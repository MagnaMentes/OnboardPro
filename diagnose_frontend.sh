#!/bin/bash
# Скрипт для диагностики проблем с фронтендом Smart Feedback Loop

echo "=== Диагностика проблем фронтенда Smart Feedback Loop ==="

# Директория проекта
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
FRONTEND_DIR="$PROJECT_DIR/frontend"

# Проверяем запущен ли фронтенд-контейнер
echo "1. Проверка статуса фронтенд-контейнера..."
if docker ps | grep -q "onboardpro-frontend"; then
    echo "   ✅ Фронтенд-контейнер запущен"
    CONTAINER_RUNNING=true
else
    echo "   ❌ Фронтенд-контейнер не запущен"
    CONTAINER_RUNNING=false
fi

# Проверяем версии пакетов с известными проблемами
echo
echo "2. Проверка версий пакетов..."
if [ "$CONTAINER_RUNNING" = true ]; then
    echo "   Версия React:"
    docker exec onboardpro-frontend npm list react | grep react
    
    echo "   Версия React Icons:"
    docker exec onboardpro-frontend npm list react-icons | grep react-icons
    
    echo "   Версия Chakra UI:"
    docker exec onboardpro-frontend npm list @chakra-ui/react | grep @chakra-ui/react
else
    echo "   ❓ Невозможно проверить версии пакетов - контейнер не запущен"
fi

# Проверяем наличие ошибок компиляции
echo
echo "3. Проверка ошибок компиляции..."
if [ "$CONTAINER_RUNNING" = true ]; then
    LOGS=$(docker logs --tail=50 onboardpro-frontend 2>&1)
    
    if echo "$LOGS" | grep -q "ERROR"; then
        echo "   ❌ Найдены ошибки компиляции:"
        echo "$LOGS" | grep -A 3 -B 3 "ERROR"
    else
        echo "   ✅ Ошибок компиляции не обнаружено"
    fi
else
    echo "   ❓ Невозможно проверить логи - контейнер не запущен"
fi

# Проверяем сетевую доступность
echo
echo "4. Проверка сетевой доступности..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/ > /dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/)
    echo "   ✅ Фронтенд доступен, HTTP код: $HTTP_CODE"
else
    echo "   ❌ Не удалось подключиться к фронтенду на порту 5173"
fi

# Проверяем наличие исправлений в файле StepFeedbackCard.tsx
echo
echo "5. Проверка исправлений в StepFeedbackCard.tsx..."
if grep -q "SafeIcon" "$FRONTEND_DIR/src/components/feedback/StepFeedbackCard.tsx" 2>/dev/null; then
    echo "   ✅ Исправления в StepFeedbackCard.tsx найдены"
else
    echo "   ❌ Исправления в StepFeedbackCard.tsx не найдены"
fi

# Предлагаем решения
echo
echo "=== Рекомендации ==="
echo "1. Если контейнер не запущен, выполните: docker-compose up -d frontend"
echo "2. Для очистки кэша и перезапуска фронтенда: ./restart_frontend.sh"
echo "3. Для очистки кэша браузера следуйте инструкциям: ./clear_browser_cache.sh"
echo "4. Если все проблемы сохраняются, проверьте документацию: frontend/docs/fix_feedback_page_errors.md"
echo
echo "=== Готово ==="
