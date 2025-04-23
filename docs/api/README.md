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

## 👥 Пользователи

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

### 👥 GET /users

Получение списка пользователей (для HR и менеджеров).

### 👤 GET /users/me

Получение информации о текущем пользователе.

### 🔒 PUT /users/{user_id}/password

Обновление пароля пользователя (только для HR).

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

### 📋 GET /plans

Получение списка всех планов онбординга.

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

### 📋 GET /tasks

Получение списка задач (фильтруется по роли пользователя).

### 🔄 PUT /tasks/{task_id}/status

Обновление статуса задачи.

### ❌ DELETE /tasks/{task_id}

Удаление задачи (только для HR и менеджеров).

## 💬 Отзывы

### ✍️ POST /feedback

Создание нового отзыва.

**📨 Запрос:**
```json
{
  "recipient_id": 2,
  "task_id": 1,
  "message": "Отличная работа!"
}
```

### 📑 GET /feedback

Получение списка отзывов.

## 🤖 Интеграции

### 📱 POST /integrations/telegram

Подключение Telegram для уведомлений.

**📨 Запрос:**
```json
{
  "telegram_id": "12345678"
}
```

### 📅 POST /integrations/calendar

Создание события в Google Calendar.

**📨 Запрос:**
```json
{
  "task_id": 1
}
```

### 👥 POST /integrations/workable

Импорт сотрудников из Workable (только для HR).

## 📊 Аналитика

### 📈 GET /analytics/summary

Получение сводной аналитики для HR-дашборда.

**📩 Ответ:**
```json
{
  "task_stats": {
    "total": 100,
    "completed": 75,
    "completion_rate": 0.75
  },
  "feedback_stats": {
    "total": 50,
    "avg_per_user": 2.5
  }
}
```

### 📊 POST /analytics

Создание записи аналитики (только для HR).

### 📈 GET /analytics

Получение всех записей аналитики (только для HR).

## 🔄 Webhook

### 🤖 POST /webhook/telegram

Обработка webhook'ов от Telegram бота.

## 🔍 Мониторинг

### ❤️ GET /health

Проверка работоспособности API.

**📩 Ответ:**
```json
{
  "status": "healthy"
}
```
