# AI Insights - Модуль аналитики на базе искусственного интеллекта

## Общее описание

Модуль AI Insights предоставляет аналитику и инсайты на основе искусственного интеллекта для оценки рисков и прогресса онбординга сотрудников. Используя имеющиеся данные о прогрессе прохождения шагов, обратной связи и настроении, модуль выявляет потенциальные проблемы и предоставляет рекомендации HR-менеджерам для своевременного вмешательства.

## Модели данных

### AIInsight

Основная модель для хранения инсайтов AI:

- `user` (FK на User): Сотрудник, к которому относится инсайт
- `assignment` (FK на UserOnboardingAssignment): Назначение онбординга
- `risk_level` (enum: low, medium, high): Уровень риска провала онбординга
- `reason` (текст): Текстовое объяснение причин риска
- `created_at` (datetime): Дата и время создания инсайта

## Сервисы

### AIInsightService

Сервис для анализа данных и создания инсайтов:

- `analyze_onboarding_progress(assignment)`: Анализирует прогресс конкретного назначения онбординга
- `_analyze_mood(assignment)`: Анализирует настроение пользователя (внутренний метод)
- `_analyze_steps_progress(assignment)`: Анализирует выполнение шагов (внутренний метод)
- `_analyze_step_feedback(assignment)`: Анализирует обратную связь по шагам (внутренний метод)
- `get_insights_for_user(user_id)`: Возвращает инсайты для конкретного пользователя
- `get_all_insights()`: Возвращает все инсайты

## События и триггеры

Анализ выполняется автоматически при:

1. Создании/обновлении настроения пользователя (FeedbackMood)
2. Создании/обновлении отзыва о шаге (StepFeedback)
3. Обновлении прогресса по шагу (UserStepProgress)

Также возможен периодический анализ через management command `analyze_insights`.

## API Endpoints

### GET /api/ai/insights/

Получение списка всех инсайтов.

**Ответ:**
```json
[
  {
    "id": 1,
    "user": 5,
    "user_email": "employee@example.com",
    "user_full_name": "Иван Иванов",
    "assignment": 3,
    "program_name": "Онбординг разработчика",
    "risk_level": "high",
    "risk_level_display": "High",
    "reason": "Просрочено 3 шагов онбординга (30%).\nПреобладают негативные настроения в последние 7 дней.",
    "created_at": "2025-05-23T10:30:00Z"
  }
]
```

### GET /api/ai/insights/user/{user_id}/

Получение инсайтов для конкретного пользователя.

**Ответ:** 
Аналогичен GET /api/ai/insights/, но только для указанного пользователя.

### POST /api/ai/insights/analyze/{assignment_id}/

Ручной запуск анализа для конкретного назначения.

**Ответ:**
```json
{
  "id": 1,
  "user": 5,
  "user_email": "employee@example.com",
  "user_full_name": "Иван Иванов",
  "assignment": 3,
  "program_name": "Онбординг разработчика",
  "risk_level": "high",
  "risk_level_display": "High",
  "reason": "Просрочено 3 шагов онбординга (30%).",
  "created_at": "2025-05-23T10:30:00Z"
}
```

## Management Commands

### analyze_insights

Запускает анализ для всех активных назначений.

**Использование:**
```bash
python manage.py analyze_insights
```

С фильтром по пользователю:
```bash
python manage.py analyze_insights --user_id=5
```

## Разрешения

Все API-эндпоинты доступны только для пользователей с ролями HR или Admin.
