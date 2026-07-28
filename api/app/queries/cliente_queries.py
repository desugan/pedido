import logging
from typing import Optional

from app.db import query_all, query_one, execute, execute_insert, tx_query, tx_one, tx_execute, tx_insert

logger = logging.getLogger(__name__)

_SQL_SELECT_CLIENTE = """
    SELECT c.id_cliente, c.nome, c.status, c.contato,
           f.limite_credito, f.saldo_utilizado,
           COALESCE((SELECT COUNT(*) FROM pedido p WHERE p.id_cliente = c.id_cliente), 0) AS total_pedidos,
           COALESCE((SELECT COUNT(*) FROM pagamento pg WHERE pg.id_cliente = c.id_cliente), 0) AS total_pagamentos
    FROM cliente c
    LEFT JOIN financeiro f ON f.id_financeiro = (
        SELECT MAX(id_financeiro) FROM financeiro WHERE id_cliente = c.id_cliente
    )
"""


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> list[dict]:
    """Retorna clientes paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Lista de dicionários com dados dos clientes.
    """
    try:
        offset = (page - 1) * limit
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(c.id_cliente AS CHAR) LIKE %s OR c.nome LIKE %s OR c.status LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%"]
        params.extend([limit, offset])
        return query_all(_SQL_SELECT_CLIENTE + " " + where + " ORDER BY c.id_cliente DESC LIMIT %s OFFSET %s", tuple(params))
    except Exception as ex:
        logger.error('cliente_queries.py - listar_todos: %s', ex)
        return []


def contar_todos(q: Optional[str] = None) -> int:
    """Conta clientes com filtros.

    Args:
        q: Termo de busca.

    Returns:
        Total de registros.
    """
    try:
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(id_cliente AS CHAR) LIKE %s OR nome LIKE %s OR status LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%"]
        row = query_one("SELECT COUNT(*) AS total FROM cliente " + where, tuple(params))
        return row["total"] if row else 0
    except Exception as ex:
        logger.error('cliente_queries.py - contar_todos: %s', ex)
        return 0


def obter_por_id(cliente_id: int) -> Optional[dict]:
    """Retorna um cliente pelo ID.

    Args:
        cliente_id: ID do cliente.

    Returns:
        Dicionário com dados do cliente ou None.
    """
    try:
        return query_one(_SQL_SELECT_CLIENTE + " WHERE c.id_cliente = %s", (cliente_id,))
    except Exception as ex:
        logger.error('cliente_queries.py - obter_por_id: %s', ex)
        return None


def criar(nome: str, status: str) -> int:
    """Cria um novo cliente.

    Args:
        nome: Nome do cliente.
        status: Status do cliente.

    Returns:
        ID do cliente criado.
    """
    try:
        return execute_insert("INSERT INTO cliente (nome, status) VALUES (%s, %s)", (nome, status))
    except Exception as ex:
        logger.error('cliente_queries.py - criar: %s', ex)
        raise


def atualizar(cliente_id: int, dados: dict) -> None:
    """Atualiza dados de um cliente.

    Args:
        cliente_id: ID do cliente.
        dados: Dict com campos a atualizar (nome, status, contato).
    """
    try:
        execute(
            """
            UPDATE cliente
            SET nome = COALESCE(%s, nome),
                status = COALESCE(%s, status),
                contato = COALESCE(%s, contato)
            WHERE id_cliente = %s
            """,
            (dados.get("nome"), dados.get("status"), dados.get("contato"), cliente_id),
        )
    except Exception as ex:
        logger.error('cliente_queries.py - atualizar: %s', ex)
        raise


def deletar(cliente_id: int) -> None:
    """Deleta um cliente.

    Args:
        cliente_id: ID do cliente.
    """
    try:
        execute("DELETE FROM cliente WHERE id_cliente = %s", (cliente_id,))
    except Exception as ex:
        logger.error('cliente_queries.py - deletar: %s', ex)
        raise


def obter_ultimo_financeiro(cliente_id: int) -> Optional[dict]:
    """Retorna o último registro financeiro de um cliente.

    Args:
        cliente_id: ID do cliente.

    Returns:
        Dict com dados financeiros ou None.
    """
    try:
        return query_one(
            "SELECT id_financeiro FROM financeiro WHERE id_cliente = %s ORDER BY id_financeiro DESC LIMIT 1",
            (cliente_id,),
        )
    except Exception as ex:
        logger.error('cliente_queries.py - obter_ultimo_financeiro: %s', ex)
        return None


def criar_financeiro(cliente_id: int, limite: float) -> int:
    """Cria registro financeiro para um cliente.

    Args:
        cliente_id: ID do cliente.
        limite: Limite de crédito.

    Returns:
        ID do registro financeiro criado.
    """
    try:
        return execute_insert(
            """
            INSERT INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao)
            VALUES (%s, %s, 0, %s, NOW(), 'SISTEMA')
            """,
            (cliente_id, limite, limite),
        )
    except Exception as ex:
        logger.error('cliente_queries.py - criar_financeiro: %s', ex)
        raise


def atualizar_financeiro(financeiro_id: int, limite: float) -> None:
    """Atualiza limite de crédito no financeiro.

    Args:
        financeiro_id: ID do registro financeiro.
        limite: Novo limite.
    """
    try:
        execute(
            "UPDATE financeiro SET limite_credito = %s, ultimo_limite = %s, usuario_alteracao = 'SISTEMA' WHERE id_financeiro = %s",
            (limite, limite, financeiro_id),
        )
    except Exception as ex:
        logger.error('cliente_queries.py - atualizar_financeiro: %s', ex)
        raise
