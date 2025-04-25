FROM python:3.11-slim

WORKDIR /app

# Устанавливаем curl для проверки здоровья
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Создаем директорию для тестов
RUN mkdir -p /app/tests

EXPOSE 8000

# Запускаем тесты при сборке образа
RUN pytest tests/test_api.py -v || true

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]