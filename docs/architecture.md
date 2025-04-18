# Архитектура проекта OnboardPro

## Общий обзор

OnboardPro - это платформа для автоматизации процесса онбординга новых сотрудников. Проект построен на микросервисной архитектуре с использованием современных технологий.

## Технический стек

### Backend

- Python 3.11
- Django 4.2+
- Django REST Framework
- PostgreSQL 15
- Docker & Docker Compose

### Frontend (планируется)

- React
- TailwindCSS
- TypeScript

## Структура проекта

```
onboardpro/
├── backend/              # Django backend
│   ├── core/            # Основное приложение
│   ├── onboardpro/      # Настройки проекта
│   └── manage.py        # Django CLI
├── frontend/            # React frontend (в разработке)
├── docs/               # Документация
└── docker-compose.yml  # Docker композиция
```

## База данных

- PostgreSQL используется как основная база данных
- Подключение настроено через Docker Compose
- Миграции управляются через Django ORM

## API

- RESTful архитектура
- Документация доступна в `/docs/api.md`
- Health check endpoint для мониторинга

## Безопасность

- CORS настройки (планируется)
- JWT аутентификация (планируется)
- Rate limiting (планируется)

## Масштабирование

- Контейнеризация через Docker
- Легкое горизонтальное масштабирование
- Stateless архитектура

## Мониторинг (планируется)

- Prometheus для метрик
- Grafana для визуализации
- Sentry для отслеживания ошибок
