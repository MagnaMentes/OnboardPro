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

## 📊 Коды ответов

- ✅ 200: Успешный запрос
- ⚠️ 401: Ошибка аутентификации
- 🚫 403: Недостаточно прав
- ❌ 422: Ошибка валидации данных
- 💥 500: Внутренняя ошибка сервера

## 🌐 CORS

API поддерживает CORS для всех источников (*) и следующие методы:
- 📥 GET
- 📤 POST
- 🔄 PUT
- 🗑️ DELETE
- 🔍 OPTIONS
