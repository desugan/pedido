import logging

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.services import pagamento_service
from app.schemas.pagamento_schema import PagamentoCreateRequest

pagamentos_bp = Blueprint("pagamentos", __name__, url_prefix="/api/pagamentos")

logger = logging.getLogger(__name__)


@pagamentos_bp.get("")
def list_pagamentos():
    """Lista pagamentos paginados.

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
        pagamentos, total = pagamento_service.listar_todos(page, limit, q, status)
        return jsonify({"data": [p.model_dump() for p in pagamentos], "total": total, "page": page, "limit": limit})
    except Exception as ex:
        logger.error('pagamentos.py - list_pagamentos: %s', ex)
        return jsonify({"error": "Erro ao listar pagamentos"}), 500


@pagamentos_bp.get("/cliente/<int:cliente_id>")
def list_pagamentos_cliente(cliente_id: int):
    """Lista pagamentos de um cliente.

    Args:
        cliente_id: ID do cliente.

    Returns:
        JSON com lista de pagamentos.
    """
    try:
        pagamentos = pagamento_service.listar_por_cliente(cliente_id)
        return jsonify([p.model_dump() for p in pagamentos])
    except Exception as ex:
        logger.error('pagamentos.py - list_pagamentos_cliente: %s', ex)
        return jsonify({"error": "Erro ao listar pagamentos"}), 500


@pagamentos_bp.get("/<int:pagamento_id>")
def get_pagamento(pagamento_id: int):
    """Retorna um pagamento pelo ID.

    Args:
        pagamento_id: ID do pagamento.

    Returns:
        JSON com dados do pagamento.
    """
    try:
        pagamento = pagamento_service.obter_por_id(pagamento_id)
        if not pagamento:
            return jsonify({"error": "Pagamento não encontrado"}), 404
        return jsonify(pagamento.model_dump())
    except Exception as ex:
        logger.error('pagamentos.py - get_pagamento: %s', ex)
        return jsonify({"error": "Erro ao buscar pagamento"}), 500


@pagamentos_bp.post("")
def create_pagamento():
    """Cria um novo pagamento.

    Args:
        Body: {valor: number, qrcode: string, chavepix: string, id_cliente: int, pedido_ids?: int[]} validado via PagamentoCreateRequest.

    Returns:
        JSON com pagamento criado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = PagamentoCreateRequest(**body)
        pagamento = pagamento_service.criar(req)
        return jsonify(pagamento.model_dump()), 201
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except Exception as ex:
        logger.error('pagamentos.py - create_pagamento: %s', ex)
        return jsonify({"error": f"Erro ao criar pagamento: {str(ex)}"}), 500


@pagamentos_bp.patch("/<int:pagamento_id>/status")
def patch_pagamento_status(pagamento_id: int):
    """Atualiza o status de um pagamento.

    Args:
        pagamento_id: ID do pagamento.

    Returns:
        JSON com pagamento atualizado.
    """
    try:
        body = request.get_json(silent=True) or {}
        status = str(body.get("status") or "").strip()
        if not status:
            return jsonify({"error": "Status inválido"}), 400
        pagamento = pagamento_service.atualizar_status(pagamento_id, status)
        return jsonify(pagamento.model_dump())
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        logger.error('pagamentos.py - patch_pagamento_status: %s', ex)
        return jsonify({"error": "Erro ao atualizar status"}), 500


@pagamentos_bp.delete("/<int:pagamento_id>")
def delete_pagamento(pagamento_id: int):
    """Deleta um pagamento.

    Args:
        pagamento_id: ID do pagamento.

    Returns:
        JSON com mensagem de sucesso.
    """
    try:
        pagamento_service.deletar(pagamento_id)
        return jsonify({"message": "Pagamento deletado com sucesso"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('pagamentos.py - delete_pagamento: %s', ex)
        return jsonify({"error": "Erro ao deletar pagamento"}), 500
