import logging
from typing import Optional

from app.queries import fornecedor_queries as queries
from app.schemas.fornecedor_schema import (
    FornecedorResponse,
    FornecedorCreateRequest,
    FornecedorUpdateRequest,
)

logger = logging.getLogger(__name__)


def _montar_fornecedor_response(row: dict) -> FornecedorResponse:
    """Converte row do banco para FornecedorResponse.

    Args:
        row: Dict com campos do banco (id_fornecedor, razao, cnpj, status, data).

    Returns:
        FornecedorResponse.
    """
    try:
        return FornecedorResponse(
            id_fornecedor=row["id_fornecedor"],
            razao=row.get("razao") or "",
            cnpj=row.get("cnpj") or "",
            status=row.get("status") or "",
            data=row.get("data").isoformat() if hasattr(row.get("data"), "isoformat") else row.get("data"),
        )
    except Exception as ex:
        logger.error("fornecedor_service.py - _montar_fornecedor_response: %s", ex)
        raise


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> tuple:
    """Lista fornecedores paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Tupla (lista de FornecedorResponse, total).
    """
    try:
        rows = queries.listar_todos(page, limit, q)
        total = queries.contar_todos(q)
        return [_montar_fornecedor_response(r) for r in rows], total
    except Exception as ex:
        logger.error('fornecedor_service.py - listar_todos: %s', ex)
        return [], 0


def obter_por_id(fornecedor_id: int) -> Optional[FornecedorResponse]:
    """Obtém um fornecedor pelo ID.

    Args:
        fornecedor_id: ID do fornecedor.

    Returns:
        FornecedorResponse ou None.
    """
    try:
        row = queries.obter_por_id(fornecedor_id)
        if not row:
            return None
        return _montar_fornecedor_response(row)
    except Exception as ex:
        logger.error('fornecedor_service.py - obter_por_id: %s', ex)
        return None


def criar(dados: FornecedorCreateRequest) -> FornecedorResponse:
    """Cria um novo fornecedor.

    Args:
        dados: Dados validados do fornecedor.

    Returns:
        FornecedorResponse do fornecedor criado.
    """
    try:
        new_id = queries.criar({
            "razao": dados.razao,
            "cnpj": dados.cnpj,
            "status": dados.status,
            "data": dados.data,
            "id_usuario": dados.id_usuario,
        })
        return obter_por_id(new_id)
    except Exception as ex:
        logger.error('fornecedor_service.py - criar: %s', ex)
        raise


def atualizar(fornecedor_id: int, dados: FornecedorUpdateRequest) -> FornecedorResponse:
    """Atualiza dados de um fornecedor.

    Args:
        fornecedor_id: ID do fornecedor.
        dados: Dados validados para atualização.

    Returns:
        FornecedorResponse atualizado.
    """
    try:
        current = queries.obter_por_id(fornecedor_id)
        if not current:
            raise ValueError("Fornecedor não encontrado")

        update_data = {}
        if dados.razao is not None:
            update_data["razao"] = dados.razao
        if dados.cnpj is not None:
            update_data["cnpj"] = dados.cnpj
        if dados.status is not None:
            update_data["status"] = dados.status
        if dados.data is not None:
            update_data["data"] = dados.data

        queries.atualizar(fornecedor_id, update_data)
        return obter_por_id(fornecedor_id)
    except ValueError as ex:
            raise ex
    except Exception as ex:
        logger.error('fornecedor_service.py - atualizar: %s', ex)
        raise


def deletar(fornecedor_id: int) -> None:
    """Deleta um fornecedor.

    Args:
        fornecedor_id: ID do fornecedor.
    """
    try:
        row = queries.obter_por_id(fornecedor_id)
        if not row:
            raise ValueError("Fornecedor não encontrado")
        queries.deletar(fornecedor_id)
    except ValueError as ex:
            raise ex
    except Exception as ex:
        logger.error('fornecedor_service.py - deletar: %s', ex)
        raise
