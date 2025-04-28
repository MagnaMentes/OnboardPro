"""
Настройки аутентификации для тестовой среды OnboardPro
Использует те же основные механизмы, что и основной auth.py, но с адаптацией для тестов
"""
from jose import JWTError, jwt
from passlib.context import CryptContext
import sys
import os

# Добавляем родительскую директорию в sys.path для импорта основного auth модуля
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ВАЖНО: Используем константный SECRET_KEY для тестов, чтобы обеспечить согласованность токенов
DEFAULT_SECRET_KEY = "OnboardProSecretKey2025!MagnaMentes"
SECRET_KEY = DEFAULT_SECRET_KEY

# Устанавливаем переменную окружения SECRET_KEY для обеспечения согласованности
os.environ["SECRET_KEY"] = SECRET_KEY

print(f"[AUTH_TEST] Установлен SECRET_KEY для тестов: {SECRET_KEY[:10]}...")

ALGORITHM = "HS256"

# Используем тот же механизм хеширования, что и в основном приложении
pwd_scheme = ["bcrypt"]
fallback_scheme = ["sha256_crypt"]
try:
    pwd_context = CryptContext(schemes=pwd_scheme, deprecated="auto")
    # Проверяем работоспособность
    test_hash = pwd_context.hash("test_password")
    if not pwd_context.verify("test_password", test_hash):
        raise Exception("bcrypt verification test failed in tests")
except Exception as e:
    print(f"Error with bcrypt in tests: {e}. Switching to sha256_crypt.")
    pwd_context = CryptContext(schemes=fallback_scheme, deprecated="auto")


def verify_password(plain_password, hashed_password):
    """
    Проверяет соответствие введённого пароля хешированному значению
    с поддержкой запасного алгоритма хеширования
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"Error verifying password in tests: {e}")
        # Пробуем запасной вариант для обратной совместимости
        try:
            fallback_context = CryptContext(
                schemes=fallback_scheme, deprecated="auto")
            return fallback_context.verify(plain_password, hashed_password)
        except Exception as fallback_error:
            print(
                f"Fallback verification also failed in tests: {fallback_error}")
            return False


def create_access_token(data: dict):
    """
    Создаёт JWT токен с проверкой правильности входных данных
    """
    if not isinstance(data, dict):
        raise ValueError("Token data must be a dictionary")
    if "sub" not in data:
        raise ValueError("Token data must contain 'sub' key")

    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    print(
        f"[AUTH_TEST] Создан тестовый токен: {token[:20]}... для пользователя: {data['sub']}")
    return token
