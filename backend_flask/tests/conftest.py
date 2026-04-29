from __future__ import annotations

import pytest

from app import create_app
from app.security import sign_token


@pytest.fixture
def app_instance():
    return create_app()


@pytest.fixture
def client(app_instance):
    return app_instance.test_client()


@pytest.fixture
def auth_headers() -> dict[str, str]:
    token = sign_token(
        {
            "id_usuario": 1,
            "usuario": "admin",
            "id_perfil": 1,
            "id_cliente": 1,
        }
    )
    return {"Authorization": f"Bearer {token}"}
