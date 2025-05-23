#!/bin/bash
set -e

# Применение миграций
python backend/manage.py migrate

# Создание суперпользователя
python backend/manage.py create_superuser

# Запуск сервера
exec python backend/manage.py runserver 0.0.0.0:8000
