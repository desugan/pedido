import logging
from typing import Optional

from app.db import query_all, query_one, execute, execute_insert

logger = logging.getLogger(__name__)


def _build_where(status=None, q=None):
    """Monta cláusula WHERE dinâmica para listagem de pedidos.

    Args:
        status: Filtrar por status do pedido (opcional).
        q: Termo de busca (opcional) — busca por id_pedido, nome do cliente ou status.

    Returns:
        Tupla (where_string, params_tuple).
    """
    try:
        conditions = []
        params = []
        if status:
            conditions.append("p.status = %s")
            params.append(status)
        if q:
            conditions.append("(CAST(p.id_pedido AS CHAR) LIKE %s OR c.nome LIKE %s OR p.status LIKE %s)")
            params.extend([f"%{q}%", f"%{q}%", f"%{q}%"])
        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        return where, params
    except Exception as ex:
        logger.error("pedido_queries.py - _build_where: %s", ex)
        return "", []


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None, status: Optional[str] = None) -> list[dict]:
    """Retorna pedidos paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.
        status: Filtro por status.

    Returns:
        Lista de dicionários com dados dos pedidos.
    """
    try:
        offset = (page - 1) * limit
        where, params = _build_where(status, q)
        params.extend([limit, offset])
        return query_all(
            f"""
            SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome,
                   p.status, p.total, p.data
            FROM pedido p
            LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
            {where}
            ORDER BY p.id_pedido DESC
            LIMIT %s OFFSET %s
            """,
            tuple(params),
        )
    except Exception as ex:
        logger.error('pedido_queries.py - listar_todos: %s', ex)
        return []


def contar_todos(q: Optional[str] = None, status: Optional[str] = None) -> int:
    """Conta pedidos com filtros.

    Args:
        q: Termo de busca.
        status: Filtro por status.

    Returns:
        Total de registros.
    """
    try:
        where, params = _build_where(status, q)
        row = query_one(
            f"SELECT COUNT(*) AS total FROM pedido p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente {where}",
            tuple(params),
        )
        return row["total"] if row else 0
    except Exception as ex:
        logger.error('pedido_queries.py - contar_todos: %s', ex)
        return 0


def listar_por_cliente(cliente_id: int, page: int = 1, limit: int = 10, status: Optional[str] = None) -> list[dict]:
    """Retorna pedidos de um cliente específico com paginação.

    Args:
        cliente_id: ID do cliente.
        page: Número da página.
        limit: Itens por página.
        status: Filtro opcional por status.

    Returns:
        Lista de dicionários com dados dos pedidos.
    """
    try:
        offset = (page - 1) * limit
        where = "WHERE p.id_cliente = %s"
        params = [cliente_id]
        if status:
            where += " AND p.status = %s"
            params.append(status)
        params.extend([limit, offset])
        return query_all(
            f"""
            SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome,
                   p.status, p.total, p.data
            FROM pedido p
            LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
            {where}
            ORDER BY p.id_pedido DESC
            LIMIT %s OFFSET %s
            """,
            tuple(params),
        )
    except Exception as ex:
        logger.error('pedido_queries.py - listar_por_cliente: %s', ex)
        return []


def contar_por_cliente(cliente_id: int, status: Optional[str] = None) -> int:
    """Conta pedidos de um cliente.

    Args:
        cliente_id: ID do cliente.
        status: Filtro opcional por status.

    Returns:
        Total de registros.
    """
    try:
        where = "WHERE id_cliente = %s"
        params = [cliente_id]
        if status:
            where += " AND status = %s"
            params.append(status)
        row = query_one(f"SELECT COUNT(*) AS total FROM pedido {where}", tuple(params))
        return row["total"] if row else 0
    except Exception as ex:
        logger.error('pedido_queries.py - contar_por_cliente: %s', ex)
        return 0


def obter_por_id(pedido_id: int) -> Optional[dict]:
    """Retorna um pedido pelo ID.

    Args:
        pedido_id: ID do pedido.

    Returns:
        Dicionário com dados do pedido ou None.
    """
    try:
        return query_one(
            """
            SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome,
                   p.status, p.total, p.data
            FROM pedido p
            LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
            WHERE p.id_pedido = %s
            LIMIT 1
            """,
            (pedido_id,),
        )
    except Exception as ex:
        logger.error('pedido_queries.py - obter_por_id: %s', ex)
        return None


def obter_status(pedido_id: int) -> Optional[str]:
    """Retorna apenas o status de um pedido.

    Args:
        pedido_id: ID do pedido.

    Returns:
        String com status ou None.
    """
    try:
        row = query_one("SELECT status FROM pedido WHERE id_pedido = %s", (pedido_id,))
        return row["status"] if row else None
    except Exception as ex:
        logger.error('pedido_queries.py - obter_status: %s', ex)
        return None


def criar(pedido_data: dict) -> int:
    """Cria um novo pedido.

    Args:
        pedido_data: Dict com id_cliente, total.

    Returns:
        ID do pedido criado.
    """
    try:
        return execute_insert(
            "INSERT INTO pedido (id_cliente, total, data, status) VALUES (%s, %s, NOW(), 'pendente')",
            (pedido_data["id_cliente"], pedido_data["total"]),
        )
    except Exception as ex:
        logger.error('pedido_queries.py - criar: %s', ex)
        raise


def atualizar_status(pedido_id: int, status: str) -> None:
    """Atualiza o status de um pedido.

    Args:
        pedido_id: ID do pedido.
        status: Novo status.
    """
    try:
        execute("UPDATE pedido SET status = %s WHERE id_pedido = %s", (status, pedido_id))
    except Exception as ex:
        logger.error('pedido_queries.py - atualizar_status: %s', ex)
        raise


def deletar(pedido_id: int) -> None:
    """Deleta um pedido e seus itens.

    Args:
        pedido_id: ID do pedido.
    """
    try:
        execute("DELETE FROM pedido_item WHERE id_pedido = %s", (pedido_id,))
        execute("DELETE FROM pedido WHERE id_pedido = %s", (pedido_id,))
    except Exception as ex:
        logger.error('pedido_queries.py - deletar: %s', ex)
        raise


def listar_itens(pedido_id: int) -> list[dict]:
    """Retorna os itens de um pedido.

    Args:
        pedido_id: ID do pedido.

    Returns:
        Lista de dicionários com itens.
    """
    try:
        return query_all(
            """
            SELECT pi.id_item_pedido AS id, pi.id_pedido AS pedido_id,
                   p.nome AS produto_nome, pi.qtd AS quantidade,
                   pi.vlr_item AS preco_unitario, pi.vlr_total AS subtotal
            FROM pedido_item pi
            LEFT JOIN produto p ON p.id_produto = pi.id_produto
            WHERE pi.id_pedido = %s
            ORDER BY pi.id_item_pedido ASC
            """,
            (pedido_id,),
        )
    except Exception as ex:
        logger.error('pedido_queries.py - listar_itens: %s', ex)
        return []


def obter_item_por_id(item_id: int, pedido_id: int) -> Optional[dict]:
    """Retorna um item específico de pedido.

    Args:
        item_id: ID do item.
        pedido_id: ID do pedido.

    Returns:
        Dicionário com dados do item ou None.
    """
    try:
        return query_one(
            "SELECT id_produto, qtd FROM pedido_item WHERE id_item_pedido = %s AND id_pedido = %s",
            (item_id, pedido_id),
        )
    except Exception as ex:
        logger.error('pedido_queries.py - obter_item_por_id: %s', ex)
        return None


def adicionar_item(item_data: dict) -> int:
    """Adiciona um item a um pedido.

    Args:
        item_data: Dict com id_pedido, id_produto, qtd, vlr_item, vlr_total, vlr_custo.

    Returns:
        ID do item criado.
    """
    try:
        return execute_insert(
            "INSERT INTO pedido_item (id_pedido, id_produto, qtd, vlr_item, vlr_total, vlr_custo) VALUES (%s, %s, %s, %s, %s, 0)",
            (item_data["id_pedido"], item_data["id_produto"], item_data["qtd"], item_data["vlr_item"], item_data["vlr_total"]),
        )
    except Exception as ex:
        logger.error('pedido_queries.py - adicionar_item: %s', ex)
        raise


def remover_item(item_id: int) -> None:
    """Remove um item de um pedido.

    Args:
        item_id: ID do item.
    """
    try:
        execute("DELETE FROM pedido_item WHERE id_item_pedido = %s", (item_id,))
    except Exception as ex:
        logger.error('pedido_queries.py - remover_item: %s', ex)
        raise


def atualizar_total(pedido_id: int) -> None:
    """Atualiza o total do pedido com base na soma dos itens.

    Args:
        pedido_id: ID do pedido.
    """
    try:
        execute(
            "UPDATE pedido SET total = (SELECT COALESCE(SUM(vlr_total),0) FROM pedido_item WHERE id_pedido = %s) WHERE id_pedido = %s",
            (pedido_id, pedido_id),
        )
    except Exception as ex:
        logger.error('pedido_queries.py - atualizar_total: %s', ex)
        raise


def calcular_total(pedido_id: int) -> float:
    """Calcula o total de itens de um pedido.

    Args:
        pedido_id: ID do pedido.

    Returns:
        Valor total.
    """
    try:
        row = query_one("SELECT COALESCE(SUM(vlr_total),0) AS total FROM pedido_item WHERE id_pedido = %s", (pedido_id,))
        return float(row["total"]) if row else 0.0
    except Exception as ex:
        logger.error('pedido_queries.py - calcular_total: %s', ex)
        return 0.0


def verificar_estoque_produto(produto_id: int) -> Optional[dict]:
    """Retorna nome e saldo de um produto.

    Args:
        produto_id: ID do produto.

    Returns:
        Dict com nome e saldo ou None.
    """
    try:
        return query_one("SELECT nome, saldo FROM produto WHERE id_produto = %s", (produto_id,))
    except Exception as ex:
        logger.error('pedido_queries.py - verificar_estoque_produto: %s', ex)
        return None


def obter_produto_por_nome(nome: str) -> Optional[dict]:
    """Busca produto por nome exato.

    Args:
        nome: Nome do produto.

    Returns:
        Dict com dados do produto ou None.
    """
    try:
        return query_one("SELECT id_produto, nome, saldo FROM produto WHERE nome = %s LIMIT 1", (nome,))
    except Exception as ex:
        logger.error('pedido_queries.py - obter_produto_por_nome: %s', ex)
        return None


def listar_para_pagamento(page: int = 1, limit: int = 10, q: Optional[str] = None, cliente_id: Optional[int] = None) -> list[dict]:
    """Retorna pedidos confirmados disponiveis para pagamento (nao vinculados a pagamentos existentes).

    Args:
        page: Numero da pagina.
        limit: Itens por pagina.
        q: Termo de busca.
        cliente_id: Filtrar por cliente (opcional).

    Returns:
        Lista de dicionarios com dados dos pedidos.
    """
    try:
        offset = (page - 1) * limit
        conditions = [
            "p.status = 'confirmado'",
            "NOT EXISTS (SELECT 1 FROM pagamentopedido pp WHERE pp.id_pedido = p.id_pedido)",
        ]
        params = []
        if cliente_id is not None:
            conditions.append("p.id_cliente = %s")
            params.append(cliente_id)
        if q:
            conditions.append("(CAST(p.id_pedido AS CHAR) LIKE %s OR c.nome LIKE %s)")
            params.extend([f"%{q}%", f"%{q}%"])
        where = "WHERE " + " AND ".join(conditions)
        params.extend([limit, offset])
        return query_all(
            f"""
            SELECT p.id_pedido, p.id_cliente, c.nome AS cliente_nome,
                   p.status, p.total, p.data
            FROM pedido p
            LEFT JOIN cliente c ON c.id_cliente = p.id_cliente
            {where}
            ORDER BY p.id_pedido DESC
            LIMIT %s OFFSET %s
            """,
            tuple(params),
        )
    except Exception as ex:
        logger.error('pedido_queries.py - listar_para_pagamento: %s', ex)
        return []


def contar_para_pagamento(q: Optional[str] = None, cliente_id: Optional[int] = None) -> int:
    """Conta pedidos confirmados disponiveis para pagamento.

    Args:
        q: Termo de busca.
        cliente_id: Filtrar por cliente (opcional).

    Returns:
        Total de registros.
    """
    try:
        conditions = [
            "p.status = 'confirmado'",
            "NOT EXISTS (SELECT 1 FROM pagamentopedido pp WHERE pp.id_pedido = p.id_pedido)",
        ]
        params = []
        if cliente_id is not None:
            conditions.append("p.id_cliente = %s")
            params.append(cliente_id)
        if q:
            conditions.append("(CAST(p.id_pedido AS CHAR) LIKE %s OR c.nome LIKE %s)")
            params.extend([f"%{q}%", f"%{q}%"])
        where = "WHERE " + " AND ".join(conditions)
        row = query_one(
            f"SELECT COUNT(*) AS total FROM pedido p LEFT JOIN cliente c ON c.id_cliente = p.id_cliente {where}",
            tuple(params),
        )
        return row["total"] if row else 0
    except Exception as ex:
        logger.error('pedido_queries.py - contar_para_pagamento: %s', ex)
        return 0
