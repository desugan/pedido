import logging
from typing import Optional
import hashlib

from app.queries import usuario_queries as queries
from app.schemas.usuario_schema import (
    UsuarioResponse,
    UsuarioCreateRequest,
    UsuarioUpdateRequest,
    PerfilResponse,
)

logger = logging.getLogger(__name__)


def _map_user(u: dict) -> UsuarioResponse:
    """Converte row do banco para UsuarioResponse.

    Args:
        u: Dict com campos do banco (id_usuario, id_cliente, id_perfil, usuario, cliente_nome, perfil_nome).

    Returns:
        UsuarioResponse.
    """
    try:
        return UsuarioResponse(
            id_usuario=u["id_usuario"],
            id_cliente=u.get("id_cliente") or 0,
            id_perfil=u.get("id_perfil") or 0,
            usuario=u.get("usuario") or "",
            cliente_nome=u.get("cliente_nome"),
            perfil_nome=u.get("perfil_nome"),
        )
    except Exception as ex:
        logger.error("usuario_service.py - _map_user: %s", ex)
        raise


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> tuple:
    """Lista usuários paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Tupla (lista de UsuarioResponse, total).
    """
    try:
        rows = queries.listar_todos(page, limit, q)
        total = queries.contar_todos(q)
        return [_map_user(r) for r in rows], total
    except Exception as ex:
        logger.error('usuario_service.py - listar_todos: %s', ex)
        return [], 0


def listar_perfis() -> list[PerfilResponse]:
    """Lista todos os perfis.

    Returns:
        Lista de PerfilResponse.
    """
    try:
        rows = queries.listar_perfis()
        return [PerfilResponse(id_perfil=r["id_perfil"], perfil=r.get("perfil") or "") for r in rows]
    except Exception as ex:
        logger.error('usuario_service.py - listar_perfis: %s', ex)
        return []


def obter_por_id(usuario_id: int) -> Optional[UsuarioResponse]:
    """Obtém um usuário pelo ID.

    Args:
        usuario_id: ID do usuário.

    Returns:
        UsuarioResponse ou None.
    """
    try:
        row = queries.obter_por_id(usuario_id)
        if not row:
            return None
        return _map_user(row)
    except Exception as ex:
        logger.error('usuario_service.py - obter_por_id: %s', ex)
        return None


def criar(dados: UsuarioCreateRequest) -> UsuarioResponse:
    """Cria um novo usuário.

    Args:
        dados: Dados validados do usuário.

    Returns:
        UsuarioResponse do usuário criado.
    """
    try:
        hashed = hashlib.md5(dados.senha.encode()).hexdigest()
        new_id = queries.criar({
            "id_cliente": dados.id_cliente,
            "id_perfil": dados.id_perfil,
            "usuario": dados.usuario,
            "senha": hashed,
        })
        return obter_por_id(new_id)
    except Exception as ex:
        logger.error('usuario_service.py - criar: %s', ex)
        raise


def atualizar(usuario_id: int, dados: UsuarioUpdateRequest) -> UsuarioResponse:
    """Atualiza dados de um usuário.

    Args:
        usuario_id: ID do usuário.
        dados: Dados validados para atualização.

    Returns:
        UsuarioResponse atualizado.
    """
    try:
        current = queries.obter_por_id(usuario_id)
        if not current:
            raise ValueError("Usuário não encontrado")

        update_data = {}
        if dados.id_cliente is not None:
            update_data["id_cliente"] = dados.id_cliente
        if dados.id_perfil is not None:
            update_data["id_perfil"] = dados.id_perfil
        if dados.usuario is not None:
            update_data["usuario"] = dados.usuario
        if dados.senha:
            update_data["senha"] = hashlib.md5(dados.senha.encode()).hexdigest()

        queries.atualizar(usuario_id, update_data)
        return obter_por_id(usuario_id)
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('usuario_service.py - atualizar: %s', ex)
        raise


def deletar(usuario_id: int) -> None:
    """Deleta um usuário.

    Args:
        usuario_id: ID do usuário.
    """
    try:
        row = queries.obter_por_id(usuario_id)
        if not row:
            raise ValueError("Usuário não encontrado")
        queries.deletar(usuario_id)
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('usuario_service.py - deletar: %s', ex)
        raise


def resetar_senha(usuario_id: int) -> UsuarioResponse:
    """Reseta a senha de um usuário para '123456'.

    Args:
        usuario_id: ID do usuário.

    Returns:
        UsuarioResponse atualizado.
    """
    try:
        row = queries.obter_por_id(usuario_id)
        if not row:
            raise ValueError("Usuário não encontrado")

        senha_hash = hashlib.md5(b"123456").hexdigest()
        queries.atualizar(usuario_id, {"senha": senha_hash})
        return obter_por_id(usuario_id)
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('usuario_service.py - resetar_senha: %s', ex)
        raise
