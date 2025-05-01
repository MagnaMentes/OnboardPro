from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from dotenv import load_dotenv
import os

load_dotenv()
# Устанавливаем согласованный SECRET_KEY с надежным дефолтным значением
DEFAULT_SECRET_KEY = "OnboardProSecretKey2025!MagnaMentes"

# Получаем SECRET_KEY из переменной окружения или используем значение по умолчанию
SECRET_KEY = os.getenv("SECRET_KEY", DEFAULT_SECRET_KEY)

# Обеспечиваем, чтобы SECRET_KEY никогда не был пустой строкой
if not SECRET_KEY or SECRET_KEY.strip() == "":
    print("[AUTH] WARNING: SECRET_KEY not set or empty. Using secure default key.")
    SECRET_KEY = DEFAULT_SECRET_KEY

print(f"[AUTH] Используемый SECRET_KEY: {SECRET_KEY[:10]}...")

ALGORITHM = "HS256"

# Исправление проблем с bcrypt и консистентное использование алгоритма хеширования
pwd_scheme = ["bcrypt"]
fallback_scheme = ["sha256_crypt"]
try:
    pwd_context = CryptContext(schemes=pwd_scheme, deprecated="auto")
    # Проверяем работоспособность
    test_hash = pwd_context.hash("test_password")
    if not pwd_context.verify("test_password", test_hash):
        raise Exception("bcrypt verification test failed")
except Exception as e:
    print(f"[AUTH] Error with bcrypt: {e}. Switching to sha256_crypt.")
    pwd_context = CryptContext(schemes=fallback_scheme, deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def get_db():
    """
    Создает и возвращает новую сессию базы данных.
    Эта функция будет переопределена в тестовой среде для использования тестовой БД.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verify_password(plain_password, hashed_password):
    """
    Проверяет соответствие введённого пароля хешированному значению
    с поддержкой запасного алгоритма хеширования
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print(f"[AUTH] Error verifying password: {e}")
        # Пробуем запасной вариант для обратной совместимости
        try:
            fallback_context = CryptContext(
                schemes=fallback_scheme, deprecated="auto")
            return fallback_context.verify(plain_password, hashed_password)
        except Exception as fallback_error:
            print(
                f"[AUTH] Fallback verification also failed: {fallback_error}")
            return False


def get_password_hash(password: str):
    """
    Хеширует пароль с использованием выбранного алгоритма
    """
    return pwd_context.hash(password)


def create_access_token(data: dict):
    """
    Создаёт JWT токен с проверкой правильности входных данных
    """
    # Добавляем дополнительную защиту от неверных данных
    if not isinstance(data, dict):
        raise ValueError("Token data must be a dictionary")
    if "sub" not in data:
        raise ValueError("Token data must contain 'sub' key")

    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    print(
        f"[AUTH] Создан токен: {token[:20]}... для пользователя: {data['sub']}")
    return token


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Проверяет токен и возвращает текущего аутентифицированного пользователя
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Проверка структуры токена и подробное логирование для отладки
        if not token or not token.strip():
            print(f"[AUTH] Ошибка: Токен пустой")
            raise credentials_exception

        # Расшифровка токена
        print(f"[AUTH] Проверяем токен: {token[:20]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Валидация содержимого
        email: str = payload.get("sub")
        if email is None or not email.strip():
            print(f"[AUTH] Ошибка: Email не найден в токене или пустой")
            raise credentials_exception

        print(f"[AUTH] Токен расшифрован, email: {email}")
    except JWTError as e:
        print(f"[AUTH] JWT ошибка: {e}")
        raise credentials_exception

    # Поиск пользователя
    # Добавляем дополнительный дебаг для выявления проблемы
    try:
        user = db.query(User).filter(User.email == email).first()
        # Проверим, что сессия и пользователь в порядке
        if user:
            print(
                f"[AUTH] Найден пользователь с email {email}, id={user.id}, role={user.role}")
        else:
            # Попытаемся найти всех пользователей в базе для отладки
            all_users = db.query(User).all()
            print(
                f"[AUTH] Пользователь с email {email} не найден в базе данных")
            print(f"[AUTH] Всего пользователей в базе: {len(all_users)}")
            if all_users:
                print(
                    f"[AUTH] Существующие пользователи: {', '.join([u.email for u in all_users])}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception as e:
        print(f"[AUTH] Ошибка при поиске пользователя: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}",
        )

    # Проверка статуса пользователя
    if user.disabled:
        print(f"[AUTH] Пользователь {email} заблокирован")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is disabled",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def authenticate_user(email: str, password: str, db: Session):
    """
    Аутентифицирует пользователя по email и паролю
    """
    print(f"[LOGIN] Попытка входа пользователя: {email}")

    # Поиск пользователя
    user = db.query(User).filter(User.email == email).first()
    if not user:
        print(f"[LOGIN] Пользователь с email {email} не найден")
        return False

    # Проверка пароля
    if not verify_password(password, user.password):
        print(f"[LOGIN] Неверный пароль для пользователя {email}")
        return False

    print(f"[LOGIN] Успешный вход пользователя {email}, id={user.id}")
    return user


def verify_token(token: str):
    """
    Проверяет JWT токен и возвращает payload без взаимодействия с БД
    Используется для WebSocket аутентификации
    """
    try:
        if not token or not token.strip():
            print("[AUTH] Ошибка: Токен WebSocket пустой")
            return None

        # Расшифровка токена
        print(f"[AUTH] Проверяем WebSocket токен: {token[:20]}...")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Валидация содержимого
        email: str = payload.get("sub")
        if email is None or not email.strip():
            print(f"[AUTH] Ошибка: Email не найден в токене WebSocket или пустой")
            return None

        print(f"[AUTH] WebSocket токен верифицирован, email: {email}")
        return payload

    except JWTError as e:
        print(f"[AUTH] WebSocket JWT ошибка: {e}")
        return None
