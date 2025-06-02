#!/bin/sh
# Запускаем Vite с доступом извне контейнера и расширенной конфигурацией для горячей перезагрузки
cd /app/frontend
echo "Устанавливаем зависимости..."
npm install --no-package-lock --legacy-peer-deps

# Ждем, чтобы убедиться, что бэкенд запущен
echo "Ждем 5 секунд для запуска других сервисов..."
sleep 5

# Время на отладку
echo "=== Диагностика среды ==="
echo "Переменные окружения:"
echo "DOCKER_ENV=$DOCKER_ENV"
echo "VITE_DOCKER_ENV=$VITE_DOCKER_ENV"
echo "VITE_API_URL=$VITE_API_URL"
echo "VITE_API_PREFIX=$VITE_API_PREFIX"

# Проверка сети
echo "=== Проверка сетевых подключений ==="
# Установка инструментов диагностики
apt-get update && apt-get install -y iputils-ping curl net-tools || echo "Невозможно установить инструменты диагностики"

# Проверка доступности бэкенда
echo "Проверка DNS для бэкенда:"
getent hosts onboardpro-backend || echo "DNS запись для onboardpro-backend не найдена"

echo "Проверка подключения к бэкенду:"
ping -c 2 onboardpro-backend || echo "Не удалось подключиться к onboardpro-backend по ICMP"

echo "Проверка HTTP-доступности бэкенда:"
curl -I http://onboardpro-backend:8000/api/health/ || echo "API бэкенда недоступно по HTTP"

echo "=== Запуск Vite ==="
# Переходим в директорию с исходным кодом и запускаем сервер
npm run dev -- --host 0.0.0.0
