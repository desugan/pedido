import logging

from flask import Blueprint, jsonify, request, g
from pydantic import ValidationError

from app.services import auth_service
from app.schemas.auth_schema import LoginRequest, AlterarSenhaRequest

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

logger = logging.getLogger(__name__)


@auth_bp.post("/login")
def login():
    """Realiza login do usuário.

    Args:
        Body: {usuario: string, senha: string}

    Returns:
        JSON com token e dados do usuário.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = LoginRequest(**body)
        result = auth_service.login(req.usuario, req.senha)
        return jsonify(result)
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 401
    except Exception as ex:
        logger.error('auth.py - login: %s', ex)
        return jsonify({"error": "Erro ao realizar login"}), 500


@auth_bp.post("/alterar-senha")
def alterar_senha():
    """Altera a senha do usuário autenticado.

    Args:
        Body: {senha_atual: string, nova_senha: string, confirmar_senha: string}

    Returns:
        JSON com mensagem de sucesso.
    """
    try:
        user = getattr(g, "user", None)
        if not user:
            return jsonify({"error": "Não autenticado"}), 401

        body = request.get_json(silent=True) or {}
        req = AlterarSenhaRequest(**body)
        auth_service.alterar_senha(user, req.senha_atual, req.nova_senha, req.confirmar_senha)
        return jsonify({"message": "Senha alterada com sucesso"})
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
            return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        logger.error('auth.py - alterar_senha: %s', ex)
        return jsonify({"error": "Erro ao alterar senha"}), 500
