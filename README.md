# 🚀 OnboardPro

![OnboardPro Logo](docs/images/logo.png)

[English](#overview) | [Русский](#обзор)

## Overview

OnboardPro is a modern web application designed to optimize the employee onboarding process. It provides tools for HR managers, department heads, and employees to manage tasks, provide feedback, and track progress.

## Features

- **Role-based access control**: HR, Manager, and Employee roles with appropriate permissions
- **Task management**: Create, assign, and track onboarding tasks
- **Feedback system**: Provide and receive feedback during the onboarding process
- **Responsive design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Built with React, Tailwind CSS, and Heroicons

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js (v16+) and npm
- Python 3.9+

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/magna_mentes/OnboardPro.git
   cd OnboardPro
   ```

2. Start the application:

   ```
   docker-compose up -d
   ```

3. Access the application at http://localhost:3000

4. Log in with one of the following credentials:
   - HR: test@onboardpro.com / test123
   - Manager: manager@onboardpro.com / test123
   - Employee: employee@onboardpro.com / test123

### Development

1. Install dependencies:

   ```
   cd frontend
   npm install
   ```

2. Start the development server:

   ```
   npm start
   ```

3. Run the setup validation script:
   ```
   ./validate_setup.sh
   ```

## Documentation

- [User Guide (English)](docs/user_guide_en.md)
- [User Guide (Russian)](docs/user_guide_ru.md)
- [Technical Documentation (English)](docs/technical_documentation.md)
- [Technical Documentation (Russian)](docs/technical_documentation_ru.md)
- [Architecture](docs/architecture.md)
- [Developer Log (English)](docs/developer_log.md)
- [Developer Log (Russian)](docs/developer_log_ru.md)

## Project Structure

```
OnboardPro/
├── backend/              # FastAPI backend
│   ├── app/              # Application code
│   ├── tests/            # Backend tests
│   └── onboardpro.db     # SQLite database
├── frontend/             # React frontend
│   ├── public/           # Static files
│   ├── src/              # Source code
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── context/      # React context
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Utility functions
│   └── package.json      # Dependencies
├── docs/                 # Documentation
├── docker-compose.yml    # Docker configuration
└── README.md             # This file
```

## License

© 2025 magna_mentes. All rights reserved.

## Support

For technical support, contact the development team at support@onboardpro.com

## ⚡️ Технологии

- 🏗 **Бэкенд**: FastAPI, SQLite, SQLAlchemy
- 🎨 **Фронтенд**: React, TailwindCSS с PostCSS 8, адаптивный дизайн
- 🔐 **Аутентификация**: JWT
- 🐳 **Контейнеризация**: Docker, docker-compose
- 🤖 **Интеграции**: Telegram, Google Calendar, Workable

## ✨ Возможности

- 👥 Аутентификация пользователей с ролями (employee, manager, hr)
- 🔒 Система ролей и разграничения доступа
- 📱 Современный адаптивный интерфейс
- 📋 Создание и управление планами онбординга
- ✅ Отслеживание прогресса выполнения задач
- 🎯 Приоритизация задач (высокий, средний, низкий)
- 📊 Фильтрация задач по статусу и приоритету
- 👀 Разные представления для сотрудников и менеджеров
- 📈 HR-дашборд с аналитикой и метриками
- 🔄 Интеграция с внешними сервисами
  - 📱 Уведомления через Telegram
  - 📅 Синхронизация с Google Calendar
  - 👥 Импорт сотрудников из Workable

## 🛠 Установка

### 🐳 Запуск через Docker

```bash
# Клонируем репозиторий
git clone https://github.com/MagnaMentes/OnboardPro.git
cd OnboardPro

# Создаем файл .env с необходимыми переменными
cp backend/.env.example backend/.env

# Запускаем контейнеры
docker-compose up -d
```

### 🔧 Локальная установка (для разработки)

#### Бэкенд

```bash
cd backend
python -m venv venv
source venv/bin/activate  # для Linux/macOS
# или
venv\Scripts\activate  # для Windows
pip install -r requirements.txt
```

📝 Создайте файл `.env` в директории backend:

```
DATABASE_URL=sqlite:///onboardpro.db
SECRET_KEY=your-secret-key
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
WORKABLE_API_KEY=your-workable-api-key
```

#### Фронтенд

```bash
cd frontend
npm install
npm run build
```

## 🚀 Запуск

### 🐳 Docker (рекомендуется)

```bash
docker-compose up -d
```

Приложение будет доступно:

- Фронтенд: http://localhost:3000
- API: http://localhost:8000
- Swagger UI: http://localhost:8000/docs

### 🔧 Локальный запуск (для разработки)

#### Бэкенд

```bash
cd backend
source venv/bin/activate  # для Linux/macOS
# или
venv\Scripts\activate  # для Windows
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

#### Фронтенд

```bash
cd frontend
npm run watch
```

## 📁 Структура проекта

```
.
├── 🐳 docker-compose.yml    # Docker конфигурация
├── 🔧 backend/             # FastAPI бэкенд
│   ├── Dockerfile        # Сборка бэкенд-контейнера
│   ├── main.py          # Основной API
│   ├── models.py        # Модели данных
│   ├── auth.py         # Аутентификация
│   ├── database.py     # Настройки БД
│   └── integrations.py # Внешние интеграции
├── 🎨 frontend/           # Фронтенд
│   ├── nginx/          # Nginx конфигурация
│   ├── src/           # Исходный код
│   │   ├── layouts/   # Шаблоны
│   │   └── input.css  # Стили
│   └── dist/          # Скомпилированные файлы
└── 📚 docs/              # Документация
    ├── api/           # API документация
    ├── frontend/      # Фронтенд документация
    ├── backend/       # Бэкенд документация
    ├── deployment/    # Инструкции по развертыванию
    └── security/      # Документация по безопасности
```

## 💻 Разработка

### ⚙️ Требования

- 🐍 Python 3.8+
- 📦 Node.js 14+
- 🔧 npm 6+
- 🐳 Docker & docker-compose (для запуска через контейнеры)

### 📝 Рекомендации по разработке

1. 🔧 Используйте виртуальное окружение Python
2. 🔄 Следите за обновлениями зависимостей
3. ✨ Соблюдайте стиль кода проекта
4. 🐳 Тестируйте изменения в Docker-окружении

## 👥 Авторы

© 2025 magna_mentes. Все права защищены.
