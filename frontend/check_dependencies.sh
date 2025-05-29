#!/bin/bash

# Скрипт для проверки зависимостей в проекте
echo "Проверка зависимостей в проекте OnboardPro Frontend"
echo "=================================================="

# Проверяем, установлены ли необходимые инструменты
if ! command -v npx &> /dev/null; then
    echo "Ошибка: npx не установлен. Установите Node.js и npm."
    exit 1
fi

# Переходим в директорию frontend
cd "$(dirname "$0")"

echo "\n1. Проверка устаревших зависимостей с помощью npm-check:\n"

# Устанавливаем npm-check, если он не установлен
if ! npx npm-check --version &> /dev/null; then
    echo "Устанавливаем npm-check..."
    npm install -g npm-check
fi

# Запускаем npm-check для проверки устаревших зависимостей
npx npm-check -u

echo "\n2. Проверка неиспользуемых зависимостей с помощью depcheck:\n"

# Устанавливаем depcheck, если он не установлен
if ! npx depcheck --version &> /dev/null; then
    echo "Устанавливаем depcheck..."
    npm install -g depcheck
fi

# Запускаем depcheck для проверки неиспользуемых зависимостей
npx depcheck

echo "\n3. Проверка проблем с зависимостями с помощью npm audit:\n"

# Запускаем npm audit для проверки уязвимостей
npm audit

echo "\n=================================================="
echo "Проверка зависимостей завершена."
echo "Для исправления проблем с зависимостями выполните рекомендуемые команды."