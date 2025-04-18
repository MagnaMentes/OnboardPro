# OnboardPro

Система управления процессом онбординга сотрудников, построенная на Django и React.

## Возможности

- 🔐 Аутентификация и авторизация пользователей
- 👥 Управление ролями (Сотрудник, Менеджер, HR)
- 📋 Создание и управление планами онбординга
- ✅ Отслеживание задач и прогресса
- 📊 Панель управления с аналитикой
- 📱 Адаптивный дизайн

## Технологический стек

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL
- JWT Аутентификация
- Celery
- Redis

### Frontend
- React 18
- Material-UI
- Redux Toolkit
- React Router
- Axios
- Tailwind CSS

## Установка и запуск

### Предварительные требования

- Python 3.8+
- Node.js 16+
- PostgreSQL
- Redis

### Backend

1. Создайте виртуальное окружение:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Установите зависимости:
```bash
cd backend
pip install -r requirements.txt
```

3. Настройте переменные окружения:
```bash
cp .env.example .env
# Отредактируйте .env файл
```

4. Примените миграции:
```bash
python manage.py migrate
```

5. Запустите сервер разработки:
```bash
python manage.py runserver
```

### Frontend

1. Установите зависимости:
```bash
cd frontend
npm install
```

2. Скомпилируйте CSS:
```bash
npm run build
```

3. Запустите сервер разработки:
```bash
npm start
```

## Структура проекта

```
onboardpro/
├── backend/              # Django backend
│   ├── onboardpro/      # Основная конфигурация
│   ├── users/           # Модуль пользователей
│   ├── onboarding/      # Планы онбординга
│   ├── core/            # Основной функционал
│   └── api/             # API эндпоинты
├── frontend/            # React frontend
│   ├── src/             # Исходный код
│   ├── dist/            # Скомпилированные файлы
│   └── public/          # Публичные файлы
└── docs/                # Документация
```

## API Документация

API документация доступна в [docs/api.md](docs/api.md)

## Архитектура

Подробное описание архитектуры доступно в [docs/architecture.md](docs/architecture.md)

## Разработка

### Создание миграций

```bash
python manage.py makemigrations
```

### Запуск тестов

```bash
python manage.py test
```

### Линтинг

```bash
# Backend
flake8
black .

# Frontend
npm run lint
```

## Лицензия

MIT
