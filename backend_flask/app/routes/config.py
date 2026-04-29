from flask import Blueprint, jsonify, request

from app.db import query_one, execute

config_bp = Blueprint("config", __name__, url_prefix="/api/config")


def _get_config(key: str):
    row = query_one("SELECT config_value FROM app_config WHERE config_key = %s LIMIT 1", (key,))
    return row["config_value"] if row else None


def _set_config(key: str, value: str):
    execute(
        """
        INSERT INTO app_config (config_key, config_value)
        VALUES (%s, %s)
        ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)
        """,
        (key, value),
    )


@config_bp.get("/pix-key")
def get_pix_key():
    return jsonify({"pixKey": _get_config("pix_key")})


@config_bp.put("/pix-key")
def set_pix_key():
    body = request.get_json(silent=True) or {}
    pix_key = str(body.get("pixKey") or "").strip()
    if not pix_key:
        return jsonify({"error": "Chave PIX é obrigatória"}), 400
    _set_config("pix_key", pix_key)
    return jsonify({"pixKey": pix_key})


@config_bp.get("/pix-nome")
def get_pix_nome():
    return jsonify({"pixNome": _get_config("pix_nome")})


@config_bp.put("/pix-nome")
def set_pix_nome():
    body = request.get_json(silent=True) or {}
    pix_nome = str(body.get("pixNome") or "").strip()
    if not pix_nome:
        return jsonify({"error": "Nome PIX é obrigatório"}), 400
    _set_config("pix_nome", pix_nome)
    return jsonify({"pixNome": pix_nome})
