# Система уведомлений OnboardPro

## Обзор

Система уведомлений OnboardPro предназначена для информирования пользователей о важных событиях в процессе онбординга. Она поддерживает различные типы уведомлений и может быть легко расширена для поддержки дополнительных каналов доставки (Telegram, Email).

## Архитектура

Система нотификаций построена на следующих компонентах:

1. **Модель `Notification`** - хранит информацию о всех уведомлениях в системе
2. **Сигналы Django** - используются для автоматической генерации уведомлений при определенных событиях
3. **Асинхронные задачи** - для проверки приближающихся дедлайнов и других фоновых операций
4. **API** - для получения и управления уведомлениями с клиентской стороны

## Основные функции

### Автоматическая генерация уведомлений

Система автоматически создает уведомления для следующих событий:

- Назначение новой программы онбординга
- Приближение дедлайна шага (менее 24 часов)
- Завершение шага (уведомление HR)
- Пропуск дедлайна (уведомление HR)
- Провал теста (уведомление сотрудника и HR)

### API для работы с уведомлениями

#### Получение списка уведомлений

```
GET /api/notifications/
```

Возвращает список всех уведомлений текущего пользователя.

**Пример ответа:**

```json
[
  {
    "id": 1,
    "title": "New onboarding program assigned",
    "message": "You have been assigned to the onboarding program \"Developers Onboarding\".",
    "notification_type": "info",
    "is_read": false,
    "created_at": "2025-05-20T15:00:00Z"
  },
  {
    "id": 2,
    "title": "Deadline approaching",
    "message": "You have less than 24 hours to complete the step \"Introduction to Git\" in program \"Developers Onboarding\".",
    "notification_type": "deadline",
    "is_read": true,
    "created_at": "2025-05-21T10:00:00Z"
  }
]
```

#### Отметка уведомления как прочитанное

```
POST /api/notifications/{id}/read/
```

Отмечает конкретное уведомление как прочитанное.

**Пример ответа:**

```json
{
  "id": 1,
  "title": "New onboarding program assigned",
  "message": "You have been assigned to the onboarding program \"Developers Onboarding\".",
  "notification_type": "info",
  "is_read": true,
  "created_at": "2025-05-20T15:00:00Z"
}
```

#### Отметка всех уведомлений как прочитанные

```
POST /api/notifications/read-all/
```

Отмечает все уведомления пользователя как прочитанные.

**Пример ответа:**

```json
{
  "message": "Marked 5 notifications as read",
  "count": 5
}
```

## Модель данных

### Notification

Представляет единичное уведомление в системе.

| Поле              | Тип              | Описание                                          |
| ----------------- | ---------------- | ------------------------------------------------- |
| id                | Integer          | Уникальный идентификатор                          |
| recipient         | ForeignKey(User) | Пользователь-получатель уведомления               |
| title             | CharField        | Заголовок уведомления                             |
| message           | TextField        | Текст уведомления                                 |
| notification_type | CharField        | Тип уведомления (info, warning, deadline, system) |
| is_read           | BooleanField     | Флаг "прочитано"                                  |
| created_at        | DateTimeField    | Дата и время создания                             |

## Типы уведомлений

- **info** - Информационное уведомление
- **warning** - Предупреждение
- **deadline** - Дедлайн
- **system** - Системное уведомление

## Расширение системы

### Добавление новых каналов доставки

Система уведомлений спроектирована так, что в будущем можно легко добавить другие каналы доставки, такие как:

1. **Email** - для отправки уведомлений по электронной почте
2. **Telegram** - для отправки сообщений через Telegram бота
3. **WebSockets** - для мгновенных уведомлений в реальном времени

Для реализации нового канала доставки нужно:

1. Создать отдельный сервис для работы с этим каналом
2. Добавить соответствующую логику в обработчики сигналов или фоновые задачи
3. Обновить настройки пользователя для возможности выбора предпочтительного канала

## Примеры использования

### Создание уведомления программно

```python
from notifications.services import NotificationService

# Отправка информационного уведомления
NotificationService.send_notification(
    recipient=user,
    title="Welcome to OnboardPro",
    message="Your onboarding journey has begun!",
    notification_type="info"
)

# Отправка уведомления о дедлайне
NotificationService.send_deadline_notification(
    recipient=user,
    title="Deadline approaching",
    message="You have a task due tomorrow"
)
```
