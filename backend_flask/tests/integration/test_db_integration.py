from __future__ import annotations

import hashlib
import os
from urllib.parse import urlparse

import pymysql
import pytest

from app import create_app
from app.config import Config
from app.security import sign_token


@pytest.fixture(scope="session")
def integration_db_url() -> str:
    return os.getenv("TEST_DATABASE_URL", "mysql://root:root@127.0.0.1:3307/pedido_test")


def _conn_from_url(database_url: str):
    parsed = urlparse(database_url)
    return pymysql.connect(
        host=parsed.hostname or "localhost",
        port=parsed.port or 3306,
        user=parsed.username or "root",
        password=parsed.password or "",
        database=(parsed.path or "/").lstrip("/"),
        charset="utf8mb4",
        autocommit=True,
        cursorclass=pymysql.cursors.DictCursor,
    )


@pytest.fixture()
def integration_client(integration_db_url: str):
    Config.DATABASE_URL = integration_db_url
    app = create_app()
    return app.test_client()


@pytest.fixture()
def seeded_db(integration_db_url: str):
    conn = _conn_from_url(integration_db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SET FOREIGN_KEY_CHECKS=0")
            for table in [
                "pagamentopedido",
                "pagamento",
                "pedido_item",
                "pedido",
                "lancamento_item",
                "itens_lancamento",
                "lancamento",
                "fornecedor",
                "usuario",
                "perfil",
                "financeiro",
                "cliente",
                "produto",
                "app_config",
            ]:
                cur.execute(f"TRUNCATE TABLE {table}")
            cur.execute("SET FOREIGN_KEY_CHECKS=1")

            cur.execute("INSERT INTO perfil (id_perfil, perfil) VALUES (1, 'ADMIN')")
            cur.execute(
                "INSERT INTO cliente (id_cliente, nome, status, contato) VALUES (1, 'Cliente Teste', 'ATIVO', NULL)"
            )
            cur.execute(
                """
                INSERT INTO financeiro (id_cliente, limite_credito, saldo_utilizado, ultimo_limite, data_criacao, usuario_alteracao)
                VALUES (1, 1000, 0, 1000, NOW(), 'TEST')
                """
            )
            md5_123456 = hashlib.md5("123456".encode("utf-8")).hexdigest()
            cur.execute(
                """
                INSERT INTO usuario (id_usuario, id_cliente, id_perfil, usuario, senha)
                VALUES (1, 1, 1, 'admin', %s)
                """,
                (md5_123456,),
            )
            cur.execute(
                """
                INSERT INTO fornecedor (id_fornecedor, razao, cnpj, status, data)
                VALUES (1, 'Fornecedor Teste', '12345678000199', 'ATIVO', NOW())
                """
            )
            cur.execute(
                """
                INSERT INTO produto (id_produto, nome, valor, oldvalor, marca, saldo, data_compra, qtd_ultima_compra)
                VALUES (1, 'Produto A', 10, 10, 'Marca A', 10, NOW(), 0)
                """
            )

        yield
    finally:
        conn.close()


def _auth_headers() -> dict[str, str]:
    token = sign_token(
        {
            "id_usuario": 1,
            "usuario": "admin",
            "id_perfil": 1,
            "id_cliente": 1,
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.integration
def test_login_success_with_seeded_user(integration_client, seeded_db):
    response = integration_client.post("/api/auth/login", json={"usuario": "admin", "senha": "123456"})
    assert response.status_code == 200
    payload = response.get_json()
    assert "token" in payload
    assert payload["user"]["usuario"] == "admin"


@pytest.mark.integration
def test_alterar_senha_updates_hash_and_allows_new_login(integration_client, seeded_db, integration_db_url: str):
    response = integration_client.post(
        "/api/auth/alterar-senha",
        headers=_auth_headers(),
        json={
            "senhaAtual": "123456",
            "novaSenha": "654321",
            "confirmarSenha": "654321",
        },
    )
    assert response.status_code == 200, response.get_json()

    old_login = integration_client.post("/api/auth/login", json={"usuario": "admin", "senha": "123456"})
    assert old_login.status_code == 401

    new_login = integration_client.post("/api/auth/login", json={"usuario": "admin", "senha": "654321"})
    assert new_login.status_code == 200, new_login.get_json()

    conn = _conn_from_url(integration_db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT senha FROM usuario WHERE id_usuario = 1")
            row = cur.fetchone()
            assert str(row["senha"]).startswith("$2")
    finally:
        conn.close()


@pytest.mark.integration
def test_create_pedido_decrements_product_stock(integration_client, seeded_db, integration_db_url: str):
    response = integration_client.post(
        "/api/pedidos",
        headers=_auth_headers(),
        json={
            "clienteId": 1,
            "itens": [
                {
                    "produtoNome": "Produto A",
                    "quantidade": 2,
                    "precoUnitario": 10,
                }
            ],
        },
    )

    assert response.status_code == 201, response.get_json()
    pedido = response.get_json()
    pedido_id = int(pedido["id"])

    conn = _conn_from_url(integration_db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT saldo FROM produto WHERE id_produto = 1")
            row = cur.fetchone()
            assert float(row["saldo"]) == 8.0

        total_response = integration_client.get(f"/api/pedidos/{pedido_id}/total", headers=_auth_headers())
        assert total_response.status_code == 200
        assert float(total_response.get_json()["total"]) == 20.0
    finally:
        conn.close()


@pytest.mark.integration
def test_cancel_confirmed_lancamento_blocked_if_product_has_sales(integration_client, seeded_db):
    pedido_response = integration_client.post(
        "/api/pedidos",
        headers=_auth_headers(),
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
    assert pedido_response.status_code == 201, pedido_response.get_json()

    lancamento_response = integration_client.post(
        "/api/lancamentos",
        headers=_auth_headers(),
        json={
            "id_fornecedor": 1,
            "status": "CONFIRMADO",
            "itens": [
                {
                    "id_produto": 1,
                    "qtd": 2,
                    "vlr_item": 10,
                    "vlr_total": 20,
                }
            ],
        },
    )
    assert lancamento_response.status_code == 201
    lancamento_id = int(lancamento_response.get_json()["id_lancamento"])

    cancel_response = integration_client.patch(
        f"/api/lancamentos/{lancamento_id}/status",
        headers=_auth_headers(),
        json={"status": "CANCELADO"},
    )

    assert cancel_response.status_code == 400
    assert "já registraram vendas" in cancel_response.get_json().get("error", "")


# ---------------------------------------------------------------------------
# Pagamentos
# ---------------------------------------------------------------------------


@pytest.mark.integration
def test_approve_pagamento_sets_data_pagamento(integration_client, seeded_db, integration_db_url: str):
    cr = integration_client.post(
        "/api/pagamentos",
        headers=_auth_headers(),
        json={"id_cliente": 1, "valor": 75.50, "qrcode": "QRCODE999", "chavepix": "pix@test.com"},
    )
    assert cr.status_code == 200, cr.get_json()
    pagamento_id = int(cr.get_json()["id_pagamento"])
    assert cr.get_json()["data_pagamento"] is None  # not yet approved

    ar = integration_client.patch(
        f"/api/pagamentos/{pagamento_id}/status",
        headers=_auth_headers(),
        json={"status": "aprovado"},
    )
    assert ar.status_code == 200, ar.get_json()

    conn = _conn_from_url(integration_db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT data_pagamento FROM pagamento WHERE id_pagamento = %s", (pagamento_id,))
            row = cur.fetchone()
            assert row["data_pagamento"] is not None
    finally:
        conn.close()


@pytest.mark.integration
def test_pending_pagamento_does_not_set_data_pagamento(integration_client, seeded_db, integration_db_url: str):
    cr = integration_client.post(
        "/api/pagamentos",
        headers=_auth_headers(),
        json={"id_cliente": 1, "valor": 30.0, "qrcode": "QRCODE001", "chavepix": "pix@test.com"},
    )
    assert cr.status_code == 200, cr.get_json()
    pagamento_id = int(cr.get_json()["id_pagamento"])

    ar = integration_client.patch(
        f"/api/pagamentos/{pagamento_id}/status",
        headers=_auth_headers(),
        json={"status": "rejeitado"},
    )
    assert ar.status_code == 200

    conn = _conn_from_url(integration_db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT data_pagamento, status FROM pagamento WHERE id_pagamento = %s", (pagamento_id,))
            row = cur.fetchone()
            assert row["status"] == "rejeitado"
            assert row["data_pagamento"] is None  # NOT set for non-aprovado status
    finally:
        conn.close()


@pytest.mark.integration
def test_create_pagamento_moves_confirmed_pedido_to_em_pagamento(integration_client, seeded_db, integration_db_url: str):
    pedido = integration_client.post(
        "/api/pedidos",
        headers=_auth_headers(),
        json={
            "clienteId": 1,
            "itens": [{"produtoNome": "Produto Payment Flow", "quantidade": 1, "precoUnitario": 10.0}],
        },
    )
    assert pedido.status_code == 201, pedido.get_json()
    pedido_id = int(pedido.get_json()["id"])

    set_status = integration_client.patch(
        f"/api/pedidos/{pedido_id}/status",
        headers=_auth_headers(),
        json={"status": "confirmado"},
    )
    assert set_status.status_code == 200, set_status.get_json()

    pagamento = integration_client.post(
        "/api/pagamentos",
        headers=_auth_headers(),
        json={
            "id_cliente": 1,
            "valor": 10.0,
            "qrcode": "QRCODE-EM-PAGAMENTO",
            "chavepix": "pix@test.com",
            "pedidoIds": [pedido_id],
        },
    )
    assert pagamento.status_code == 200, pagamento.get_json()

    conn = _conn_from_url(integration_db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT status FROM pedido WHERE id_pedido = %s", (pedido_id,))
            row = cur.fetchone()
            assert row["status"] == "em_pagamento"
    finally:
        conn.close()


@pytest.mark.integration
def test_approve_pagamento_moves_linked_pedido_to_pago(integration_client, seeded_db, integration_db_url: str):
    pedido = integration_client.post(
        "/api/pedidos",
        headers=_auth_headers(),
        json={
            "clienteId": 1,
            "itens": [{"produtoNome": "Produto Paid Flow", "quantidade": 2, "precoUnitario": 7.5}],
        },
    )
    assert pedido.status_code == 201, pedido.get_json()
    pedido_id = int(pedido.get_json()["id"])

    set_status = integration_client.patch(
        f"/api/pedidos/{pedido_id}/status",
        headers=_auth_headers(),
        json={"status": "confirmado"},
    )
    assert set_status.status_code == 200, set_status.get_json()

    pagamento = integration_client.post(
        "/api/pagamentos",
        headers=_auth_headers(),
        json={
            "id_cliente": 1,
            "valor": 15.0,
            "qrcode": "QRCODE-PAGO",
            "chavepix": "pix@test.com",
            "pedidoIds": [pedido_id],
        },
    )
    assert pagamento.status_code == 200, pagamento.get_json()
    pagamento_id = int(pagamento.get_json()["id_pagamento"])

    approve = integration_client.patch(
        f"/api/pagamentos/{pagamento_id}/status",
        headers=_auth_headers(),
        json={"status": "aprovado"},
    )
    assert approve.status_code == 200, approve.get_json()

    conn = _conn_from_url(integration_db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT status FROM pedido WHERE id_pedido = %s", (pedido_id,))
            row = cur.fetchone()
            assert row["status"] == "pago"
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------


@pytest.mark.integration
def test_config_pix_key_persists_and_updates(integration_client, seeded_db):
    set_resp = integration_client.put(
        "/api/config/pix-key",
        headers=_auth_headers(),
        json={"pixKey": "minha-chave@email.com"},
    )
    assert set_resp.status_code == 200
    assert set_resp.get_json()["pixKey"] == "minha-chave@email.com"

    get_resp = integration_client.get("/api/config/pix-key", headers=_auth_headers())
    assert get_resp.status_code == 200
    assert get_resp.get_json()["pixKey"] == "minha-chave@email.com"

    # Upsert — same key must be updated (ON DUPLICATE KEY)
    update_resp = integration_client.put(
        "/api/config/pix-key",
        headers=_auth_headers(),
        json={"pixKey": "nova-chave@banco.com"},
    )
    assert update_resp.status_code == 200
    assert update_resp.get_json()["pixKey"] == "nova-chave@banco.com"

    get_resp2 = integration_client.get("/api/config/pix-key", headers=_auth_headers())
    assert get_resp2.get_json()["pixKey"] == "nova-chave@banco.com"


@pytest.mark.integration
def test_config_pix_nome_persists(integration_client, seeded_db):
    set_resp = integration_client.put(
        "/api/config/pix-nome",
        headers=_auth_headers(),
        json={"pixNome": "Empresa LTDA"},
    )
    assert set_resp.status_code == 200
    assert set_resp.get_json()["pixNome"] == "Empresa LTDA"

    get_resp = integration_client.get("/api/config/pix-nome", headers=_auth_headers())
    assert get_resp.status_code == 200
    assert get_resp.get_json()["pixNome"] == "Empresa LTDA"


# ---------------------------------------------------------------------------
# Relatórios
# ---------------------------------------------------------------------------


@pytest.mark.integration
def test_relatorio_pedidos_counts_and_totals(integration_client, seeded_db):
    # Create 2 pedidos of 1 unit at R$10 each
    for _ in range(2):
        r = integration_client.post(
            "/api/pedidos",
            headers=_auth_headers(),
            json={
                "clienteId": 1,
                "itens": [{"produtoNome": "Produto A", "quantidade": 1, "precoUnitario": 10}],
            },
        )
        assert r.status_code == 201, r.get_json()

    resp = integration_client.get("/api/relatorios/pedidos", headers=_auth_headers())
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["totais"]["quantidade"] == 2
    assert float(body["totais"]["valorTotal"]) == 20.0
    assert float(body["totais"]["valorMedio"]) == 10.0


@pytest.mark.integration
def test_relatorio_clientes_listing(integration_client, seeded_db):
    resp = integration_client.get("/api/relatorios/clientes", headers=_auth_headers())
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["totais"]["quantidade"] == 1
    cliente = body["dados"][0]
    assert cliente["nome"] == "Cliente Teste"
    assert float(cliente["limite_credito"]) == 1000.0
    assert float(cliente["saldo_restante"]) == 1000.0


@pytest.mark.integration
def test_relatorio_vendas_excludes_cancelled_orders(integration_client, seeded_db):
    active = integration_client.post(
        "/api/pedidos",
        headers=_auth_headers(),
        json={
            "clienteId": 1,
            "itens": [{"produtoNome": "Produto A", "quantidade": 1, "precoUnitario": 10}],
        },
    )
    assert active.status_code == 201, active.get_json()

    cancelled = integration_client.post(
        "/api/pedidos",
        headers=_auth_headers(),
        json={
            "clienteId": 1,
            "itens": [{"produtoNome": "Produto A", "quantidade": 2, "precoUnitario": 10}],
        },
    )
    assert cancelled.status_code == 201, cancelled.get_json()

    cancel_resp = integration_client.patch(
        f"/api/pedidos/{cancelled.get_json()['id']}/status",
        headers=_auth_headers(),
        json={"status": "cancelado"},
    )
    assert cancel_resp.status_code == 200, cancel_resp.get_json()

    resp = integration_client.get("/api/relatorios/vendas", headers=_auth_headers())
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["totais"]["quantidadePedidos"] == 1
    assert float(body["totais"]["faturamento"]) == 10.0
    assert float(body["totais"]["ticketMedio"]) == 10.0


@pytest.mark.integration
def test_relatorio_usuario_includes_cliente_pedidos_e_pagamentos(integration_client, seeded_db):
    pedido = integration_client.post(
        "/api/pedidos",
        headers=_auth_headers(),
        json={
            "clienteId": 1,
            "itens": [{"produtoNome": "Produto A", "quantidade": 1, "precoUnitario": 10}],
        },
    )
    assert pedido.status_code == 201, pedido.get_json()

    pagamento = integration_client.post(
        "/api/pagamentos",
        headers=_auth_headers(),
        json={"id_cliente": 1, "valor": 42.5, "qrcode": "QR-USER", "chavepix": "pix@test.com"},
    )
    assert pagamento.status_code == 200, pagamento.get_json()

    resp = integration_client.get("/api/relatorios/usuario?id_cliente=1", headers=_auth_headers())
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["cliente"]["nome"] == "Cliente Teste"
    assert len(body["pedidos"]) == 1
    assert len(body["pagamentos"]) == 1
    assert float(body["pagamentos"][0]["valor"]) == 42.5


@pytest.mark.integration
def test_relatorio_pagamentos_totals(integration_client, seeded_db):
    for i in range(2):
        r = integration_client.post(
            "/api/pagamentos",
            headers=_auth_headers(),
            json={"id_cliente": 1, "valor": 25.0, "qrcode": f"QR{i}", "chavepix": "pix@test.com"},
        )
        assert r.status_code == 200, r.get_json()

    resp = integration_client.get("/api/relatorios/pagamentos", headers=_auth_headers())
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["totais"]["quantidade"] == 2
    assert float(body["totais"]["valorTotal"]) == 50.0
    assert float(body["totais"]["valorMedio"]) == 25.0

