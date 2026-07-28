import logging

from flask import Blueprint, jsonify, request, g
from pydantic import ValidationError

from app.services import fornecedor_service
from app.schemas.fornecedor_schema import FornecedorCreateRequest, FornecedorUpdateRequest

fornecedores_bp = Blueprint("fornecedores", __name__, url_prefix="/api/fornecedores")

logger = logging.getLogger(__name__)


@fornecedores_bp.get("")
def list_fornecedores():
    """Lista fornecedores paginados.

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
        fornecedores, total = fornecedor_service.listar_todos(page, limit, q)
        return jsonify({"data": [f.model_dump() for f in fornecedores], "total": total, "page": page, "limit": limit})
    except Exception as ex:
        logger.error('fornecedores.py - list_fornecedores: %s', ex)
        return jsonify({"error": "Erro ao listar fornecedores"}), 500


@fornecedores_bp.get("/<int:fornecedor_id>")
def get_fornecedor(fornecedor_id: int):
    """Retorna um fornecedor pelo ID.

    Args:
        fornecedor_id: ID do fornecedor.

    Returns:
        JSON com dados do fornecedor.
    """
    try:
        fornecedor = fornecedor_service.obter_por_id(fornecedor_id)
        if not fornecedor:
            return jsonify({"error": "Fornecedor não encontrado"}), 404
        return jsonify(fornecedor.model_dump())
    except Exception as ex:
        logger.error('fornecedores.py - get_fornecedor: %s', ex)
        return jsonify({"error": "Erro ao buscar fornecedor"}), 500


@fornecedores_bp.post("")
def create_fornecedor():
    """Cria um novo fornecedor.

    Args:
        Body: {razao: string, cnpj: string, status?: string} validado via FornecedorCreateRequest.

    Returns:
        JSON com fornecedor criado.
    """
    try:
        body = request.get_json(silent=True) or {}
        body.setdefault("id_usuario", getattr(g, "user", {}).get("id_usuario"))
        req = FornecedorCreateRequest(**body)
        fornecedor = fornecedor_service.criar(req)
        return jsonify(fornecedor.model_dump()), 201
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except Exception as ex:
        logger.error('fornecedores.py - create_fornecedor: %s', ex)
        return jsonify({"error": f"Erro ao criar fornecedor: {str(ex)}"}), 500


@fornecedores_bp.put("/<int:fornecedor_id>")
def update_fornecedor(fornecedor_id: int):
    """Atualiza dados de um fornecedor.

    Args:
        fornecedor_id: ID do fornecedor.

    Returns:
        JSON com fornecedor atualizado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = FornecedorUpdateRequest(**body)
        fornecedor = fornecedor_service.atualizar(fornecedor_id, req)
        return jsonify(fornecedor.model_dump())
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        logger.error('fornecedores.py - update_fornecedor: %s', ex)
        return jsonify({"error": f"Erro ao atualizar fornecedor: {str(ex)}"}), 500


@fornecedores_bp.delete("/<int:fornecedor_id>")
def delete_fornecedor(fornecedor_id: int):
    """Deleta um fornecedor.

    Args:
        fornecedor_id: ID do fornecedor.

    Returns:
        JSON com mensagem de sucesso.
    """
    try:
        fornecedor_service.deletar(fornecedor_id)
        return jsonify({"message": "Fornecedor deletado com sucesso"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        logger.error('fornecedores.py - delete_fornecedor: %s', ex)
        return jsonify({"error": "Erro ao deletar fornecedor"}), 500
