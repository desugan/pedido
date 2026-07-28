import logging
from typing import Optional

from app.db import query_all, query_one, execute, execute_insert

logger = logging.getLogger(__name__)


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> list[dict]:
    """Retorna fornecedores paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Lista de dicionários com dados dos fornecedores.
    """
    try:
        offset = (page - 1) * limit
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(id_fornecedor AS CHAR) LIKE %s OR razao LIKE %s OR cnpj LIKE %s OR status LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"]
        params.extend([limit, offset])
        return query_all("SELECT id_fornecedor, razao, cnpj, status, data FROM fornecedor " + where + " ORDER BY id_fornecedor DESC LIMIT %s OFFSET %s", tuple(params))
    except Exception as ex:
        logger.error('fornecedor_queries.py - listar_todos: %s', ex)
        return []


def contar_todos(q: Optional[str] = None) -> int:
    """Conta fornecedores com filtros.

    Args:
        q: Termo de busca.

    Returns:
        Total de registros.
    """
    try:
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(id_fornecedor AS CHAR) LIKE %s OR razao LIKE %s OR cnpj LIKE %s OR status LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"]
        row = query_one("SELECT COUNT(*) AS total FROM fornecedor " + where, tuple(params))
        return row["total"] if row else 0
    except Exception as ex:
        logger.error('fornecedor_queries.py - contar_todos: %s', ex)
        return 0


def obter_por_id(fornecedor_id: int) -> Optional[dict]:
    """Retorna um fornecedor pelo ID.

    Args:
        fornecedor_id: ID do fornecedor.

    Returns:
        Dicionário com dados do fornecedor ou None.
    """
    try:
        return query_one(
            "SELECT id_fornecedor, razao, cnpj, status, data FROM fornecedor WHERE id_fornecedor = %s LIMIT 1",
            (fornecedor_id,),
        )
    except Exception as ex:
        logger.error('fornecedor_queries.py - obter_por_id: %s', ex)
        return None


def criar(dados: dict) -> int:
    """Cria um novo fornecedor.

    Args:
        dados: Dict com razao, cnpj, status, data.

    Returns:
        ID do fornecedor criado.
    """
    try:
        return execute_insert(
            "INSERT INTO fornecedor (razao, cnpj, status, data, id_usuario) VALUES (%s, %s, %s, COALESCE(%s, NOW()), %s)",
            (dados["razao"], dados["cnpj"], dados.get("status", "ATIVO"), dados.get("data"), dados.get("id_usuario")),
        )
    except Exception as ex:
        logger.error('fornecedor_queries.py - criar: %s', ex)
        raise


def atualizar(fornecedor_id: int, dados: dict) -> None:
    """Atualiza dados de um fornecedor.

    Args:
        fornecedor_id: ID do fornecedor.
        dados: Dict com campos a atualizar.
    """
    try:
        execute(
            """
            UPDATE fornecedor
            SET razao = COALESCE(%s, razao),
                cnpj = COALESCE(%s, cnpj),
                status = COALESCE(%s, status),
                data = COALESCE(%s, data)
            WHERE id_fornecedor = %s
            """,
            (dados.get("razao"), dados.get("cnpj"), dados.get("status"), dados.get("data"), fornecedor_id),
        )
    except Exception as ex:
        logger.error('fornecedor_queries.py - atualizar: %s', ex)
        raise


def deletar(fornecedor_id: int) -> None:
    """Deleta um fornecedor.

    Args:
        fornecedor_id: ID do fornecedor.

    Returns:
        None
    """
    try:
        execute("DELETE FROM fornecedor WHERE id_fornecedor = %s", (fornecedor_id,))
    except Exception as ex:
        logger.error('fornecedor_queries.py - deletar: %s', ex)
        raise
