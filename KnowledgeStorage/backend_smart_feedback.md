# Smart Feedback Loop - Backend

Система Smart Feedback Loop анализирует отзывы пользователей и автоматически категоризирует их, чтобы помочь HR и менеджерам быстрее реагировать на проблемы в процессе онбординга.

## Модель данных

Расширение модели `StepFeedback` включает следующие поля:

- `auto_tag`: Автоматически назначаемая категория отзыва (одно из значений: "positive", "neutral", "negative", "unclear_instruction", "delay_warning")
- `sentiment_score`: Числовое значение тональности отзыва (от -1 до 1, где -1 - крайне негативный, 1 - крайне позитивный)

## SmartFeedbackService

Сервис для анализа текста отзывов и определения тональности/тегов.

### Функции

#### analyze_feedback(text)

Анализирует текст отзыва и возвращает тег и оценку тональности.

**Параметры:**

- `text` (str): Текст комментария

**Возвращает:**

- Кортеж (auto_tag, sentiment_score)

### Алгоритм анализа

1. **Анализ тональности (sentiment_score)**:

   - Использует библиотеку TextBlob для определения полярности текста
   - Возвращает значение от -1 до 1

2. **Автоматические теги (auto_tag)**:
   - `positive`: Позитивный отзыв (sentiment_score >= 0.2)
   - `negative`: Негативный отзыв (sentiment_score <= -0.2)
   - `neutral`: Нейтральный отзыв (-0.2 < sentiment_score < 0.2)
   - `unclear_instruction`: Отзыв указывает на непонятность инструкций (определяется по ключевым словам)
   - `delay_warning`: Отзыв указывает на проблемы со сроками (определяется по ключевым словам)

## Интеграция

Сервис `SmartFeedbackService` вызывается при создании нового отзыва в `StepFeedbackCreateView`.

```python
def perform_create(self, serializer):
    # Получаем текст комментария из данных
    comment = self.request.data.get('comment', '')

    # Импортируем здесь, чтобы избежать циклического импорта
    from .services.smart_feedback import SmartFeedbackService

    # Анализируем текст комментария с помощью SmartFeedbackService
    auto_tag, sentiment_score = SmartFeedbackService.analyze_feedback(comment)

    # Устанавливаем текущего пользователя и результаты анализа
    serializer.save(
        user=self.request.user,
        auto_tag=auto_tag,
        sentiment_score=sentiment_score
    )
```

## Использование в API

Поля `auto_tag` и `sentiment_score` доступны через API и могут использоваться для:

1. Фильтрации отзывов по тегам
2. Сортировки отзывов по тональности
3. Визуализации тональности (например, через смайлики/эмодзи)
4. Приоритизации проблемных отзывов для HR-специалистов
5. Формирования автоматических отчетов по проблемным зонам в онбординге
