import logging
from typing import Optional

from app.queries import pedido_queries as queries
from app.schemas.pedido_schema import (
    PedidoResponse,
    PedidoItemResponse,
    PedidoCreateRequest,
    PedidoStatusUpdateRequest,
)
from app.services.pagamento_service import _ensure_financeiro_row, _add_saldo_utilizado, _subtract_saldo_utilizado

logger = logging.getLogger(__name__)

STATUS_FINAIS = {"pago", "excluido", "excluído", "cancelado"}


def _iso(value):
    """Converte valor datetime para string ISO.

    Args:
        value: Valor a ser convertido (datetime ou outro).

    Returns:
        String ISO se value tiver isoformat, ou o próprio value.
    """
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _montar_pedido_response(row: dict) -> PedidoResponse:
    """Converte row do banco para PedidoResponse.

    Args:
        row: Dict com campos do banco (id_pedido, id_cliente, cliente_nome, status, total, data).

    Returns:
        PedidoResponse.
    """
    try:
        return PedidoResponse(
            id=row["id_pedido"],
            cliente_id=row.get("id_cliente") or 0,
            cliente_nome=row.get("cliente_nome"),
            status=row.get("status") or "",
            total=float(row.get("total") or 0),
            created_at=_iso(row.get("data")),
            updated_at=_iso(row.get("data")),
        )
    except Exception as ex:
        logger.error("pedido_service.py - _montar_pedido_response: %s", ex)
        raise


def listar_todos(page: int = 1, limit: int = 10, q: Optional[str] = None, status: Optional[str] = None) -> tuple:
    """Lista pedidos paginados.

    Args:
        page: Número da página.
        limit: Itens por página.
        q: Termo de busca.
        status: Filtro opcional.

    Returns:
        Tupla (lista de PedidoResponse, total).
    """
    try:
        rows = queries.listar_todos(page, limit, q, status)
        total = queries.contar_todos(q, status)
        return [_montar_pedido_response(r) for r in rows], total
    except Exception as ex:
        logger.error('pedido_service.py - listar_todos: %s', ex)
        return [], 0


def listar_para_pagamento(page: int = 1, limit: int = 10, q: Optional[str] = None, cliente_id: Optional[int] = None) -> tuple:
    """Lista pedidos confirmados disponiveis para pagamento.

    Args:
        page: Numero da pagina.
        limit: Itens por pagina.
        q: Termo de busca.
        cliente_id: Filtrar por cliente (opcional).

    Returns:
        Tupla (lista de PedidoResponse, total).
    """
    try:
        rows = queries.listar_para_pagamento(page, limit, q, cliente_id)
        total = queries.contar_para_pagamento(q, cliente_id)
        return [_montar_pedido_response(r) for r in rows], total
    except Exception as ex:
        logger.error('pedido_service.py - listar_para_pagamento: %s', ex)
        return [], 0


def listar_por_cliente(cliente_id: int, page: int = 1, limit: int = 10, status: Optional[str] = None) -> tuple:
    """Lista pedidos de um cliente paginados.

    Args:
        cliente_id: ID do cliente.
        page: Número da página.
        limit: Itens por página.
        status: Filtro opcional.

    Returns:
        Tupla (lista de PedidoResponse, total).
    """
    try:
        rows = queries.listar_por_cliente(cliente_id, page, limit, status)
        total = queries.contar_por_cliente(cliente_id, status)
        return [_montar_pedido_response(r) for r in rows], total
    except Exception as ex:
        logger.error('pedido_service.py - listar_por_cliente: %s', ex)
        return [], 0


def obter_por_id(pedido_id: int) -> Optional[PedidoResponse]:
    """Obtém um pedido com itens pelo ID.

    Args:
        pedido_id: ID do pedido.

    Returns:
        PedidoResponse ou None.
    """
    try:
        row = queries.obter_por_id(pedido_id)
        if not row:
            return None

        itens = queries.listar_itens(pedido_id)
        response = _montar_pedido_response(row)
        response.itens = [
            PedidoItemResponse(
                id=int(i.get("id") or 0),
                pedido_id=int(i.get("pedido_id") or 0),
                produto_nome=i.get("produto_nome") or "",
                quantidade=float(i.get("quantidade") or 0),
                preco_unitario=float(i.get("preco_unitario") or 0),
                subtotal=float(i.get("subtotal") or 0),
            )
            for i in itens
        ]
        return response
    except Exception as ex:
        logger.error('pedido_service.py - obter_por_id: %s', ex)
        return None


def criar(dados: PedidoCreateRequest) -> PedidoResponse:
    """Cria um novo pedido com validação de estoque.

    Args:
        dados: Dados validados do pedido.

    Returns:
        PedidoResponse do pedido criado.
    """
    from app.db import transaction, tx_insert, tx_query, tx_one, tx_execute

    try:
        total = sum(float(i.get("quantidade") or 0) * float(i.get("preco_unitario") or 0) for i in dados.itens)

        with transaction() as conn:
            pedido_id = tx_insert(
                conn,
                "INSERT INTO pedido (id_cliente, total, data, status) VALUES (%s, %s, NOW(), 'pendente')",
                (dados.cliente_id, total),
            )

            for item in dados.itens:
                produto_id = item.get("produto_id")
                produto_nome = str(item.get("produto_nome") or "").strip()
                qtd = float(item.get("quantidade") or 0)
                preco = float(item.get("preco_unitario") or 0)

                if produto_id:
                    produto = tx_one(conn, "SELECT id_produto, nome, saldo FROM produto WHERE id_produto = %s LIMIT 1", (produto_id,))
                    if not produto:
                        raise ValueError(f"Produto com ID {produto_id} não encontrado")
                else:
                    produto = tx_one(conn, "SELECT id_produto, nome, saldo FROM produto WHERE nome = %s LIMIT 1", (produto_nome,))
                    if not produto:
                        produto_id = tx_insert(
                            conn,
                            "INSERT INTO produto (nome, valor, oldvalor, marca, saldo) VALUES (%s, %s, %s, 'indefinida', 0)",
                            (produto_nome, preco, preco),
                        )
                    else:
                        produto_id = int(produto["id_produto"])

                saldo_atual = float(produto.get("saldo") or 0) if produto else 0
                if qtd > saldo_atual:
                    nome_exibicao = produto.get("nome", produto_nome) if produto else produto_nome
                    raise ValueError(f"Estoque insuficiente para {nome_exibicao}: solicitado {qtd}, disponivel {saldo_atual}")

                tx_insert(
                    conn,
                    "INSERT INTO pedido_item (id_pedido, id_produto, qtd, vlr_item, vlr_total, vlr_custo) VALUES (%s, %s, %s, %s, %s, 0)",
                    (pedido_id, produto_id, qtd, preco, qtd * preco),
                )

                tx_execute(conn, "UPDATE produto SET saldo = saldo - %s WHERE id_produto = %s", (qtd, produto_id))

        _ensure_financeiro_row(dados.cliente_id)
        _add_saldo_utilizado(dados.cliente_id, total)

        return obter_por_id(pedido_id)
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('pedido_service.py - criar: %s', ex)
        raise


def atualizar_status(pedido_id: int, dados: PedidoStatusUpdateRequest) -> PedidoResponse:
    """Atualiza o status de um pedido com controle de estoque.

    Args:
        pedido_id: ID do pedido.
        dados: Novo status validado.

    Returns:
        PedidoResponse atualizado.
    """
    from app.db import transaction, tx_execute, tx_query, tx_one

    import logging
    logger = logging.getLogger(__name__)

    try:
        row = queries.obter_status(pedido_id)
        if not row:
            raise ValueError("Pedido não encontrado")

        old = row.lower()
        new = dados.status.lower()

        if old in STATUS_FINAIS:
            raise ValueError(f"Pedido com status '{old}' não pode ser alterado")

        old_reserve = old in {"pendente", "confirmado", "em_pagamento", "pago"}
        new_reserve = new in {"pendente", "confirmado", "em_pagamento", "pago"}

        with transaction() as conn:
            if not old_reserve and new_reserve:
                _reserve_stock(conn, pedido_id)
            elif old_reserve and not new_reserve:
                _release_stock(conn, pedido_id)

            tx_execute(conn, "UPDATE pedido SET status = %s WHERE id_pedido = %s", (dados.status, pedido_id))

        pedido = obter_por_id(pedido_id)
        if pedido:
            if not old_reserve and new_reserve:
                _ensure_financeiro_row(pedido.cliente_id)
                _add_saldo_utilizado(pedido.cliente_id, pedido.total)
            elif old_reserve and not new_reserve:
                _ensure_financeiro_row(pedido.cliente_id)
                _subtract_saldo_utilizado(pedido.cliente_id, pedido.total)

        return pedido
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('pedido_service.py - atualizar_status: %s', ex)
        raise


def deletar(pedido_id: int) -> None:
    """Deleta um pedido e devolve estoque.

    Args:
        pedido_id: ID do pedido.
    """
    from app.db import transaction, tx_execute, tx_query

    try:
        pedido = obter_por_id(pedido_id)
        if not pedido:
            raise ValueError("Pedido não encontrado")

        status = queries.obter_status(pedido_id)

        with transaction() as conn:
            if status.lower() in {"pendente", "confirmado", "em_pagamento", "pago"}:
                itens = tx_query(conn, "SELECT id_produto, qtd FROM pedido_item WHERE id_pedido = %s", (pedido_id,))
                for it in itens:
                    tx_execute(conn, "UPDATE produto SET saldo = saldo + %s WHERE id_produto = %s",
                               (float(it.get("qtd") or 0), it["id_produto"]))

            queries.deletar(pedido_id)

        if status.lower() in {"pendente", "confirmado", "em_pagamento", "pago"}:
            _ensure_financeiro_row(pedido.cliente_id)
            _subtract_saldo_utilizado(pedido.cliente_id, pedido.total)
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('pedido_service.py - deletar: %s', ex)
        raise


def adicionar_item(pedido_id: int, dados: dict) -> PedidoItemResponse:
    """Adiciona um item a um pedido.

    Args:
        pedido_id: ID do pedido.
        dados: Dados do item.

    Returns:
        PedidoItemResponse do item criado.
    """
    from app.db import transaction, tx_insert, tx_one, tx_execute

    try:
        status = queries.obter_status(pedido_id)
        if not status:
            raise ValueError("Pedido não encontrado")

        produto_id = dados.get("produtoId")
        produto_nome = str(dados.get("produtoNome") or "").strip()
        qtd = float(dados.get("quantidade") or 0)
        preco = float(dados.get("precoUnitario") or 0)

        if not produto_id and not produto_nome or qtd <= 0 or preco < 0:
            raise ValueError("Item inválido")

        with transaction() as conn:
            if produto_id:
                produto = tx_one(conn, "SELECT id_produto, saldo FROM produto WHERE id_produto = %s LIMIT 1", (produto_id,))
                if not produto:
                    raise ValueError(f"Produto com ID {produto_id} não encontrado")
            else:
                produto = tx_one(conn, "SELECT id_produto, saldo FROM produto WHERE nome = %s LIMIT 1", (produto_nome,))
                if not produto:
                    produto_id = tx_insert(
                        conn,
                        "INSERT INTO produto (nome, valor, oldvalor, marca, saldo) VALUES (%s, %s, %s, 'indefinida', 0)",
                        (produto_nome, preco, preco),
                    )
                else:
                    produto_id = int(produto["id_produto"])

            if status.lower() in {"pendente", "confirmado", "em_pagamento", "pago"}:
                saldo_atual = float(produto.get("saldo") or 0) if produto else 0
                if qtd > saldo_atual:
                    raise ValueError(f"Estoque insuficiente: solicitado {qtd}, disponivel {saldo_atual}")

            item_id = tx_insert(
                conn,
                "INSERT INTO pedido_item (id_pedido, id_produto, qtd, vlr_item, vlr_total, vlr_custo) VALUES (%s, %s, %s, %s, %s, 0)",
                (pedido_id, produto_id, qtd, preco, qtd * preco),
            )

            queries.atualizar_total(pedido_id)

            if status.lower() in {"pendente", "confirmado", "em_pagamento", "pago"}:
                tx_execute(conn, "UPDATE produto SET saldo = saldo - %s WHERE id_produto = %s", (qtd, produto_id))

        return PedidoItemResponse(
            id=int(item_id),
            pedido_id=pedido_id,
            produto_nome=produto_nome,
            quantidade=qtd,
            preco_unitario=preco,
            subtotal=qtd * preco,
        )
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('pedido_service.py - adicionar_item: %s', ex)
        raise


def remover_item(pedido_id: int, item_id: int) -> None:
    """Remove um item de um pedido e devolve estoque.

    Args:
        pedido_id: ID do pedido.
        item_id: ID do item.
    """
    from app.db import transaction, tx_execute

    try:
        status = queries.obter_status(pedido_id)
        if not status:
            raise ValueError("Pedido não encontrado")

        item = queries.obter_item_por_id(item_id, pedido_id)
        if not item:
            raise ValueError("Item não encontrado no pedido")

        with transaction() as conn:
            queries.remover_item(item_id)
            queries.atualizar_total(pedido_id)

            if status.lower() in {"pendente", "confirmado", "em_pagamento", "pago"}:
                tx_execute(conn, "UPDATE produto SET saldo = saldo + %s WHERE id_produto = %s",
                           (float(item.get("qtd") or 0), int(item["id_produto"])))
    except ValueError as ex:
        raise ex
    except Exception as ex:
        logger.error('pedido_service.py - remover_item: %s', ex)
        raise


def _reserve_stock(conn, pedido_id: int):
    """Reserva estoque para um pedido.

    Args:
        conn: Conexão ativa do banco (transaction).
        pedido_id: ID do pedido.

    Returns:
        None.
    """
    try:
        itens = queries.listar_itens(pedido_id)
        for it in itens:
            from app.db import tx_execute
            qtd = float(it.get("quantidade") or 0)
            tx_execute(conn, "UPDATE produto SET saldo = saldo - %s WHERE id_produto = %s", (qtd, it["pedido_id"]))
    except Exception as ex:
        logger.error("pedido_service.py - _reserve_stock: %s", ex)
        raise


def _release_stock(conn, pedido_id: int):
    """Libera estoque de um pedido.

    Args:
        conn: Conexão ativa do banco (transaction).
        pedido_id: ID do pedido.

    Returns:
        None.
    """
    try:
        itens = queries.listar_itens(pedido_id)
        for it in itens:
            from app.db import tx_execute
            qtd = float(it.get("quantidade") or 0)
            tx_execute(conn, "UPDATE produto SET saldo = saldo + %s WHERE id_produto = %s", (qtd, it["pedido_id"]))
    except Exception as ex:
        logger.error("pedido_service.py - _release_stock: %s", ex)
        raise
