#!/bin/bash

# Скрипт для запуска нагрузочного тестирования OnboardPro

echo "=== Запуск нагрузочного тестирования OnboardPro ==="

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "Ошибка: Docker не установлен. Пожалуйста, установите Docker и повторите попытку."
    exit 1
fi

# Проверка наличия Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "Ошибка: Docker Compose не установлен. Пожалуйста, установите Docker Compose и повторите попытку."
    exit 1
fi

# Остановка и удаление существующих контейнеров
echo "Остановка существующих контейнеров..."
docker-compose down 2>/dev/null

# Запуск контейнеров для нагрузочного тестирования
echo "Запуск контейнеров для нагрузочного тестирования..."
docker-compose -f docker-compose.loadtest.yml up -d

# Проверка, что все контейнеры запущены
echo "Проверка статуса контейнеров..."
sleep 5
CONTAINERS_RUNNING=$(docker-compose -f docker-compose.loadtest.yml ps -q | wc -l)
if [ "$CONTAINERS_RUNNING" -lt 3 ]; then
    echo "Ошибка: Не все контейнеры запущены. Проверьте логи с помощью 'docker-compose -f docker-compose.loadtest.yml logs'"
    exit 1
fi

echo "Все контейнеры успешно запущены!"

# Информация о доступе к Locust
echo ""
echo "=== Инструкции по нагрузочному тестированию ==="
echo "1. Откройте в браузере адрес: http://localhost:8089"
echo "2. Укажите количество пользователей (рекомендуется: 10-20)"
echo "3. Укажите скорость появления пользователей (рекомендуется: 1-2)"
echo "4. Нажмите кнопку 'Start swarming'"
echo "5. После завершения тестирования скачайте отчет в формате JSON"
echo "6. Для анализа результатов используйте скрипт: python backend/analyze_load_test.py <путь_к_json_файлу>"
echo ""
echo "Для мониторинга ресурсов контейнеров используйте команду: docker stats"
echo "Для остановки тестирования используйте команду: docker-compose -f docker-compose.loadtest.yml down"
echo ""
echo "Подробная информация о нагрузочном тестировании доступна в файле: load_testing_guide.md"