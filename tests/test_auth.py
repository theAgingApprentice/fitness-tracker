import os
import sys
import pytest
from unittest.mock import patch, MagicMock

# Put app/ on the path so Flask can find its modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'app'))

# Set API_KEY before importing the app so the env var is present at import time
TEST_KEY = os.environ.get('API_KEY', 'test-key')
os.environ.setdefault('API_KEY', TEST_KEY)

from app import app as flask_app


@pytest.fixture
def client():
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        yield client


def _mock_db():
    """Return a context manager that patches get_db_connection with a no-op cursor."""
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.fetchall.return_value = []
    mock_cursor.fetchone.return_value = (1,)
    mock_conn.cursor.return_value = mock_cursor
    return patch('routes.api_routes.get_db_connection', return_value=mock_conn)


def test_health_no_auth(client):
    with _mock_db():
        response = client.get('/api/health')
    assert response.status_code == 200


def test_activities_no_auth_returns_401(client):
    response = client.get('/api/activities')
    assert response.status_code == 401


def test_activities_correct_key_returns_200(client):
    with _mock_db():
        response = client.get('/api/activities', headers={'X-API-Key': TEST_KEY})
    assert response.status_code == 200


def test_activities_wrong_key_returns_401(client):
    response = client.get('/api/activities', headers={'X-API-Key': 'wrong-key'})
    assert response.status_code == 401
