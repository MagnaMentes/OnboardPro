# OnboardPro

OnboardPro — платформа для автоматизации онбординга на Django, PostgreSQL, HTML, TailWind CSS, JS.

## Описание проекта

OnboardPro - это современное веб-приложение для автоматизации процесса онбординга новых сотрудников. Система помогает HR-специалистам и руководителям эффективно организовывать и контролировать процесс адаптации новых членов команды.

## Технологический стек

### Backend
- Python 3.13
- Django 5.2
- Django REST Framework
- PostgreSQL 15

### Frontend
- HTML5
- TailwindCSS
- JavaScript

## Структура проекта

```
OnboardPro/
├── backend/              # Django backend
│   ├── manage.py        # Django management script
│   ├── requirements.txt # Python dependencies
│   └── onboardpro/      # Main Django project
├── frontend/            # Frontend assets
├── docs/               # Project documentation
└── docker-compose.yml  # Docker configuration
```

## Установка и запуск

### Предварительные требования

- Python 3.13+
- Docker и Docker Compose
- Node.js и npm (для frontend)

### Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/MagnaMentes/OnboardPro.git
cd OnboardPro
```

2. Настройка backend:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Для Linux/Mac
# или
.\venv\Scripts\activate  # Для Windows
pip install -r requirements.txt
```

3. Запуск базы данных:
```bash
docker-compose up -d
```

4. Применение миграций:
```bash
cd backend
python manage.py migrate
```

### Конфигурация

Основные настройки находятся в:
- `backend/onboardpro/settings.py` - настройки Django
- `docker-compose.yml` - конфигурация PostgreSQL

### Разработка

- Backend работает на http://localhost:8000
- API документация доступна на http://localhost:8000/api/docs/
- База данных PostgreSQL доступна на порту 5433

## Лицензия

MIT License
