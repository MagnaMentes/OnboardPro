# API Документация OnboardPro

## Обзор

Эта документация описывает API-эндпоинты, используемые в приложении OnboardPro для работы с Smart Feedback Dashboard. API использует REST архитектуру и возвращает данные в формате JSON.

## Базовый URL

Все API-запросы выполняются относительно базового URL:

```
/api
```

В режиме разработки запросы проксируются через Vite на бэкенд.

## Аутентификация

API использует токены JWT для аутентификации. Токен должен быть передан в заголовке `Authorization` в формате `Bearer {token}`.

## Общие коды ответов

- `200 OK` - Запрос выполнен успешно
- `201 Created` - Ресурс успешно создан
- `400 Bad Request` - Неверный запрос
- `401 Unauthorized` - Требуется аутентификация
- `403 Forbidden` - Доступ запрещен
- `404 Not Found` - Ресурс не найден
- `500 Internal Server Error` - Внутренняя ошибка сервера

## API Эндпоинты Smart Feedback Dashboard

### Trend Snapshots (Снимки трендов)

#### Получение списка снимков трендов

```
GET /api/feedback/trend-snapshots/
```

**Параметры запроса:**

- `days` (number): Количество дней для фильтрации снимков

**Пример ответа:**

```json
[
  {
    "id": 1,
    "template": {
      "id": 1,
      "name": "Шаблон обратной связи"
    },
    "department": {
      "id": 1,
      "name": "Разработка"
    },
    "date": "2025-06-01",
    "sentiment_score": 0.85,
    "response_count": 25,
    "main_topics": { "Обучение": 10, "Коммуникация": 8 },
    "common_issues": { "Нехватка времени": 5 },
    "satisfaction_index": 4.2,
    "created_at": "2025-06-01T10:00:00Z"
  }
]
```

#### Получение данных для дашборда

```
GET /api/feedback/trend-snapshots/dashboard-data/
```

**Параметры запроса:**

- `days` (number): Количество дней для анализа

**Пример ответа:**

```json
{
  "trends": {
    "sentiment_scores": [
      { "date": "2025-05-01", "value": 0.75 },
      { "date": "2025-06-01", "value": 0.85 }
    ],
    "satisfaction_indices": [
      { "date": "2025-05-01", "value": 4.0 },
      { "date": "2025-06-01", "value": 4.2 }
    ],
    "response_counts": [
      { "date": "2025-05-01", "value": 20 },
      { "date": "2025-06-01", "value": 25 }
    ]
  },
  "current_period": {
    "average_sentiment": 0.85,
    "average_satisfaction": 4.2,
    "total_responses": 25,
    "response_rate": 0.8
  },
  "previous_period": {
    "average_sentiment": 0.75,
    "average_satisfaction": 4.0,
    "total_responses": 20,
    "response_rate": 0.7
  },
  "topics": [
    { "name": "Обучение", "count": 10, "percentage": 40 },
    { "name": "Коммуникация", "count": 8, "percentage": 32 }
  ],
  "issues": [{ "name": "Нехватка времени", "count": 5, "percentage": 20 }]
}
```

#### Генерация снимков трендов

```
POST /api/feedback/trend-snapshots/generate/
```

**Пример ответа:**

```json
{
  "success": true,
  "snapshots_created": 5,
  "message": "Успешно создано 5 снимков трендов"
}
```

### Trend Rules (Правила трендов)

#### Получение списка правил трендов

```
GET /api/feedback/trend-rules/
```

**Пример ответа:**

```json
[
  {
    "id": 1,
    "name": "Падение удовлетворенности",
    "description": "Правило для отслеживания падения удовлетворенности",
    "rule_type": "satisfaction_drop",
    "threshold": 15,
    "measurement_period_days": 30,
    "is_active": true,
    "templates": [{ "id": 1, "name": "Шаблон обратной связи" }],
    "departments": [{ "id": 1, "name": "Разработка" }],
    "created_by": {
      "id": 1,
      "first_name": "Иван",
      "last_name": "Иванов"
    },
    "created_at": "2025-05-01T10:00:00Z",
    "updated_at": "2025-05-01T10:00:00Z"
  }
]
```

#### Получение правила тренда по ID

```
GET /api/feedback/trend-rules/{id}/
```

**Пример ответа:**

```json
{
  "id": 1,
  "name": "Падение удовлетворенности",
  "description": "Правило для отслеживания падения удовлетворенности",
  "rule_type": "satisfaction_drop",
  "threshold": 15,
  "measurement_period_days": 30,
  "is_active": true,
  "templates": [{ "id": 1, "name": "Шаблон обратной связи" }],
  "departments": [{ "id": 1, "name": "Разработка" }],
  "created_by": {
    "id": 1,
    "first_name": "Иван",
    "last_name": "Иванов"
  },
  "created_at": "2025-05-01T10:00:00Z",
  "updated_at": "2025-05-01T10:00:00Z"
}
```

#### Создание правила тренда

```
POST /api/feedback/trend-rules/
```

**Тело запроса:**

```json
{
  "name": "Новое правило",
  "description": "Описание нового правила",
  "rule_type": "sentiment_drop",
  "threshold": 10,
  "measurement_period_days": 14,
  "is_active": true,
  "templates": [1, 2],
  "departments": [1]
}
```

**Пример ответа:**

```json
{
  "id": 2,
  "name": "Новое правило",
  "description": "Описание нового правила",
  "rule_type": "sentiment_drop",
  "threshold": 10,
  "measurement_period_days": 14,
  "is_active": true,
  "templates": [
    { "id": 1, "name": "Шаблон 1" },
    { "id": 2, "name": "Шаблон 2" }
  ],
  "departments": [{ "id": 1, "name": "Разработка" }],
  "created_by": {
    "id": 1,
    "first_name": "Иван",
    "last_name": "Иванов"
  },
  "created_at": "2025-06-02T10:00:00Z",
  "updated_at": "2025-06-02T10:00:00Z"
}
```

#### Обновление правила тренда

```
PUT /api/feedback/trend-rules/{id}/
```

**Тело запроса:**

```json
{
  "name": "Обновленное правило",
  "description": "Обновленное описание",
  "rule_type": "sentiment_drop",
  "threshold": 15,
  "measurement_period_days": 30,
  "is_active": true,
  "templates": [1],
  "departments": [1, 2]
}
```

**Пример ответа:**

```json
{
  "id": 1,
  "name": "Обновленное правило",
  "description": "Обновленное описание",
  "rule_type": "sentiment_drop",
  "threshold": 15,
  "measurement_period_days": 30,
  "is_active": true,
  "templates": [{ "id": 1, "name": "Шаблон 1" }],
  "departments": [
    { "id": 1, "name": "Разработка" },
    { "id": 2, "name": "Маркетинг" }
  ],
  "created_by": {
    "id": 1,
    "first_name": "Иван",
    "last_name": "Иванов"
  },
  "created_at": "2025-05-01T10:00:00Z",
  "updated_at": "2025-06-02T11:00:00Z"
}
```

#### Удаление правила тренда

```
DELETE /api/feedback/trend-rules/{id}/
```

**Ответ:** 204 No Content

#### Проверка правила тренда

```
POST /api/feedback/trend-rules/{id}/check/
```

**Пример ответа:**

```json
{
  "alerts_created": 1,
  "message": "Создан 1 алерт"
}
```

#### Проверка всех правил трендов

```
POST /api/feedback/trend-rules/check-all/
```

**Пример ответа:**

```json
{
  "alerts_created": 3,
  "message": "Создано 3 алерта"
}
```

### Trend Alerts (Алерты трендов)

#### Получение списка алертов трендов

```
GET /api/feedback/trend-alerts/
```

**Пример ответа:**

```json
[
  {
    "id": 1,
    "rule": {
      "id": 1,
      "name": "Падение удовлетворенности",
      "rule_type": "satisfaction_drop"
    },
    "template": {
      "id": 1,
      "name": "Шаблон обратной связи"
    },
    "department": {
      "id": 1,
      "name": "Разработка"
    },
    "title": "Обнаружено падение удовлетворенности",
    "description": "Удовлетворенность упала на 20% за последние 30 дней",
    "severity": "high",
    "previous_value": 4.5,
    "current_value": 3.6,
    "percentage_change": -20,
    "is_resolved": false,
    "created_at": "2025-06-01T10:00:00Z"
  }
]
```

#### Получение алерта тренда по ID

```
GET /api/feedback/trend-alerts/{id}/
```

**Пример ответа:**

```json
{
  "id": 1,
  "rule": {
    "id": 1,
    "name": "Падение удовлетворенности",
    "rule_type": "satisfaction_drop"
  },
  "template": {
    "id": 1,
    "name": "Шаблон обратной связи"
  },
  "department": {
    "id": 1,
    "name": "Разработка"
  },
  "title": "Обнаружено падение удовлетворенности",
  "description": "Удовлетворенность упала на 20% за последние 30 дней",
  "severity": "high",
  "previous_value": 4.5,
  "current_value": 3.6,
  "percentage_change": -20,
  "is_resolved": false,
  "created_at": "2025-06-01T10:00:00Z"
}
```

#### Разрешение алерта тренда

```
POST /api/feedback/trend-alerts/{id}/resolve/
```

**Тело запроса:**

```json
{
  "resolution_comment": "Проблема решена путем проведения тренинга"
}
```

**Пример ответа:**

```json
{
  "id": 1,
  "rule": {
    "id": 1,
    "name": "Падение удовлетворенности",
    "rule_type": "satisfaction_drop"
  },
  "template": {
    "id": 1,
    "name": "Шаблон обратной связи"
  },
  "department": {
    "id": 1,
    "name": "Разработка"
  },
  "title": "Обнаружено падение удовлетворенности",
  "description": "Удовлетворенность упала на 20% за последние 30 дней",
  "severity": "high",
  "previous_value": 4.5,
  "current_value": 3.6,
  "percentage_change": -20,
  "is_resolved": true,
  "resolved_by": {
    "id": 1,
    "first_name": "Иван",
    "last_name": "Иванов"
  },
  "resolved_at": "2025-06-02T12:00:00Z",
  "resolution_comment": "Проблема решена путем проведения тренинга",
  "created_at": "2025-06-01T10:00:00Z"
}
```

## Типы данных

### RuleType (Тип правила)

```typescript
enum RuleType {
  SENTIMENT_DROP = "sentiment_drop",
  SATISFACTION_DROP = "satisfaction_drop",
  RESPONSE_RATE_DROP = "response_rate_drop",
  ISSUE_FREQUENCY_RISE = "issue_frequency_rise",
  TOPIC_SHIFT = "topic_shift",
}
```

### AlertSeverity (Уровень серьезности алерта)

```typescript
enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}
```

### RuleFormData (Данные формы правила)

```typescript
interface RuleFormData {
  id?: number;
  name: string;
  description: string;
  rule_type: string;
  threshold: number;
  measurement_period_days: number;
  is_active: boolean;
  templates: number[];
  departments: number[];
}
```

### AlertResolveData (Данные для разрешения алерта)

```typescript
interface AlertResolveData {
  resolution_comment: string;
}
```

## Обработка ошибок

В случае ошибки API возвращает соответствующий HTTP-код и JSON-объект с описанием ошибки:

```json
{
  "error": "Описание ошибки",
  "code": "ERROR_CODE",
  "details": {}
}
```

## Важные замечания по использованию API

### Формат URL

Все URL-пути в API используют дефисы (`-`) вместо подчеркиваний (`_`) для разделения слов. Например:

```
/api/feedback/trend-snapshots/  # Правильно
/api/feedback/trend_snapshots/  # Неправильно
```

Это соглашение должно соблюдаться во всех запросах к API.

## Тестирование API

Для тестирования доступности API-эндпоинтов используется набор автоматических тестов, расположенных в директории `frontend/src/__tests__/api/dashboardApi.test.ts`. Эти тесты проверяют:

1. Корректность работы функций API-клиента
2. Доступность всех API-эндпоинтов
3. Правильность обработки ответов

Для запуска тестов используйте команду:

```bash
npm test -- --testPathPattern=dashboardApi
```

Тесты используют библиотеку `axios-mock-adapter` для мокирования HTTP-запросов в тестовой среде и Jest для выполнения тестов и проверки результатов.
