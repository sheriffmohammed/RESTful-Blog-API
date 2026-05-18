import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from sqlmodel.pool import StaticPool
from api import app
from db_utils import get_session


# in-memory SQLite DB — no MySQL needed for tests
@pytest.fixture
def session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)


@pytest.fixture
def client(session):
    def override_get_session():
        yield session

    app.dependency_overrides[get_session] = override_get_session
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def registered_user(client):
    client.post("/register/", json={
        "user_name": "testuser",
        "email": "test@test.com",
        "password": "password123",
    })
    return {"username": "testuser", "password": "password123"}


@pytest.fixture
def auth_client(client, registered_user):
    response = client.post("/login", data={
        "username": registered_user["username"],
        "password": registered_user["password"],
    })
    token = response.json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client
