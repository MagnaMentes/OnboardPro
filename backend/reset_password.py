"""
Скрипт для сброса пароля пользователя в системе OnboardPro
"""

from sqlalchemy.orm import Session
from models import User
from auth import pwd_context
from database import SessionLocal


def reset_user_password(email: str, new_password: str):
    """
    Сбрасывает пароль для указанного пользователя.

    Args:
        email (str): Email пользователя
        new_password (str): Новый пароль
    """
    db = SessionLocal()
    try:
        # Находим пользователя по email
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"Пользователь с email {email} не найден!")
            return False

        # Хешируем новый пароль
        hashed_password = pwd_context.hash(new_password)

        # Обновляем пароль
        user.password = hashed_password
        db.commit()

        print(f"Пароль для пользователя {email} успешно обновлен!")
        return True

    except Exception as e:
        print(f"Ошибка при сбросе пароля: {e}")
        db.rollback()
        return False

    finally:
        db.close()


if __name__ == "__main__":
    # Установка пароля 'test123' для пользователя test@onboardpro.com
    reset_user_password("test@onboardpro.com", "test123")
