# 🚀 OnboardPro

![OnboardPro Логотип](docs/images/onboardpro_logo.png)

## Обзор

OnboardPro — это современное веб-приложение, разработанное для оптимизации процесса адаптации новых сотрудников. Оно предоставляет инструменты для HR-менеджеров, руководителей отделов и сотрудников для управления задачами, сбора обратной связи и отслеживания прогресса.

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

## Быстрый старт

### Предварительные требования

- Docker и Docker Compose
- Node.js (v16+) и npm
- Python 3.9+

### Установка

1. Клонируйте репозиторий:

   ```
   git clone https://github.com/magna_mentes/OnboardPro.git
   cd OnboardPro
   ```

2. Запустите приложение:

   ```
   docker-compose up -d
   ```

3. Откройте приложение по адресу http://localhost:3000

4. Войдите, используя одни из следующих учетных данных:
   - HR: test@onboardpro.com / test123
   - Менеджер: manager@onboardpro.com / test123
   - Сотрудник: employee@onboardpro.com / test123

### Разработка

1. Установите зависимости:

   ```
   cd frontend
   npm install
   ```

2. Запустите сервер разработки:

   ```
   npm start
   ```

3. Запустите скрипт проверки настройки:
   ```
   ./validate_setup.sh
   ```

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

## Документация

- [Руководство пользователя (Русский)](docs/user_guide_ru.md)
- [Руководство пользователя (Английский)](docs/user_guide_en.md)
- [Техническая документация (Русский)](docs/technical_documentation_ru.md)
- [Техническая документация (Английский)](docs/technical_documentation.md)
- [Архитектура](docs/architecture.md)
- [Журнал разработки (Русский)](docs/developer_log_ru.md)
- [Журнал разработки (Английский)](docs/developer_log.md)

## 📁 Структура проекта

```
OnboardPro/
├── backend/              # FastAPI бэкенд
│   ├── app/              # Код приложения
│   ├── tests/            # Тесты бэкенда
│   └── onboardpro.db     # SQLite база данных
├── frontend/             # React фронтенд
│   ├── public/           # Статические файлы
│   ├── src/              # Исходный код
│   │   ├── components/   # React компоненты
│   │   ├── pages/        # Компоненты страниц
│   │   ├── context/      # React контекст
│   │   ├── hooks/        # Пользовательские хуки
│   │   └── utils/        # Служебные функции
│   └── package.json      # Зависимости
├── docs/                 # Документация
├── docker-compose.yml    # Docker конфигурация
└── README.md             # Этот файл
```

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

## Лицензия

© 2025 magna_mentes. Все права защищены.

## Поддержка

Для технической поддержки обращайтесь к команде разработки по адресу support@onboardpro.com
