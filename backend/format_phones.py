import sqlite3
from pathlib import Path
import re

# Путь к файлу базы данных
db_path = Path(__file__).parent / "onboardpro.db"


def format_ukrainian_phone(phone):
    """
    Форматирует украинский номер телефона в стандартный формат: +380 XX XXX XX XX
    """
    if phone is None:
        return None

    # Удаляем все пробелы для начала
    cleaned_number = phone.replace(" ", "")

    # Проверяем, что это действительно украинский номер
    pattern = r'^\+380\d{9}$'
    if not re.match(pattern, cleaned_number):
        # Если номер не соответствует формату, возвращаем как есть
        return phone

    # Форматируем номер
    operator_code = cleaned_number[4:6]
    first_part = cleaned_number[6:9]
    second_part = cleaned_number[9:11]
    third_part = cleaned_number[11:13]

    return f"+380 {operator_code} {first_part} {second_part} {third_part}"


def update_phone_formats():
    """
    Обновляет все телефонные номера в базе данных, приводя их к стандартному украинскому формату.
    """
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Получаем всех пользователей с телефонными номерами
    cursor.execute(
        "SELECT id, email, phone FROM users WHERE phone IS NOT NULL")
    users = cursor.fetchall()

    updated_count = 0

    for user_id, email, phone in users:
        # Проверяем, нужно ли форматировать номер (если в нем нет пробелов)
        if phone and " " not in phone:
            formatted_phone = format_ukrainian_phone(phone)

            # Если номер изменился, обновляем его в базе данных
            if formatted_phone != phone:
                cursor.execute(
                    "UPDATE users SET phone = ? WHERE id = ?",
                    (formatted_phone, user_id)
                )
                updated_count += 1
                print(
                    f"Обновлен номер телефона для {email}: {phone} -> {formatted_phone}")

    conn.commit()
    conn.close()

    print(
        f"\nФорматирование телефонных номеров завершено. Обновлено номеров: {updated_count}")


if __name__ == "__main__":
    update_phone_formats()
