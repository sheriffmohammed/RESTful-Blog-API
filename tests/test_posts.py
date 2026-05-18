def test_create_post(auth_client):
    response = auth_client.post("/post/", json={"content": "hello world"})
    assert response.status_code == 200
    assert response.json()["content"] == "hello world"


def test_create_post_unauthorized(client):
    response = client.post("/post/", json={"content": "hello world"})
    assert response.status_code == 401


def test_get_posts(auth_client):
    auth_client.post("/post/", json={"content": "post 1"})
    auth_client.post("/post/", json={"content": "post 2"})
    response = auth_client.get("/posts/")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_delete_post(auth_client):
    post = auth_client.post("/post/", json={"content": "to delete"}).json()
    response = auth_client.delete(f"/delete-post/{post['post_id']}")
    assert response.status_code == 200
    assert response.json()["msg"] == "post successfully deleted"


def test_delete_post_not_owner(auth_client, client, registered_user):
    # create another user
    client.post("/register/", json={
        "user_name": "other",
        "email": "other@test.com",
        "password": "password123"
    })
    post = auth_client.post("/post/", json={"content": "mine"}).json()

    # login as other user
    token = client.post("/login", data={
        "username": "other", "password": "password123"
    }).json()["access_token"]
    client.headers.update({"Authorization": f"Bearer {token}"})

    response = client.delete(f"/delete-post/{post['post_id']}")
    assert response.status_code == 401