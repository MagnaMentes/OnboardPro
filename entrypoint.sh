#!/bin/bash

# Выход при ошибке
set -e

# Переход в директорию бэкенда
cd backend

# Выполнение миграций
python manage.py makemigrations
python manage.py migrate

cd ..

exec "$@"
