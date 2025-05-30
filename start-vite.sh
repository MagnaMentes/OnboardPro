#!/bin/sh
# Запускаем Vite с доступом извне контейнера и расширенной конфигурацией для горячей перезагрузки
cd /app/frontend
echo "Устанавливаем зависимости..."
npm install --no-package-lock --legacy-peer-deps

# Время на отладку
echo "Отображение текущих переменных окружения для диагностики..."
echo "DOCKER_ENV=$DOCKER_ENV"
echo "VITE_API_URL=$VITE_API_URL"
echo "VITE_API_PREFIX=$VITE_API_PREFIX"
echo "VITE_HMR_HOSTNAME=$VITE_HMR_HOSTNAME"

# Проверка сетевого соединения с контейнером бэкенда
echo "Проверка сетевой доступности бэкенда..."
ping -c 2 onboardpro-backend || echo "Не удалось подключиться к бэкенду по имени onboardpro-backend"

echo "Проверка HTTP доступности бэкенда..."
curl -I http://onboardpro-backend:8000/api/admin/ || echo "Не удалось выполнить HTTP запрос к бэкенду"

# Получаем информацию о сети Docker для отладки
echo "Информация о Docker сети:"
ip addr show
echo "DNS конфигурация:"
cat /etc/resolv.conf

# Запускаем сервис
echo "Запускаем Vite в режиме разработки..."
npm run dev -- --host 0.0.0.0 --strictPort
