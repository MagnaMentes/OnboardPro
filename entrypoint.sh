#!/bin/bash

# Выход при ошибке
set -e

# Переход в директорию бэкенда
cd backend

# Выполнение миграций
python manage.py makemigrations
python manage.py migrate

# Создание суперпользователя
python manage.py create_superuser

cd ..

exec "$@"
