from flask import Blueprint, jsonify, request

from app.db import query_all, query_one, execute, execute_insert

pagamentos_bp = Blueprint("pagamentos", __name__, url_prefix="/api/pagamentos")


def _iso(value):
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _map_row(row: dict) -> dict:
    row["data_criacao"] = _iso(row.get("data_criacao"))
    row["data_pagamento"] = _iso(row.get("data_pagamento"))
    nome = row.pop("cliente_nome", None)
    row["cliente"] = {"nome": nome} if nome else None
    return row


_SQL_SELECT = """
    SELECT p.id_pagamento, p.valor, p.qrcode, p.chavepix, p.status,
           p.data_criacao, p.id_cliente, p.data_pagamento,
           c.nome AS cliente_nome
    FROM pagamento p
    LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
"""


def _normalize_status(value: str | None) -> str:
    return str(value or "").strip().lower()


def _extract_valid_pedido_ids(raw_ids) -> list[int]:
    if not isinstance(raw_ids, list):
        return []
    unique_ids: list[int] = []
    seen: set[int] = set()
    for raw in raw_ids:
        try:
            pedido_id = int(raw)
        except (TypeError, ValueError):
            continue
        if pedido_id <= 0 or pedido_id in seen:
            continue
        seen.add(pedido_id)
        unique_ids.append(pedido_id)
    return unique_ids


def _in_clause(ids: list[int]) -> tuple[str, tuple[int, ...]]:
    placeholders = ", ".join(["%s"] * len(ids))
    return placeholders, tuple(ids)


def _ensure_financeiro_row(cliente_id: int):
    existing = query_one(
        "SELECT id_financeiro FROM financeiro WHERE id_cliente = %s ORDER BY id_financeiro DESC LIMIT 1",
        (cliente_id,),
    )
    if existing:
        return int(existing["id_financeiro"])

    execute(
        """
        INSERT INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao)
        VALUES (%s, 0, 0, 0, NOW(), 'SISTEMA')
        """,
        (cliente_id,),
    )
    created = query_one(
        "SELECT id_financeiro FROM financeiro WHERE id_cliente = %s ORDER BY id_financeiro DESC LIMIT 1",
        (cliente_id,),
    )
    return int(created["id_financeiro"])


def _subtract_saldo_utilizado(cliente_id: int, amount: float):
    amount = float(amount or 0)
    if amount <= 0:
        return
    fin_id = _ensure_financeiro_row(cliente_id)
    row = query_one("SELECT saldo_utilizado FROM financeiro WHERE id_financeiro = %s", (fin_id,))
    atual = float((row or {}).get("saldo_utilizado") or 0)
    novo = max(atual - amount, 0)
    execute(
        "UPDATE financeiro SET saldo_utilizado = %s, usuario_alteracao = 'SISTEMA' WHERE id_financeiro = %s",
        (novo, fin_id),
    )


def _add_saldo_utilizado(cliente_id: int, amount: float):
    amount = float(amount or 0)
    if amount <= 0:
        return
    fin_id = _ensure_financeiro_row(cliente_id)
    row = query_one("SELECT saldo_utilizado FROM financeiro WHERE id_financeiro = %s", (fin_id,))
    atual = float((row or {}).get("saldo_utilizado") or 0)
    novo = atual + amount
    execute(
        "UPDATE financeiro SET saldo_utilizado = %s, usuario_alteracao = 'SISTEMA' WHERE id_financeiro = %s",
        (novo, fin_id),
    )


def _linked_pedido_ids(pagamento_id: int) -> list[int]:
    rows = query_all("SELECT id_pedido FROM pagamentopedido WHERE id_pagamento = %s", (pagamento_id,))
    return [int(r["id_pedido"]) for r in rows]


@pagamentos_bp.get("")
def list_pagamentos():
    status = request.args.get("status")
    if status:
        rows = query_all(
            _SQL_SELECT + "WHERE p.status = %s ORDER BY p.id_pagamento DESC",
            (status,),
        )
    else:
        rows = query_all(_SQL_SELECT + "ORDER BY p.id_pagamento DESC")
    return jsonify([_map_row(r) for r in rows])


@pagamentos_bp.get("/cliente/<int:cliente_id>")
def list_pagamentos_cliente(cliente_id: int):
    rows = query_all(
        _SQL_SELECT + "WHERE p.id_cliente = %s ORDER BY p.id_pagamento DESC",
        (cliente_id,),
    )
    return jsonify([_map_row(r) for r in rows])


@pagamentos_bp.get("/<int:pagamento_id>")
def get_pagamento(pagamento_id: int):
    row = query_one(
        _SQL_SELECT + "WHERE p.id_pagamento = %s LIMIT 1",
        (pagamento_id,),
    )
    if not row:
        return jsonify({"error": "Pagamento não encontrado"}), 404
    payload = _map_row(row)
    payload["pagamentopedido"] = query_all(
        "SELECT id_pagamento_pedido, id_pedido, id_pagamento FROM pagamentopedido WHERE id_pagamento = %s ORDER BY id_pagamento_pedido ASC",
        (pagamento_id,),
    )

    pedido_ids = [int(r.get("id_pedido") or 0) for r in payload["pagamentopedido"] if int(r.get("id_pedido") or 0) > 0]
    if not pedido_ids:
        payload["pedidos"] = []
        return jsonify(payload)

    placeholders, params = _in_clause(pedido_ids)
    pedidos_rows = query_all(
        f"""
        SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome, p.status, p.total, p.data
        FROM pedido p
        LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
        WHERE p.id_pedido IN ({placeholders})
        ORDER BY p.id_pedido DESC
        """,
        params,
    )

    itens_rows = query_all(
        f"""
        SELECT pi.id_item_pedido AS id, pi.id_pedido AS pedidoId, pr.nome AS produtoNome,
               pi.qtd AS quantidade, pi.vlr_item AS precoUnitario, pi.vlr_total AS subtotal
        FROM pedido_item pi
        LEFT JOIN produto pr ON pr.id_produto = pi.id_produto
        WHERE pi.id_pedido IN ({placeholders})
        ORDER BY pi.id_item_pedido ASC
        """,
        params,
    )

    itens_por_pedido: dict[int, list[dict]] = {}
    for item in itens_rows:
        pedido_id = int(item.get("pedidoId") or 0)
        if pedido_id <= 0:
            continue
        itens_por_pedido.setdefault(pedido_id, []).append(
            {
                "id": int(item.get("id") or 0),
                "pedidoId": pedido_id,
                "produtoNome": item.get("produtoNome") or "",
                "quantidade": float(item.get("quantidade") or 0),
                "precoUnitario": float(item.get("precoUnitario") or 0),
                "subtotal": float(item.get("subtotal") or 0),
            }
        )

    pedidos = []
    for p in pedidos_rows:
        pedido_id = int(p.get("id_pedido") or 0)
        pedidos.append(
            {
                "id": pedido_id,
                "clienteId": int(p.get("id_cliente") or 0),
                "clienteNome": p.get("cliente_nome"),
                "status": p.get("status"),
                "total": float(p.get("total") or 0),
                "createdAt": _iso(p.get("data")),
                "updatedAt": _iso(p.get("data")),
                "itens": itens_por_pedido.get(pedido_id, []),
            }
        )

    payload["pedidos"] = pedidos
    return jsonify(payload)


@pagamentos_bp.post("")
def create_pagamento():
    body = request.get_json(silent=True) or {}
    id_cliente = body.get("id_cliente")
    valor = float(body.get("valor") or 0)
    qrcode = str(body.get("qrcode") or "").strip()
    chavepix = str(body.get("chavepix") or "").strip()
    status = _normalize_status(body.get("status") or "pendente") or "pendente"
    pedido_ids = _extract_valid_pedido_ids(body.get("pedidoIds") or [])

    if not id_cliente or valor <= 0 or not qrcode or not chavepix:
        return jsonify({"error": "Dados de pagamento inválidos"}), 400

    if not pedido_ids:
        return jsonify({"error": "Selecione ao menos um pedido para vincular ao pagamento."}), 400

    if pedido_ids:
        placeholders, params = _in_clause(pedido_ids)
        elegiveis = query_all(
            f"SELECT id_pedido FROM pedido WHERE id_pedido IN ({placeholders}) AND id_cliente = %s AND status = 'confirmado'",
            params + (int(id_cliente),),
        )
        if len(elegiveis) != len(pedido_ids):
            return jsonify({"error": "Há pedidos inválidos para pagamento (cliente/status)."}), 400

    pagamento_id = execute_insert(
        "INSERT INTO pagamento (valor, qrcode, chavepix, status, data_criacao, id_cliente) VALUES (%s, %s, %s, %s, NOW(), %s)",
        (valor, qrcode, chavepix, status, id_cliente),
    )

    for pedido_id in pedido_ids:
        execute(
            "INSERT INTO pagamentopedido (id_pedido, id_pagamento) VALUES (%s, %s)",
            (pedido_id, pagamento_id),
        )

    if pedido_ids:
        placeholders, params = _in_clause(pedido_ids)
        execute(
            f"UPDATE pedido SET status = 'em_pagamento' WHERE id_pedido IN ({placeholders}) AND status = 'confirmado'",
            params,
        )

    return get_pagamento(pagamento_id)


@pagamentos_bp.patch("/<int:pagamento_id>/status")
def patch_pagamento_status(pagamento_id: int):
    body = request.get_json(silent=True) or {}
    status = str(body.get("status") or "").strip()
    if not status:
        return jsonify({"error": "Status inválido"}), 400

    row = query_one("SELECT id_pagamento, status FROM pagamento WHERE id_pagamento = %s", (pagamento_id,))
    if not row:
        return jsonify({"error": "Pagamento não encontrado"}), 404

    old_status = _normalize_status(row.get("status"))
    new_status = _normalize_status(status)
    was_aprovado = old_status == "aprovado"
    is_aprovado = new_status == "aprovado"
    is_rollback = new_status in {"cancelado", "rejeitado", "excluido", "excluído", "pendente"}

    if new_status == "aprovado":
        execute("UPDATE pagamento SET status = %s, data_pagamento = NOW() WHERE id_pagamento = %s", (new_status, pagamento_id))
    else:
        execute("UPDATE pagamento SET status = %s WHERE id_pagamento = %s", (new_status, pagamento_id))

    pedido_ids = _linked_pedido_ids(pagamento_id)
    if pedido_ids:
        placeholders, params = _in_clause(pedido_ids)
        pedidos_atuais = query_all(
            f"SELECT id_pedido, id_cliente, total, status FROM pedido WHERE id_pedido IN ({placeholders})",
            params,
        )

        if not was_aprovado and is_aprovado:
            execute(
                f"UPDATE pedido SET status = 'pago' WHERE id_pedido IN ({placeholders}) AND status IN ('confirmado', 'em_pagamento')",
                params,
            )
            consumo_por_cliente: dict[int, float] = {}
            for pedido in pedidos_atuais:
                status_atual = _normalize_status(pedido.get("status"))
                if status_atual in {"pago", "cancelado"}:
                    continue
                cliente_id = int(pedido.get("id_cliente") or 0)
                consumo_por_cliente[cliente_id] = consumo_por_cliente.get(cliente_id, 0.0) + float(pedido.get("total") or 0)
            for cliente_id, valor_total in consumo_por_cliente.items():
                _subtract_saldo_utilizado(cliente_id, valor_total)

        if is_rollback:
            execute(
                f"UPDATE pedido SET status = 'confirmado' WHERE id_pedido IN ({placeholders}) AND status IN ('em_pagamento', 'pago')",
                params,
            )
            if was_aprovado:
                consumo_por_cliente: dict[int, float] = {}
                for pedido in pedidos_atuais:
                    status_atual = _normalize_status(pedido.get("status"))
                    if status_atual != "pago":
                        continue
                    cliente_id = int(pedido.get("id_cliente") or 0)
                    consumo_por_cliente[cliente_id] = consumo_por_cliente.get(cliente_id, 0.0) + float(pedido.get("total") or 0)
                for cliente_id, valor_total in consumo_por_cliente.items():
                    _add_saldo_utilizado(cliente_id, valor_total)

    return get_pagamento(pagamento_id)


@pagamentos_bp.delete("/<int:pagamento_id>")
def delete_pagamento(pagamento_id: int):
    row = query_one("SELECT id_pagamento, status FROM pagamento WHERE id_pagamento = %s", (pagamento_id,))
    if not row:
        return jsonify({"error": "Pagamento não encontrado"}), 404

    old_status = _normalize_status(row.get("status"))
    pedido_ids = _linked_pedido_ids(pagamento_id)
    if pedido_ids:
        placeholders, params = _in_clause(pedido_ids)
        pedidos_atuais = query_all(
            f"SELECT id_pedido, id_cliente, total, status FROM pedido WHERE id_pedido IN ({placeholders})",
            params,
        )
        execute(
            f"UPDATE pedido SET status = 'confirmado' WHERE id_pedido IN ({placeholders}) AND status IN ('em_pagamento', 'pago')",
            params,
        )
        if old_status == "aprovado":
            consumo_por_cliente: dict[int, float] = {}
            for pedido in pedidos_atuais:
                status_atual = _normalize_status(pedido.get("status"))
                if status_atual != "pago":
                    continue
                cliente_id = int(pedido.get("id_cliente") or 0)
                consumo_por_cliente[cliente_id] = consumo_por_cliente.get(cliente_id, 0.0) + float(pedido.get("total") or 0)
            for cliente_id, valor_total in consumo_por_cliente.items():
                _add_saldo_utilizado(cliente_id, valor_total)

    execute("UPDATE pagamento SET status = 'excluido' WHERE id_pagamento = %s", (pagamento_id,))
    return jsonify({"message": "Pagamento deletado com sucesso"})
