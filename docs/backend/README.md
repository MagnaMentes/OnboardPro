# Бэкенд OnboardPro

## Технологии

- FastAPI
- SQLAlchemy (ORM)
- SQLite
- Python-Jose (JWT)
- Passlib (Хеширование паролей)

## Структура проекта

```
backend/
├── __init__.py        # Инициализация пакета
├── models.py          # Модели данных
├── auth.py           # Аутентификация и авторизация
├── database.py       # Настройки базы данных
├── main.py           # Основные эндпоинты API
└── requirements.txt  # Зависимости
```

## Настройка окружения

1. Создание виртуального окружения:

   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/macOS
   # или
   venv\Scripts\activate     # Windows
   ```

2. Установка зависимостей:

   ```bash
   pip install -r requirements.txt
   ```

3. Настройка переменных окружения (`.env`):
   ```
   DATABASE_URL=sqlite:///onboardpro.db
   SECRET_KEY=your-secret-key
   ```

## Модели данных

### User

```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="employee")
    department = Column(String, nullable=True)
```

## Аутентификация

- JWT токены для аутентификации
- Bcrypt для хеширования паролей
- OAuth2PasswordBearer для получения токена

## API Endpoints

### POST /login

- Аутентификация пользователя
- Возвращает JWT токен

### POST /users

- Создание нового пользователя
- Хеширование пароля
- Базовая валидация данных

### GET /users/me

- Получение информации о текущем пользователе
- Требует JWT токен

## База данных

- SQLite для разработки
- SQLAlchemy для ORM
- Миграции создаются автоматически

## CORS

Настроен CORS middleware:

- Разрешены все источники (\*)
- Поддержка credentials
- Все стандартные методы

## Запуск

Для разработки:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Тестирование API

Документация API доступна по адресам:

- /docs (Swagger UI)
- /redoc (ReDoc)

## Рекомендации по разработке

1. Следуйте принципам REST API
2. Используйте типизацию Python
3. Документируйте новые эндпоинты
4. Пишите тесты для новой функциональности

## Планы по развитию

1. Миграция на PostgreSQL
2. Добавление кеширования (Redis)
3. Внедрение асинхронных задач (Celery)
4. Улучшение логирования
5. Добавление тестов
