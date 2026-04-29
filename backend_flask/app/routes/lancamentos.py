from flask import Blueprint, jsonify, request

from app.db import query_all, query_one, execute, execute_insert, transaction, tx_query, tx_one, tx_execute, tx_insert

lancamentos_bp = Blueprint("lancamentos", __name__, url_prefix="/api/lancamentos")


def _apply_stock(lancamento_id: int, mode: str):
    itens = query_all("SELECT id_produto, qtd, vlr_item FROM lancamento_item WHERE id_lancamento = %s", (lancamento_id,))
    for item in itens:
        qtd = float(item.get("qtd") or 0)
        if mode == "add":
            execute("UPDATE produto SET saldo = saldo + %s, oldvalor = valor, valor = %s WHERE id_produto = %s", (qtd, float(item.get("vlr_item") or 0), int(item["id_produto"])))
        else:
            execute("UPDATE produto SET saldo = GREATEST(0, saldo - %s) WHERE id_produto = %s", (qtd, int(item["id_produto"])))


@lancamentos_bp.get("")
def list_lancamentos():
    rows = query_all(
        """
        SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total, l.data, l.status
        FROM lancamento l
        LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
        ORDER BY l.id_lancamento DESC
        """
    )
    return jsonify(rows)


@lancamentos_bp.get("/<int:lancamento_id>")
def get_lancamento(lancamento_id: int):
    row = query_one(
        """
        SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome, l.total, l.data, l.status
        FROM lancamento l
        LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
        WHERE l.id_lancamento = %s
        LIMIT 1
        """,
        (lancamento_id,),
    )
    if not row:
        return jsonify({"error": "Lançamento não encontrado"}), 404
    itens = query_all(
        """
        SELECT li.id_produto, p.nome AS produto_nome, li.qtd, li.vlr_item, li.vlr_total
        FROM lancamento_item li
        LEFT JOIN produto p ON p.id_produto = li.id_produto
        WHERE li.id_lancamento = %s
        """,
        (lancamento_id,),
    )
    row["itens"] = itens
    return jsonify(row)


@lancamentos_bp.post("")
def create_lancamento():
    body = request.get_json(silent=True) or {}
    id_fornecedor = body.get("id_fornecedor")
    itens = body.get("itens") or []
    status = str(body.get("status") or "PENDENTE").upper()

    if not id_fornecedor or not itens:
        return jsonify({"error": "Informe pelo menos um item"}), 400

    try:
        with transaction() as conn:
            total = sum(float(i.get("vlr_total") or (float(i.get("qtd") or 0) * float(i.get("vlr_item") or 0))) for i in itens)

            columns_rows = tx_query(
                conn,
                """
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lancamento'
                """
            )
            available_columns = {str(r.get("COLUMN_NAME")) for r in columns_rows}

            insert_columns = ["id_fornecedor", "total", "data"]
            insert_values: list = [id_fornecedor, total, "NOW()"]
            insert_params: list = [id_fornecedor, total]

            if "status" in available_columns:
                insert_columns.append("status")
                insert_values.append("%s")
                insert_params.append(status)

            if "documento" in available_columns:
                insert_columns.append("documento")
                insert_values.append("%s")
                insert_params.append(f"LAN-{int(__import__('time').time())}"[:45])

            if "chave" in available_columns:
                insert_columns.append("chave")
                insert_values.append("%s")
                insert_params.append(body.get("chave"))

            if "id_usuario" in available_columns:
                user_row = tx_one(conn, "SELECT id_usuario FROM usuario ORDER BY id_usuario ASC LIMIT 1")
                insert_columns.append("id_usuario")
                insert_values.append("%s")
                insert_params.append((user_row or {}).get("id_usuario"))

            if "data_lancamento" in available_columns:
                insert_columns.append("data_lancamento")
                insert_values.append("NOW()")

            values_sql = []
            for v in insert_values:
                values_sql.append(v if v == "NOW()" else "%s")

            lancamento_id = tx_insert(
                conn,
                f"INSERT INTO lancamento ({', '.join(insert_columns)}) VALUES ({', '.join(values_sql)})",
                tuple(insert_params),
            )

            for item in itens:
                qtd = float(item.get("qtd") or 0)
                vlr_item = float(item.get("vlr_item") or 0)
                vlr_total = float(item.get("vlr_total") or (qtd * vlr_item))
                tx_insert(
                    conn,
                    "INSERT INTO lancamento_item (id_lancamento, id_produto, qtd, vlr_item, vlr_total) VALUES (%s, %s, %s, %s, %s)",
                    (lancamento_id, item.get("id_produto"), qtd, vlr_item, vlr_total),
                )

            if status == "CONFIRMADO":
                _apply_stock(lancamento_id, "add")

    except Exception as e:
        return jsonify({"error": f"Erro ao criar lancamento: {str(e)}"}), 500

    return get_lancamento(lancamento_id), 201


@lancamentos_bp.patch("/<int:lancamento_id>/status")
def update_status(lancamento_id: int):
    body = request.get_json(silent=True) or {}
    next_status = str(body.get("status") or "").upper()
    if next_status not in {"PENDENTE", "CONFIRMADO", "CANCELADO"}:
        return jsonify({"error": "Status inválido"}), 400

    row = query_one("SELECT status FROM lancamento WHERE id_lancamento = %s", (lancamento_id,))
    if not row:
        return jsonify({"error": "Lançamento não encontrado"}), 404

    current = str(row.get("status") or "").upper()
    if current == "CONFIRMADO" and next_status == "PENDENTE":
        return jsonify({"error": "Não é permitido voltar um lançamento confirmado para pendente. Cancele o lançamento para reverter o estoque."}), 400

    try:
        with transaction() as conn:
            if next_status == "CANCELADO" and current == "CONFIRMADO":
                vendidos = tx_query(
                    conn,
                    """
                    SELECT DISTINCT p.nome AS produto_nome
                    FROM lancamento_item li
                    JOIN pedido_item pi ON pi.id_produto = li.id_produto
                    JOIN pedido pd ON pd.id_pedido = pi.id_pedido
                    LEFT JOIN produto p ON p.id_produto = li.id_produto
                    WHERE li.id_lancamento = %s
                      AND UPPER(pd.status) <> 'CANCELADO'
                    """,
                    (lancamento_id,),
                )
                if vendidos:
                    nomes = ", ".join([str(v.get("produto_nome") or "Produto") for v in vendidos])
                    raise ValueError(f"Não é possível cancelar: os seguintes produtos já registraram vendas e o estoque está em uso: {nomes}")
                _apply_stock(lancamento_id, "subtract")

            if next_status == "CONFIRMADO" and current != "CONFIRMADO":
                _apply_stock(lancamento_id, "add")

            tx_execute(conn, "UPDATE lancamento SET status = %s WHERE id_lancamento = %s", (next_status, lancamento_id))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Erro ao atualizar status: {str(e)}"}), 500

    return get_lancamento(lancamento_id)
