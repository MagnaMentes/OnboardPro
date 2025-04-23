import pytest
from fastapi.testclient import TestClient
from main import app
from models import Base, User
from auth import create_access_token, pwd_context
from tests.config import engine, TestingSessionLocal


def get_test_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides = {
    "auth.get_db": get_test_db,
    "database.get_db": get_test_db
}


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def test_user(db):
    password = "test123"
    hashed_password = pwd_context.hash(password)
    user = User(email="test@onboardpro.com",
                password=hashed_password, role="hr", department="HR")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_create_user(client, db):
    response = client.post("/users", json={
        "email": "new@onboardpro.com",
        "password": "test123",
        "role": "employee",
        "department": "Engineering"
    })
    assert response.status_code == 200
    assert response.json()["email"] == "new@onboardpro.com"


def test_login(client, test_user):
    response = client.post("/login", data={
        "username": "test@onboardpro.com",
        "password": "test123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_tasks(client, test_user):
    token = create_access_token({"sub": test_user.email})
    # Создаем план онбординга
    response = client.post(
        "/plans",
        json={"role": "employee", "title": "Test Plan"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    plan_id = response.json()["id"]

    # Создаем задачу
    response = client.post(
        "/tasks",
        json={
            "plan_id": plan_id,
            "user_id": test_user.id,
            "title": "Test Task",
            "description": "Test",
            "priority": "high",
            "deadline": "2025-05-01T12:00:00Z"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    # Проверяем список задач
    response = client.get(
        "/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) > 0


def test_feedback(client, test_user):
    token = create_access_token({"sub": test_user.email})
    response = client.post(
        "/feedback",
        json={
            "recipient_id": test_user.id,
            "task_id": None,
            "message": "Test feedback"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    response = client.get(
        "/feedback",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) > 0


def test_analytics(client, test_user):
    token = create_access_token({"sub": test_user.email})
    response = client.post(
        "/analytics",
        json={
            "user_id": test_user.id,
            "metric": "task_completion_rate",
            "value": 0.75
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    response = client.get(
        "/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert len(response.json()) > 0
