#!/bin/zsh

# Скрипт для настройки переменных окружения API
# Использование: ./setup_env.sh [local|docker|prod]

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Проверяем аргументы командной строки
if [ $# -ne 1 ]; then
    echo "Использование: ./setup_env.sh [local|docker|prod]"
    exit 1
fi

MODE=$1

case $MODE in
    local)
        echo "⚙️ Настройка переменных окружения для локальной разработки..."
        cp "$FRONTEND_DIR/.env.local" "$FRONTEND_DIR/.env"
        ;;
    docker)
        echo "🐳 Настройка переменных окружения для разработки в Docker..."
        cp "$FRONTEND_DIR/.env.development" "$FRONTEND_DIR/.env"
        ;;
    prod)
        echo "🚀 Настройка переменных окружения для продакшн среды..."
        cp "$FRONTEND_DIR/.env.production" "$FRONTEND_DIR/.env"
        ;;
    *)
        echo "❌ Неверный режим. Используйте 'local', 'docker' или 'prod'"
        exit 1
        ;;
esac

echo "✅ Готово! Переменные окружения настроены для режима: $MODE"
echo "👉 Не забудьте перезапустить приложение, чтобы изменения вступили в силу"
