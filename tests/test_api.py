from api import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_get():
    response = client.get("/posts/")
    assert response.status_code == 200
