import logging
from typing import Optional

from app.db import query_all, query_one, execute, execute_insert

logger = logging.getLogger(__name__)


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> list[dict]:
    """Retorna lançamentos paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Lista de dicionários com dados dos lançamentos.
    """
    try:
        offset = (page - 1) * limit
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(l.id_lancamento AS CHAR) LIKE %s OR f.razao LIKE %s OR l.status LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%"]
        params.extend([limit, offset])
        return query_all(
            f"""
            SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome,
                   l.total, l.data, l.status, l.documento, l.id_usuario,
                   u.usuario AS usuario_nome
            FROM lancamento l
            LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
            LEFT JOIN usuario u ON u.id_usuario = l.id_usuario
            {where}
            ORDER BY l.id_lancamento DESC
            LIMIT %s OFFSET %s
            """,
            tuple(params),
        )
    except Exception as ex:
        logger.error('lancamento_queries.py - listar_todos: %s', ex)
        return []


def contar_todos(q: Optional[str] = None) -> int:
    """Conta lançamentos com filtros.

    Args:
        q: Termo de busca.

    Returns:
        Total de registros.
    """
    try:
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(l.id_lancamento AS CHAR) LIKE %s OR f.razao LIKE %s OR l.status LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%"]
        row = query_one(
            f"""SELECT COUNT(*) AS total FROM lancamento l
            LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor {where}""",
            tuple(params),
        )
        return row["total"] if row else 0
    except Exception as ex:
        logger.error('lancamento_queries.py - contar_todos: %s', ex)
        return 0


def obter_por_id(lancamento_id: int) -> Optional[dict]:
    """Retorna um lançamento pelo ID.

    Args:
        lancamento_id: ID do lançamento.

    Returns:
        Dicionário com dados do lançamento ou None.
    """
    try:
        return query_one(
            """
            SELECT l.id_lancamento, l.id_fornecedor, f.razao AS fornecedor_nome,
                   l.total, l.data, l.status, l.documento, l.id_usuario,
                   u.usuario AS usuario_nome
            FROM lancamento l
            LEFT JOIN fornecedor f ON f.id_fornecedor = l.id_fornecedor
            LEFT JOIN usuario u ON u.id_usuario = l.id_usuario
            WHERE l.id_lancamento = %s
            LIMIT 1
            """,
            (lancamento_id,),
        )
    except Exception as ex:
        logger.error('lancamento_queries.py - obter_por_id: %s', ex)
        return None


def listar_itens(lancamento_id: int) -> list[dict]:
    """Retorna os itens de um lançamento.

    Args:
        lancamento_id: ID do lançamento.

    Returns:
        Lista de dicionários com itens.
    """
    try:
        return query_all(
            """
            SELECT li.id_produto, p.nome AS produto_nome,
                   li.quantidade AS qtd, li.vlr_unit AS vlr_item,
                   (li.quantidade * li.vlr_unit) AS vlr_total
            FROM itens_lancamento li
            LEFT JOIN produto p ON p.id_produto = li.id_produto
            WHERE li.id_lancamento = %s
            """,
            (lancamento_id,),
        )
    except Exception as ex:
        logger.error('lancamento_queries.py - listar_itens: %s', ex)
        return []


def criar(dados: dict) -> int:
    """Cria um novo lançamento.

    Args:
        dados: Dict com dados do lançamento.

    Returns:
        ID do lançamento criado.
    """
    try:
        return execute_insert(
            "INSERT INTO lancamento (id_fornecedor, total, data, status, documento, id_usuario) VALUES (%s, %s, NOW(), %s, COALESCE(%s, ''), %s)",
            (dados["id_fornecedor"], dados["total"], dados.get("status", "PENDENTE"), dados.get("documento"), dados.get("id_usuario")),
        )
    except Exception as ex:
        logger.error('lancamento_queries.py - criar: %s', ex)
        raise


def atualizar_status(lancamento_id: int, status: str) -> None:
    """Atualiza o status de um lançamento.

    Args:
        lancamento_id: ID do lançamento.
        status: Novo status.
    """
    try:
        execute("UPDATE lancamento SET status = %s WHERE id_lancamento = %s", (status, lancamento_id))
    except Exception as ex:
        logger.error('lancamento_queries.py - atualizar_status: %s', ex)
        raise


def adicionar_item(item_data: dict) -> int:
    """Adiciona um item a um lançamento.

    Args:
        item_data: Dict com id_lancamento, id_produto, qtd, vlr_item, vlr_total.

    Returns:
        ID do item criado.
    """
    try:
        return execute_insert(
            "INSERT INTO itens_lancamento (id_lancamento, id_produto, quantidade, vlr_unit) VALUES (%s, %s, %s, %s)",
            (item_data["id_lancamento"], item_data["id_produto"], item_data["qtd"], item_data["vlr_item"]),
        )
    except Exception as ex:
        logger.error('lancamento_queries.py - adicionar_item: %s', ex)
        raise


def obter_produtos_vendidos_em_lancamento(lancamento_id: int) -> list[dict]:
    """Retorna produtos de um lançamento que já foram vendidos.

    Args:
        lancamento_id: ID do lançamento.

    Returns:
        Lista de dicionários com produtos vendidos.
    """
    try:
        return query_all(
            """
            SELECT DISTINCT p.nome AS produto_nome
            FROM itens_lancamento li
            JOIN pedido_item pi ON pi.id_produto = li.id_produto
            JOIN pedido pd ON pd.id_pedido = pi.id_pedido
            LEFT JOIN produto p ON p.id_produto = li.id_produto
            WHERE li.id_lancamento = %s
              AND UPPER(pd.status) <> 'CANCELADO'
            """,
            (lancamento_id,),
        )
    except Exception as ex:
        logger.error('lancamento_queries.py - obter_produtos_vendidos_em_lancamento: %s', ex)
        return []
