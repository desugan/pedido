import logging
from typing import Optional

from app.queries import produto_queries as queries
from app.schemas.produto_schema import (
    ProdutoResponse,
    ProdutoCreateRequest,
    ProdutoUpdateRequest,
)

logger = logging.getLogger(__name__)


def _montar_produto_response(row: dict) -> ProdutoResponse:
    """Converte row do banco para ProdutoResponse.

    Args:
        row: Dict com campos do banco (id_produto, nome, valor, oldvalor, marca, saldo).

    Returns:
        ProdutoResponse.
    """
    try:
        return ProdutoResponse(
            id_produto=row["id_produto"],
            nome=row.get("nome") or "",
            valor=float(row.get("valor") or 0),
            oldvalor=float(row.get("oldvalor")) if row.get("oldvalor") is not None else None,
            marca=row.get("marca") or "",
            saldo=float(row.get("saldo") or 0),
        )
    except Exception as ex:
        logger.error("produto_service.py - _montar_produto_response: %s", ex)
        raise


def obter_resumo() -> dict:
    """Retorna totais agregados de produtos (count, estoque, valor).

    Returns:
        Dict com total_produtos, total_estoque, valor_estoque.
    """
    try:
        return queries.obter_resumo()
    except Exception as ex:
        logger.error('produto_service.py - obter_resumo: %s', ex)
        return {"total_produtos": 0, "total_estoque": 0, "valor_estoque": 0}


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> tuple:
    """Lista produtos paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Tupla (lista de ProdutoResponse, total).
    """
    try:
        rows = queries.listar_todos(page, limit, q)
        total = queries.contar_todos(q)
        return [_montar_produto_response(r) for r in rows], total
    except Exception as ex:
        logger.error('produto_service.py - listar_todos: %s', ex)
        return [], 0


def obter_por_id(produto_id: int) -> Optional[ProdutoResponse]:
    """Obtém um produto pelo ID.

    Args:
        produto_id: ID do produto.

    Returns:
        ProdutoResponse ou None.
    """
    try:
        row = queries.obter_por_id(produto_id)
        if not row:
            return None
        return _montar_produto_response(row)
    except Exception as ex:
        logger.error('produto_service.py - obter_por_id: %s', ex)
        return None


def criar(dados: ProdutoCreateRequest) -> ProdutoResponse:
    """Cria um novo produto.

    Args:
        dados: Dados validados do produto.

    Returns:
        ProdutoResponse do produto criado.
    """
    try:
        new_id = queries.criar({
            "nome": dados.nome,
            "valor": dados.valor,
            "oldvalor": dados.valor,
            "marca": dados.marca,
            "saldo": dados.saldo,
        })
        return obter_por_id(new_id)
    except Exception as ex:
        logger.error('produto_service.py - criar: %s', ex)
        raise


def atualizar(produto_id: int, dados: ProdutoUpdateRequest) -> ProdutoResponse:
    """Atualiza dados de um produto.

    Args:
        produto_id: ID do produto.
        dados: Dados validados para atualização.

    Returns:
        ProdutoResponse atualizado.
    """
    try:
        current = queries.obter_por_id(produto_id)
        if not current:
            raise ValueError("Produto não encontrado")

        update_data = {}
        if dados.nome is not None:
            update_data["nome"] = dados.nome
        if dados.marca is not None:
            update_data["marca"] = dados.marca
        if dados.valor is not None:
            update_data["valor"] = dados.valor
        if dados.saldo is not None:
            update_data["saldo"] = dados.saldo

        queries.atualizar(produto_id, update_data)
        return obter_por_id(produto_id)
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('produto_service.py - atualizar: %s', ex)
        raise


def deletar(produto_id: int) -> None:
    """Deleta um produto.

    Args:
        produto_id: ID do produto.
    """
    try:
        row = queries.obter_por_id(produto_id)
        if not row:
            raise ValueError("Produto não encontrado")
        queries.deletar(produto_id)
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('produto_service.py - deletar: %s', ex)
        raise
