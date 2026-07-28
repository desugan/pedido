import logging

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.services import cliente_service
from app.schemas.cliente_schema import ClienteCreateRequest, ClienteUpdateRequest

clientes_bp = Blueprint("clientes", __name__, url_prefix="/api/clientes")

logger = logging.getLogger(__name__)


@clientes_bp.get("")
def list_clientes():
    """Lista clientes paginados.

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
        clientes, total = cliente_service.listar_todos(page, limit, q)
        return jsonify({"data": [c.model_dump() for c in clientes], "total": total, "page": page, "limit": limit})
    except Exception as ex:
        logger.error('clientes.py - list_clientes: %s', ex)
        return jsonify({"error": "Erro ao listar clientes"}), 500


@clientes_bp.get("/<int:cliente_id>")
def get_cliente(cliente_id: int):
    """Retorna um cliente pelo ID.

    Args:
        cliente_id: ID do cliente.

    Returns:
        JSON com dados do cliente.
    """
    try:
        cliente = cliente_service.obter_por_id(cliente_id)
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        return jsonify(cliente.model_dump())
    except Exception as ex:
        logger.error('clientes.py - get_cliente: %s', ex)
        return jsonify({"error": "Erro ao buscar cliente"}), 500


@clientes_bp.post("")
def create_cliente():
    """Cria um novo cliente.

    Args:
        Body: {nome: string, status: string, limite_credito?: number} validado via ClienteCreateRequest.

    Returns:
        JSON com cliente criado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = ClienteCreateRequest(**body)
        cliente = cliente_service.criar(req)
        return jsonify(cliente.model_dump()), 201
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except Exception as ex:
        logger.error('clientes.py - create_cliente: %s', ex)
        return jsonify({"error": f"Erro ao criar cliente: {str(ex)}"}), 500


@clientes_bp.put("/<int:cliente_id>")
def update_cliente(cliente_id: int):
    """Atualiza dados de um cliente.

    Args:
        cliente_id: ID do cliente.

    Returns:
        JSON com cliente atualizado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = ClienteUpdateRequest(**body)
        cliente = cliente_service.atualizar(cliente_id, req)
        return jsonify(cliente.model_dump())
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('clientes.py - update_cliente: %s', ex)
        return jsonify({"error": f"Erro ao atualizar cliente: {str(ex)}"}), 500


@clientes_bp.delete("/<int:cliente_id>")
def delete_cliente(cliente_id: int):
    """Deleta um cliente.

    Args:
        cliente_id: ID do cliente.

    Returns:
        JSON com mensagem de sucesso.
    """
    try:
        cliente_service.deletar(cliente_id)
        return jsonify({"message": "Cliente deletado com sucesso"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('clientes.py - delete_cliente: %s', ex)
        return jsonify({"error": "Erro ao deletar cliente"}), 500
