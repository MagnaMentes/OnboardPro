import sqlite3
from pathlib import Path
import random

# Путь к файлу базы данных
db_path = Path(__file__).parent / "onboardpro.db"

# Демо-данные для ФИО
demo_first_names = ["Алексей", "Иван", "Сергей", "Дмитрий",
                    "Михаил", "Ольга", "Елена", "Анна", "Мария", "Татьяна"]
demo_last_names = ["Иванов", "Смирнов", "Петров", "Соколов",
                   "Михайлов", "Иванова", "Смирнова", "Петрова", "Соколова", "Михайлова"]
demo_middle_names = ["Иванович", "Сергеевич", "Дмитриевич", "Михайлович", "Александрович",
                     "Ивановна", "Сергеевна", "Дмитриевна", "Михайловна", "Александровна"]

# Функция для генерации случайного телефона в украинском формате


def generate_phone():
    operator_code = random.randint(50, 99)
    first_part = random.randint(100, 999)
    second_part = random.randint(10, 99)
    third_part = random.randint(10, 99)
    # Возвращаем отформатированный номер в стандартном украинском формате
    return f"+380 {operator_code} {first_part} {second_part} {third_part}"


def update_users_with_demo_data():
    """Обновляет существующих пользователей демо-данными ФИО и телефонов"""

    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Получаем список всех пользователей
    cursor.execute("SELECT id, email, role FROM users")
    users = cursor.fetchall()

    for user_id, email, role in users:
        gender = 0 if random.random() < 0.6 else 5  # 60% мужских имен, 40% женских
        first_name = demo_first_names[gender + random.randint(0, 4)]
        last_name = demo_last_names[gender + random.randint(0, 4)]
        middle_name = demo_middle_names[gender + random.randint(0, 4)]
        phone = generate_phone()

        # Обновляем пользователя
        cursor.execute(
            """UPDATE users SET 
               first_name = ?, 
               last_name = ?, 
               middle_name = ?, 
               phone = ? 
               WHERE id = ?""",
            (first_name, last_name, middle_name, phone, user_id)
        )

        print(
            f"Обновлен пользователь {email} ({role}): {last_name} {first_name} {middle_name}, тел: {phone}")

    conn.commit()
    conn.close()

    print("\nДемо-данные успешно добавлены для всех пользователей!")


if __name__ == "__main__":
    update_users_with_demo_data()
