#!/bin/bash
set -e

# Создаем миграции, если нужно
python backend/manage.py makemigrations ai_insights onboarding users

# Применение миграций
python backend/manage.py migrate

# Создание суперпользователя без интерактивности
python backend/manage.py createsuperuser --noinput \
  --username "$DJANGO_SUPERUSER_USERNAME" \
  --email "$DJANGO_SUPERUSER_EMAIL" || echo "Superuser already exists"
# Установка пароля суперпользователя
echo "from django.contrib.auth import get_user_model; User = get_user_model(); \
user = User.objects.get(username='$DJANGO_SUPERUSER_USERNAME'); \
user.set_password('$DJANGO_SUPERUSER_PASSWORD'); user.save()" \
| python backend/manage.py shell

# Вывод информации для отладки
echo "=== Диагностика перед запуском сервера ==="
echo "Переменные окружения:"
echo "DEBUG = $DEBUG"
echo "DJANGO_ALLOWED_HOSTS = $DJANGO_ALLOWED_HOSTS"
echo "POSTGRES_HOST = $POSTGRES_HOST"
echo "DATABASE_URL = $DATABASE_URL"
echo "=== Проверка сетевого соединения ==="
# Устанавливаем ping для диагностики, если его нет
apt-get update && apt-get install -y iputils-ping || echo "Не удалось установить ping"
# Пробуем подключиться к контейнеру фронтенда
ping -c 2 -W 1 onboardpro-frontend || echo "Не удалось подключиться к onboardpro-frontend"
# Проверяем DNS
cat /etc/hosts

# Запуск сервера с детальным логированием запросов
echo "=== Запуск Django сервера с детальным логированием ==="
exec python backend/manage.py runserver 0.0.0.0:8000 --verbosity 2
