from flask import Blueprint, jsonify, request
import bcrypt

from app.db import query_all, query_one, execute, execute_insert

usuarios_bp = Blueprint("usuarios", __name__, url_prefix="/api/usuarios")


def _map_user(u: dict) -> dict:
    return {
        "id_usuario": u["id_usuario"],
        "id_cliente": u["id_cliente"],
        "id_perfil": u["id_perfil"],
        "usuario": u["usuario"],
        "cliente_nome": u.get("cliente_nome"),
        "perfil_nome": u.get("perfil_nome"),
    }


@usuarios_bp.get("")
def list_usuarios():
    rows = query_all(
        """
        SELECT u.id_usuario, u.id_cliente, u.id_perfil, u.usuario,
               c.nome AS cliente_nome, p.perfil AS perfil_nome
        FROM usuario u
        LEFT JOIN cliente c ON c.id_cliente = u.id_cliente
        LEFT JOIN perfil p ON p.id_perfil = u.id_perfil
        ORDER BY u.id_usuario DESC
        """
    )
    return jsonify([_map_user(r) for r in rows])


@usuarios_bp.get("/perfis")
def list_perfis():
    return jsonify(query_all("SELECT id_perfil, perfil FROM perfil ORDER BY id_perfil ASC"))


@usuarios_bp.get("/<int:usuario_id>")
def get_usuario(usuario_id: int):
    row = query_one(
        """
        SELECT u.id_usuario, u.id_cliente, u.id_perfil, u.usuario,
               c.nome AS cliente_nome, p.perfil AS perfil_nome
        FROM usuario u
        LEFT JOIN cliente c ON c.id_cliente = u.id_cliente
        LEFT JOIN perfil p ON p.id_perfil = u.id_perfil
        WHERE u.id_usuario = %s
        LIMIT 1
        """,
        (usuario_id,),
    )
    if not row:
        return jsonify({"error": "Usuário não encontrado"}), 404
    return jsonify(_map_user(row))


@usuarios_bp.post("")
def create_usuario():
    body = request.get_json(silent=True) or {}
    usuario = str(body.get("usuario") or "").strip()
    senha = str(body.get("senha") or "").strip()
    id_cliente = body.get("id_cliente")
    id_perfil = body.get("id_perfil")

    if not usuario or not senha or not id_cliente or not id_perfil:
        return jsonify({"error": "Usuário e senha são obrigatórios"}), 400

    hashed = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")
    new_id = execute_insert(
        "INSERT INTO usuario (id_cliente, id_perfil, usuario, senha) VALUES (%s, %s, %s, %s)",
        (id_cliente, id_perfil, usuario, hashed),
    )
    return get_usuario(new_id)


@usuarios_bp.put("/<int:usuario_id>")
def update_usuario(usuario_id: int):
    body = request.get_json(silent=True) or {}
    row = query_one("SELECT id_usuario FROM usuario WHERE id_usuario = %s", (usuario_id,))
    if not row:
        return jsonify({"error": "Usuário não encontrado"}), 404

    senha = body.get("senha")
    senha_hash = None
    if isinstance(senha, str) and senha.strip():
        senha_hash = bcrypt.hashpw(senha.strip().encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")

    execute(
        """
        UPDATE usuario
        SET id_cliente = COALESCE(%s, id_cliente),
            id_perfil = COALESCE(%s, id_perfil),
            usuario = COALESCE(%s, usuario),
            senha = COALESCE(%s, senha)
        WHERE id_usuario = %s
        """,
        (body.get("id_cliente"), body.get("id_perfil"), body.get("usuario"), senha_hash, usuario_id),
    )
    return get_usuario(usuario_id)


@usuarios_bp.delete("/<int:usuario_id>")
def delete_usuario(usuario_id: int):
    row = query_one("SELECT id_usuario FROM usuario WHERE id_usuario = %s", (usuario_id,))
    if not row:
        return jsonify({"error": "Usuário não encontrado"}), 404
    execute("DELETE FROM usuario WHERE id_usuario = %s", (usuario_id,))
    return jsonify({"message": "Usuário deletado com sucesso"})


@usuarios_bp.post("/<int:usuario_id>/reset-senha")
def reset_senha(usuario_id: int):
    row = query_one("SELECT id_usuario FROM usuario WHERE id_usuario = %s", (usuario_id,))
    if not row:
        return jsonify({"error": "Usuário não encontrado"}), 404

    senha_hash = bcrypt.hashpw("123456".encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")
    execute("UPDATE usuario SET senha = %s WHERE id_usuario = %s", (senha_hash, usuario_id))
    return get_usuario(usuario_id)
