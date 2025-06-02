#!/bin/bash
# Скрипт для диагностики проблем с API v2 и аутентификацией

echo "=== Диагностика проблем с API v2 и аутентификацией ==="

# Директория проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Проверяем запущены ли контейнеры Docker
echo "1. Проверка статуса контейнеров Docker:"
if docker ps | grep -q "onboardpro-frontend"; then
    echo "   ✅ Контейнер frontend запущен"
    FRONTEND_RUNNING=true
else
    echo "   ❌ Контейнер frontend не запущен"
    FRONTEND_RUNNING=false
fi

if docker ps | grep -q "onboardpro-backend"; then
    echo "   ✅ Контейнер backend запущен"
    BACKEND_RUNNING=true
else
    echo "   ❌ Контейнер backend не запущен"
    BACKEND_RUNNING=false
fi

# Анализируем конфигурацию API URL
echo
echo "2. Анализ конфигурации API URL:"
echo "   - Файл .env:"
cat "$PROJECT_DIR/.env" 2>/dev/null | grep -E "API_|VITE_" || echo "   Файл .env не найден"

echo "   - Файл .env.development:"
cat "$FRONTEND_DIR/.env.development" 2>/dev/null | grep -E "API_|VITE_" || echo "   Файл .env.development не найден"

echo "   - Файл client.ts (первые строки):"
head -n 20 "$FRONTEND_DIR/src/api/client.ts" 2>/dev/null | grep -E "console.log|API_|baseURL" || echo "   Файл client.ts не найден"

# Проверяем аутентификацию и маршрутизацию API v2
echo
echo "3. Проверка API v2 и аутентификации:"

if [ "$FRONTEND_RUNNING" = true ] && [ "$BACKEND_RUNNING" = true ]; then
    # Проверяем наличие файла aiInsights.ts и его содержимое
    if [ -f "$FRONTEND_DIR/src/services/aiInsights.ts" ]; then
        echo "   - Файл aiInsights.ts найден"
        echo "   - Проверка импорта api клиента:"
        grep -A 3 "import api" "$FRONTEND_DIR/src/services/aiInsights.ts" || echo "     ❌ Импорт api не найден"
        echo "   - Проверка конфигурации URL:"
        grep -A 3 "const AI_URL" "$FRONTEND_DIR/src/services/aiInsights.ts" || echo "     ❌ Константа AI_URL не найдена"
    else
        echo "   ❌ Файл aiInsights.ts не найден"
    fi

    # Проверяем доступность API v2
    echo "   - Тест доступности API v2:"
    if docker exec onboardpro-frontend curl -s -I "http://onboardpro-backend:8000/api/v2/ai/insights/stats/" | grep -q "401 Unauthorized"; then
        echo "     ✅ API v2 доступен (возвращает 401 Unauthorized - требуется токен)"
    elif docker exec onboardpro-frontend curl -s -I "http://onboardpro-backend:8000/api/v2/ai/insights/stats/" | grep -q "404 Not Found"; then
        echo "     ❌ API v2 недоступен (404 Not Found) - проверьте бэкенд"
    else
        echo "     ❓ Неожиданный ответ от API v2"
        docker exec onboardpro-frontend curl -s -I "http://onboardpro-backend:8000/api/v2/ai/insights/stats/"
    fi
    
    # Проверяем возможность авторизации
    echo "   - Тест авторизации API:"
    TOKEN_RESULT=$(docker exec onboardpro-frontend curl -s -X POST "http://onboardpro-backend:8000/api/auth/test-token/" -H "Content-Type: application/json" -d '{"token": "test"}')
    echo "     Результат: $TOKEN_RESULT"
else
    echo "   ❌ Невозможно проверить API - контейнеры не запущены"
fi

# Проверка логов
echo
echo "4. Проверка логов на ошибки аутентификации:"
if [ "$BACKEND_RUNNING" = true ]; then
    echo "   - Логи бэкенда:"
    docker logs --tail 50 onboardpro-backend | grep -E "auth|token|401|unauthorized" | tail -n 5
else
    echo "   ❌ Невозможно проверить логи бэкенда - контейнер не запущен"
fi

echo
echo "5. Дополнительные действия:"
echo "   [1] Перезапустить фронтенд"
echo "   [2] Очистить кэш браузера"
echo "   [3] Проверить все API эндпоинты"
echo "   [4] Выход"

read -p "Выберите действие (1-4): " action

case $action in
    1)
        echo "Перезапуск фронтенда..."
        "$PROJECT_DIR/restart_frontend.sh"
        ;;
    2)
        echo "Инструкции по очистке кэша браузера:"
        "$PROJECT_DIR/clear_browser_cache.sh"
        ;;
    3)
        echo "Проверка API эндпоинтов:"
        if [ "$FRONTEND_RUNNING" = true ] && [ "$BACKEND_RUNNING" = true ]; then
            endpoints=(
                "/api/v2/ai/insights/stats/"
                "/api/v2/ai/recommendations/stats/"
                "/api/v2/ai/insights/"
                "/api/v2/ai/recommendations/"
                "/api/v2/ai/tags/"
            )
            for endpoint in "${endpoints[@]}"; do
                status=$(docker exec onboardpro-frontend curl -s -o /dev/null -w "%{http_code}" "http://onboardpro-backend:8000$endpoint")
                echo "   $endpoint: $status"
            done
        else
            echo "   ❌ Невозможно проверить API - контейнеры не запущены"
        fi
        ;;
    *)
        echo "Выход"
        ;;
esac

echo
echo "=== Готово ==="
