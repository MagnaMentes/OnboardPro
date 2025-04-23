# 🚀 API Документация OnboardPro

## 🔐 Аутентификация

### 🔑 POST /login

Аутентификация пользователя и получение JWT токена.

**📨 Запрос:**

```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**📩 Ответ:**

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer"
}
```

### 👤 POST /users

Создание нового пользователя.

**📨 Запрос:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "employee",
  "department": "IT"
}
```

**📩 Ответ:**

```json
{
  "email": "user@example.com",
  "role": "employee"
}
```

### 👥 GET /users/me

Получение информации о текущем пользователе.

**📋 Заголовки:**

```
Authorization: Bearer <token>
```

**📩 Ответ:**

```json
{
  "email": "user@example.com",
  "role": "employee"
}
```

## 📋 Планы онбординга

### 📝 POST /plans

Создание нового плана онбординга (только для HR).

**📨 Запрос:**
```json
{
  "role": "employee",
  "title": "План онбординга разработчика"
}
```

**📩 Ответ:**
```json
{
  "id": 1,
  "role": "employee",
  "title": "План онбординга разработчика",
  "created_at": "2025-04-23T10:00:00Z"
}
```

### 📋 GET /plans

Получение списка всех планов онбординга.

**📋 Заголовки:**
```
Authorization: Bearer <token>
```

**📩 Ответ:**
```json
[
  {
    "id": 1,
    "role": "employee",
    "title": "План онбординга разработчика",
    "created_at": "2025-04-23T10:00:00Z"
  }
]
```

## 📝 Задачи

### ✨ POST /tasks

Создание новой задачи (для HR и менеджеров).

**📨 Запрос:**
```json
{
  "plan_id": 1,
  "user_id": 2,
  "title": "Изучить документацию",
  "description": "Ознакомиться с документацией проекта",
  "priority": "high",
  "deadline": "2025-05-01T00:00:00Z"
}
```

**📩 Ответ:**
```json
{
  "id": 1,
  "plan_id": 1,
  "user_id": 2,
  "title": "Изучить документацию",
  "description": "Ознакомиться с документацией проекта",
  "priority": "high",
  "deadline": "2025-05-01T00:00:00Z",
  "status": "pending",
  "created_at": "2025-04-23T10:00:00Z"
}
```

### 📋 GET /tasks

Получение списка задач. Для сотрудников возвращает только их задачи, для HR и менеджеров - все задачи.

**📋 Заголовки:**
```
Authorization: Bearer <token>
```

**📩 Ответ:**
```json
[
  {
    "id": 1,
    "plan_id": 1,
    "user_id": 2,
    "title": "Изучить документацию",
    "description": "Ознакомиться с документацией проекта",
    "priority": "high",
    "deadline": "2025-05-01T00:00:00Z",
    "status": "pending",
    "created_at": "2025-04-23T10:00:00Z"
  }
]
```

### 🔄 PUT /tasks/{task_id}/status

Обновление статуса задачи.

**📋 Параметры запроса:**
- status: Новый статус задачи (pending, in_progress, completed)

**📋 Заголовки:**
```
Authorization: Bearer <token>
```

**📩 Ответ:**
```json
{
  "id": 1,
  "plan_id": 1,
  "user_id": 2,
  "title": "Изучить документацию",
  "description": "Ознакомиться с документацией проекта",
  "priority": "high",
  "deadline": "2025-05-01T00:00:00Z",
  "status": "in_progress",
  "created_at": "2025-04-23T10:00:00Z"
}
```

## 📊 Коды ответов

- ✅ 200: Успешный запрос
- ⚠️ 401: Ошибка аутентификации
- 🚫 403: Недостаточно прав
- ❌ 422: Ошибка валидации данных
- 💥 500: Внутренняя ошибка сервера

## 🌐 CORS

API поддерживает CORS для всех источников (\*) и следующие методы:

- 📥 GET
- 📤 POST
- 🔄 PUT
- 🗑️ DELETE
- 🔍 OPTIONS
