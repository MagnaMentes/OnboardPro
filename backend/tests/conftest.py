"""
Настройка тестового окружения для проекта OnboardPro
"""
from tests.config import TestingSessionLocal, engine
import os
import sys
import pytest

# Добавляем корневую директорию проекта в sys.path для импорта модулей
# Необходимо для корректной работы в Docker-контейнере
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

print(f"[TEST] Инициализация тестового окружения")
print(f"[TEST] Base directory: {BASE_DIR}")
print(f"[TEST] Python path: {sys.path}")
print(f"[TEST] Current directory: {os.getcwd()}")
print(f"[TEST] Directory contents: {os.listdir(os.getcwd())}")

# Используем отложенные импорты после настройки sys.path

# Фикстуры для тестов


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    """
    Создание и очистка тестовой БД для каждого теста
    """
    from models import Base
    print("[TEST] Сбрасываем тестовую базу данных перед тестами")

    # Удаляем все таблицы и создаём их заново
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    yield

    print("[TEST] Очищаем тестовую базу данных после тестов")
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    """
    Фикстура для создания тестового клиента FastAPI
    """
    from fastapi.testclient import TestClient
    from main import app
    from database import get_db as app_get_db

    # Настройка SECRET_KEY для тестов
    os.environ["SECRET_KEY"] = "OnboardProTestSecretKey2025"
    print(
        f"[TEST] SECRET_KEY для тестов установлен: {os.environ.get('SECRET_KEY')[:10]}...")

    # Функция для получения тестовой сессии базы данных
    def override_get_db():
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
        app_get_db: override_get_db  # Основное приложение
    }

    # Проверяем импорт auth модуля
    try:
        import auth
        # Модуль аутентификации
        app.dependency_overrides[auth.get_db] = override_get_db
        print("[TEST] Успешно заменили зависимость auth.get_db")
    except Exception as e:
        print(f"[TEST] Ошибка при замене зависимости auth.get_db: {e}")

    return TestClient(app)


@pytest.fixture
def db():
    """
    Фикстура для создания сессии тестовой базы данных
    """
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
