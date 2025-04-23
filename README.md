# OnboardPro

OnboardPro — современная платформа для автоматизации процесса онбординга сотрудников.

## Технологии

- **Бэкенд**: FastAPI, SQLite, SQLAlchemy
- **Фронтенд**: HTML, TailwindCSS, JavaScript
- **Аутентификация**: JWT

## Возможности

- Аутентификация пользователей с ролями (employee, manager, hr)
- Система ролей и разграничения доступа
- Современный адаптивный интерфейс

## Установка

### Бэкенд

```bash
cd backend
python -m venv venv
source venv/bin/activate  # для Linux/macOS
# или
venv\Scripts\activate  # для Windows
pip install -r requirements.txt
```

Создайте файл `.env` в директории backend:

```
DATABASE_URL=sqlite:///onboardpro.db
SECRET_KEY=your-secret-key
```

### Фронтенд

```bash
cd frontend
npm install
npm run build
```

## Запуск

### Бэкенд

```bash
cd backend
source venv/bin/activate  # для Linux/macOS
# или
venv\Scripts\activate  # для Windows
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Фронтенд

```bash
cd frontend
npm run watch
```

## API Endpoints

- POST `/login` - Аутентификация пользователя
- POST `/users` - Создание нового пользователя
- GET `/users/me` - Получение информации о текущем пользователе

## Структура проекта

```
.
├── backend/               # FastAPI бэкенд
│   ├── models.py         # Модели данных
│   ├── auth.py          # Аутентификация
│   ├── database.py      # Настройки БД
│   └── main.py          # Основной API
├── frontend/             # Фронтенд
│   ├── src/             # Исходный код
│   │   ├── layouts/     # Шаблоны
│   │   └── input.css    # Стили
│   └── dist/            # Скомпилированные файлы
└── docs/                # Документация
```

## Разработка

### Требования

- Python 3.8+
- Node.js 14+
- npm 6+

### Рекомендации по разработке

1. Используйте виртуальное окружение Python
2. Следите за обновлениями зависимостей
3. Соблюдайте стиль кода проекта

## Авторы

© 2025 magna_mentes. Все права защищены.
