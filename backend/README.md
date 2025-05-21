# OnboardPro Backend

Backend-сервис для платформы онбординга сотрудников OnboardPro, разработанный на Django 5 с Django REST Framework.

## Технологии

- Django 5.x
- Django REST Framework
- PostgreSQL
- Docker
- Swagger/OpenAPI (drf-spectacular)

## Быстрый старт

### Запуск проекта

```bash
# Сборка и запуск
docker-compose up --build

# Запуск существующих контейнеров
docker-compose up
```

### Основные команды

```bash
# Создать миграции
docker-compose exec backend python manage.py makemigrations

# Применить миграции
docker-compose exec backend python manage.py migrate

# Создать суперпользователя
docker-compose exec backend python manage.py createsuperuser
```

## Доступные URL

- Admin: [http://localhost:8000/admin/](http://localhost:8000/admin/)
- API Health Check: [http://localhost:8000/api/health/](http://localhost:8000/api/health/)
- API Documentation: [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
- ReDoc: [http://localhost:8000/api/redoc/](http://localhost:8000/api/redoc/)

## Структура проекта

```
backend/
├── config/     # Настройки и маршруты
├── core/       # Общие классы, базовые модели
├── users/      # Пользователи, роли, авторизация
└── onboarding/ # Модуль онбординга
```

## API Endpoints

### Health Check

- **URL**: `/api/health/`
- **Метод**: GET
- **Ответ**: `{"status": "ok"}`
- **Назначение**: Проверка работоспособности API

## Настройки среды

Настройки среды хранятся в файле `.env.dev` в корне проекта.

### Порты

- **Django**: 8000
- **PostgreSQL (внешний)**: 5434
- **PostgreSQL (внутренний)**: 5432

## Docker конфигурация

Проект настроен для работы с Docker и Docker Compose:

- **Dockerfile.backend**: Образ бэкенда
- **docker-compose.yml**: Настройки для развертывания
- **entrypoint.sh**: Скрипт инициализации
- **wait-for-db.sh**: Скрипт ожидания базы данных

## База данных

- **Тип**: PostgreSQL 14
- **Имя базы данных**: onboardpro
- **Пользователь**: postgres
- **Пароль**: postgres (для разработки)

## Документация

Дополнительная документация доступна в каталоге KnowledgeStorage:

- `/KnowledgeStorage/project_structure.md`
- `/KnowledgeStorage/backend_setup.md`
└── onboarding_module/ # Модуль онбординга
```

## Разработка

Вся разработка происходит в Docker-контейнере. Изменения в коде отслеживаются и автоматически применяются благодаря volume монтированию локальной директории.

## Дополнительная документация

Более подробная документация доступна в каталоге `/KnowledgeStorage/`
