# 🚀 OnboardPro

> 🌟 Современная платформа для автоматизации процесса онбординга сотрудников

## ⚡️ Технологии

- 🏗 **Бэкенд**: FastAPI, SQLite, SQLAlchemy
- 🎨 **Фронтенд**: HTML, TailwindCSS, JavaScript
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
