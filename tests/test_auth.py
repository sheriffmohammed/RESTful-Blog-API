def test_register(client):
    response = client.post("/register/", json={
        "user_name": "newuser",
        "email": "new@test.com",
        "password": "password123",
    })
    assert response.status_code == 201
    assert response.json()["user_name"] == "newuser"


def test_register_duplicate(client, registered_user):
    response = client.post("/register/", json={
        "user_name": "testuser",
        "email": "test@test.com",
        "password": "password123",
    })
    assert response.status_code == 400


def test_login(client, registered_user):
    response = client.post("/login", data={
        "username": registered_user["username"],
        "password": registered_user["password"],
    })
    assert response.status_code == 200
    assert "access_token" in response.json()
    assert "refresh_token" in response.json()


def test_login_wrong_password(client, registered_user):
    response = client.post("/login", data={
        "username": "testuser",
        "password": "wrongpassword",
    })
    assert response.status_code == 401