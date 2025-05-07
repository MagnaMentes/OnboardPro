#!/bin/bash
# Скрипт для запуска API с предварительной проверкой миграций

set -e

echo "🔍 Проверка и исправление миграций БД..."
python migration_manager.py check

# Если есть проблемы с миграциями, пытаемся их исправить
if [ $? -ne 0 ]; then
    echo "⚠️ Обнаружены проблемы с миграциями. Пытаемся исправить..."
    python migration_manager.py fix
    
    echo "🔄 Применяем миграции..."
    python migration_manager.py upgrade
fi

echo "🔍 Валидация схемы БД..."
python validate_db_models.py

# Если схема БД не соответствует моделям, завершаем с ошибкой
if [ $? -ne 0 ]; then
    echo "❌ Ошибка: Схема БД не соответствует моделям. Пожалуйста, исправьте несоответствия."
    exit 1
fi

echo "✅ Схема БД валидна. Запускаем сервер..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload