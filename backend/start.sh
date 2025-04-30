#!/bin/bash
set -e

# Создаем директорию для логов, если она не существует
echo "Checking logs directory..."
mkdir -p /app/logs
chmod -R 755 /app/logs

echo "Checking database structure..."

# Функция для проверки наличия таблицы
check_table_exists() {
    sqlite3 onboardpro.db "SELECT name FROM sqlite_master WHERE type='table' AND name='$1';" | grep -q "$1"
    return $?
}

# Проверяем наличие таблицы users
if check_table_exists "users"; then
    echo "Database exists, checking structure..."
    # Проверяем наличие колонки photo в таблице users
    if ! sqlite3 onboardpro.db "PRAGMA table_info(users);" | grep -q "photo"; then
        echo "Column 'photo' is missing in users table. Applying migrations..."
    fi
else
    echo "Users table doesn't exist. Creating database structure..."
fi

# Запускаем миграции базы данных
echo "Applying database migrations..."
alembic upgrade heads || echo "Warning: Alembic migrations failed. Trying direct database update..."

# Если миграции не прошли, используем прямое обновление базы данных
if ! sqlite3 onboardpro.db "PRAGMA table_info(users);" | grep -q "photo" 2>/dev/null; then
    echo "Running direct database update..."
    python direct_db_update.py
fi

# Проверим успешность обновления
if ! sqlite3 onboardpro.db "PRAGMA table_info(users);" | grep -q "photo" 2>/dev/null; then
    echo "WARNING: Column 'photo' still missing after all attempts! Creating it manually..."
    # Создаем таблицу users если она не существует
    sqlite3 onboardpro.db "CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        middle_name TEXT,
        phone TEXT,
        role TEXT NOT NULL,
        department TEXT,
        telegram_id TEXT,
        disabled BOOLEAN DEFAULT 0,
        photo TEXT
    );" || echo "Failed to create users table!"
    
    # Добавляем колонку photo
    sqlite3 onboardpro.db "ALTER TABLE users ADD COLUMN photo TEXT;" || echo "Failed to add photo column!"
fi

# Проверяем, установлен ли пакет apscheduler
echo "Checking required packages..."
if ! pip list | grep -q "apscheduler"; then
    echo "Installing missing package: apscheduler"
    pip install apscheduler
fi

# Запуск скрипта инициализации данных
echo "Initializing database with seed data..."
python seed_data.py || echo "Warning: Seed data initialization failed, but continuing..."

# Запуск сервера FastAPI
echo "Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload