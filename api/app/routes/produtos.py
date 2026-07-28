import logging

from flask import Blueprint, jsonify, request
from pydantic import ValidationError

from app.services import produto_service
from app.schemas.produto_schema import ProdutoCreateRequest, ProdutoUpdateRequest

produtos_bp = Blueprint("produtos", __name__, url_prefix="/api/produtos")

logger = logging.getLogger(__name__)


@produtos_bp.get("")
def list_produtos():
    """Lista produtos paginados.

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
        produtos, total = produto_service.listar_todos(page, limit, q)
        return jsonify({"data": [p.model_dump() for p in produtos], "total": total, "page": page, "limit": limit})
    except Exception as ex:
        logger.error('produtos.py - list_produtos: %s', ex)
        return jsonify({"error": "Erro ao listar produtos"}), 500


@produtos_bp.get("/resumo")
def resumo_produtos():
    """Retorna totais agregados de produtos.

    Args:
        (Nenhum — endpoint sem parametros.)

    Returns:
        JSON com total_produtos, total_estoque, valor_estoque.
    """
    try:
        resumo = produto_service.obter_resumo()
        return jsonify(resumo)
    except Exception as ex:
        logger.error('produtos.py - resumo_produtos: %s', ex)
        return jsonify({"error": "Erro ao obter resumo de produtos"}), 500


@produtos_bp.get("/<int:produto_id>")
def get_produto(produto_id: int):
    """Retorna um produto pelo ID.

    Args:
        produto_id: ID do produto.

    Returns:
        JSON com dados do produto.
    """
    try:
        produto = produto_service.obter_por_id(produto_id)
        if not produto:
            return jsonify({"error": "Produto não encontrado"}), 404
        return jsonify(produto.model_dump())
    except Exception as ex:
        logger.error('produtos.py - get_produto: %s', ex)
        return jsonify({"error": "Erro ao buscar produto"}), 500


@produtos_bp.post("")
def create_produto():
    """Cria um novo produto.

    Args:
        Body: {nome: string, valor: number, marca: string, saldo: number} validado via ProdutoCreateRequest.

    Returns:
        JSON com produto criado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = ProdutoCreateRequest(**body)
        produto = produto_service.criar(req)
        return jsonify(produto.model_dump()), 201
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except Exception as ex:
        logger.error('produtos.py - create_produto: %s', ex)
        return jsonify({"error": f"Erro ao criar produto: {str(ex)}"}), 500


@produtos_bp.put("/<int:produto_id>")
def update_produto(produto_id: int):
    """Atualiza dados de um produto.

    Args:
        produto_id: ID do produto.

    Returns:
        JSON com produto atualizado.
    """
    try:
        body = request.get_json(silent=True) or {}
        req = ProdutoUpdateRequest(**body)
        produto = produto_service.atualizar(produto_id, req)
        return jsonify(produto.model_dump())
    except ValidationError as ve:
        return jsonify({"error": ve.errors()}), 422
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('produtos.py - update_produto: %s', ex)
        return jsonify({"error": f"Erro ao atualizar produto: {str(ex)}"}), 500


@produtos_bp.delete("/<int:produto_id>")
def delete_produto(produto_id: int):
    """Deleta um produto.

    Args:
        produto_id: ID do produto.

    Returns:
        JSON com mensagem de sucesso.
    """
    try:
        produto_service.deletar(produto_id)
        return jsonify({"message": "Produto deletado com sucesso"})
    except ValueError as ex:
        return jsonify({"error": str(ex)}), 404
    except Exception as ex:
        logger.error('produtos.py - delete_produto: %s', ex)
        return jsonify({"error": "Erro ao deletar produto"}), 500
