import logging

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.db import query_all, query_one
from app.schemas.relatorio_schema import RelatorioUsuarioRequest

relatorios_bp = Blueprint("relatorios", __name__, url_prefix="/api/relatorios")

logger = logging.getLogger(__name__)


def _latest_financeiro_join(alias: str = "f") -> str:
    return f"""
    LEFT JOIN financeiro {alias} ON {alias}.id_financeiro = (
        SELECT MAX(f2.id_financeiro)
        FROM financeiro f2
        WHERE f2.id_cliente = c.id_cliente
    )
    """


def _date_filter(col: str, ini: str | None, fim: str | None):
    clauses = []
    params: list = []
    if ini:
        clauses.append(f"{col} >= %s")
        params.append(ini)
    if fim:
        clauses.append(f"{col} <= %s")
        params.append(fim)
    return clauses, params


def _status_count(rows: list[dict], key: str = "status") -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in rows:
        status = str(row.get(key) or "sem_status")
        counts[status] = counts.get(status, 0) + 1
    return counts


@relatorios_bp.get("/pedidos")
def rel_pedidos():
    """Relatório de pedidos por período.

    Returns:
        JSON com dados do relatório.
    """
    try:
        data_inicio = request.args.get("dataInicio")
        data_fim = request.args.get("dataFim")
        status = request.args.get("status")
        clauses, params = _date_filter("p.data", data_inicio, data_fim)
        if status:
            clauses.append("p.status = %s")
            params.append(status)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

        dados = query_all(
            f"""
            SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome, p.total, p.data, p.status
            FROM pedido p
            LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
            {where}
            ORDER BY p.data DESC
            """,
            tuple(params),
        )
        total = sum(float(d.get("total") or 0) for d in dados)
        return jsonify({
            "tipo": "pedidos",
            "periodo": {"dataInicio": data_inicio, "dataFim": data_fim},
            "totais": {
                "quantidade": len(dados),
                "valorTotal": total,
                "valorMedio": (total / len(dados) if dados else 0),
                "statusCount": _status_count(dados),
            },
            "dados": dados,
        })
    except Exception as ex:
        logger.error('relatorios.py - rel_pedidos: %s', ex)
        return jsonify({"error": "Erro ao gerar relatório de pedidos"}), 500


@relatorios_bp.get("/pagamentos")
def rel_pagamentos():
    """Relatório de pagamentos por período.

    Returns:
        JSON com dados do relatório.
    """
    try:
        data_inicio = request.args.get("dataInicio")
        data_fim = request.args.get("dataFim")
        status = request.args.get("status")
        clauses, params = _date_filter("p.data_criacao", data_inicio, data_fim)
        if status:
            clauses.append("p.status = %s")
            params.append(status)
        where = f"WHERE {' AND '.join(clauses)}" if clauses else ""

        dados = query_all(
            f"""
            SELECT p.id_pagamento, p.id_cliente, c.nome AS cliente_nome, p.valor, p.status, p.data_criacao
            FROM pagamento p
            LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
            {where}
            ORDER BY p.data_criacao DESC
            """,
            tuple(params),
        )
        total = sum(float(d.get("valor") or 0) for d in dados)
        return jsonify({
            "tipo": "pagamentos",
            "periodo": {"dataInicio": data_inicio, "dataFim": data_fim},
            "totais": {
                "quantidade": len(dados),
                "valorTotal": total,
                "valorMedio": (total / len(dados) if dados else 0),
                "statusCount": _status_count(dados),
            },
            "dados": dados,
        })
    except Exception as ex:
        logger.error('relatorios.py - rel_pagamentos: %s', ex)
        return jsonify({"error": "Erro ao gerar relatório de pagamentos"}), 500


@relatorios_bp.get("/clientes")
def rel_clientes():
    """Relatório de clientes.

    Returns:
        JSON com dados do relatório.
    """
    try:
        status = request.args.get("status")
        latest_fin_join = _latest_financeiro_join("f")
        if status:
            dados = query_all(
                f"""
                SELECT c.id_cliente, c.nome, c.status,
                       COALESCE(f.limite_credito, 0) AS limite_credito,
                       COALESCE(f.saldo_utilizado, 0) AS credito_utilizado,
                       COALESCE((SELECT COUNT(*) FROM pedido p WHERE p.id_cliente = c.id_cliente), 0) AS total_pedidos,
                       COALESCE((SELECT COUNT(*) FROM pagamento pg WHERE pg.id_cliente = c.id_cliente), 0) AS total_pagamentos
                FROM cliente c
                {latest_fin_join}
                WHERE c.status = %s
                ORDER BY c.id_cliente DESC
                """,
                (status,),
            )
        else:
            dados = query_all(
                f"""
                SELECT c.id_cliente, c.nome, c.status,
                       COALESCE(f.limite_credito, 0) AS limite_credito,
                       COALESCE(f.saldo_utilizado, 0) AS credito_utilizado,
                       COALESCE((SELECT COUNT(*) FROM pedido p WHERE p.id_cliente = c.id_cliente), 0) AS total_pedidos,
                       COALESCE((SELECT COUNT(*) FROM pagamento pg WHERE pg.id_cliente = c.id_cliente), 0) AS total_pagamentos
                FROM cliente c
                {latest_fin_join}
                ORDER BY c.id_cliente DESC
                """
            )
        for d in dados:
            d["saldo_restante"] = float(d.get("limite_credito") or 0) - float(d.get("credito_utilizado") or 0)

        return jsonify({
            "tipo": "clientes",
            "totais": {
                "quantidade": len(dados),
                "totalPedidos": sum(int(d.get("total_pedidos") or 0) for d in dados),
                "totalPagamentos": sum(int(d.get("total_pagamentos") or 0) for d in dados),
                "limiteCreditoTotal": sum(float(d.get("limite_credito") or 0) for d in dados),
                "saldoRestanteTotal": sum(float(d.get("saldo_restante") or 0) for d in dados),
                "creditoUtilizadoTotal": sum(float(d.get("credito_utilizado") or 0) for d in dados),
            },
            "dados": dados,
        })
    except Exception as ex:
        logger.error('relatorios.py - rel_clientes: %s', ex)
        return jsonify({"error": "Erro ao gerar relatório de clientes"}), 500


@relatorios_bp.get("/vendas")
def rel_vendas():
    """Relatório de vendas por período.

    Returns:
        JSON com dados do relatório.
    """
    try:
        data_inicio = request.args.get("dataInicio")
        data_fim = request.args.get("dataFim")
        clauses, params = _date_filter("p.data", data_inicio, data_fim)
        clauses.append("LOWER(p.status) <> 'cancelado'")
        where = f"WHERE {' AND '.join(clauses)}"
        dados = query_all(
            f"""
            SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome, p.total, p.data, p.status
            FROM pedido p
            LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
            {where}
            ORDER BY p.data DESC
            """,
            tuple(params),
        )
        faturamento = sum(float(d.get("total") or 0) for d in dados)
        qtd = len(dados)
        return jsonify({
            "tipo": "vendas",
            "periodo": {"dataInicio": data_inicio, "dataFim": data_fim},
            "totais": {
                "quantidadePedidos": qtd,
                "faturamento": faturamento,
                "ticketMedio": (faturamento / qtd if qtd else 0),
            },
            "dados": dados,
        })
    except Exception as ex:
        logger.error('relatorios.py - rel_vendas: %s', ex)
        return jsonify({"error": "Erro ao gerar relatório de vendas"}), 500


@relatorios_bp.get("/usuario")
def rel_usuario():
    """Relatório detalhado de um cliente.

    Returns:
        JSON com dados do relatório.
    """
    try:
        id_cliente = request.args.get("id_cliente", type=int)
        if not id_cliente:
            return jsonify({"error": "id_cliente obrigatório"}), 400

        cliente = query_one(
            f"""
            SELECT c.id_cliente, c.nome, c.status,
                   COALESCE(f.limite_credito, 0) AS limite_credito,
                   COALESCE(f.saldo_utilizado, 0) AS credito_utilizado
            FROM cliente c
            {_latest_financeiro_join('f')}
            WHERE c.id_cliente = %s
            LIMIT 1
            """,
            (id_cliente,),
        )

        pedidos = query_all(
            "SELECT id_pedido, total, status, data FROM pedido WHERE id_cliente = %s ORDER BY data DESC",
            (id_cliente,),
        )
        pedido_ids = [int(p.get("id_pedido")) for p in pedidos if p.get("id_pedido") is not None]
        itens_por_pedido: dict[int, list] = {}
        if pedido_ids:
            placeholders = ", ".join(["%s"] * len(pedido_ids))
            itens = query_all(
                f"""
                SELECT pi.id_pedido, pi.id_item_pedido AS id_pedido_item, pi.id_produto, p.nome AS produto_nome,
                    pi.qtd, pi.vlr_item AS vlr_venda
                FROM pedido_item pi
                LEFT JOIN produto p ON p.id_produto = pi.id_produto
                WHERE pi.id_pedido IN ({placeholders})
                ORDER BY pi.id_item_pedido ASC
                """,
                tuple(pedido_ids),
            )
            for item in itens:
                pid = int(item["id_pedido"])
                itens_por_pedido.setdefault(pid, []).append({
                    "id_pedido_item": item.get("id_pedido_item"),
                    "id_produto": item.get("id_produto"),
                    "produto_nome": item.get("produto_nome"),
                    "qtd": item.get("qtd"),
                    "vlr_venda": item.get("vlr_venda"),
                })

        for pedido in pedidos:
            pid = int(pedido.get("id_pedido")) if pedido.get("id_pedido") is not None else 0
            pedido["pedido_item"] = itens_por_pedido.get(pid, [])

        pagamentos = query_all(
            "SELECT id_pagamento, valor, status, data_criacao FROM pagamento WHERE id_cliente = %s ORDER BY data_criacao DESC",
            (id_cliente,),
        )

        total_pedidos = sum(float(p.get("total") or 0) for p in pedidos)
        total_pagamentos_valor = sum(float(p.get("valor") or 0) for p in pagamentos)
        limite_credito = float((cliente or {}).get("limite_credito") or 0)
        credito_utilizado = float((cliente or {}).get("credito_utilizado") or 0)

        return jsonify({
            "tipo": "usuario",
            "cliente": {
                **(cliente or {}),
                "saldo_restante": limite_credito - credito_utilizado,
            } if cliente else None,
            "totais": {
                "totalPedidos": len(pedidos),
                "quantidadePedidos": len(pedidos),
                "valorTotalPedidos": total_pedidos,
                "totalPagamentos": len(pagamentos),
                "quantidadePagamentos": len(pagamentos),
                "valorTotalPagamentos": total_pagamentos_valor,
                "limiteCredito": limite_credito,
                "creditoUtilizado": credito_utilizado,
                "saldoRestante": limite_credito - credito_utilizado,
            },
            "pedidos": pedidos,
            "pagamentos": pagamentos,
            "dados": pedidos,
        })
    except Exception as ex:
        logger.error('relatorios.py - rel_usuario: %s', ex)
        return jsonify({"error": "Erro ao gerar relatório de usuário"}), 500
