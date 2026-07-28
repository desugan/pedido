import logging

from flask import Blueprint, jsonify, request, g
from pydantic import ValidationError

from app.services import lancamento_service
from app.schemas.lancamento_schema import LancamentoCreateRequest, LancamentoStatusUpdateRequest

lancamentos_bp = Blueprint("lancamentos", __name__, url_prefix="/api/lancamentos")

logger = logging.getLogger(__name__)


@lancamentos_bp.get("")
def list_lancamentos():
    """Lista lançamentos paginados.

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
        lancamentos, total = lancamento_service.listar_todos(page, limit, q)
        return jsonify({"data": [l.model_dump() for l in lancamentos], "total": total, "page": page, "limit": limit})
    except Exception as ex:
        logger.error('lancamentos.py - list_lancamentos: %s', ex)
        return jsonify({"error": "Erro ao listar lançamentos"}), 500


@lancamentos_bp.get("/<int:lancamento_id>")
def get_lancamento(lancamento_id: int):
    """Retorna um lançamento pelo ID.

    Args:
        lancamento_id: ID do lançamento.

    Returns:
        JSON com dados do lançamento.
    """
    try:
        lancamento = lancamento_service.obter_por_id(lancamento_id)
        if not lancamento:
            return jsonify({"error": "Lançamento não encontrado"}), 404
        return jsonify(lancamento.model_dump())
    except Exception as ex:
        logger.error('lancamentos.py - get_lancamento: %s', ex)
        return jsonify({"error": "Erro ao buscar lançamento"}), 500


@lancamentos_bp.post("")
def create_lancamento():
    """Cria um novo lançamento.

    Args:
        Body: {id_fornecedor: int, itens: array, documento?: string} validado via LancamentoCreateRequest.

    Returns:
        JSON com lançamento criado.
    """
    try:
        body = request.get_json(silent=True) or {}
        body.setdefault("id_usuario", getattr(g, "user", {}).get("id_usuario"))
        req = LancamentoCreateRequest(**body)
        lancamento = lancamento_service.criar(req)
        return jsonify(lancamento.model_dump()), 201
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except Exception as ex:
        logger.error('lancamentos.py - create_lancamento: %s', ex)
        return jsonify({"error": f"Erro ao criar lançamento: {str(ex)}"}), 500


@lancamentos_bp.patch("/<int:lancamento_id>/status")
def update_status(lancamento_id: int):
    """Atualiza o status de um lançamento.

    Args:
        lancamento_id: ID do lançamento.

    Returns:
        JSON com lançamento atualizado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = LancamentoStatusUpdateRequest(**body)
        lancamento = lancamento_service.atualizar_status(lancamento_id, req.status)
        return jsonify(lancamento.model_dump())
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 400
    except Exception as ex:
        logger.error('lancamentos.py - update_status: %s', ex)
        return jsonify({"error": "Erro ao atualizar status"}), 500
