import logging
from typing import Optional

from app.db import query_all, query_one, execute, execute_insert

logger = logging.getLogger(__name__)

_SQL_SELECT = """
    SELECT p.id_pagamento, p.valor, p.qrcode, p.chavepix, p.status,
           p.data_criacao, p.id_cliente, p.data_pagamento,
           c.nome AS cliente_nome
    FROM pagamento p
    LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
"""


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None, status: Optional[str] = None) -> list[dict]:
    """Retorna pagamentos paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.
        status: Filtro por status.

    Returns:
        Lista de dicionários com dados dos pagamentos.
    """
    try:
        offset = (page - 1) * limit
        conditions = []
        params = []
        if status:
            conditions.append("p.status = %s")
            params.append(status)
        if q:
            conditions.append("(CAST(p.id_pagamento AS CHAR) LIKE %s OR p.status LIKE %s)")
            params.extend([f"%{q}%", f"%{q}%"])
        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        params.extend([limit, offset])
        return query_all(_SQL_SELECT + where + " ORDER BY p.id_pagamento DESC LIMIT %s OFFSET %s", tuple(params))
    except Exception as ex:
        logger.error('pagamento_queries.py - listar_todos: %s', ex)
        return []


def contar_todos(q: Optional[str] = None, status: Optional[str] = None) -> int:
    """Conta pagamentos com filtros.

    Args:
        q: Termo de busca.
        status: Filtro por status.

    Returns:
        Total de registros.
    """
    try:
        conditions = []
        params = []
        if status:
            conditions.append("p.status = %s")
            params.append(status)
        if q:
            conditions.append("(CAST(p.id_pagamento AS CHAR) LIKE %s OR p.status LIKE %s)")
            params.extend([f"%{q}%", f"%{q}%"])
        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        row = query_one(
            "SELECT COUNT(*) AS total FROM pagamento p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente " + where,
            tuple(params),
        )
        return row["total"] if row else 0
    except Exception as ex:
        logger.error('pagamento_queries.py - contar_todos: %s', ex)
        return 0


def listar_por_cliente(cliente_id: int) -> list[dict]:
    """Retorna pagamentos de um cliente.

    Args:
        cliente_id: ID do cliente.

    Returns:
        Lista de dicionários com dados dos pagamentos.
    """
    try:
        return query_all(_SQL_SELECT + "WHERE p.id_cliente = %s ORDER BY p.id_pagamento DESC", (cliente_id,))
    except Exception as ex:
        logger.error('pagamento_queries.py - listar_por_cliente: %s', ex)
        return []


def obter_por_id(pagamento_id: int) -> Optional[dict]:
    """Retorna um pagamento pelo ID.

    Args:
        pagamento_id: ID do pagamento.

    Returns:
        Dicionário com dados do pagamento ou None.
    """
    try:
        return query_one(_SQL_SELECT + "WHERE p.id_pagamento = %s LIMIT 1", (pagamento_id,))
    except Exception as ex:
        logger.error('pagamento_queries.py - obter_por_id: %s', ex)
        return None


def criar(dados: dict) -> int:
    """Cria um novo pagamento.

    Args:
        dados: Dict com valor, qrcode, chavepix, id_cliente.

    Returns:
        ID do pagamento criado.
    """
    try:
        return execute_insert(
            "INSERT INTO pagamento (valor, qrcode, chavepix, status, id_cliente, data_criacao) VALUES (%s, %s, %s, 'PROCESSANDO PAGAMENTO', %s, NOW())",
            (dados["valor"], dados.get("qrcode", ""), dados.get("chavepix", ""), dados["id_cliente"]),
        )
    except Exception as ex:
        logger.error('pagamento_queries.py - criar: %s', ex)
        raise


def atualizar_status(pagamento_id: int, status: str) -> None:
    """Atualiza o status de um pagamento.

    Args:
        pagamento_id: ID do pagamento.
        status: Novo status.
    """
    try:
        execute("UPDATE pagamento SET status = %s WHERE id_pagamento = %s", (status, pagamento_id))
    except Exception as ex:
        logger.error('pagamento_queries.py - atualizar_status: %s', ex)
        raise


def atualizar_data_pagamento(pagamento_id: int) -> None:
    """Define a data de pagamento como NOW().

    Args:
        pagamento_id: ID do pagamento.
    """
    try:
        execute("UPDATE pagamento SET data_pagamento = NOW() WHERE id_pagamento = %s", (pagamento_id,))
    except Exception as ex:
        logger.error('pagamento_queries.py - atualizar_data_pagamento: %s', ex)
        raise


def deletar(pagamento_id: int) -> None:
    """Deleta um pagamento.

    Args:
        pagamento_id: ID do pagamento.
    """
    try:
        execute("DELETE FROM pagamento WHERE id_pagamento = %s", (pagamento_id,))
    except Exception as ex:
        logger.error('pagamento_queries.py - deletar: %s', ex)
        raise


def vincular_pedido(pagamento_id: int, pedido_id: int) -> None:
    """Vincula um pedido a um pagamento.

    Args:
        pagamento_id: ID do pagamento.
        pedido_id: ID do pedido.
    """
    try:
        execute_insert(
            "INSERT INTO pagamentopedido (id_pagamento, id_pedido) VALUES (%s, %s)",
            (pagamento_id, pedido_id),
        )
    except Exception as ex:
        logger.error('pagamento_queries.py - vincular_pedido: %s', ex)
        raise


def listar_pedidos_vinculados(pagamento_id: int) -> list[dict]:
    """Retorna os pedidos vinculados a um pagamento.

    Args:
        pagamento_id: ID do pagamento.

    Returns:
        Lista de dicionários com vínculos.
    """
    try:
        return query_all(
            "SELECT id_pagamento_pedido, id_pedido, id_pagamento FROM pagamentopedido WHERE id_pagamento = %s ORDER BY id_pagamento_pedido ASC",
            (pagamento_id,),
        )
    except Exception as ex:
        logger.error('pagamento_queries.py - listar_pedidos_vinculados: %s', ex)
        return []
