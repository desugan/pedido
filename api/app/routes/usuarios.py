import logging

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.services import usuario_service
from app.schemas.usuario_schema import UsuarioCreateRequest, UsuarioUpdateRequest

usuarios_bp = Blueprint("usuarios", __name__, url_prefix="/api/usuarios")

logger = logging.getLogger(__name__)


@usuarios_bp.get("")
def list_usuarios():
    """Lista usuários paginados.

    Args:
        page: Número da página (query).
        limit: Itens por página (query).
        q: Termo de busca opcional (query).

    Returns:
        JSON com {data, total, page, limit}.
    """
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        q = request.args.get("q")
        usuarios, total = usuario_service.listar_todos(page, limit, q)
        return jsonify({"data": [u.model_dump() for u in usuarios], "total": total, "page": page, "limit": limit})
    except Exception as ex:
        logger.error('usuarios.py - list_usuarios: %s', ex)
        return jsonify({"error": "Erro ao listar usuários"}), 500


@usuarios_bp.get("/perfis")
def list_perfis():
    """Lista todos os perfis.

    Args:
        (Nenhum — endpoint sem parametros.)

    Returns:
        JSON com lista de perfis.
    """
    try:
        perfis = usuario_service.listar_perfis()
        return jsonify([p.model_dump() for p in perfis])
    except Exception as ex:
        logger.error('usuarios.py - list_perfis: %s', ex)
        return jsonify({"error": "Erro ao listar perfis"}), 500


@usuarios_bp.get("/<int:usuario_id>")
def get_usuario(usuario_id: int):
    """Retorna um usuário pelo ID.

    Args:
        usuario_id: ID do usuário.

    Returns:
        JSON com dados do usuário.
    """
    try:
        usuario = usuario_service.obter_por_id(usuario_id)
        if not usuario:
            return jsonify({"error": "Usuário não encontrado"}), 404
        return jsonify(usuario.model_dump())
    except Exception as ex:
        logger.error('usuarios.py - get_usuario: %s', ex)
        return jsonify({"error": "Erro ao buscar usuário"}), 500


@usuarios_bp.post("")
def create_usuario():
    """Cria um novo usuário.

    Args:
        Body: {id_cliente: int, id_perfil: int, usuario: string, senha: string} validado via UsuarioCreateRequest.

    Returns:
        JSON com usuário criado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = UsuarioCreateRequest(**body)
        usuario = usuario_service.criar(req)
        return jsonify(usuario.model_dump()), 201
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except Exception as ex:
        logger.error('usuarios.py - create_usuario: %s', ex)
        return jsonify({"error": "Erro ao criar usuário"}), 500


@usuarios_bp.put("/<int:usuario_id>")
def update_usuario(usuario_id: int):
    """Atualiza dados de um usuário.

    Args:
        usuario_id: ID do usuário.

    Returns:
        JSON com usuário atualizado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = UsuarioUpdateRequest(**body)
        usuario = usuario_service.atualizar(usuario_id, req)
        return jsonify(usuario.model_dump())
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('usuarios.py - update_usuario: %s', ex)
        return jsonify({"error": "Erro ao atualizar usuário"}), 500


@usuarios_bp.delete("/<int:usuario_id>")
def delete_usuario(usuario_id: int):
    """Deleta um usuário.

    Args:
        usuario_id: ID do usuário.

    Returns:
        JSON com mensagem de sucesso.
    """
    try:
        usuario_service.deletar(usuario_id)
        return jsonify({"message": "Usuário deletado com sucesso"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('usuarios.py - delete_usuario: %s', ex)
        return jsonify({"error": "Erro ao deletar usuário"}), 500


@usuarios_bp.post("/<int:usuario_id>/reset-senha")
def reset_senha(usuario_id: int):
    """Reseta a senha de um usuário para '123456'.

    Args:
        usuario_id: ID do usuário.

    Returns:
        JSON com usuário atualizado.
    """
    try:
        usuario = usuario_service.resetar_senha(usuario_id)
        return jsonify(usuario.model_dump())
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('usuarios.py - reset_senha: %s', ex)
        return jsonify({"error": "Erro ao resetar senha"}), 500
