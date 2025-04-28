#!/bin/bash
set -e

# Запуск миграций базы данных
echo "Applying database migrations..."
alembic upgrade heads

# Запуск скрипта инициализации данных
echo "Initializing database with seed data..."
python seed_data.py

# Запуск сервера FastAPI
echo "Starting FastAPI server..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --reload