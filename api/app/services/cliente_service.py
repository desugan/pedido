import logging
from typing import Optional

from app.queries import cliente_queries as queries
from app.schemas.cliente_schema import (
    ClienteResponse,
    ClienteFinanceiro,
    ClienteCreateRequest,
    ClienteUpdateRequest,
)
from app.db import transaction, tx_execute, tx_insert

logger = logging.getLogger(__name__)


def _montar_cliente_response(row: dict) -> ClienteResponse:
    """Converte row do banco para ClienteResponse.

    Args:
        row: Dict com campos do banco (id_cliente, nome, status, contato, limite_credito, saldo_utilizado, total_pedidos, total_pagamentos).

    Returns:
        ClienteResponse.
    """
    try:
        limite = float(row.get("limite_credito") or 0)
        saldo_utilizado = float(row.get("saldo_utilizado") or 0)
        return ClienteResponse(
            id_cliente=row["id_cliente"],
            nome=row.get("nome") or "",
            status=row.get("status") or "",
            contato=row.get("contato"),
            limite_credito=limite,
            credito_utilizado=saldo_utilizado,
            saldo_restante=limite - saldo_utilizado,
            financeiro=ClienteFinanceiro(
                limite_credito=limite,
                saldo_utilizado=saldo_utilizado,
            ),
            total_pedidos=int(row.get("total_pedidos") or 0),
            total_pagamentos=int(row.get("total_pagamentos") or 0),
        )
    except Exception as ex:
        logger.error("cliente_service.py - _montar_cliente_response: %s", ex)
        raise


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None) -> tuple:
    """Lista clientes paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.

    Returns:
        Tupla (lista de ClienteResponse, total).
    """
    try:
        rows = queries.listar_todos(page, limit, q)
        total = queries.contar_todos(q)
        return [_montar_cliente_response(r) for r in rows], total
    except Exception as ex:
        logger.error('cliente_service.py - listar_todos: %s', ex)
        return [], 0


def obter_por_id(cliente_id: int) -> Optional[ClienteResponse]:
    """Obtém um cliente pelo ID.

    Args:
        cliente_id: ID do cliente.

    Returns:
        ClienteResponse ou None.
    """
    try:
        row = queries.obter_por_id(cliente_id)
        if not row:
            return None
        return _montar_cliente_response(row)
    except Exception as ex:
        logger.error('cliente_service.py - obter_por_id: %s', ex)
        return None


def criar(dados: ClienteCreateRequest) -> ClienteResponse:
    """Cria um novo cliente com registro financeiro.

    Args:
        dados: Dados validados do cliente.

    Returns:
        ClienteResponse do cliente criado.
    """
    try:
        with transaction() as conn:
            new_id = queries.criar(dados.nome, dados.status)

            tx_insert(
                conn,
                """
                INSERT INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao)
                VALUES (%s, %s, 0, %s, NOW(), 'SISTEMA')
                """,
                (new_id, dados.limite_credito, dados.limite_credito),
            )

        return obter_por_id(new_id)
    except Exception as ex:
        logger.error('cliente_service.py - criar: %s', ex)
        raise


def atualizar(cliente_id: int, dados: ClienteUpdateRequest) -> ClienteResponse:
    """Atualiza dados de um cliente.

    Args:
        cliente_id: ID do cliente.
        dados: Dados validados para atualização.

    Returns:
        ClienteResponse atualizado.
    """
    try:
        current = queries.obter_por_id(cliente_id)
        if not current:
            raise ValueError("Cliente não encontrado")

        update_data = {}
        if dados.nome is not None:
            update_data["nome"] = dados.nome
        if dados.status is not None:
            update_data["status"] = dados.status
        if dados.contato is not None:
            update_data["contato"] = dados.contato

        if update_data:
            queries.atualizar(cliente_id, update_data)

        if dados.limite_credito is not None:
            fin = queries.obter_ultimo_financeiro(cliente_id)
            if fin:
                queries.atualizar_financeiro(fin["id_financeiro"], dados.limite_credito)
            else:
                queries.criar_financeiro(cliente_id, dados.limite_credito)

        return obter_por_id(cliente_id)
    except ValueError as ex:
            raise ex
    except Exception as ex:
        logger.error('cliente_service.py - atualizar: %s', ex)
        raise


def deletar(cliente_id: int) -> None:
    """Deleta um cliente.

    Args:
        cliente_id: ID do cliente.
    """
    try:
        row = queries.obter_por_id(cliente_id)
        if not row:
            raise ValueError("Cliente não encontrado")
        queries.deletar(cliente_id)
    except ValueError as ex:
            raise ex
    except Exception as ex:
        logger.error('cliente_service.py - deletar: %s', ex)
        raise
