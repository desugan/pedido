import logging
from typing import Optional

from app.queries import lancamento_queries as queries
from app.queries import produto_queries as produto_queries
from app.schemas.lancamento_schema import (
    LancamentoResponse,
    LancamentoItemResponse,
    LancamentoCreateRequest,
)
from app.db import transaction, tx_insert, tx_query, tx_execute, execute, query_all

logger = logging.getLogger(__name__)


def _apply_stock(lancamento_id: int, mode: str):
    """Aplica ou reverte estoque de um lançamento.

    Args:
        lancamento_id: ID do lançamento.
        mode: "add" para adicionar estoque, "subtract" para remover.

    Returns:
        None.
    """
    try:
        itens = query_all(
            "SELECT id_produto, quantidade AS qtd, vlr_unit AS vlr_item FROM itens_lancamento WHERE id_lancamento = %s",
            (lancamento_id,),
        )
        for item in itens:
            qtd = float(item.get("qtd") or 0)
            if mode == "add":
                execute(
                    "UPDATE produto SET saldo = saldo + %s, oldvalor = valor, valor = %s WHERE id_produto = %s",
                    (qtd, float(item.get("vlr_item") or 0), int(item["id_produto"])),
                )
            else:
                execute("UPDATE produto SET saldo = GREATEST(0, saldo - %s) WHERE id_produto = %s",
                        (qtd, int(item["id_produto"])))
    except Exception as ex:
        logger.error("lancamento_service.py - _apply_stock: %s", ex)
        raise


def _montar_lancamento_response(row: dict) -> LancamentoResponse:
    """Converte row do banco para LancamentoResponse.

    Args:
        row: Dict com campos do banco (id_lancamento, id_fornecedor, fornecedor_nome, total, data, status, documento, id_usuario, usuario_nome).

    Returns:
        LancamentoResponse.
    """
    try:
        return LancamentoResponse(
            id_lancamento=row["id_lancamento"],
            id_fornecedor=row.get("id_fornecedor") or 0,
            fornecedor_nome=row.get("fornecedor_nome"),
            total=float(row.get("total") or 0),
            data=row.get("data").isoformat() if hasattr(row.get("data"), "isoformat") else row.get("data"),
            status=row.get("status") or "",
            documento=row.get("documento"),
            id_usuario=row.get("id_usuario"),
            usuario_nome=row.get("usuario_nome"),
        )
    except Exception as ex:
        logger.error("lancamento_service.py - _montar_lancamento_response: %s", ex)
        raise


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> tuple:
    """Lista lançamentos paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Tupla (lista de LancamentoResponse, total).
    """
    try:
        rows = queries.listar_todos(page, limit, q)
        total = queries.contar_todos(q)
        return [_montar_lancamento_response(r) for r in rows], total
    except Exception as ex:
        logger.error('lancamento_service.py - listar_todos: %s', ex)
        return [], 0


def obter_por_id(lancamento_id: int) -> Optional[LancamentoResponse]:
    """Obtém um lançamento com itens pelo ID.

    Args:
        lancamento_id: ID do lançamento.

    Returns:
        LancamentoResponse ou None.
    """
    try:
        row = queries.obter_por_id(lancamento_id)
        if not row:
            return None
        response = _montar_lancamento_response(row)
        itens = queries.listar_itens(lancamento_id)
        response.itens = [
            LancamentoItemResponse(
                id_produto=int(i.get("id_produto") or 0),
                produto_nome=i.get("produto_nome") or "",
                qtd=float(i.get("qtd") or 0),
                vlr_item=float(i.get("vlr_item") or 0),
                vlr_total=float(i.get("vlr_total") or 0),
            )
            for i in itens
        ]
        return response
    except Exception as ex:
        logger.error('lancamento_service.py - obter_por_id: %s', ex)
        return None


def criar(dados: LancamentoCreateRequest) -> LancamentoResponse:
    """Cria um novo lançamento com itens.

    Args:
        dados: Dados validados do lançamento.

    Returns:
        LancamentoResponse do lançamento criado.
    """
    import time

    try:
        total = sum(
            float(i.get("vlr_total") or (float(i.get("qtd") or 0) * float(i.get("vlr_item") or 0)))
            for i in dados.itens
        )

        with transaction() as conn:
            lancamento_id = queries.criar({
                "id_fornecedor": dados.id_fornecedor,
                "total": total,
                "status": dados.status,
                "documento": getattr(dados, "documento", None),
                "id_usuario": getattr(dados, "id_usuario", None),
            })

            for item in dados.itens:
                qtd = float(item.get("qtd") or 0)
                vlr_item = float(item.get("vlr_item") or 0)
                queries.adicionar_item({
                    "id_lancamento": lancamento_id,
                    "id_produto": item.get("id_produto"),
                    "qtd": qtd,
                    "vlr_item": vlr_item,
                })

            if dados.status == "CONFIRMADO":
                _apply_stock(lancamento_id, "add")

        return obter_por_id(lancamento_id)
    except Exception as ex:
        logger.error('lancamento_service.py - criar: %s', ex)
        raise


def atualizar_status(lancamento_id: int, status: str) -> LancamentoResponse:
    """Atualiza o status de um lançamento com controle de estoque.

    Args:
        lancamento_id: ID do lançamento.
        status: Novo status (PENDENTE, CONFIRMADO, CANCELADO).

    Returns:
        LancamentoResponse atualizado.
    """
    from app.db import transaction, tx_execute, tx_query

    try:
        row = queries.obter_por_id(lancamento_id)
        if not row:
            raise ValueError("Lançamento não encontrado")

        current = str(row.get("status") or "").upper()
        if current == "CONFIRMADO" and status == "PENDENTE":
            raise ValueError("Não é permitido voltar um lançamento confirmado para pendente. Cancele o lançamento para reverter o estoque.")

        with transaction() as conn:
            if status == "CANCELADO" and current == "CONFIRMADO":
                vendidos = queries.obter_produtos_vendidos_em_lancamento(lancamento_id)
                if vendidos:
                    nomes = ", ".join(str(v.get("produto_nome") or "Produto") for v in vendidos)
                    raise ValueError(f"Não é possível cancelar: os seguintes produtos já registraram vendas: {nomes}")
                _apply_stock(lancamento_id, "subtract")

            if status == "CONFIRMADO" and current != "CONFIRMADO":
                _apply_stock(lancamento_id, "add")

            queries.atualizar_status(lancamento_id, status)

        return obter_por_id(lancamento_id)
    except ValueError as ex:
            raise ex
    except Exception as ex:
        logger.error('lancamento_service.py - atualizar_status: %s', ex)
        raise
