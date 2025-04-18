# API Documentation

## Base URL

- Local development: `http://localhost:8000`

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

### Endpoints аутентификации

#### POST /api/login

Авторизация пользователя и получение JWT токенов

**Request:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "access": "string",
  "refresh": "string"
}
```

#### POST /api/refresh

Обновление access токена

**Request:**

```json
{
  "refresh": "string"
}
```

**Response:**

```json
{
  "access": "string"
}
```

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
  "message": "Accessible only to HR"
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

## Onboarding API

### GET /api/onboarding/templates/

Получение списка шаблонов онбординга

**Parameters:**

- `department` (string, optional): Фильтрация по отделу
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
      "name": "string",
      "description": "string",
      "department": "string",
      "tasks": []
    }
  ]
}
```

### GET /api/onboarding/tasks/

Получение списка задач онбординга

**Parameters:**

- `template` (integer, optional): ID шаблона
- `status` (string, optional): Статус задачи
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
      "title": "string",
      "description": "string",
      "due_date": "string",
      "status": "string"
    }
  ]
}
```

## Endpoints

### Health Check

Проверка работоспособности API.

- **URL**: `/api/health`
- **Method**: `GET`
- **Success Response**:
  - **Code**: 200
  - **Content**: `{"status": "OK"}`
- **Example**:
  ```bash
  curl http://localhost:8000/api/health
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

- /api/v1/...
- /api/v2/... (в разработке)

## Поддержка

По вопросам работы API обращайтесь:

- Email: api@onboardpro.com
- Документация: https://docs.onboardpro.com/api
