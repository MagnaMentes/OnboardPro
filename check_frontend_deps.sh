#!/bin/bash

# Скрипт для проверки зависимостей в frontend-контейнере
echo "Проверка зависимостей в контейнере OnboardPro Frontend"
echo "=================================================="

# Проверяем, запущен ли контейнер frontend
if ! docker-compose ps | grep -q "frontend.*Up"; then
    echo "Ошибка: контейнер frontend не запущен. Запустите его с помощью 'docker-compose up -d frontend'."
    exit 1
fi

echo "\n1. Проверка устаревших зависимостей с помощью npm-check:\n"

# Запускаем npm-check в контейнере
docker-compose exec frontend sh -c "cd /app/frontend && npm install -g npm-check && npm-check"

echo "\n2. Проверка неиспользуемых зависимостей с помощью depcheck:\n"

# Запускаем depcheck в контейнере
docker-compose exec frontend sh -c "cd /app/frontend && npm install -g depcheck && depcheck"

echo "\n3. Проверка проблем с зависимостями с помощью npm audit:\n"

# Запускаем npm audit в контейнере
docker-compose exec frontend sh -c "cd /app/frontend && npm audit"

echo "\n=================================================="
echo "Проверка зависимостей завершена."
echo "Для исправления проблем с зависимостями выполните рекомендуемые команды в контейнере."