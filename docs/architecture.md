# Архитектура проекта OnboardPro

## Общий обзор

OnboardPro - это платформа для автоматизации процесса онбординга новых сотрудников. Проект построен на микросервисной архитектуре с использованием современных технологий.

## Технический стек

### Backend

- Python 3.11
- Django 5.2
- Django REST Framework
- PostgreSQL 15
- Docker & Docker Compose

### Frontend

- HTML5
- TailwindCSS
- JavaScript

## Структура проекта

```
onboardpro/
├── backend/              # Django backend
│   ├── core/            # Основное приложение
│   ├── onboardpro/      # Настройки проекта
│   └── manage.py        # Django CLI
├── frontend/            # Frontend с TailwindCSS
├── docs/               # Документация
└── docker-compose.yml  # Docker композиция
```

## Модели данных

### User

Расширенная модель пользователя Django с дополнительными полями:

- role: Роль пользователя (employee, manager, hr)
- department: Отдел пользователя
- Стандартные поля Django User (username, email, password, etc.)

## База данных

- PostgreSQL используется как основная база данных
- Подключение настроено через Docker Compose
- Миграции управляются через Django ORM

## API

- RESTful архитектура
- JWT аутентификация
- Документация доступна в `/docs/api.md`
- Health check endpoint для мониторинга

## Безопасность

- Кастомная модель пользователя с ролями
- JWT аутентификация
- Rate limiting
- Защищенные эндпоинты API

## Масштабирование

- Контейнеризация через Docker
- Легкое горизонтальное масштабирование
- Stateless архитектура

## Мониторинг

- Health check endpoints
- Логирование действий пользователей
- Планируется интеграция с Prometheus и Grafana
