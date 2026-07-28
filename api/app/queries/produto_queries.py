import logging
from typing import Optional

from app.db import query_all, query_one, execute, execute_insert

logger = logging.getLogger(__name__)


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> list[dict]:
    """Retorna produtos paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Lista de dicionários com dados dos produtos.
    """
    try:
        offset = (page - 1) * limit
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(id_produto AS CHAR) LIKE %s OR nome LIKE %s OR marca LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%"]
        params.extend([limit, offset])
        return query_all("SELECT id_produto, nome, valor, oldvalor, marca, saldo FROM produto " + where + " ORDER BY id_produto DESC LIMIT %s OFFSET %s", tuple(params))
    except Exception as ex:
        logger.error('produto_queries.py - listar_todos: %s', ex)
        return []


def contar_todos(q: Optional[str] = None) -> int:
    """Conta produtos com filtros.

    Args:
        q: Termo de busca.

    Returns:
        Total de registros.
    """
    try:
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(id_produto AS CHAR) LIKE %s OR nome LIKE %s OR marca LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%"]
        row = query_one("SELECT COUNT(*) AS total FROM produto " + where, tuple(params))
        return row["total"] if row else 0
    except Exception as ex:
        logger.error('produto_queries.py - contar_todos: %s', ex)
        return 0


def obter_por_id(produto_id: int) -> Optional[dict]:
    """Retorna um produto pelo ID.

    Args:
        produto_id: ID do produto.

    Returns:
        Dicionário com dados do produto ou None.
    """
    try:
        return query_one(
            "SELECT id_produto, nome, valor, oldvalor, marca, saldo FROM produto WHERE id_produto = %s LIMIT 1",
            (produto_id,),
        )
    except Exception as ex:
        logger.error('produto_queries.py - obter_por_id: %s', ex)
        return None


def criar(dados: dict) -> int:
    """Cria um novo produto.

    Args:
        dados: Dict com nome, valor, oldvalor, marca, saldo.

    Returns:
        ID do produto criado.
    """
    try:
        return execute_insert(
            "INSERT INTO produto (nome, valor, oldvalor, marca, saldo) VALUES (%s, %s, %s, %s, %s)",
            (dados["nome"], dados["valor"], dados["oldvalor"], dados["marca"], dados.get("saldo", 0)),
        )
    except Exception as ex:
        logger.error('produto_queries.py - criar: %s', ex)
        raise


def atualizar(produto_id: int, dados: dict) -> None:
    """Atualiza dados de um produto.

    Args:
        produto_id: ID do produto.
        dados: Dict com campos a atualizar.
    """
    try:
        execute(
            """
            UPDATE produto
            SET nome = COALESCE(%s, nome),
                marca = COALESCE(%s, marca),
                oldvalor = CASE WHEN %s IS NULL THEN oldvalor ELSE valor END,
                valor = COALESCE(%s, valor),
                saldo = COALESCE(%s, saldo)
            WHERE id_produto = %s
            """,
            (dados.get("nome"), dados.get("marca"), dados.get("valor"), dados.get("valor"), dados.get("saldo"), produto_id),
        )
    except Exception as ex:
        logger.error('produto_queries.py - atualizar: %s', ex)
        raise


def deletar(produto_id: int) -> None:
    """Deleta um produto.

    Args:
        produto_id: ID do produto.
    """
    try:
        execute("DELETE FROM produto WHERE id_produto = %s", (produto_id,))
    except Exception as ex:
        logger.error('produto_queries.py - deletar: %s', ex)
        raise


def obter_resumo() -> dict:
    """Retorna totais agregados de todos os produtos.

    Returns:
        Dict com total_produtos, total_estoque, valor_estoque.
    """
    try:
        row = query_one("""
            SELECT COUNT(*) AS total_produtos,
                   COALESCE(SUM(saldo), 0) AS total_estoque,
                   COALESCE(SUM(saldo * valor), 0) AS valor_estoque
            FROM produto
        """)
        return row or {"total_produtos": 0, "total_estoque": 0, "valor_estoque": 0}
    except Exception as ex:
        logger.error('produto_queries.py - obter_resumo: %s', ex)
        return {"total_produtos": 0, "total_estoque": 0, "valor_estoque": 0}


def obter_por_nome(nome: str) -> Optional[dict]:
    """Busca produto por nome exato.

    Args:
        nome: Nome do produto.

    Returns:
        Dict com dados do produto ou None.
    """
    try:
        return query_one("SELECT id_produto, saldo FROM produto WHERE nome = %s LIMIT 1", (nome,))
    except Exception as ex:
        logger.error('produto_queries.py - obter_por_nome: %s', ex)
        return None
