#!/bin/bash

# Остановка и удаление контейнеров
echo "Останавливаем контейнеры..."
docker-compose down

# Пересборка и запуск frontend контейнера
echo "Пересобираем и запускаем frontend контейнер..."
docker-compose build frontend
docker-compose up -d frontend

# Ожидание запуска контейнера
echo "Ожидаем запуск контейнера..."
sleep 5

# Проверка логов
echo "Проверяем логи frontend контейнера:"
docker-compose logs frontend

echo "Процесс обновления завершен. Проверьте логи на наличие ошибок."
echo "Если все в порядке, приложение доступно по адресу: http://localhost:5173/"