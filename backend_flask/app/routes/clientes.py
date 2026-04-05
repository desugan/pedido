from flask import Blueprint, jsonify, request

from app.db import query_all, query_one, execute, execute_insert

clientes_bp = Blueprint("clientes", __name__, url_prefix="/api/clientes")


def _map_cliente_row(c: dict) -> dict:
    limite = float(c.get("limite_credito") or 0)
    saldo_utilizado = float(c.get("saldo_utilizado") or 0)
    return {
        "id_cliente": c["id_cliente"],
        "nome": c["nome"],
        "status": c.get("status"),
        "contato": c.get("contato"),
        "limite_credito": limite,
        "credito_utilizado": saldo_utilizado,
        "saldo_restante": limite - saldo_utilizado,
        "financeiro": {
            "limite_credito": limite,
            "saldo_utilizado": saldo_utilizado,
        },
        "total_pedidos": int(c.get("total_pedidos") or 0),
        "total_pagamentos": int(c.get("total_pagamentos") or 0),
    }


@clientes_bp.get("")
def list_clientes():
    rows = query_all(
        """
        SELECT c.id_cliente, c.nome, c.status, c.contato,
             f.limite_credito, f.saldo_utilizado,
             COALESCE((SELECT COUNT(*) FROM pedido p WHERE p.id_cliente = c.id_cliente), 0) AS total_pedidos,
             COALESCE((SELECT COUNT(*) FROM pagamento pg WHERE pg.id_cliente = c.id_cliente), 0) AS total_pagamentos
        FROM cliente c
        LEFT JOIN financeiro f ON f.id_financeiro = (
            SELECT MAX(id_financeiro) FROM financeiro WHERE id_cliente = c.id_cliente
        )
        ORDER BY c.id_cliente DESC
        """
    )
    return jsonify([_map_cliente_row(r) for r in rows])


@clientes_bp.get("/<int:cliente_id>")
def get_cliente(cliente_id: int):
    row = query_one(
        """
        SELECT c.id_cliente, c.nome, c.status, c.contato,
             f.limite_credito, f.saldo_utilizado,
             COALESCE((SELECT COUNT(*) FROM pedido p WHERE p.id_cliente = c.id_cliente), 0) AS total_pedidos,
             COALESCE((SELECT COUNT(*) FROM pagamento pg WHERE pg.id_cliente = c.id_cliente), 0) AS total_pagamentos
        FROM cliente c
        LEFT JOIN financeiro f ON f.id_financeiro = (
            SELECT MAX(id_financeiro) FROM financeiro WHERE id_cliente = c.id_cliente
        )
        WHERE c.id_cliente = %s
        """,
        (cliente_id,),
    )
    if not row:
        return jsonify({"error": "Cliente não encontrado"}), 404
    return jsonify(_map_cliente_row(row))


@clientes_bp.post("")
def create_cliente():
    body = request.get_json(silent=True) or {}
    nome = str(body.get("nome") or "").strip()
    status = str(body.get("status") or "ATIVO").strip() or "ATIVO"
    limite = float(body.get("limite_credito") or 0)

    if not nome:
        return jsonify({"error": "Nome é obrigatório"}), 400

    new_id = execute_insert(
        "INSERT INTO cliente (nome, status) VALUES (%s, %s)",
        (nome, status),
    )

    execute(
        """
        INSERT INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao)
        VALUES (%s, %s, 0, %s, NOW(), 'SISTEMA')
        """,
        (new_id, limite, limite),
    )

    row = query_one(
        """
        SELECT c.id_cliente, c.nome, c.status, c.contato,
             f.limite_credito, f.saldo_utilizado,
             COALESCE((SELECT COUNT(*) FROM pedido p WHERE p.id_cliente = c.id_cliente), 0) AS total_pedidos,
             COALESCE((SELECT COUNT(*) FROM pagamento pg WHERE pg.id_cliente = c.id_cliente), 0) AS total_pagamentos
        FROM cliente c
        LEFT JOIN financeiro f ON f.id_financeiro = (
            SELECT MAX(id_financeiro) FROM financeiro WHERE id_cliente = c.id_cliente
        )
        WHERE c.id_cliente = %s
        """,
        (new_id,),
    )
    return jsonify(_map_cliente_row(row)), 201


@clientes_bp.put("/<int:cliente_id>")
def update_cliente(cliente_id: int):
    body = request.get_json(silent=True) or {}
    current = query_one("SELECT id_cliente FROM cliente WHERE id_cliente = %s", (cliente_id,))
    if not current:
        return jsonify({"error": "Cliente não encontrado"}), 404

    nome = body.get("nome")
    status = body.get("status")
    contato = body.get("contato")

    execute(
        """
        UPDATE cliente
        SET nome = COALESCE(%s, nome),
            status = COALESCE(%s, status),
            contato = COALESCE(%s, contato)
        WHERE id_cliente = %s
        """,
        (nome, status, contato, cliente_id),
    )

    if "limite_credito" in body:
        limite = float(body.get("limite_credito") or 0)
        fin = query_one(
            "SELECT id_financeiro FROM financeiro WHERE id_cliente = %s ORDER BY id_financeiro DESC LIMIT 1",
            (cliente_id,),
        )
        if fin:
            execute(
                "UPDATE financeiro SET limite_credito = %s, ultimo_limite = %s, usuario_alteracao = 'SISTEMA' WHERE id_financeiro = %s",
                (limite, limite, fin["id_financeiro"]),
            )
        else:
            execute(
                "INSERT INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao) VALUES (%s, %s, 0, %s, NOW(), 'SISTEMA')",
                (cliente_id, limite, limite),
            )

    row = query_one(
        """
        SELECT c.id_cliente, c.nome, c.status, c.contato,
             f.limite_credito, f.saldo_utilizado,
             COALESCE((SELECT COUNT(*) FROM pedido p WHERE p.id_cliente = c.id_cliente), 0) AS total_pedidos,
             COALESCE((SELECT COUNT(*) FROM pagamento pg WHERE pg.id_cliente = c.id_cliente), 0) AS total_pagamentos
        FROM cliente c
        LEFT JOIN financeiro f ON f.id_financeiro = (
            SELECT MAX(id_financeiro) FROM financeiro WHERE id_cliente = c.id_cliente
        )
        WHERE c.id_cliente = %s
        """,
        (cliente_id,),
    )
    return jsonify(_map_cliente_row(row))


@clientes_bp.delete("/<int:cliente_id>")
def delete_cliente(cliente_id: int):
    row = query_one("SELECT id_cliente FROM cliente WHERE id_cliente = %s", (cliente_id,))
    if not row:
        return jsonify({"error": "Cliente não encontrado"}), 404

    execute("DELETE FROM cliente WHERE id_cliente = %s", (cliente_id,))
    return jsonify({"message": "Cliente deletado com sucesso"})
