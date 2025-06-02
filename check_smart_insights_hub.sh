#!/bin/bash
# Скрипт для пошаговой проверки Smart Insights Hub

echo "=== Smart Insights Hub - Проверка и отладка ==="

# Директория проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"

# 1. Проверяем наличие необходимых компонентов
echo "1. Проверка наличия необходимых компонентов:"

# Проверка наличия файла aiInsights.ts
API_FILE="$PROJECT_DIR/frontend/src/services/aiInsights.ts"
if [ -f "$API_FILE" ]; then
    echo "   ✅ Файл сервисов AI Insights найден"
    
    # Проверка правильных импортов
    if grep -q "import api from \"../api/client\";" "$API_FILE"; then
        echo "   ✅ Импорт API клиента корректен"
    else
        echo "   ❌ Неправильный импорт клиента API"
    fi
    
    # Проверка правильного определения URL
    if grep -q "const AI_URL = \`/v2/ai\`;" "$API_FILE"; then
        echo "   ✅ URL для v2 API определен корректно"
    else
        echo "   ❌ Проблемы с определением URL для v2 API"
    fi
else
    echo "   ❌ Файл aiInsights.ts не найден"
fi

# Проверка наличия компонента SmartInsightsHub
HUB_FILE="$PROJECT_DIR/frontend/src/pages/admin/SmartInsightsHub.tsx"
if [ -f "$HUB_FILE" ]; then
    echo "   ✅ Компонент Smart Insights Hub найден"
else
    echo "   ❌ Компонент Smart Insights Hub не найден"
fi

# 2. Проверяем работу фронтенда
echo
echo "2. Проверка работы фронтенда:"

# Проверяем запущен ли контейнер
if docker ps | grep -q "onboardpro-frontend"; then
    echo "   ✅ Контейнер frontend запущен"
    
    # Проверяем веб-сервер
    if curl -s -I http://localhost:5173 | grep -q "200 OK"; then
        echo "   ✅ Веб-сервер frontend отвечает"
    else
        echo "   ❌ Веб-сервер frontend не отвечает"
    fi
else
    echo "   ❌ Контейнер frontend не запущен"
fi

# 3. Проверяем работу бэкенда
echo
echo "3. Проверка работы бэкенда:"

# Проверяем запущен ли контейнер
if docker ps | grep -q "onboardpro-backend"; then
    echo "   ✅ Контейнер backend запущен"
    
    # Проверяем API эндпоинт
    if docker exec onboardpro-frontend curl -s -o /dev/null -w "%{http_code}" http://onboardpro-backend:8000/api/health/ | grep -q "200"; then
        echo "   ✅ API бэкенда отвечает"
    else
        echo "   ❌ API бэкенда не отвечает"
    fi
    
    # Проверяем API v2
    V2_STATUS=$(docker exec onboardpro-frontend curl -s -o /dev/null -w "%{http_code}" http://onboardpro-backend:8000/api/v2/ai/insights/stats/)
    if [ "$V2_STATUS" == "401" ]; then
        echo "   ✅ API v2 отвечает (требуется авторизация)"
    else
        echo "   ❓ API v2 вернул код $V2_STATUS"
    fi
else
    echo "   ❌ Контейнер backend не запущен"
fi

# 4. Проверяем авторизацию
echo
echo "4. Проверка авторизации:"

# Проверяем наличие интерцепторов в клиенте
CLIENT_FILE="$PROJECT_DIR/frontend/src/api/client.ts"
if [ -f "$CLIENT_FILE" ]; then
    if grep -q "interceptors.request.use" "$CLIENT_FILE" && grep -q "Authorization" "$CLIENT_FILE"; then
        echo "   ✅ Интерцептор авторизации настроен"
    else
        echo "   ❌ Проблемы с интерцептором авторизации"
    fi
else
    echo "   ❌ Файл API клиента не найден"
fi

# 5. Тестирование API v2 с авторизацией
echo
echo "5. Комплексная проверка запросов к API v2:"

echo "   Получение тестового JWT-токена..."
TEST_TOKEN=$(docker exec onboardpro-frontend curl -s -X POST http://onboardpro-backend:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@onboardpro.com","password":"admin123"}' | grep -o '"access":"[^"]*' | cut -d'"' -f4)

if [ -n "$TEST_TOKEN" ]; then
    echo "   ✅ Токен получен успешно"
    
    echo "   Тестовый запрос к API v2 с токеном..."
    V2_RESPONSE=$(docker exec onboardpro-frontend curl -s -X GET http://onboardpro-backend:8000/api/v2/ai/insights/stats/ \
      -H "Authorization: Bearer $TEST_TOKEN")
    
    echo "   Результат: $V2_RESPONSE"
    
    if echo "$V2_RESPONSE" | grep -q "total_insights"; then
        echo "   ✅ API v2 успешно отвечает на авторизованный запрос"
    else
        echo "   ❌ Проблема с обработкой авторизованного запроса к API v2"
    fi
else
    echo "   ❌ Не удалось получить тестовый токен"
fi

echo
echo "=== Результаты проверки ==="
echo "Если есть проблемы с авторизацией или API v2, обратитесь к документации:"
echo "- /Users/magna_mentes/Desktop/Projects/OnboardPro/OnboardPro/KnowledgeStorage/fixing_api_v2_auth.md"
echo "- /Users/magna_mentes/Desktop/Projects/OnboardPro/OnboardPro/KnowledgeStorage/api_url_configuration.md"

echo
echo "Для детальной диагностики выполните:"
echo "cd /Users/magna_mentes/Desktop/Projects/OnboardPro/OnboardPro && ./diagnose_api_v2.sh"

echo
echo "=== Завершено ==="
