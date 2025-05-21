# Настройка и запуск Backend OnboardPro

## Предварительные требования

- Docker
- Docker Compose

## Структура файлов

Все необходимые файлы для запуска backend находятся в корневой директории проекта:

- `docker-compose.yml` - настройки Docker Compose
- `Dockerfile.backend` - образ для бэкенда
- `.env.dev` - переменные окружения
- `entrypoint.sh` и `wait-for-db.sh` - вспомогательные скрипты

## Запуск проекта

### 1. Первый запуск

```bash
# Собираем и запускаем контейнеры
docker-compose up --build
```

Это выполнит следующие действия:

- Соберет образ бэкенда согласно Dockerfile.backend
- Запустит PostgreSQL и Django
- Применит миграции через wait-for-db.sh
- Запустит сервер Django на порту 8000

### 2. Последующие запуски

```bash
docker-compose up
```

### 3. Запуск в фоновом режиме

```bash
docker-compose up -d
```

## Управление проектом

### Создание миграций

```bash
docker-compose exec backend python manage.py makemigrations
```

### Применение миграций вручную

```bash
docker-compose exec backend python manage.py migrate
```

### Создание суперпользователя

```bash
docker-compose exec backend python manage.py createsuperuser
```

## Доступ к API

### Проверка работоспособности API

```bash
curl http://localhost:8000/api/health/
```

Ожидаемый ответ:
```json
{"status":"ok"}
```

### Документация API

Документация доступна по следующим URL:

- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- Схема OpenAPI: http://localhost:8000/api/schema/

## Настройка окружения

Файл `.env.dev` содержит основные параметры для разработки:

```
DEBUG=1
SECRET_KEY=django-insecure-development-key-change-in-production
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,[::1]

# Настройки базы данных
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=onboardpro
DATABASE_URL=postgres://postgres:postgres@db:5432/onboardpro

# Настройки для контейнера postgres
POSTGRES_HOST=db
POSTGRES_PORT=5432
```

Обратите внимание, что:
- Внутри контейнера PostgreSQL использует стандартный порт 5432
- Снаружи контейнера порт мэппится на 5434 для избегания конфликтов
- DJANGO_ALLOWED_HOSTS должен содержать список хостов через запятую

## Структура проекта Django

Приложение Django разделено на модули:

- `config` - основные настройки Django
- `core` - базовые компоненты и API health endpoint
- `users` - управление пользователями
- `onboarding` - основная функциональность онбординга

Все изменения в коде немедленно отражаются на работающем сервере благодаря тому, что директория `backend` монтируется в контейнер через volume.

### Применение миграций

```bash
docker-compose exec backend python manage.py migrate
```

### Создание суперпользователя

```bash
docker-compose exec backend python manage.py createsuperuser
```

### Запуск интерактивной оболочки Django

```bash
docker-compose exec backend python manage.py shell
```

### Просмотр логов

```bash
docker-compose logs -f backend
```

## Доступ к API

После запуска проекта, следующие URL будут доступны:

- `http://localhost:8000/admin/` - панель администратора Django
- `http://localhost:8000/api/health/` - проверка работоспособности API
- `http://localhost:8000/api/docs/` - Swagger UI для API
- `http://localhost:8000/api/redoc/` - ReDoc UI для API

## Подключение к базе данных

PostgreSQL запускается на порту 5432. Вы можете подключиться к базе данных, используя параметры из файла .env.dev:

- Хост: localhost
- Порт: 5432
- База данных: onboardpro (согласно POSTGRES_DB в .env.dev)
- Пользователь: postgres (согласно POSTGRES_USER в .env.dev)
- Пароль: postgres (согласно POSTGRES_PASSWORD в .env.dev)

## Остановка проекта

```bash
docker-compose down
```

## Полная очистка (включая тома базы данных)

```bash
docker-compose down -v
```
