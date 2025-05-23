# Backend: Система Геймификации

## Обзор

Модуль геймификации на бэкенде отвечает за управление наградами, уровнями и очками пользователей, начисляемыми за их активность в системе онбординга.

## Модели Данных

Расположение: `backend/gamification/models.py`

### 1. `UserReward`

Хранит информацию о наградах, выданных пользователям.

- `user` (ForeignKey на `User`): Пользователь, получивший награду.
- `reward_type` (Enum: `achievement`, `medal`, `level`, `badge`): Тип награды.
- `title` (String): Название награды.
- `description` (String): Описание награды.
- `icon` (String/Slug): Идентификатор иконки для награды.
- `awarded_at` (DateTime): Дата и время вручения награды.

### 2. `UserLevel`

Хранит информацию об уровне и очках пользователя.

- `user` (ForeignKey на `User`): Пользователь.
- `level` (Integer): Текущий уровень пользователя.
- `points` (Integer): Общее количество очков пользователя.
- `updated_at` (DateTime): Дата и время последнего обновления уровня/очков.

## Сервисы

Расположение: `backend/gamification/services.py`

### `GamificationService`

Основной сервис для управления логикой геймификации.

- **Основные методы:**
  - `add_points(user, points_type, count=1)`: Начисляет очки пользователю за определенный тип действия (`step_completion`, `test_completion`, `feedback_submission`). Автоматически проверяет и повышает уровень при достижении пороговых значений.
  - `award_achievement(user, achievement_key)`: Выдает пользователю предопределенную награду (ачивку, медаль, значок) за ключевые действия (например, 'first_step', 'complete_onboarding').
  - `award_level_up(user, new_level, old_level)`: Выдает награду типа 'level' при повышении уровня.
  - `get_or_create_user_level(user)`: Получает или создает запись об уровне пользователя.
- **Методы-обработчики:**
  - `handle_step_completion(user, step)`: Вызывается при завершении шага онбординга. Начисляет очки и может выдать награду 'first_step' или 'complete_onboarding'.
  - `handle_test_completion(user, test_result)`: Вызывается при успешном прохождении теста. Начисляет очки и может выдать награду 'perfect_test'.
  - `handle_feedback_submission(user, feedback)`: Вызывается при отправке фидбека. Начисляет очки и может выдать награду 'feedback_king' (например, за 10 фидбеков).
- **Конфигурация:**
  - `POINTS_CONFIG`: Словарь с количеством очков за разные типы действий.
  - `LEVEL_THRESHOLDS`: Словарь с пороговыми значениями очков для каждого уровня.
  - `KEY_ACHIEVEMENTS`: Словарь с описанием ключевых наград.

## API Эндпоинты

Расположение: `backend/gamification/views.py` и `backend/gamification/urls.py`

Базовый URL: `/api/gamification/`

1.  **GET `/rewards/`**

    - Описание: Получение списка всех наград текущего аутентифицированного пользователя.
    - Параметры запроса (query params):
      - `type` (string, опционально): Фильтрация наград по типу (`achievement`, `medal`, `level`, `badge`).
    - Ответ: Список объектов `UserReward`.
    - Права доступа: `IsAuthenticated`.

2.  **GET `/level/`**
    - Описание: Получение текущего уровня и количества очков текущего аутентифицированного пользователя.
    - Ответ: Объект `UserLevel`.
    - Права доступа: `IsAuthenticated`.

## Интеграция с другими модулями

Сервис `GamificationService` интегрирован со следующими действиями в модуле `onboarding`:

- **Завершение шага онбординга:**
  - Место интеграции: `onboarding.views.CompleteStepView.post()`
  - Вызываемый метод: `GamificationService.handle_step_completion(user, step)`
- **Успешное прохождение теста:**
  - Место интеграции: `onboarding.lms_views.LMSTestSubmitView.post()`
  - Вызываемый метод: `GamificationService.handle_test_completion(request.user, test_result)`
- **Отправка фидбека:**
  - Место интеграции: `onboarding.feedback_views.StepFeedbackCreateView.perform_create()`
  - Вызываемый метод: `GamificationService.handle_feedback_submission(request.user, step_feedback)`

## Миграции

Модели `UserReward` и `UserLevel` требуют создания и применения миграций базы данных. Это стандартный процесс Django:

```bash
python manage.py makemigrations gamification
python manage.py migrate
```
