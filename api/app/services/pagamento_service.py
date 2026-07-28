import logging
from typing import Optional

from app.queries import pagamento_queries as queries
from app.queries import pedido_queries as pedido_queries
from app.schemas.pagamento_schema import (
    PagamentoResponse,
    PagamentoCreateRequest,
    PagamentoPedidoLink,
)
from app.db import execute, query_one

logger = logging.getLogger(__name__)


def _iso(value):
    """Converte valor datetime para string ISO.

    Args:
        value: Valor a ser convertido (datetime ou outro).

    Returns:
        String ISO se value tiver isoformat, ou o próprio value.
    """
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _normalize_status(value: str | None) -> str:
    """Normaliza string de status para lowercase sem espaços.

    Args:
        value: Status bruto ou None.

    Returns:
        String normalizada em lowercase.
    """
    return str(value or "").strip().lower()


def _ensure_financeiro_row(cliente_id: int) -> int:
    """Garante que existe um registro financeiro para o cliente.

    Args:
        cliente_id: ID do cliente.

    Returns:
        ID do registro financeiro (existente ou recém-criado).
    """
    try:
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
    except Exception as ex:
        logger.error("pagamento_service.py - _ensure_financeiro_row: %s", ex)
        raise


def _subtract_saldo_utilizado(cliente_id: int, amount: float):
    """Reduz o saldo utilizado do cliente.

    Args:
        cliente_id: ID do cliente.
        amount: Valor a subtrair.

    Returns:
        None.
    """
    try:
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
    except Exception as ex:
        logger.error("pagamento_service.py - _subtract_saldo_utilizado: %s", ex)
        raise


def _add_saldo_utilizado(cliente_id: int, amount: float):
    """Aumenta o saldo utilizado do cliente.

    Args:
        cliente_id: ID do cliente.
        amount: Valor a adicionar.

    Returns:
        None.
    """
    try:
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
    except Exception as ex:
        logger.error("pagamento_service.py - _add_saldo_utilizado: %s", ex)
        raise


def _montar_pagamento_response(row: dict) -> PagamentoResponse:
    """Converte row do banco para PagamentoResponse.

    Args:
        row: Dict com campos do banco (id_pagamento, valor, qrcode, chavepix, status, data_criacao, data_pagamento, id_cliente, cliente_nome).

    Returns:
        PagamentoResponse.
    """
    try:
        return PagamentoResponse(
            id_pagamento=row["id_pagamento"],
            valor=float(row.get("valor") or 0),
            qrcode=row.get("qrcode"),
            chavepix=row.get("chavepix"),
            status=row.get("status") or "",
            data_criacao=_iso(row.get("data_criacao")),
            data_pagamento=_iso(row.get("data_pagamento")),
            id_cliente=row.get("id_cliente") or 0,
            cliente={"nome": row.get("cliente_nome")} if row.get("cliente_nome") else None,
        )
    except Exception as ex:
        logger.error("pagamento_service.py - _montar_pagamento_response: %s", ex)
        raise


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None, status: Optional[str] = None) -> tuple:
    """Lista pagamentos paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.
        status: Filtro opcional.

    Returns:
        Tupla (lista de PagamentoResponse, total).
    """
    try:
        rows = queries.listar_todos(page, limit, q, status)
        total = queries.contar_todos(q, status)
        results = []
        for r in rows:
            p = _montar_pagamento_response(r)
            p.pagamentopedido = queries.listar_pedidos_vinculados(p.id_pagamento)
            p.pedido_ids = [int(pp["id_pedido"]) for pp in p.pagamentopedido]
            results.append(p)
        return results, total
    except Exception as ex:
        logger.error('pagamento_service.py - listar_todos: %s', ex)
        return [], 0


def listar_por_cliente(cliente_id: int) -> list[PagamentoResponse]:
    """Lista pagamentos de um cliente.

    Args:
        cliente_id: ID do cliente.

    Returns:
        Lista de PagamentoResponse.
    """
    try:
        rows = queries.listar_por_cliente(cliente_id)
        results = []
        for r in rows:
            p = _montar_pagamento_response(r)
            p.pagamentopedido = queries.listar_pedidos_vinculados(p.id_pagamento)
            p.pedido_ids = [int(pp["id_pedido"]) for pp in p.pagamentopedido]
            results.append(p)
        return results
    except Exception as ex:
        logger.error('pagamento_service.py - listar_por_cliente: %s', ex)
        return []


def obter_por_id(pagamento_id: int) -> Optional[PagamentoResponse]:
    """Obtém um pagamento pelo ID.

    Args:
        pagamento_id: ID do pagamento.

    Returns:
        PagamentoResponse ou None.
    """
    try:
        row = queries.obter_por_id(pagamento_id)
        if not row:
            return None
        p = _montar_pagamento_response(row)
        p.pagamentopedido = queries.listar_pedidos_vinculados(p.id_pagamento)
        p.pedido_ids = [int(pp["id_pedido"]) for pp in p.pagamentopedido]
        return p
    except Exception as ex:
        logger.error('pagamento_service.py - obter_por_id: %s', ex)
        return None


def criar(dados: PagamentoCreateRequest) -> PagamentoResponse:
    """Cria um novo pagamento com vínculo opcional a pedidos.

    Args:
        dados: Dados validados do pagamento.

    Returns:
        PagamentoResponse do pagamento criado.
    """
    try:
        pagamento_id = queries.criar({
            "valor": dados.valor,
            "qrcode": dados.qrcode,
            "chavepix": dados.chavepix,
            "id_cliente": dados.id_cliente,
        })

        if dados.pedido_ids:
            for pid in dados.pedido_ids:
                queries.vincular_pedido(pagamento_id, pid)

        return obter_por_id(pagamento_id)
    except Exception as ex:
        logger.error('pagamento_service.py - criar: %s', ex)
        raise


def atualizar_status(pagamento_id: int, status: str) -> PagamentoResponse:
    """Atualiza o status de um pagamento e reflete nos pedidos vinculados.

    Args:
        pagamento_id: ID do pagamento.
        status: Novo status.

    Returns:
        PagamentoResponse atualizado.
    """
    try:
        pagamento = obter_por_id(pagamento_id)
        if not pagamento:
            raise ValueError("Pagamento não encontrado")

        queries.atualizar_status(pagamento_id, status)

        if status.upper() == "PAGO":
            queries.atualizar_data_pagamento(pagamento_id)
            vinculos = queries.listar_pedidos_vinculados(pagamento_id)
            for v in vinculos:
                pedido_queries.atualizar_status(int(v["id_pedido"]), "pago")

        return obter_por_id(pagamento_id)
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('pagamento_service.py - atualizar_status: %s', ex)
        raise


def deletar(pagamento_id: int) -> None:
    """Deleta um pagamento.

    Args:
        pagamento_id: ID do pagamento.
    """
    try:
        p = obter_por_id(pagamento_id)
        if not p:
            raise ValueError("Pagamento não encontrado")
        queries.deletar(pagamento_id)
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('pagamento_service.py - deletar: %s', ex)
        raise
