import auth
from tests.config import engine, TestingSessionLocal
from tests.auth_test import create_access_token, pwd_context, verify_password
from models import Base, User
from main import app
import os
import sys
import pytest
from fastapi.testclient import TestClient

# Импортируем напрямую из модуля файла
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Полностью заменяем зависимости приложения
# Это позволяет тестам использовать ту же базу данных


def get_test_db():
    """
    Переопределение функции получения базы данных для тестов
    """
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Переопределяем все зависимости, связанные с базой данных
app.dependency_overrides = {
    "auth.get_db": get_test_db,
    "database.get_db": get_test_db,
    "auth.get_current_user": lambda token=auth.Depends(auth.oauth2_scheme), db=auth.Depends(get_test_db):
        auth.get_current_user(token, db)
}

# В этой фикстуре мы готовим базу данных для тестов


@pytest.fixture(autouse=True)
def setup_db():
    print("Сбрасываем тестовую базу данных перед тестами")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    print("Очищаем тестовую базу данных после тестов")
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
    """
    Создает тестового пользователя и возвращает его
    """
    try:
        # Проверяем, не существует ли такой пользователь уже
        user = db.query(User).filter(
            User.email == "test@onboardpro.com").first()
        if user:
            print(f"Пользователь {user.email} уже существует, id={user.id}")
            return user

        # Создаем нового пользователя
        password = "test123"
        hashed_password = pwd_context.hash(password)
        user = User(
            email="test@onboardpro.com",
            password=hashed_password,
            role="hr",
            department="HR",
            disabled=False
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(
            f"Создан тестовый пользователь с ID: {user.id} и ролью: {user.role}")

        # Проверяем правильность хеширования пароля
        assert verify_password(
            password, user.password), "Ошибка верификации пароля"

        return user
    except Exception as e:
        print(f"Ошибка при создании тестового пользователя: {e}")
        db.rollback()
        raise


def test_create_user(client, db):
    """Тест создания пользователя"""
    # Используем уникальный email для каждого теста
    unique_email = f"new_user_{os.urandom(4).hex()}@onboardpro.com"

    response = client.post("/users", json={
        "email": unique_email,
        "password": "test123",
        "role": "employee",
        "department": "Engineering"
    })
    assert response.status_code == 200, f"Failed to create user: {response.text}"
    assert response.json()["email"] == unique_email


def test_login(client, test_user):
    """Тест аутентификации пользователя"""
    response = client.post("/login", data={
        "username": "test@onboardpro.com",
        "password": "test123"
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    assert "access_token" in response.json()
    print(f"Успешный вход, токен: {response.json()['access_token'][:20]}...")


def test_tasks(client, test_user):
    """Тест создания и получения задач"""
    # Создаем токен доступа с email пользователя
    token = create_access_token({"sub": test_user.email})
    print(f"Создан токен для пользователя {test_user.email}: {token[:20]}...")

    # Создаем план онбординга
    response = client.post(
        "/plans",
        json={"role": "employee", "title": "Test Plan",
              "description": "Test description"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, f"Failed to create plan: {response.text}"
    plan_id = response.json()["id"]
    print(f"Создан план с ID: {plan_id}")

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
    assert response.status_code == 200, f"Failed to create task: {response.text}"
    task_id = response.json()["id"]
    print(f"Создана задача с ID: {task_id}")

    # Проверяем список задач
    response = client.get(
        "/tasks",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, f"Failed to get tasks: {response.text}"
    assert len(response.json()) > 0
    print(f"Получен список задач, количество: {len(response.json())}")


def test_feedback(client, test_user):
    """Тест создания и получения отзывов"""
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
    assert response.status_code == 200, f"Failed to create feedback: {response.text}"
    feedback_id = response.json()["id"]
    print(f"Создан отзыв с ID: {feedback_id}")

    response = client.get(
        "/feedback",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, f"Failed to get feedback: {response.text}"
    assert len(response.json()) > 0
    print(f"Получен список отзывов, количество: {len(response.json())}")


def test_analytics(client, test_user):
    """Тест создания и получения аналитики"""
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
    assert response.status_code == 200, f"Failed to create analytics: {response.text}"
    analytics_id = response.json()["id"]
    print(f"Создана аналитика с ID: {analytics_id}")

    response = client.get(
        "/analytics",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200, f"Failed to get analytics: {response.text}"
    assert len(response.json()) > 0
    print(f"Получен список аналитики, количество: {len(response.json())}")
