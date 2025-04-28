#!/usr/bin/env python3
"""
Скрипт для прямого обновления структуры базы данных.
Используется как аварийное решение, когда миграции не работают корректно.
"""
import sqlite3
import os
import sys


def ensure_column_exists(conn, table, column, type_def='TEXT'):
    """Проверяет наличие колонки и добавляет её, если она отсутствует"""
    cursor = conn.cursor()
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [info[1] for info in cursor.fetchall()]
    
    if column not in columns:
        print(f"Добавляем колонку '{column}' в таблицу '{table}'")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {type_def}")
        conn.commit()
        return True
    else:
        print(f"Колонка '{column}' уже существует в таблице '{table}'")
        return False


def reset_database_migrations(conn):
    """Сбросить информацию о миграциях, чтобы они заново применились при следующем запуске"""
    cursor = conn.cursor()
    cursor.execute("DROP TABLE IF EXISTS alembic_version")
    conn.commit()
    print("Таблица миграций очищена. При следующем запуске миграции будут применены заново.")


def main():
    """Основная функция для обновления базы данных"""
    db_path = os.path.join(os.path.dirname(__file__), 'onboardpro.db')
    
    if not os.path.exists(db_path):
        print(f"База данных не найдена по пути: {db_path}")
        print("Новая база данных будет создана при запуске приложения.")
        return 0
    
    print(f"Подключение к базе данных: {db_path}")
    conn = sqlite3.connect(db_path)
    
    # Проверяем наличие основных таблиц
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if not cursor.fetchone():
        print("Таблица 'users' не найдена. Структура базы данных будет создана при запуске приложения.")
        return 0
    
    # Добавляем колонку photo, если она отсутствует
    changed = ensure_column_exists(conn, 'users', 'photo')
    
    if changed:
        # Если мы изменили структуру, сбросим миграции
        reset_database_migrations(conn)
    
    conn.close()
    print("Обновление базы данных завершено успешно.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
