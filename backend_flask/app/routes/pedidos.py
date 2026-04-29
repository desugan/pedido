from flask import Blueprint, jsonify, request

from app.db import query_all, query_one, execute, execute_insert, transaction, tx_query, tx_one, tx_execute, tx_insert

pedidos_bp = Blueprint("pedidos", __name__, url_prefix="/api/pedidos")


def _iso(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _map_item_row(it: dict) -> dict:
    return {
        "id": int(it.get("id") or 0),
        "pedidoId": int(it.get("pedidoId") or 0),
        "produtoNome": it.get("produtoNome") or "",
        "quantidade": float(it.get("quantidade") or 0),
        "precoUnitario": float(it.get("precoUnitario") or 0),
        "subtotal": float(it.get("subtotal") or 0),
    }


def _pedido_row_to_json(p: dict) -> dict:
    return {
        "id": p["id_pedido"],
        "clienteId": p["id_cliente"],
        "clienteNome": p.get("cliente_nome"),
        "status": p.get("status"),
        "total": float(p.get("total") or 0),
        "createdAt": _iso(p.get("data")),
        "updatedAt": _iso(p.get("data")),
    }


def _check_stock(pedido_id: int) -> tuple[bool, str]:
    itens = query_all(
        """
        SELECT p.nome AS produto_nome, pi.qtd AS qtd_solicitada, p.saldo AS saldo_atual
        FROM pedido_item pi
        JOIN produto p ON p.id_produto = pi.id_produto
        WHERE pi.id_pedido = %s
        """,
        (pedido_id,)
    )
    insuficiente = []
    for it in itens:
        nome = it.get("produto_nome", "")
        qtd_solicitada = float(it.get("qtd_solicitada") or 0)
        saldo_atual = float(it.get("saldo_atual") or 0)
        if qtd_solicitada > saldo_atual:
            insuficiente.append(f"{nome}: solicitado {qtd_solicitada}, disponivel {saldo_atual}")
    if insuficiente:
        return False, "; ".join(insuficiente)
    return True, ""


def _reserve_or_release_stock(conn, pedido_id: int, mode: str):
    if mode == "subtract":
        itens = tx_query(conn, "SELECT id_produto, qtd FROM pedido_item WHERE id_pedido = %s", (pedido_id,))
        insuficientes = []
        for it in itens:
            produto = tx_one(conn, "SELECT nome, saldo FROM produto WHERE id_produto = %s", (it["id_produto"],))
            if produto:
                saldo_atual = float(produto.get("saldo") or 0)
                qtd = float(it.get("qtd") or 0)
                if qtd > saldo_atual:
                    insuficientes.append(f"{produto['nome']}: solicitado {qtd}, disponivel {saldo_atual}")
        if insuficientes:
            raise ValueError(f"Estoque insuficiente: {'; '.join(insuficientes)}")

    itens = tx_query(conn, "SELECT id_produto, qtd FROM pedido_item WHERE id_pedido = %s", (pedido_id,))
    for it in itens:
        qtd = float(it.get("qtd") or 0)
        if mode == "subtract":
            tx_execute(conn, "UPDATE produto SET saldo = saldo - %s WHERE id_produto = %s", (qtd, it["id_produto"]))
        else:
            tx_execute(conn, "UPDATE produto SET saldo = saldo + %s WHERE id_produto = %s", (qtd, it["id_produto"]))


@pedidos_bp.get("")
def list_pedidos():
    status = request.args.get("status")
    if status:
        rows = query_all(
            """
            SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome, p.status, p.total, p.data
            FROM pedido p
            LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
            WHERE p.status = %s
            ORDER BY p.id_pedido DESC
            """,
            (status,),
        )
    else:
        rows = query_all(
            """
            SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome, p.status, p.total, p.data
            FROM pedido p
            LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
            ORDER BY p.id_pedido DESC
            """
        )
    return jsonify([_pedido_row_to_json(r) for r in rows])


@pedidos_bp.get("/cliente/<int:cliente_id>")
def list_pedidos_by_cliente(cliente_id: int):
    rows = query_all(
        """
        SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome, p.status, p.total, p.data
        FROM pedido p
        LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
        WHERE p.id_cliente = %s
        ORDER BY p.id_pedido DESC
        """,
        (cliente_id,),
    )
    return jsonify([_pedido_row_to_json(r) for r in rows])


@pedidos_bp.get("/<int:pedido_id>")
def get_pedido(pedido_id: int):
    row = query_one(
        """
        SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome, p.status, p.total, p.data
        FROM pedido p
        LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
        WHERE p.id_pedido = %s
        LIMIT 1
        """,
        (pedido_id,),
    )
    if not row:
        return jsonify({"error": "Pedido não encontrado"}), 404

    itens = query_all(
        """
        SELECT pi.id_item_pedido AS id, pi.id_pedido AS pedidoId, p.nome AS produtoNome,
               pi.qtd AS quantidade, pi.vlr_item AS precoUnitario, pi.vlr_total AS subtotal
        FROM pedido_item pi
        LEFT JOIN produto p ON p.id_produto = pi.id_produto
        WHERE pi.id_pedido = %s
        ORDER BY pi.id_item_pedido ASC
        """,
        (pedido_id,),
    )

    payload = _pedido_row_to_json(row)
    payload["itens"] = [_map_item_row(i) for i in itens]
    return jsonify(payload)


@pedidos_bp.post("")
def create_pedido():
    import logging
    logger = logging.getLogger(__name__)
    
    body = request.get_json(silent=True) or {}
    cliente_id = body.get("clienteId")
    itens = body.get("itens") or []

    if not cliente_id or not itens:
        return jsonify({"error": "Pedido deve ter pelo menos um item"}), 400

    try:
        with transaction() as conn:
            logger.info(f"create_pedido: cliente={cliente_id}, itens={len(itens)}")
            total = 0.0
            for item in itens:
                total += float(item.get("quantidade") or 0) * float(item.get("precoUnitario") or 0)

            pedido_id = tx_insert(
                conn,
                "INSERT INTO pedido (id_cliente, total, data, status) VALUES (%s, %s, NOW(), 'pendente')",
                (cliente_id, total),
            )
            logger.info(f"create_pedido: pedido_id={pedido_id}")

            for item in itens:
                produto_id = item.get("produtoId")
                produto_nome = str(item.get("produtoNome") or "").strip()
                qtd = float(item.get("quantidade") or 0)
                preco = float(item.get("precoUnitario") or 0)
                logger.info(f"create_pedido: item produtoId={produto_id}, nome={produto_nome}, qtd={qtd}")

                if produto_id:
                    produto = tx_one(conn, "SELECT id_produto FROM produto WHERE id_produto = %s LIMIT 1", (produto_id,))
                    if not produto:
                        raise ValueError(f"Produto com ID {produto_id} não encontrado")
                else:
                    produto = tx_one(conn, "SELECT id_produto FROM produto WHERE nome = %s LIMIT 1", (produto_nome,))
                    if not produto:
                        produto_id = tx_insert(
                            conn,
                            "INSERT INTO produto (nome, valor, oldvalor, marca, saldo) VALUES (%s, %s, %s, 'indefinida', 0)",
                            (produto_nome, preco, preco),
                        )
                        logger.info(f"create_pedido: novo produto criado id={produto_id}")
                    else:
                        produto_id = int(produto["id_produto"])

                tx_insert(
                    conn,
                    "INSERT INTO pedido_item (id_pedido, id_produto, qtd, vlr_item, vlr_total, vlr_custo) VALUES (%s, %s, %s, %s, %s, 0)",
                    (pedido_id, produto_id, qtd, preco, qtd * preco),
                )

            insuficientes = []
            for item in itens:
                produto_id = item.get("produtoId")
                produto_nome = str(item.get("produtoNome") or "").strip()
                qtd = float(item.get("quantidade") or 0)
                
                if produto_id:
                    produto = tx_one(conn, "SELECT nome, saldo FROM produto WHERE id_produto = %s LIMIT 1", (produto_id,))
                else:
                    produto = tx_one(conn, "SELECT saldo FROM produto WHERE nome = %s LIMIT 1", (produto_nome,))
                
                nome_exibicao = produto["nome"] if produto else produto_nome
                if produto:
                    saldo_atual = float(produto.get("saldo") or 0)
                    if qtd > saldo_atual:
                        insuficientes.append(f"{nome_exibicao}: solicitado {qtd}, disponivel {saldo_atual}")

            if insuficientes:
                raise ValueError(f"Estoque insuficiente: {'; '.join(insuficientes)}")

            for item in itens:
                produto_id = item.get("produtoId")
                produto_nome = str(item.get("produtoNome") or "").strip()
                qtd = float(item.get("quantidade") or 0)
                
                if produto_id:
                    prod = tx_one(conn, "SELECT id_produto FROM produto WHERE id_produto = %s", (produto_id,))
                else:
                    prod = tx_one(conn, "SELECT id_produto FROM produto WHERE nome = %s", (produto_nome,))
                
                if prod:
                    tx_execute(conn, "UPDATE produto SET saldo = saldo - %s WHERE id_produto = %s", (qtd, prod["id_produto"]))
                    logger.info(f"create_pedido: estoque atualizado produto={prod['id_produto']}, subtraido={qtd}")

    except ValueError as e:
        logger.error(f"create_pedido ValueError: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"create_pedido Exception: {type(e).__name__}: {e}")
        return jsonify({"error": f"Erro ao criar pedido: {str(e)}"}), 500

    return get_pedido(pedido_id), 201


@pedidos_bp.patch("/<int:pedido_id>/status")
def patch_pedido_status(pedido_id: int):
    import logging
    logger = logging.getLogger(__name__)
    
    body = request.get_json(silent=True) or {}
    status = str(body.get("status") or "").strip()
    if not status:
        return jsonify({"error": "Status inválido"}), 400

    row = query_one("SELECT status FROM pedido WHERE id_pedido = %s", (pedido_id,))
    if not row:
        return jsonify({"error": "Pedido não encontrado"}), 404

    old = str(row.get("status") or "").lower()
    new = status.lower()
    logger.info(f"patch_pedido_status: pedido={pedido_id}, old={old}, new={new}")

    FINAL_STATUSES = {"pago", "excluido", "excluído", "cancelado"}
    if old in FINAL_STATUSES:
        return jsonify({"error": f"Pedido com status '{old}' não pode ser alterado"}), 422

    old_reserve = old in {"pendente", "confirmado", "em_pagamento", "pago"}
    new_reserve = new in {"pendente", "confirmado", "em_pagamento", "pago"}
    logger.info(f"patch_pedido_status: old_reserve={old_reserve}, new_reserve={new_reserve}")

    try:
        with transaction() as conn:
            logger.info(f"patch_pedido_status: inside transaction")
            if not old_reserve and new_reserve:
                try:
                    _reserve_or_release_stock(conn, pedido_id, "subtract")
                except ValueError as e:
                    raise ValueError(str(e))
            elif old_reserve and not new_reserve:
                _reserve_or_release_stock(conn, pedido_id, "add")

            tx_execute(conn, "UPDATE pedido SET status = %s WHERE id_pedido = %s", (status, pedido_id))
            logger.info(f"patch_pedido_status: status updated")
    except ValueError as e:
        logger.error(f"patch_pedido_status ValueError: {e}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"patch_pedido_status Exception: {type(e).__name__}: {e}")
        return jsonify({"error": f"Erro ao atualizar status: {str(e)}"}), 500

    return get_pedido(pedido_id)


@pedidos_bp.delete("/<int:pedido_id>")
def delete_pedido(pedido_id: int):
    row = query_one("SELECT status FROM pedido WHERE id_pedido = %s", (pedido_id,))
    if not row:
        return jsonify({"error": "Pedido não encontrado"}), 404

    status = str(row.get("status") or "").lower()

    try:
        with transaction() as conn:
            if status in {"pendente", "confirmado", "em_pagamento", "pago"}:
                itens = tx_query(conn, "SELECT id_produto, qtd FROM pedido_item WHERE id_pedido = %s", (pedido_id,))
                for it in itens:
                    tx_execute(conn, "UPDATE produto SET saldo = saldo + %s WHERE id_produto = %s", (float(it.get("qtd") or 0), it["id_produto"]))

            tx_execute(conn, "DELETE FROM pedido_item WHERE id_pedido = %s", (pedido_id,))
            tx_execute(conn, "DELETE FROM pedido WHERE id_pedido = %s", (pedido_id,))
    except Exception as e:
        return jsonify({"error": f"Erro ao deletar pedido: {str(e)}"}), 500

    return jsonify({"message": "Pedido deletado com sucesso"})


@pedidos_bp.post("/<int:pedido_id>/itens")
def add_item(pedido_id: int):
    pedido = query_one("SELECT id_pedido, status FROM pedido WHERE id_pedido = %s", (pedido_id,))
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    body = request.get_json(silent=True) or {}
    produto_id = body.get("produtoId")
    produto_nome = str(body.get("produtoNome") or "").strip()
    qtd = float(body.get("quantidade") or 0)
    preco = float(body.get("precoUnitario") or 0)
    if not produto_id and not produto_nome or qtd <= 0 or preco < 0:
        return jsonify({"error": "Item inválido"}), 400

    try:
        with transaction() as conn:
            if produto_id:
                produto = tx_one(conn, "SELECT id_produto FROM produto WHERE id_produto = %s LIMIT 1", (produto_id,))
                if not produto:
                    raise ValueError(f"Produto com ID {produto_id} não encontrado")
            else:
                produto = tx_one(conn, "SELECT id_produto FROM produto WHERE nome = %s LIMIT 1", (produto_nome,))
                if not produto:
                    produto_id = tx_insert(
                        conn,
                        "INSERT INTO produto (nome, valor, oldvalor, marca, saldo) VALUES (%s, %s, %s, 'indefinida', 0)",
                        (produto_nome, preco, preco),
                    )
                else:
                    produto_id = int(produto["id_produto"])

            if str(pedido.get("status") or "").lower() in {"pendente", "confirmado", "em_pagamento", "pago"}:
                produto_estoque = tx_one(conn, "SELECT saldo FROM produto WHERE id_produto = %s", (produto_id,))
                if produto_estoque:
                    saldo_atual = float(produto_estoque.get("saldo") or 0)
                    if qtd > saldo_atual:
                        raise ValueError(f"Estoque insuficiente: solicitado {qtd}, disponivel {saldo_atual}")

            item_id = tx_insert(
                conn,
                "INSERT INTO pedido_item (id_pedido, id_produto, qtd, vlr_item, vlr_total, vlr_custo) VALUES (%s, %s, %s, %s, %s, 0)",
                (pedido_id, produto_id, qtd, preco, qtd * preco),
            )

            tx_execute(conn, "UPDATE pedido SET total = (SELECT COALESCE(SUM(vlr_total),0) FROM pedido_item WHERE id_pedido = %s) WHERE id_pedido = %s", (pedido_id, pedido_id))

            if str(pedido.get("status") or "").lower() in {"pendente", "confirmado", "em_pagamento", "pago"}:
                tx_execute(conn, "UPDATE produto SET saldo = saldo - %s WHERE id_produto = %s", (qtd, produto_id))

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": f"Erro ao adicionar item: {str(e)}"}), 500

    return jsonify({
        "id": int(item_id),
        "pedidoId": pedido_id,
        "produtoNome": produto_nome,
        "quantidade": qtd,
        "precoUnitario": preco,
        "subtotal": qtd * preco,
    }), 201


@pedidos_bp.delete("/<int:pedido_id>/itens/<int:item_id>")
def remove_item(pedido_id: int, item_id: int):
    pedido = query_one("SELECT status FROM pedido WHERE id_pedido = %s", (pedido_id,))
    if not pedido:
        return jsonify({"error": "Pedido não encontrado"}), 404

    item = query_one("SELECT id_produto, qtd FROM pedido_item WHERE id_item_pedido = %s AND id_pedido = %s", (item_id, pedido_id))
    if not item:
        return jsonify({"error": "Item não encontrado no pedido"}), 404

    try:
        with transaction() as conn:
            tx_execute(conn, "DELETE FROM pedido_item WHERE id_item_pedido = %s", (item_id,))
            tx_execute(conn, "UPDATE pedido SET total = (SELECT COALESCE(SUM(vlr_total),0) FROM pedido_item WHERE id_pedido = %s) WHERE id_pedido = %s", (pedido_id, pedido_id))

            if str(pedido.get("status") or "").lower() in {"pendente", "confirmado", "em_pagamento", "pago"}:
                tx_execute(conn, "UPDATE produto SET saldo = saldo + %s WHERE id_produto = %s", (float(item["qtd"] or 0), int(item["id_produto"])))
    except Exception as e:
        return jsonify({"error": f"Erro ao remover item: {str(e)}"}), 500

    return jsonify({"message": "Item removido com sucesso"})


@pedidos_bp.get("/<int:pedido_id>/itens")
def list_items(pedido_id: int):
    rows = query_all(
        """
        SELECT pi.id_item_pedido AS id, pi.id_pedido AS pedidoId, p.nome AS produtoNome,
               pi.qtd AS quantidade, pi.vlr_item AS precoUnitario, pi.vlr_total AS subtotal
        FROM pedido_item pi
        LEFT JOIN produto p ON p.id_produto = pi.id_produto
        WHERE pi.id_pedido = %s
        ORDER BY pi.id_item_pedido ASC
        """,
        (pedido_id,),
    )
    return jsonify([_map_item_row(r) for r in rows])


@pedidos_bp.get("/<int:pedido_id>/total")
def pedido_total(pedido_id: int):
    row = query_one("SELECT COALESCE(SUM(vlr_total),0) AS total FROM pedido_item WHERE id_pedido = %s", (pedido_id,))
    return jsonify({"total": float(row["total"])})
