# Документация API

## Аутентификация

### Вход
- **URL**: `/api/auth/login/`
- **Метод**: `POST`
- **Описание**: Аутентификация пользователя и получение JWT токена
- **Тело запроса**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Ответ**:
  ```json
  {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
  ```

### Обновление токена
- **URL**: `/api/auth/refresh/`
- **Метод**: `POST`
- **Описание**: Получение нового access токена с помощью refresh токена
- **Тело запроса**:
  ```json
  {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
  ```
- **Ответ**:
  ```json
  {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
  ```

## Пользователи

### Получение текущего пользователя
- **URL**: `/api/users/me/`
- **Метод**: `GET`
- **Описание**: Получение профиля текущего пользователя
- **Заголовки**: `Authorization: Bearer <token>`
- **Ответ**:
  ```json
  {
    "id": 1,
    "email": "user@example.com",
    "first_name": "Иван",
    "last_name": "Иванов",
    "role": "employee"
  }
  ```

### Обновление текущего пользователя
- **URL**: `/api/users/me/`
- **Метод**: `PATCH`
- **Описание**: Обновление профиля текущего пользователя
- **Заголовки**: `Authorization: Bearer <token>`
- **Тело запроса**:
  ```json
  {
    "first_name": "Иван",
    "last_name": "Иванов"
  }
  ```
- **Ответ**: Обновленный объект пользователя

## Планы онбординга

### Список планов
- **URL**: `/api/onboarding/plans/`
- **Метод**: `GET`
- **Описание**: Получение списка планов онбординга
- **Заголовки**: `Authorization: Bearer <token>`
- **Ответ**:
  ```json
  [
    {
      "id": 1,
      "title": "Онбординг нового сотрудника",
      "description": "Стандартный план онбординга для новых сотрудников",
      "duration_days": 30,
      "tasks": [...]
    }
  ]
  ```

### Создание плана
- **URL**: `/api/onboarding/plans/`
- **Метод**: `POST`
- **Описание**: Создание нового плана онбординга
- **Заголовки**: `Authorization: Bearer <token>`
- **Тело запроса**:
  ```json
  {
    "title": "Онбординг нового сотрудника",
    "description": "Стандартный план онбординга для новых сотрудников",
    "duration_days": 30,
    "tasks": [
      {
        "title": "Заполнить профиль",
        "description": "Заполнить информацию в профиле",
        "due_date": "2024-03-20",
        "assigned_to": 1
      }
    ]
  }
  ```
- **Ответ**: Созданный объект плана

### Получение деталей плана
- **URL**: `/api/onboarding/plans/{id}/`
- **Метод**: `GET`
- **Описание**: Получение подробной информации о конкретном плане
- **Заголовки**: `Authorization: Bearer <token>`
- **Ответ**: Объект плана с задачами

### Обновление плана
- **URL**: `/api/onboarding/plans/{id}/`
- **Метод**: `PATCH`
- **Описание**: Обновление существующего плана
- **Заголовки**: `Authorization: Bearer <token>`
- **Тело запроса**: Поля плана для обновления
- **Ответ**: Обновленный объект плана

### Удаление плана
- **URL**: `/api/onboarding/plans/{id}/`
- **Метод**: `DELETE`
- **Описание**: Удаление плана
- **Заголовки**: `Authorization: Bearer <token>`
- **Ответ**: 204 No Content

## Задачи

### Список задач
- **URL**: `/api/onboarding/tasks/`
- **Метод**: `GET`
- **Описание**: Получение списка задач
- **Заголовки**: `Authorization: Bearer <token>`
- **Параметры запроса**:
  - `plan_id`: Фильтрация по ID плана
  - `status`: Фильтрация по статусу (pending, in_progress, completed)
  - `assigned_to`: Фильтрация по ID назначенного пользователя
  - `team`: Фильтрация по команде (для менеджеров)
- **Ответ**:
  ```json
  [
    {
      "id": 1,
      "title": "Заполнить профиль",
      "description": "Заполнить информацию в профиле",
      "status": "pending",
      "due_date": "2024-03-20",
      "assigned_to": 1,
      "plan": 1
    }
  ]
  ```

### Создание задачи
- **URL**: `/api/onboarding/tasks/`
- **Метод**: `POST`
- **Описание**: Создание новой задачи
- **Заголовки**: `Authorization: Bearer <token>`
- **Тело запроса**:
  ```json
  {
    "title": "Заполнить профиль",
    "description": "Заполнить информацию в профиле",
    "due_date": "2024-03-20",
    "assigned_to": 1,
    "plan": 1
  }
  ```
- **Ответ**: Созданный объект задачи

### Обновление статуса задачи
- **URL**: `/api/onboarding/tasks/{id}/status/`
- **Метод**: `PATCH`
- **Описание**: Обновление статуса задачи
- **Заголовки**: `Authorization: Bearer <token>`
- **Тело запроса**:
  ```json
  {
    "status": "completed"
  }
  ```
- **Ответ**: Обновленный объект задачи

### Получение задач команды (для менеджеров)
- **URL**: `/api/onboarding/tasks/team/`
- **Метод**: `GET`
- **Описание**: Получение списка задач для всех сотрудников в команде менеджера
- **Заголовки**: `Authorization: Bearer <token>`
- **Параметры запроса**:
  - `status`: Фильтрация по статусу (pending, in_progress, completed)
  - `plan_id`: Фильтрация по ID плана
- **Ответ**:
  ```json
  [
    {
      "id": 1,
      "title": "Заполнить профиль",
      "description": "Заполнить информацию в профиле",
      "status": "pending",
      "due_date": "2024-03-20",
      "assigned_to": {
        "id": 1,
        "first_name": "Иван",
        "last_name": "Иванов",
        "email": "ivan@example.com"
      },
      "plan": 1
    }
  ]
  ```

## Проверка работоспособности

### Проверка работоспособности API
- **URL**: `/api/health/`
- **Метод**: `GET`
- **Описание**: Проверка работоспособности API
- **Ответ**:
  ```json
  {
    "status": "healthy",
    "version": "1.0.0"
  }
  ```

## Ошибки

Все эндпоинты могут возвращать следующие ошибки:

### 400 Bad Request
```json
{
  "error": "Некорректные входные данные",
  "details": {
    "field": ["сообщение об ошибке"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "Не предоставлены учетные данные аутентификации"
}
```

### 403 Forbidden
```json
{
  "error": "У вас нет прав для выполнения этого действия"
}
```

### 404 Not Found
```json
{
  "error": "Ресурс не найден"
}
```

### 500 Internal Server Error
```json
{
  "error": "Внутренняя ошибка сервера"
}
```

## Базовый URL

- Локальная разработка: `http://localhost:8000`

## Общая информация

API построено с использованием Django REST Framework и следует принципам REST. Все запросы к API должны быть выполнены по HTTPS.

## Аутентификация и Авторизация

API использует JWT (JSON Web Tokens) для аутентификации и систему ролей для авторизации.
Токен должен быть передан в заголовке Authorization:

```
Authorization: Bearer <token>
```

### Роли пользователей

Система поддерживает следующие роли:

- employee: Обычный сотрудник
- manager: Менеджер
- hr: HR специалист

### Тестовые endpoints

#### GET /api/test-hr

Тестовый эндпоинт, доступный только для пользователей с ролью HR

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "Доступно только для HR"
}
```

#### GET /api/test-manager

Тестовый эндпоинт, доступный только для пользователей с ролью Manager

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "Доступно только для Manager"
}
```

## Users API

### GET /api/users/

Получение списка пользователей

**Headers:**

```
Authorization: Bearer <access_token>
```

**Parameters:**

- `role` (string, optional): Фильтрация по роли
- `page` (integer, optional): Номер страницы
- `page_size` (integer, optional): Количество записей на странице

**Response:**

```json
{
  "count": 0,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 0,
      "username": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "role": "string",
      "department": "string"
    }
  ]
}
```

### POST /api/users/

Создание нового пользователя (требуется роль HR)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string",
  "role": "string",
  "department": "string"
}
```

## Onboarding Plans API

### GET /api/plans/

Получение списка планов онбординга

**Headers:**

```
Authorization: Bearer <access_token>
```

**Parameters:**

- `role` (string, optional): Фильтрация по роли
- `page` (integer, optional): Номер страницы
- `page_size` (integer, optional): Количество записей на странице

**Response:**

```json
{
  "count": 0,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 0,
      "role": "string",
      "title": "string",
      "tasks": [
        {
          "id": 0,
          "plan": 0,
          "user": 0,
          "title": "string",
          "description": "string",
          "priority": "string",
          "deadline": "string",
          "status": "string"
        }
      ]
    }
  ]
}
```

### POST /api/plans/

Создание нового плана онбординга (требуется роль HR)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "role": "string",
  "title": "string"
}
```

### GET /api/plans/{id}/

Получение детальной информации о плане онбординга

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "id": 0,
  "role": "string",
  "title": "string",
  "tasks": [
    {
      "id": 0,
      "plan": 0,
      "user": 0,
      "title": "string",
      "description": "string",
      "priority": "string",
      "deadline": "string",
      "status": "string"
    }
  ]
}
```

### PUT /api/plans/{id}/

Обновление плана онбординга (требуется роль HR)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "role": "string",
  "title": "string"
}
```

### DELETE /api/plans/{id}/

Удаление плана онбординга (требуется роль HR)

**Headers:**

```
Authorization: Bearer <access_token>
```

## Tasks API

### GET /api/tasks/

Получение списка задач

**Headers:**

```
Authorization: Bearer <access_token>
```

**Parameters:**

- `plan` (integer, optional): ID плана онбординга
- `user` (integer, optional): ID пользователя
- `priority` (string, optional): Приоритет задачи (low, medium, high)
- `status` (string, optional): Статус задачи (pending, in_progress, completed)
- `page` (integer, optional): Номер страницы

**Response:**

```json
{
  "count": 0,
  "next": "string",
  "previous": "string",
  "results": [
    {
      "id": 0,
      "plan": 0,
      "user": 0,
      "title": "string",
      "description": "string",
      "priority": "string",
      "deadline": "string",
      "status": "string",
      "created_at": "string"
    }
  ]
}
```

### POST /api/tasks/

Создание новой задачи (требуется роль HR или Manager)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "plan": 0,
  "user": 0,
  "title": "string",
  "description": "string",
  "priority": "string",
  "deadline": "string"
}
```

### GET /api/tasks/{id}/

Получение детальной информации о задаче

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "id": 0,
  "plan": 0,
  "user": 0,
  "title": "string",
  "description": "string",
  "priority": "string",
  "deadline": "string",
  "status": "string",
  "created_at": "string"
}
```

### PUT /api/tasks/{id}/

Обновление задачи (требуется роль HR или Manager)

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "plan": 0,
  "user": 0,
  "title": "string",
  "description": "string",
  "priority": "string",
  "deadline": "string"
}
```

### PATCH /api/tasks/{id}/

Обновление статуса задачи

**Headers:**

```
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "status": "string"
}
```

### DELETE /api/tasks/{id}/

Удаление задачи (требуется роль HR или Manager)

**Headers:**

```
Authorization: Bearer <access_token>
```

## Health Check

### GET /api/health

Проверка работоспособности API.

**Response:**

```json
{
  "status": "OK"
}
```

## Коды ответов

- 200: Успешный запрос
- 201: Успешное создание
- 400: Некорректный запрос
- 401: Не авторизован
- 403: Доступ запрещен (неверная роль)
- 404: Не найдено
- 500: Внутренняя ошибка сервера

## Ограничения и троттлинг

- Анонимные запросы: 100 запросов в час
- Авторизованные запросы: 1000 запросов в час
- Размер payload: максимум 10MB

## Версионирование

API версионируется через URL:

- Текущая версия: v1
- Формат URL: `/api/v1/...`

## Поддержка

По вопросам работы API обращайтесь:

- Email: api@onboardpro.com
- Документация: https://docs.onboardpro.com/api
