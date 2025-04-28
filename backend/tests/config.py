from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

# Используем абсолютный путь для тестовой базы данных
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_DB_PATH = os.path.join(BASE_DIR, "test.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"

print(f"[TEST CONFIG] Initializing test database at: {TEST_DB_PATH}")

# Создаем движок с уникальным соединением и проверяем его
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)

# Создаем фабрику сессий
TestingSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine)

# Для отладки: проверяем, что база данных доступна
try:
    # Создаем тестовую сессию
    test_session = TestingSessionLocal()
    # Выполняем простой запрос для проверки
    test_session.execute("SELECT 1")
    print("[TEST CONFIG] Test database connection successful")
    # Закрываем сессию
    test_session.close()
except Exception as e:
    print(f"[TEST CONFIG] Error connecting to test database: {e}")
