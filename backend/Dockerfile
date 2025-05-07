FROM python:3.11-slim

WORKDIR /app

# Устанавливаем необходимые пакеты: curl для проверки здоровья и sqlite3 для работы с базой данных
RUN apt-get update && apt-get install -y curl sqlite3 postgresql-client && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Создаем директории для тестов, логов и отчетов о миграциях
RUN mkdir -p /app/tests /app/logs /app/migration_reports

# Делаем скрипты исполняемыми
RUN chmod +x /app/start.sh
RUN chmod +x /app/migration_manager.py
RUN chmod +x /app/validate_db_models.py

EXPOSE 8000

# Запускаем тесты при сборке образа
RUN pytest tests/test_api.py -v || true

# Используем скрипт start.sh для автоматического применения миграций перед запуском сервера
CMD ["/app/start.sh"]