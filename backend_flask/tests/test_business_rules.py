from __future__ import annotations

from typing import Any

import pytest

from app.routes import pedidos as pedidos_routes
from app.routes import lancamentos as lancamentos_routes
from app.routes import relatorios as relatorios_routes


def test_fornecedor_create_requires_razao_and_cnpj(client, auth_headers):

    response = client.post(
        "/api/fornecedores",
        headers=auth_headers,
        json={"razao": "", "cnpj": ""},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_produto_create_requires_positive_valor(client, auth_headers):

    response = client.post(
        "/api/produtos",
        headers=auth_headers,
        json={"nome": "Prod", "marca": "Marca", "valor": 0, "saldo": 1},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_usuario_create_requires_required_fields(client, auth_headers):

    response = client.post(
        "/api/usuarios",
        headers=auth_headers,
        json={"usuario": "", "senha": "", "id_cliente": None, "id_perfil": None},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_pagamento_create_requires_minimum_payload(client, auth_headers):

    response = client.post(
        "/api/pagamentos",
        headers=auth_headers,
        json={"id_cliente": 0, "valor": 0, "qrcode": "", "chavepix": ""},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_config_pix_key_put_requires_value(client, auth_headers):

    response = client.put(
        "/api/config/pix-key",
        headers=auth_headers,
        json={"pixKey": ""},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_config_pix_nome_put_requires_value(client, auth_headers):
    response = client.put(
        "/api/config/pix-nome",
        headers=auth_headers,
        json={"pixNome": ""},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_relatorio_usuario_requires_id_cliente(client, auth_headers):

    response = client.get(
        "/api/relatorios/usuario",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.get_json().get("error") == "id_cliente obrigatório"


def test_pedido_create_requires_cliente_and_items(client, auth_headers):

    response = client.post(
        "/api/pedidos",
        headers=auth_headers,
        json={"clienteId": 0, "itens": []},
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_pedido_status_requires_non_empty_status(client, auth_headers):

    response = client.patch(
        "/api/pedidos/1/status",
        headers=auth_headers,
        json={"status": ""},
    )

    assert response.status_code == 400
    assert response.get_json().get("error") == "Status inválido"


def test_lancamento_status_rejects_invalid_value(client, auth_headers):

    response = client.patch(
        "/api/lancamentos/1/status",
        headers=auth_headers,
        json={"status": "XYZ"},
    )

    assert response.status_code == 400
    assert response.get_json().get("error") == "Status inválido"


def test_lancamento_cancel_confirmado_with_sales_is_blocked(client, auth_headers, monkeypatch):

    def fake_query_one(sql: str, params: Any = None):
        if "SELECT status FROM lancamento" in sql:
            return {"status": "CONFIRMADO"}
        if "WHERE l.id_lancamento" in sql:
            return {
                "id_lancamento": 1,
                "id_fornecedor": 1,
                "fornecedor_nome": "F1",
                "total": 10,
                "data": "2026-01-01",
                "status": "CONFIRMADO",
            }
        return None

    def fake_query_all(sql: str, params: Any = None):
        if "SELECT DISTINCT p.nome AS produto_nome" in sql:
            return [{"produto_nome": "Produto Teste"}]
        if "FROM lancamento_item li" in sql:
            return [{"id_produto": 1, "qtd": 1, "vlr_item": 10, "vlr_total": 10, "produto_nome": "Produto Teste"}]
        return []

    monkeypatch.setattr(lancamentos_routes, "query_one", fake_query_one)
    monkeypatch.setattr(lancamentos_routes, "query_all", fake_query_all)
    monkeypatch.setattr(lancamentos_routes, "execute", lambda *args, **kwargs: 1)

    response = client.patch(
        "/api/lancamentos/1/status",
        headers=auth_headers,
        json={"status": "CANCELADO"},
    )

    assert response.status_code == 400
    assert "já registraram vendas" in response.get_json().get("error", "")


def test_pedido_create_reserves_stock(client, auth_headers, monkeypatch):

    called = {"reserve": 0}

    def fake_reserve(_pedido_id: int, mode: str):
        if mode == "subtract":
            called["reserve"] += 1

    seq = {"insert_calls": 0}

    def fake_execute_insert(_sql: str, _params: Any = None):
        seq["insert_calls"] += 1
        if seq["insert_calls"] == 1:
            return 1
        return 99

    def fake_query_one(sql: str, params: Any = None):
        if "SELECT id_produto FROM produto WHERE nome" in sql:
            return {"id_produto": 5}
        if "WHERE p.id_pedido = %s" in sql:
            return {
                "id_pedido": 1,
                "id_cliente": 1,
                "cliente_nome": "C1",
                "status": "pendente",
                "total": 10,
                "data": "2026-01-01",
            }
        return {"id": 1}

    def fake_query_all(sql: str, params: Any = None):
        if "FROM pedido_item pi" in sql:
            return [
                {
                    "id": 99,
                    "pedidoId": 1,
                    "produtoNome": "Produto A",
                    "quantidade": 1,
                    "precoUnitario": 10,
                    "subtotal": 10,
                }
            ]
        return []

    monkeypatch.setattr(pedidos_routes, "_reserve_or_release_stock", fake_reserve)
    monkeypatch.setattr(pedidos_routes, "query_one", fake_query_one)
    monkeypatch.setattr(pedidos_routes, "query_all", fake_query_all)
    monkeypatch.setattr(pedidos_routes, "execute_insert", fake_execute_insert)
    monkeypatch.setattr(pedidos_routes, "execute", lambda *args, **kwargs: 1)

    response = client.post(
        "/api/pedidos",
        headers=auth_headers,
        json={
            "clienteId": 1,
            "itens": [
                {
                    "produtoNome": "Produto A",
                    "quantidade": 1,
                    "precoUnitario": 10,
                }
            ],
        },
    )

    assert response.status_code == 201
    assert called["reserve"] == 1


@pytest.mark.parametrize(
    "method,path,payload",
    [
        ("get", "/api/clientes/0", None),
        ("get", "/api/produtos/0", None),
        ("get", "/api/fornecedores/0", None),
        ("get", "/api/usuarios/0", None),
        ("get", "/api/pedidos/0", None),
        ("get", "/api/pagamentos/0", None),
        ("get", "/api/lancamentos/0", None),
    ],
)
def test_get_unknown_resource_returns_not_found_or_backend_error(client, auth_headers, method, path, payload):
    caller = getattr(client, method)
    if payload is None:
        response = caller(path, headers=auth_headers)
    else:
        response = caller(path, headers=auth_headers, json=payload)

    assert response.status_code in (404, 500)
    data = response.get_json()
    assert isinstance(data, dict)
    assert "error" in data


@pytest.mark.parametrize(
    "method,path,payload,expected_status",
    [
        ("post", "/api/clientes", {"nome": "", "status": "ATIVO"}, 400),
        ("post", "/api/fornecedores", {"razao": "Fornecedor", "cnpj": ""}, 400),
        ("post", "/api/lancamentos", {"id_fornecedor": 1, "itens": []}, 400),
        ("patch", "/api/lancamentos/1/status", {"status": ""}, 400),
    ],
)
def test_validation_errors_for_key_endpoints(client, auth_headers, method, path, payload, expected_status):
    caller = getattr(client, method)
    response = caller(path, headers=auth_headers, json=payload)

    assert response.status_code == expected_status
    assert "error" in response.get_json()


def test_relatorio_usuario_returns_totals_and_saldo_restante(client, auth_headers, monkeypatch):

    def fake_query_one(sql: str, params: Any = None):
        if "FROM cliente c" in sql:
            return {
                "id_cliente": 1,
                "nome": "Cliente Teste",
                "status": "ATIVO",
                "limite_credito": 1000,
                "credito_utilizado": 250,
            }
        return None

    def fake_query_all(sql: str, params: Any = None):
        if "FROM pedido WHERE id_cliente" in sql:
            return [{"id_pedido": 10, "total": 120.5, "status": "confirmado", "data": "2026-04-04"}]
        if "FROM pedido_item pi" in sql:
            return [
                {
                    "id_pedido": 10,
                    "id_pedido_item": 1,
                    "id_produto": 1,
                    "produto_nome": "Produto A",
                    "qtd": 2,
                    "vlr_venda": 60.25,
                }
            ]
        if "FROM pagamento WHERE id_cliente" in sql:
            return [{"id_pagamento": 2, "valor": 90.0, "status": "pendente", "data_criacao": "2026-04-04"}]
        return []

    monkeypatch.setattr(relatorios_routes, "query_one", fake_query_one)
    monkeypatch.setattr(relatorios_routes, "query_all", fake_query_all)

    response = client.get("/api/relatorios/usuario?id_cliente=1", headers=auth_headers)

    assert response.status_code == 200
    data = response.get_json()
    assert "totais" in data
    assert float(data["totais"]["valorTotalPedidos"]) == 120.5
    assert float(data["totais"]["valorTotalPagamentos"]) == 90.0
    assert float(data["cliente"]["saldo_restante"]) == 750.0
    assert len(data["pedidos"][0]["pedido_item"]) == 1
