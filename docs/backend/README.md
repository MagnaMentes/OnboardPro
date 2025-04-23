# 🏗 Бэкенд OnboardPro

## 🛠 Технологии

- ⚡️ FastAPI
- 🗃 SQLAlchemy (ORM)
- 🎲 SQLite
- 🔑 Python-Jose (JWT)
- 🔒 Passlib (Хеширование паролей)
- 🐳 Docker
- ✅ Pytest

## 📁 Структура проекта

```
backend/
├── 📦 __init__.py        # Инициализация пакета
├── 📊 models.py          # Модели данных
├── 🔐 auth.py           # Аутентификация и авторизация
├── 🗄️ database.py       # Настройки базы данных
├── 🚀 main.py           # Основные эндпоинты API
├── 🔗 integrations.py   # Интеграции с внешними сервисами
├── 📋 requirements.txt  # Зависимости
└── 📝 tests/           # Тесты
    ├── __init__.py
    ├── config.py       # Конфигурация тестов
    └── test_api.py     # Тесты API
```

## ⚙️ Запуск через Docker

1. 🐳 Сборка и запуск контейнеров:

```bash
docker-compose up --build
```

2. 🔄 Перезапуск только backend:

```bash
docker-compose restart backend
```

3. ✅ Запуск тестов:

```bash
docker-compose up backend-test
```

## ⚙️ Локальная настройка окружения

1. 🏗 Создание виртуального окружения:

   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   # или
   venv\Scripts\activate     # Windows
   ```

2. 📦 Установка зависимостей:

   ```bash
   pip install -r requirements.txt
   ```

3. 🔧 Настройка переменных окружения (`.env`):
   ```
   DATABASE_URL=sqlite:///onboardpro.db
   SECRET_KEY=your-secret-key
   ```

## 📊 Модели данных

### 👤 User

```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="employee")  # employee, manager, hr
    department = Column(String, nullable=True)
    telegram_id = Column(String, nullable=True)
```

## 🧪 Тестирование

### 🚀 Запуск тестов

В Docker:

```bash
docker-compose up backend-test
```

Локально:

```bash
pytest tests/test_api.py -v
```

### 📝 Структура тестов

- ✅ Тесты аутентификации
- 👥 Тесты работы с пользователями
- 📋 Тесты планов онбординга
- ✍️ Тесты задач и отзывов
- 📊 Тесты аналитики

### 🔧 Конфигурация тестов

- 🗃 Отдельная тестовая база данных (SQLite)
- 🔄 Автоматическая очистка данных между тестами
- 🔐 Фикстуры для создания тестовых пользователей
- 📝 Использование FastAPI TestClient

## 🔐 Аутентификация

- 🎫 JWT токены для аутентификации
- 🔒 Bcrypt для хеширования паролей
- 🔑 OAuth2PasswordBearer для получения токена

## 🔌 API Endpoints

### 🔑 POST /login

- 🔓 Аутентификация пользователя
- 🎫 Возвращает JWT токен

### 👤 POST /users

- 📝 Создание нового пользователя
- 🔒 Хеширование пароля
- ✅ Базовая валидация данных

### 👥 GET /users/me

- 📱 Получение информации о текущем пользователе
- 🔐 Требует JWT токен

## 🗄️ База данных

- 🎲 SQLite для разработки
- 🔄 SQLAlchemy для ORM
- 🔧 Миграции создаются автоматически

## 🌐 CORS

Настроен CORS middleware:

- 🌍 Разрешены все источники (\*)
- 🔒 Поддержка credentials
- 📡 Все стандартные методы

## 🚀 Запуск

Для разработки:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📚 Тестирование API

Документация API доступна по адресам:

- 📖 /docs (Swagger UI)
- 📑 /redoc (ReDoc)

## 📋 Рекомендации по разработке

1. 🎯 Следуйте принципам REST API
2. ✨ Используйте типизацию Python
3. 📝 Документируйте новые эндпоинты
4. ✅ Пишите тесты для новой функциональности

## 🔄 Планы по развитию

1. 🐘 Миграция на PostgreSQL
2. ⚡️ Добавление кеширования (Redis)
3. 🔄 Внедрение асинхронных задач (Celery)
4. 📊 Улучшение логирования и мониторинга
5. 🔐 Двухфакторная аутентификация
