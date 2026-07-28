from app import create_app


def test_health_endpoint_contract():
    app = create_app()
    client = app.test_client()

    response = client.get('/api/health')
    assert response.status_code in (200, 503)

    data = response.get_json()
    assert isinstance(data, dict)
    assert 'api' in data
    assert 'database' in data
    assert 'status' in data
    assert 'timestamp' in data
