# Архитектура проекта OnboardPro

## Общая архитектура

OnboardPro построен как монолитное веб-приложение с четким разделением на фронтенд и бэкенд части, взаимодействующие через REST API.

### Технологический стек

#### Бэкенд:

- **Основной фреймворк**: FastAPI (Python)
- **ORM**: SQLAlchemy для работы с базой данных
- **База данных**: SQLite (текущая версия), с планами миграции на PostgreSQL
- **Миграции**: Alembic для управления схемой БД
- **Аутентификация**: JWT-токены
- **Валидация данных**: Pydantic

#### Фронтенд:

- **Основной фреймворк**: React.js с функциональными компонентами и хуками
- **Роутинг**: React Router
- **Стилизация**: TailwindCSS с PostCSS 8
- **UI компоненты**: Собственная библиотека компонентов
- **Иконки**: Heroicons

#### Инфраструктура:

- **Контейнеризация**: Docker и Docker Compose
- **Сеть**: Nginx в качестве обратного прокси
- **Развертывание**: Локальная разработка через Docker Compose, планируется перенос в облако (AWS)
- **CI/CD**: В процессе настройки (планируется GitHub Actions)

## Архитектурные слои

### Бэкенд

1. **API слой** (`main.py`):

   - Определение эндпоинтов REST API
   - Обработка HTTP-запросов
   - Аутентификация и авторизация
   - Валидация входных данных

2. **Слой бизнес-логики**:

   - Обработка данных
   - Реализация основных функций приложения
   - Интеграции с внешними сервисами

3. **Слой доступа к данным**:

   - ORM-модели SQLAlchemy (`models.py`)
   - Функции для работы с базой данных (`database.py`)

4. **Слой аутентификации** (`auth.py`):
   - JWT аутентификация
   - Управление паролями и токенами
   - Авторизация на основе ролей

### Фронтенд

1. **Слой маршрутизации и компонентов**:

   - Определение маршрутов приложения
   - Компоненты страниц (Dashboard, Login и т.д.)
   - Защищенные маршруты с проверкой ролей

2. **Слой UI-компонентов**:

   - Переиспользуемые компоненты интерфейса
   - Формы и элементы ввода
   - Модальные окна

3. **Слой управления состоянием**:

   - React Context для глобального состояния
   - Локальное состояние компонентов

4. **Слой взаимодействия с API**:
   - Централизованный клиент API

## Схема базы данных

### Основные таблицы:

1. **users** - Пользователи системы:

   - Первичный ключ, email, хешированный пароль, ФИО, телефон
   - Роль пользователя (HR, Manager, Employee)
   - Отдел, статус активности, фото

2. **tasks** - Задачи онбординга:

   - Первичный ключ, название, описание
   - Связи с пользователем и планом
   - Приоритет, статус, дедлайн

3. **plans** - Планы онбординга:

   - Первичный ключ, название, описание
   - Целевая роль, временные метки

4. **feedback** - Обратная связь:

   - Первичный ключ, содержание
   - Связи с отправителем и получателем
   - Опционально - связь с задачей

5. **analytics** - Аналитические данные:
   - Первичный ключ, метрика, значение
   - Связь с пользователем, временные метки

## Интеграции с внешними сервисами

1. **Telegram** - отправка уведомлений
2. **Google Calendar** - синхронизация задач
3. **Workable** - импорт данных сотрудников

## Аутентификация и безопасность

- JWT-токены для аутентификации
- Хэширование паролей через bcrypt (с запасным вариантом sha256_crypt)
- Ролевая система доступа (HR, Manager, Employee)
- Защищенные маршруты на фронтенде

## Особенности кэширования и производительности

- Кэширование аналитических данных в памяти
- WebSocket для обновлений в реальном времени
- Стратегии оптимизации запросов к базе данных

## Текущие ограничения и планы развития

- Текущая версия базы данных (SQLite) имеет ограничения при конкурентном доступе
- Планируется миграция на PostgreSQL
- Требуется улучшение механизма повторных попыток при сбое внешних сервисов
- Неоптимальная работа календаря и таблиц с большими объемами данных
