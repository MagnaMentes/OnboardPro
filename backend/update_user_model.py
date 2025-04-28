import sqlite3
from pathlib import Path

# Путь к файлу базы данных
db_path = Path(__file__).parent / "onboardpro.db"

def add_user_personal_info():
    """Добавляет поля first_name, last_name, middle_name и phone в таблицу users"""
    
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Проверяем, существуют ли уже эти колонки
    cursor.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in cursor.fetchall()]
    
    # Добавляем отсутствующие колонки
    if "first_name" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN first_name TEXT")
    
    if "last_name" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN last_name TEXT")
    
    if "middle_name" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN middle_name TEXT")
    
    if "phone" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT")
    
    conn.commit()
    conn.close()
    
    print("База данных успешно обновлена!")

if __name__ == "__main__":
    add_user_personal_info()