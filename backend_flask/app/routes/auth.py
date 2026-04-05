from datetime import datetime, timezone
import re

from flask import Blueprint, jsonify, request, g
import bcrypt

from app.db import get_connection
from app.security import sign_token, verify_password

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
_LOGIN_LOG: list[dict] = []


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    usuario = str(payload.get("usuario") or "").strip()
    senha = str(payload.get("senha") or "").strip()

    if not usuario or not senha:
        return jsonify({"error": "Usuário e senha são obrigatórios"}), 400

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id_usuario, usuario, id_perfil, id_cliente, senha
                FROM usuario
                WHERE usuario IN (%s, %s, %s)
                LIMIT 1
                """,
                (usuario, usuario.upper(), usuario.lower()),
            )
            user = cur.fetchone()

            if not user:
                _LOGIN_LOG.append({"timestamp": _utcnow_iso(), "usuario": usuario, "status": "failed", "reason": "Usuário não encontrado"})
                return jsonify({"error": "Usuário ou senha inválidos"}), 401

            if not verify_password(str(user.get("senha") or ""), senha):
                _LOGIN_LOG.append({"timestamp": _utcnow_iso(), "usuario": usuario, "status": "failed", "reason": "Senha incorreta", "id_usuario": user["id_usuario"]})
                return jsonify({"error": "Usuário ou senha inválidos"}), 401

            cur.execute("SELECT perfil FROM perfil WHERE id_perfil = %s LIMIT 1", (user["id_perfil"],))
            perfil = cur.fetchone()

            cur.execute("SELECT nome FROM cliente WHERE id_cliente = %s LIMIT 1", (user["id_cliente"],))
            cliente = cur.fetchone()

    token = sign_token(
        {
            "id_usuario": user["id_usuario"],
            "usuario": user["usuario"],
            "id_perfil": user["id_perfil"],
            "id_cliente": user["id_cliente"],
        }
    )

    return jsonify(
        {
            "token": token,
            "user": {
                "id_usuario": user["id_usuario"],
                "usuario": user["usuario"],
                "id_perfil": user["id_perfil"],
                "perfil": perfil["perfil"] if perfil else None,
                "id_cliente": user["id_cliente"],
                "cliente_nome": cliente["nome"] if cliente else None,
            },
        }
    )


@auth_bp.post("/alterar-senha")
def alterar_senha():
    user = getattr(g, "user", None)
    if not user:
        return jsonify({"error": "Não autenticado"}), 401

    body = request.get_json(silent=True) or {}
    senha_atual = str(body.get("senhaAtual") or "").strip()
    nova_senha = str(body.get("novaSenha") or "").strip()
    confirmar_senha = str(body.get("confirmarSenha") or "").strip()

    if not senha_atual or not nova_senha or not confirmar_senha:
        return jsonify({"error": "Todos os campos são obrigatórios"}), 400
    if nova_senha != confirmar_senha:
        return jsonify({"error": "A confirmação da senha não confere"}), 400
    if len(nova_senha) < 6:
        return jsonify({"error": "A nova senha deve ter ao menos 6 caracteres"}), 400
    if len(nova_senha) > 255:
        return jsonify({"error": "A nova senha excede o tamanho máximo permitido"}), 400
    if not re.search(r"[A-Z]", nova_senha):
        return jsonify({"error": "A nova senha deve conter ao menos uma letra maiúscula"}), 400
    if not re.search(r"[a-z]", nova_senha):
        return jsonify({"error": "A nova senha deve conter ao menos uma letra minúscula"}), 400
    if not re.search(r"[^A-Za-z0-9]", nova_senha):
        return jsonify({"error": "A nova senha deve conter ao menos um caractere especial"}), 400

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id_usuario, senha FROM usuario WHERE id_usuario = %s LIMIT 1", (user.get("id_usuario"),))
            db_user = cur.fetchone()
            if not db_user:
                return jsonify({"error": "Usuário não encontrado"}), 404

            if not verify_password(str(db_user.get("senha") or ""), senha_atual):
                return jsonify({"error": "Senha atual inválida"}), 401

            nova_hash = bcrypt.hashpw(nova_senha.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")
            cur.execute("UPDATE usuario SET senha = %s WHERE id_usuario = %s", (nova_hash, user.get("id_usuario")))

    return jsonify({"message": "Senha alterada com sucesso"})


@auth_bp.get("/login-log")
def login_log():
    return jsonify(_LOGIN_LOG)
