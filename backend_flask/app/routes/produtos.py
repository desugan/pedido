from flask import Blueprint, jsonify, request

from app.db import query_all, query_one, execute, execute_insert

produtos_bp = Blueprint("produtos", __name__, url_prefix="/api/produtos")


@produtos_bp.get("")
def list_produtos():
    rows = query_all(
        "SELECT id_produto, nome, valor, oldvalor, marca, saldo FROM produto ORDER BY id_produto DESC"
    )
    return jsonify(rows)


@produtos_bp.get("/<int:produto_id>")
def get_produto(produto_id: int):
    row = query_one(
        "SELECT id_produto, nome, valor, oldvalor, marca, saldo FROM produto WHERE id_produto = %s LIMIT 1",
        (produto_id,),
    )
    if not row:
        return jsonify({"error": "Produto não encontrado"}), 404
    return jsonify(row)


@produtos_bp.post("")
def create_produto():
    body = request.get_json(silent=True) or {}
    nome = str(body.get("nome") or "").strip()
    marca = str(body.get("marca") or "").strip()
    valor = float(body.get("valor") or 0)
    saldo = float(body.get("saldo") or 0)

    if not nome or not marca:
        return jsonify({"error": "Nome e marca são obrigatórios"}), 400
    if valor <= 0:
        return jsonify({"error": "Valor deve ser maior que zero"}), 400

    new_id = execute_insert(
        "INSERT INTO produto (nome, valor, oldvalor, marca, saldo) VALUES (%s, %s, %s, %s, %s)",
        (nome, valor, valor, marca, saldo),
    )
    return get_produto(new_id)


@produtos_bp.put("/<int:produto_id>")
def update_produto(produto_id: int):
    body = request.get_json(silent=True) or {}
    current = query_one("SELECT id_produto FROM produto WHERE id_produto = %s", (produto_id,))
    if not current:
        return jsonify({"error": "Produto não encontrado"}), 404

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
        (
            body.get("nome"),
            body.get("marca"),
            body.get("valor"),
            body.get("valor"),
            body.get("saldo"),
            produto_id,
        ),
    )
    return get_produto(produto_id)


@produtos_bp.delete("/<int:produto_id>")
def delete_produto(produto_id: int):
    current = query_one("SELECT id_produto FROM produto WHERE id_produto = %s", (produto_id,))
    if not current:
        return jsonify({"error": "Produto não encontrado"}), 404

    execute("DELETE FROM produto WHERE id_produto = %s", (produto_id,))
    return jsonify({"message": "Produto deletado com sucesso"})
