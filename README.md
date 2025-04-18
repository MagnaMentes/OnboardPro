# OnboardPro

OnboardPro — платформа для автоматизации онбординга на Django, PostgreSQL, HTML, TailWind CSS, JS.

## Описание проекта

OnboardPro - это современное веб-приложение для автоматизации процесса онбординга новых сотрудников. Система помогает HR-специалистам и руководителям эффективно организовывать и контролировать процесс адаптации новых членов команды.

## Технологический стек

### Backend

- Python 3.11
- Django 5.2
- Django REST Framework
- PostgreSQL 15

### Frontend

- HTML5
- TailwindCSS 3.3
- JavaScript
- Node.js и npm

## Ключевые функции

- Кастомная модель пользователя с ролями (Employee, Manager, HR)
- REST API с JWT аутентификацией
- Управление отделами и ролями пользователей
- Health check endpoints для мониторинга

## Структура проекта

```
OnboardPro/
├── backend/                # Django backend
│   ├── core/              # Основное приложение
│   │   ├── models.py      # Модели данных
│   │   ├── views.py       # Представления
│   │   └── migrations/    # Миграции базы данных
│   ├── onboardpro/        # Настройки проекта
│   ├── manage.py          # Django management script
│   └── requirements.txt   # Python зависимости
├── frontend/              # Frontend assets
│   ├── src/              # Source files
│   │   ├── index.html    # Main HTML template
│   │   └── input.css     # TailwindCSS entry point
│   ├── package.json      # Node.js зависимости
│   └── tailwind.config.js # TailwindCSS конфигурация
├── docs/                 # Проектная документация
└── docker-compose.yml    # Docker конфигурация
```

## Установка и запуск

### Предварительные требования

- Docker и Docker Compose
- Node.js и npm (для frontend)

### Установка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/MagnaMentes/OnboardPro.git
cd OnboardPro
```

2. Запустите Docker контейнеры:

```bash
docker-compose up -d
```

3. Установите frontend зависимости и соберите статику:

```bash
cd frontend
npm install
npm run build
```

### Разработка

- Backend API доступен на http://localhost:8000
- API документация: http://localhost:8000/api/docs/
- База данных PostgreSQL: порт 5432
- Frontend: src/index.html

## Лицензия

MIT License
