import logging
from typing import Optional

from app.db import query_all, query_one, execute, execute_insert

logger = logging.getLogger(__name__)

_SQL_SELECT_USUARIO = """
    SELECT u.id_usuario, u.id_cliente, u.id_perfil, u.usuario,
           c.nome AS cliente_nome, p.perfil AS perfil_nome
    FROM usuario u
    LEFT JOIN cliente c ON c.id_cliente = u.id_cliente
    LEFT JOIN perfil p ON p.id_perfil = u.id_perfil
"""


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> list[dict]:
    """Retorna usuários paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Lista de dicionários com dados dos usuários.
    """
    try:
        offset = (page - 1) * limit
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(u.id_usuario AS CHAR) LIKE %s OR u.usuario LIKE %s OR c.nome LIKE %s OR p.perfil LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"]
        params.extend([limit, offset])
        return query_all(_SQL_SELECT_USUARIO + " " + where + " ORDER BY u.id_usuario DESC LIMIT %s OFFSET %s", tuple(params))
    except Exception as ex:
        logger.error('usuario_queries.py - listar_todos: %s', ex)
        return []


def contar_todos(q: Optional[str] = None) -> int:
    """Conta usuários com filtros.

    Args:
        q: Termo de busca.

    Returns:
        Total de registros.
    """
    try:
        where = ""
        params = []
        if q:
            where = "WHERE (CAST(u.id_usuario AS CHAR) LIKE %s OR u.usuario LIKE %s OR c.nome LIKE %s OR p.perfil LIKE %s)"
            params = [f"%{q}%", f"%{q}%", f"%{q}%", f"%{q}%"]
        row = query_one(
            "SELECT COUNT(*) AS total FROM usuario u LEFT JOIN cliente c ON c.id_cliente = u.id_cliente LEFT JOIN perfil p ON p.id_perfil = u.id_perfil " + where,
            tuple(params),
        )
        return row["total"] if row else 0
    except Exception as ex:
        logger.error('usuario_queries.py - contar_todos: %s', ex)
        return 0


def obter_por_id(usuario_id: int) -> Optional[dict]:
    """Retorna um usuário pelo ID.

    Args:
        usuario_id: ID do usuário.

    Returns:
        Dicionário com dados do usuário ou None.
    """
    try:
        return query_one(_SQL_SELECT_USUARIO + " WHERE u.id_usuario = %s LIMIT 1", (usuario_id,))
    except Exception as ex:
        logger.error('usuario_queries.py - obter_por_id: %s', ex)
        return None


def listar_perfis() -> list[dict]:
    """Retorna todos os perfis.

    Returns:
        Lista de dicionários com perfis.
    """
    try:
        return query_all("SELECT id_perfil, perfil FROM perfil ORDER BY id_perfil ASC")
    except Exception as ex:
        logger.error('usuario_queries.py - listar_perfis: %s', ex)
        return []


def criar(dados: dict) -> int:
    """Cria um novo usuário.

    Args:
        dados: Dict com id_cliente, id_perfil, usuario, senha.

    Returns:
        ID do usuário criado.
    """
    try:
        return execute_insert(
            "INSERT INTO usuario (id_cliente, id_perfil, usuario, senha) VALUES (%s, %s, %s, %s)",
            (dados["id_cliente"], dados["id_perfil"], dados["usuario"], dados["senha"]),
        )
    except Exception as ex:
        logger.error('usuario_queries.py - criar: %s', ex)
        raise


def atualizar(usuario_id: int, dados: dict) -> None:
    """Atualiza dados de um usuário.

    Args:
        usuario_id: ID do usuário.
        dados: Dict com campos a atualizar.
    """
    try:
        execute(
            """
            UPDATE usuario
            SET id_cliente = COALESCE(%s, id_cliente),
                id_perfil = COALESCE(%s, id_perfil),
                usuario = COALESCE(%s, usuario),
                senha = COALESCE(%s, senha)
            WHERE id_usuario = %s
            """,
            (dados.get("id_cliente"), dados.get("id_perfil"), dados.get("usuario"), dados.get("senha"), usuario_id),
        )
    except Exception as ex:
        logger.error('usuario_queries.py - atualizar: %s', ex)
        raise


def deletar(usuario_id: int) -> None:
    """Deleta um usuário.

    Args:
        usuario_id: ID do usuário.
    """
    try:
        execute("DELETE FROM usuario WHERE id_usuario = %s", (usuario_id,))
    except Exception as ex:
        logger.error('usuario_queries.py - deletar: %s', ex)
        raise


def obter_por_usuario(usuario: str) -> Optional[dict]:
    """Busca usuário por nome de login.

    Args:
        usuario: Nome de usuário.

    Returns:
        Dict com dados do usuário ou None.
    """
    try:
        return query_one(
            "SELECT id_usuario, usuario, id_perfil, id_cliente, senha FROM usuario WHERE usuario IN (%s, %s, %s) LIMIT 1",
            (usuario, usuario.upper(), usuario.lower()),
        )
    except Exception as ex:
        logger.error('usuario_queries.py - obter_por_usuario: %s', ex)
        return None
