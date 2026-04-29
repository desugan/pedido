from flask import Blueprint, jsonify, request

from app.db import query_all, query_one, execute, execute_insert

fornecedores_bp = Blueprint("fornecedores", __name__, url_prefix="/api/fornecedores")


@fornecedores_bp.get("")
def list_fornecedores():
    rows = query_all(
        "SELECT id_fornecedor, razao, cnpj, status, data FROM fornecedor ORDER BY id_fornecedor DESC"
    )
    return jsonify(rows)


@fornecedores_bp.get("/<int:fornecedor_id>")
def get_fornecedor(fornecedor_id: int):
    row = query_one(
        "SELECT id_fornecedor, razao, cnpj, status, data FROM fornecedor WHERE id_fornecedor = %s LIMIT 1",
        (fornecedor_id,),
    )
    if not row:
        return jsonify({"error": "Fornecedor não encontrado"}), 404
    return jsonify(row)


@fornecedores_bp.post("")
def create_fornecedor():
    body = request.get_json(silent=True) or {}
    razao = str(body.get("razao") or "").strip()
    cnpj = str(body.get("cnpj") or "").strip()
    status = str(body.get("status") or "ATIVO").strip() or "ATIVO"
    data = body.get("data")

    if not razao or not cnpj:
        return jsonify({"error": "Razão social e CNPJ são obrigatórios"}), 400

    new_id = execute_insert(
        "INSERT INTO fornecedor (razao, cnpj, status, data) VALUES (%s, %s, %s, COALESCE(%s, NOW()))",
        (razao, cnpj, status, data),
    )
    return get_fornecedor(new_id)


@fornecedores_bp.put("/<int:fornecedor_id>")
def update_fornecedor(fornecedor_id: int):
    body = request.get_json(silent=True) or {}
    current = query_one("SELECT id_fornecedor FROM fornecedor WHERE id_fornecedor = %s", (fornecedor_id,))
    if not current:
        return jsonify({"error": "Fornecedor não encontrado"}), 404

    execute(
        """
        UPDATE fornecedor
        SET razao = COALESCE(%s, razao),
            cnpj = COALESCE(%s, cnpj),
            status = COALESCE(%s, status),
            data = COALESCE(%s, data)
        WHERE id_fornecedor = %s
        """,
        (body.get("razao"), body.get("cnpj"), body.get("status"), body.get("data"), fornecedor_id),
    )
    return get_fornecedor(fornecedor_id)


@fornecedores_bp.delete("/<int:fornecedor_id>")
def delete_fornecedor(fornecedor_id: int):
    current = query_one("SELECT id_fornecedor FROM fornecedor WHERE id_fornecedor = %s", (fornecedor_id,))
    if not current:
        return jsonify({"error": "Fornecedor não encontrado"}), 404
    execute("DELETE FROM fornecedor WHERE id_fornecedor = %s", (fornecedor_id,))
    return jsonify({"message": "Fornecedor deletado com sucesso"})
