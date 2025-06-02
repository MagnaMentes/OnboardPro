#!/bin/bash
# Скрипт для перезапуска фронтенда с очисткой кэша и логированием

echo "=== Перезапуск фронтенд-контейнера с очисткой кэша ==="

# Останавливаем только фронтенд-контейнер
echo "Останавливаем фронтенд-контейнер..."
docker-compose stop frontend

# Очищаем node_modules и кэши
echo "Очищаем кэши и node_modules..."
# Проверяем, запущен ли контейнер перед выполнением команды exec
if docker ps | grep -q "onboardpro-frontend"; then
    docker exec onboardpro-frontend sh -c "rm -rf /app/frontend/node_modules/.vite /app/frontend/node_modules/.cache"
else
    echo "Контейнер не запущен, очистка будет выполнена после старта"
fi

# Перезапускаем фронтенд
echo "Запускаем фронтенд-контейнер..."
docker-compose up -d frontend

# Показываем логи для отслеживания запуска
echo "Выводим логи фронтенд-контейнера:"
docker-compose logs -f frontend