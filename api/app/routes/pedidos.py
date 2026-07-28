import logging

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.services import pedido_service
from app.schemas.pedido_schema import (
    PedidoCreateRequest,
    PedidoStatusUpdateRequest,
)

pedidos_bp = Blueprint("pedidos", __name__, url_prefix="/api/pedidos")

logger = logging.getLogger(__name__)


@pedidos_bp.get("")
def list_pedidos():
    """Lista pedidos paginados.

    Args:
        page: Número da página (query).
        limit: Itens por página (query).
        q: Termo de busca opcional (query).
        status: Filtro opcional por status (query).

    Returns:
        JSON com {data, total, page, limit}.
    """
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        q = request.args.get("q")
        status = request.args.get("status")
        pedidos, total = pedido_service.listar_todos(page, limit, q, status)
        return jsonify({"data": [p.model_dump() for p in pedidos], "total": total, "page": page, "limit": limit})
    except Exception as ex:
        logger.error('pedidos.py - list_pedidos: %s', ex)
        return jsonify({"error": "Erro ao listar pedidos"}), 500


@pedidos_bp.get("/para-pagamento")
def list_pedidos_para_pagamento():
    """Lista pedidos confirmados disponiveis para pagamento.

    Args:
        page: Número da página (query).
        limit: Itens por página (query).
        q: Termo de busca opcional (query).
        cliente_id: Filtrar por cliente (query).

    Returns:
        JSON com {data, total, page, limit}.
    """
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        q = request.args.get("q")
        cliente_id = request.args.get("cliente_id", type=int)
        pedidos, total = pedido_service.listar_para_pagamento(page, limit, q, cliente_id)
        return jsonify({"data": [p.model_dump() for p in pedidos], "total": total, "page": page, "limit": limit})
    except Exception as ex:
        logger.error('pedidos.py - list_pedidos_para_pagamento: %s', ex)
        return jsonify({"error": "Erro ao listar pedidos para pagamento"}), 500


@pedidos_bp.get("/<int:pedido_id>")
def get_pedido(pedido_id: int):
    """Retorna um pedido pelo ID com itens.

    Args:
        pedido_id: ID do pedido.

    Returns:
        JSON com dados do pedido.
    """
    try:
        pedido = pedido_service.obter_por_id(pedido_id)
        if not pedido:
            return jsonify({"error": "Pedido não encontrado"}), 404
        return jsonify(pedido.model_dump())
    except Exception as ex:
        logger.error('pedidos.py - get_pedido: %s', ex)
        return jsonify({"error": "Erro ao buscar pedido"}), 500


@pedidos_bp.get("/cliente/<int:cliente_id>")
def list_pedidos_by_cliente(cliente_id: int):
    """Lista pedidos de um cliente paginados.

    Args:
        cliente_id: ID do cliente.

    Returns:
        JSON com {data, total, page, limit}.
    """
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 10))
        status = request.args.get("status")
        pedidos, total = pedido_service.listar_por_cliente(cliente_id, page, limit, status)
        return jsonify({"data": [p.model_dump() for p in pedidos], "total": total, "page": page, "limit": limit})
    except Exception as ex:
        logger.error('pedidos.py - list_pedidos_by_cliente: %s', ex)
        return jsonify({"error": "Erro ao listar pedidos do cliente"}), 500


@pedidos_bp.post("")
def create_pedido():
    """Cria um novo pedido com itens.

    Args:
        Body: {cliente_id: int, itens: array} validado via PedidoCreateRequest.

    Returns:
        JSON com pedido criado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = PedidoCreateRequest(**body)
        pedido = pedido_service.criar(req)
        return jsonify(pedido.model_dump()), 201
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        logger.error('pedidos.py - create_pedido: %s', ex)
        return jsonify({"error": "Erro ao criar pedido"}), 500


@pedidos_bp.patch("/<int:pedido_id>/status")
def patch_pedido_status(pedido_id: int):
    """Atualiza o status de um pedido.

    Args:
        pedido_id: ID do pedido.

    Returns:
        JSON com pedido atualizado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = PedidoStatusUpdateRequest(**body)
        pedido = pedido_service.atualizar_status(pedido_id, req)
        return jsonify(pedido.model_dump())
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        logger.error('pedidos.py - patch_pedido_status: %s', ex)
        return jsonify({"error": "Erro ao atualizar status"}), 500


@pedidos_bp.delete("/<int:pedido_id>")
def delete_pedido(pedido_id: int):
    """Deleta um pedido.

    Args:
        pedido_id: ID do pedido.

    Returns:
        JSON com mensagem de sucesso.
    """
    try:
        pedido_service.deletar(pedido_id)
        return jsonify({"message": "Pedido deletado com sucesso"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('pedidos.py - delete_pedido: %s', ex)
        return jsonify({"error": "Erro ao deletar pedido"}), 500


@pedidos_bp.get("/<int:pedido_id>/itens")
def list_items(pedido_id: int):
    """Lista itens de um pedido.

    Args:
        pedido_id: ID do pedido.

    Returns:
        JSON com lista de itens.
    """
    try:
        pedido = pedido_service.obter_por_id(pedido_id)
        if not pedido:
            return jsonify({"error": "Pedido não encontrado"}), 404
        return jsonify([i.model_dump() for i in pedido.itens])
    except Exception as ex:
        logger.error('pedidos.py - list_items: %s', ex)
        return jsonify({"error": "Erro ao listar itens"}), 500


@pedidos_bp.post("/<int:pedido_id>/itens")
def add_item(pedido_id: int):
    """Adiciona um item a um pedido.

    Args:
        pedido_id: ID do pedido.

    Returns:
        JSON com item criado.
    """
    try:
        body = request.get_json(silent=True) or {}
        item = pedido_service.adicionar_item(pedido_id, body)
        return jsonify(item.model_dump()), 201
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        logger.error('pedidos.py - add_item: %s', ex)
        return jsonify({"error": "Erro ao adicionar item"}), 500


@pedidos_bp.delete("/<int:pedido_id>/itens/<int:item_id>")
def remove_item(pedido_id: int, item_id: int):
    """Remove um item de um pedido.

    Args:
        pedido_id: ID do pedido.
        item_id: ID do item.

    Returns:
        JSON com mensagem de sucesso.
    """
    try:
        pedido_service.remover_item(pedido_id, item_id)
        return jsonify({"message": "Item removido com sucesso"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('pedidos.py - remove_item: %s', ex)
        return jsonify({"error": "Erro ao remover item"}), 500


@pedidos_bp.get("/<int:pedido_id>/total")
def pedido_total(pedido_id: int):
    """Calcula o total de itens de um pedido.

    Args:
        pedido_id: ID do pedido.

    Returns:
        JSON com total.
    """
    try:
        from app.queries import pedido_queries as queries
        total = queries.calcular_total(pedido_id)
        return jsonify({"total": total})
    except Exception as ex:
        logger.error('pedidos.py - pedido_total: %s', ex)
        return jsonify({"error": "Erro ao calcular total"}), 500
