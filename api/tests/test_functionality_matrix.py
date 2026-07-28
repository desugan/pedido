from app import create_app


FUNCTIONALITIES = [
    ("health_root", "GET", "/health", True),
    ("health_api", "GET", "/api/health", True),
    ("auth_login", "POST", "/api/auth/login", True),
    ("auth_alterar_senha", "POST", "/api/auth/alterar-senha", False),
    ("auth_login_log", "GET", "/api/auth/login-log", False),
    ("clientes_list", "GET", "/api/clientes", False),
    ("clientes_get", "GET", "/api/clientes/1", False),
    ("clientes_create", "POST", "/api/clientes", False),
    ("clientes_update", "PUT", "/api/clientes/1", False),
    ("clientes_delete", "DELETE", "/api/clientes/1", False),
    ("pedidos_list", "GET", "/api/pedidos", False),
    ("pedidos_get", "GET", "/api/pedidos/1", False),
    ("pedidos_create", "POST", "/api/pedidos", False),
    ("pedidos_patch_status", "PATCH", "/api/pedidos/1/status", False),
    ("pedidos_delete", "DELETE", "/api/pedidos/1", False),
    ("pedidos_add_item", "POST", "/api/pedidos/1/itens", False),
    ("pedidos_remove_item", "DELETE", "/api/pedidos/1/itens/1", False),
    ("pedidos_items", "GET", "/api/pedidos/1/itens", False),
    ("pedidos_total", "GET", "/api/pedidos/1/total", False),
    ("pedidos_cliente", "GET", "/api/pedidos/cliente/1", False),
    ("pagamentos_list", "GET", "/api/pagamentos", False),
    ("pagamentos_cliente", "GET", "/api/pagamentos/cliente/1", False),
    ("pagamentos_get", "GET", "/api/pagamentos/1", False),
    ("pagamentos_create", "POST", "/api/pagamentos", False),
    ("pagamentos_patch_status", "PATCH", "/api/pagamentos/1/status", False),
    ("pagamentos_delete", "DELETE", "/api/pagamentos/1", False),
    ("relatorios_pedidos", "GET", "/api/relatorios/pedidos", False),
    ("relatorios_pagamentos", "GET", "/api/relatorios/pagamentos", False),
    ("relatorios_clientes", "GET", "/api/relatorios/clientes", False),
    ("relatorios_vendas", "GET", "/api/relatorios/vendas", False),
    ("relatorios_usuario", "GET", "/api/relatorios/usuario", False),
    ("produtos_list", "GET", "/api/produtos", False),
    ("produtos_get", "GET", "/api/produtos/1", False),
    ("produtos_create", "POST", "/api/produtos", False),
    ("produtos_update", "PUT", "/api/produtos/1", False),
    ("produtos_delete", "DELETE", "/api/produtos/1", False),
    ("usuarios_list", "GET", "/api/usuarios", False),
    ("usuarios_perfis", "GET", "/api/usuarios/perfis", False),
    ("usuarios_get", "GET", "/api/usuarios/1", False),
    ("usuarios_create", "POST", "/api/usuarios", False),
    ("usuarios_update", "PUT", "/api/usuarios/1", False),
    ("usuarios_delete", "DELETE", "/api/usuarios/1", False),
    ("usuarios_reset_senha", "POST", "/api/usuarios/1/reset-senha", False),
    ("fornecedores_list", "GET", "/api/fornecedores", False),
    ("fornecedores_get", "GET", "/api/fornecedores/1", False),
    ("fornecedores_create", "POST", "/api/fornecedores", False),
    ("fornecedores_update", "PUT", "/api/fornecedores/1", False),
    ("fornecedores_delete", "DELETE", "/api/fornecedores/1", False),
    ("lancamentos_list", "GET", "/api/lancamentos", False),
    ("lancamentos_get", "GET", "/api/lancamentos/1", False),
    ("lancamentos_create", "POST", "/api/lancamentos", False),
    ("lancamentos_patch_status", "PATCH", "/api/lancamentos/1/status", False),
    ("config_pix_key_get", "GET", "/api/config/pix-key", False),
    ("config_pix_key_put", "PUT", "/api/config/pix-key", False),
    ("config_pix_nome_get", "GET", "/api/config/pix-nome", False),
    ("config_pix_nome_put", "PUT", "/api/config/pix-nome", False),
]


def test_all_functionalities_are_registered_in_routes():
    app = create_app()
    adapter = app.url_map.bind("localhost")

    for name, method, path, _public in FUNCTIONALITIES:
        endpoint, _args = adapter.match(path, method=method)
        assert endpoint is not None, f"Funcionalidade sem rota registrada: {name} {method} {path}"


def test_public_endpoints_contract():
    app = create_app()
    client = app.test_client()

    health = client.get("/api/health")
    assert health.status_code in (200, 503)

    login = client.post("/api/auth/login", json={"usuario": "", "senha": ""})
    assert login.status_code == 400
    assert isinstance(login.get_json(), dict)
    assert "error" in login.get_json()


def test_protected_endpoints_require_token():
    app = create_app()
    client = app.test_client()

    protected = [f for f in FUNCTIONALITIES if not f[3]]

    for name, method, path, _ in protected:
        if method == "GET":
            response = client.get(path)
        elif method == "POST":
            response = client.post(path, json={})
        elif method == "PUT":
            response = client.put(path, json={})
        elif method == "PATCH":
            response = client.patch(path, json={})
        elif method == "DELETE":
            response = client.delete(path)
        else:
            raise AssertionError(f"Método não coberto no teste: {method}")

        assert response.status_code == 401, f"Funcionalidade deveria exigir token: {name}"
