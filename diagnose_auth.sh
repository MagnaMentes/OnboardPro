#!/bin/bash
# Скрипт для диагностики проблем авторизации и API Smart Insights Hub

echo "=== Диагностика проблем с авторизацией и API Smart Insights Hub ==="

# Директория проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Копирование исправленных файлов для решения проблемы аутентификации API v2
echo "1. Копирование исправленных файлов..."
cp "$FRONTEND_DIR/src/services/aiInsights.fixed.ts" "$FRONTEND_DIR/src/services/aiInsights.ts" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Файл aiInsights.ts успешно обновлен"
else
    echo "   ❌ Ошибка при обновлении файла aiInsights.ts"
fi

# Проверяем доступность backend контейнера из frontend
echo
echo "2. Проверяем сетевую доступность бэкенда из фронтенда..."
docker exec onboardpro-frontend sh -c "apt-get update && apt-get install -y curl iputils-ping" > /dev/null 2>&1
docker exec onboardpro-frontend sh -c "ping -c 1 onboardpro-backend" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Бэкенд доступен из фронтенда"
else
    echo "   ❌ Бэкенд НЕ доступен из фронтенда"
fi

# Проверяем API endpoint v2 напрямую
echo
echo "3. Проверяем API v2 напрямую..."
V2_RESULT=$(docker exec onboardpro-frontend sh -c "curl -s -o /dev/null -w '%{http_code}' http://onboardpro-backend:8000/api/v2/ai/insights/stats/")
if [ "$V2_RESULT" == "401" ]; then
    echo "   ✅ API v2 отвечает (401 Unauthorized - требуется токен)"
elif [ "$V2_RESULT" == "404" ]; then
    echo "   ❌ API v2 не найден (404 Not Found)"
else
    echo "   ❓ API v2 вернул код: $V2_RESULT"
fi

# Проверяем доступность frontend из локальной машины
echo
echo "4. Проверяем доступность фронтенда..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/ 2>/dev/null)
if [ "$FRONTEND_STATUS" == "200" ]; then
    echo "   ✅ Фронтенд доступен (200 OK)"
else
    echo "   ❌ Фронтенд недоступен или вернул код: $FRONTEND_STATUS"
fi

# Выводим конфигурацию прокси из frontend
echo
echo "5. Выводим конфигурацию Vite proxy..."
docker exec onboardpro-frontend sh -c "cat /app/frontend/vite.config.ts" | grep -A 10 "proxy" || echo "   ❌ Proxy конфигурация не найдена"

echo
echo "=== Перезапускаем фронтенд для применения изменений ==="
"$PROJECT_DIR/restart_frontend.sh" &

echo
echo "=== Рекомендации ==="
echo "1. Убедитесь, что API v2 доступен на бэкенде (проверьте логи бэкенда)"
echo "2. Проверьте, что токен JWT корректно передается в заголовке Authorization"
echo "3. Очистите кеш браузера и перезагрузите страницу"
echo
echo "=== Готово ==="