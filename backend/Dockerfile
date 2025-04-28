FROM python:3.11-slim

WORKDIR /app

# Устанавливаем необходимые пакеты: curl для проверки здоровья и sqlite3 для работы с базой данных
RUN apt-get update && apt-get install -y curl sqlite3 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Создаем директорию для тестов
RUN mkdir -p /app/tests

# Делаем скрипты исполняемыми
RUN chmod +x /app/start.sh

EXPOSE 8000

# Запускаем тесты при сборке образа
RUN pytest tests/test_api.py -v || true

# Используем скрипт start.sh для автоматического применения миграций перед запуском сервера
CMD ["/app/start.sh"]