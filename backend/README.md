# OnboardPro Backend

Бэкенд-часть проекта OnboardPro, разработанная на Django REST Framework.

## Технологии

- Python 3.11+
- Django 5.0+
- Django REST Framework 3.14+
- PostgreSQL 14+
- JWT (djangorestframework-simplejwt)
- Docker & Docker Compose

## Основные компоненты

- Кастомная модель пользователя с ролевой системой
- JWT-аутентификация
- API документация (drf-spectacular)
- Миграции для настройки базы данных

## Пользователи и авторизация

Система использует кастомную модель пользователя, расширяющую стандартного пользователя Django:

- Вход по email вместо username
- Роли: admin, hr, manager, employee
- Аутентификация через JWT-токены
- Защита маршрутов на основе ролей

### API endpoints аутентификации

- `POST /api/auth/login/` - получение access/refresh токенов
- `POST /api/auth/refresh/` - обновление access-токена
- `GET /api/users/me/` - информация о текущем пользователе

Подробная документация по системе пользователей доступна в [backend_users.md](../KnowledgeStorage/backend_users.md)

## Онбординг

Система онбординга позволяет создавать программы онбординга для новых сотрудников, состоящие из различных шагов и заданий.

### Основные функции

- Создание и управление программами онбординга
- Добавление шагов разных типов (задачи, встречи, обучение)
- Назначение программ пользователям
- Отслеживание прогресса выполнения

### API endpoints онбординга

- `GET /api/onboarding/programs/` - список всех программ онбординга
- `POST /api/onboarding/programs/` - создание новой программы
- `GET /api/onboarding/programs/{id}/` - детали программы
- `POST /api/onboarding/programs/{id}/assign/` - назначение программы пользователю
- `GET /api/onboarding/assignments/my/` - назначенные программы текущего пользователя
- `POST /api/onboarding/steps/{id}/complete/` - отметить шаг как выполненный
- `GET /api/onboarding/assignments/{id}/progress/` - прогресс по назначенной программе

Подробная документация по моделям онбординга доступна в [backend_onboarding_models.md](../KnowledgeStorage/backend_onboarding_models.md)

## Система обратной связи

Система обратной связи позволяет собирать отзывы от сотрудников о процессе онбординга:

- Настроение (FeedbackMood) по ходу выполнения программы
- Комментарии к отдельным шагам (StepFeedback)

### API endpoints обратной связи

- `POST /api/feedback/mood/` - отправка настроения по назначению (ограничение - один раз в день)
- `POST /api/feedback/step/` - отзыв по конкретному шагу
- `GET /api/feedback/assignment/{id}/` - весь фидбек по конкретному назначению (для HR/Admin)

Подробная документация по системе обратной связи доступна в [backend_feedback.md](../KnowledgeStorage/backend_feedback.md)

## LMS (Обучающие шаги)

Система LMS (Learning Management System) позволяет создавать обучающий контент и тесты в рамках шагов онбординга:

- Различные типы контента: видео, текст, файлы
- Тестирование для проверки полученных знаний
- Автоматическое отслеживание прогресса обучения

### API endpoints LMS

- `GET /api/lms/module/{step_id}/` - получение обучающих модулей по шагу
- `GET /api/lms/test/{step_id}/` - получение теста по шагу
- `POST /api/lms/test/{step_id}/submit/` - отправка ответов на тест
- `GET /api/lms/test/{step_id}/result/` - результат теста пользователя

Подробная документация по LMS доступна в [backend_lms.md](../KnowledgeStorage/backend_lms.md)

## Analytics API

Аналитическое API предоставляет агрегированные данные по процессу онбординга для HR и администраторов:

- Общие метрики по сотрудникам на онбординге
- Статистика прогресса по программам
- Аналитика настроения и обратной связи
- Отчеты по прохождению тестов

### API endpoints аналитики

- `GET /api/analytics/summary/` - общая сводка по онбордингу
- `GET /api/analytics/assignments/` - таблица всех назначений с прогрессом
- `GET /api/analytics/feedback-summary/` - сводка по настроениям пользователей (для графиков)

Все аналитические endpoints доступны только для пользователей с ролями HR и ADMIN и требуют JWT-аутентификации. Пример использования с cURL:

```bash
# Получение JWT-токена
curl -X POST -H "Content-Type: application/json" -d '{"email": "hr@example.com", "password": "password"}' http://localhost:8000/api/auth/login/

# Использование токена для доступа к аналитике
curl -H "Authorization: Bearer <jwt_token>" http://localhost:8000/api/analytics/summary/
```

Подробная документация по аналитическому API доступна в [backend_analytics.md](../KnowledgeStorage/backend_analytics.md)

## Notifications API

Система уведомлений предоставляет API для получения и управления уведомлениями:

- Автоматические уведомления о новых назначениях
- Напоминания о приближающихся дедлайнах
- Уведомления о пропущенных шагах и провале тестов

### API endpoints уведомлений

- `GET /api/notifications/` - список всех уведомлений пользователя
- `POST /api/notifications/{id}/read/` - отметка уведомления как прочитанное
- `POST /api/notifications/read-all/` - отметка всех уведомлений как прочитанные

Все эндпоинты уведомлений доступны только авторизованным пользователям и возвращают только уведомления, предназначенные для текущего пользователя.

Пример использования с cURL:

```bash
# Получение JWT-токена
curl -X POST -H "Content-Type: application/json" -d '{"email": "user@example.com", "password": "password"}' http://localhost:8000/api/auth/login/

# Получение списка уведомлений
curl -H "Authorization: Bearer <jwt_token>" http://localhost:8000/api/notifications/

# Отметка уведомления как прочитанное
curl -X POST -H "Authorization: Bearer <jwt_token>" http://localhost:8000/api/notifications/1/read/
```

Подробная документация по системе уведомлений доступна в [backend_notifications.md](../KnowledgeStorage/backend_notifications.md)

## Установка и запуск

### С использованием Docker (рекомендуется)

1. Запустите контейнеры:

```bash
docker-compose up -d
```

2. Примените миграции:

```bash
docker-compose exec backend python backend/manage.py migrate
```

3. Создайте суперпользователя:

```bash
docker-compose exec backend python backend/manage.py createsuperuser
```

### Доступ к API

Backend API доступен по адресу: [http://localhost:8000/api/](http://localhost:8000/api/)
Документация API (Swagger): [http://localhost:8000/api/docs/](http://localhost:8000/api/docs/)
