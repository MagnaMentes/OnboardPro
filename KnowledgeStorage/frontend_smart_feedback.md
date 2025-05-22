# Smart Feedback Loop - Frontend

## Компоненты

### StepFeedbackCard

Карточка для отображения отдельного отзыва о шаге с визуализацией тональности и автоматических тегов.

- **Путь**: `src/components/feedback/StepFeedbackCard.tsx`
- **Props**:
  - `feedback: StepFeedback` - Объект отзыва о шаге

Компонент визуализирует:

- Название шага
- Дату создания отзыва
- Автоматический тег в виде цветного бейджа
- Оценку тональности в виде эмодзи
- Текст комментария

### FeedbackList

Компонент для отображения списка отзывов с фильтрацией по тегам и поиском.

- **Путь**: `src/components/feedback/FeedbackList.tsx`
- **Props**:
  - `feedbacks: StepFeedback[]` - Массив отзывов
  - `isLoading: boolean` - Флаг загрузки данных

Функциональность:

- Фильтрация по автоматическим тегам
- Поиск отзывов по тексту комментария или названию шага
- Отображение количества отзывов

## Страницы

### FeedbackPage

Страница для просмотра всех отзывов пользователей с расширенной фильтрацией.

- **Путь**: `src/pages/admin/FeedbackPage.tsx`

Функциональность:

- Отображение списка всех отзывов
- Фильтрация по типам меток
- Фильтрация по уровню тональности

### AssignmentFeedbackPage

Страница для просмотра отзывов по конкретному назначению.

- **Путь**: `src/pages/admin/AssignmentFeedback.tsx`
- **URL**: `/admin/assignments/:id/feedback`

Функциональность:

- Просмотр отзывов для конкретного назначения
- Табы для переключения между отзывами о шагах и записями о настроении

## API Интерфейс

### Типы данных

```typescript
// Тип для отзыва о шаге
export interface StepFeedback {
  id: number;
  user_email: string;
  step_name: string;
  comment: string;
  auto_tag: string;
  auto_tag_display: string;
  sentiment_score: number;
  created_at: string;
}

// Тип для всей обратной связи по назначению
export interface AssignmentFeedback {
  assignment_id: number;
  program_name: string;
  user_email: string;
  moods: FeedbackMood[];
  step_feedbacks: StepFeedback[];
}
```

### API Запросы

```typescript
// Получение всех отзывов по конкретному назначению
getAssignmentFeedback: async (
  assignmentId: number
): Promise<AssignmentFeedback> => {
  const response = await api.get(`/api/feedback/assignment/${assignmentId}/`);
  return response.data;
};
```

## Визуальные элементы

### Отображение тональности

- **Очень позитивный** (0.6-1.0): 😄 Зеленый цвет
- **Позитивный** (0.2-0.6): 🙂 Светло-зеленый цвет
- **Нейтральный** (-0.2-0.2): 😐 Серый цвет
- **Негативный** (-0.6-(-0.2)): 🙁 Светло-красный цвет
- **Очень негативный** (-1.0-(-0.6)): 😞 Красный цвет

### Цветовая схема тегов

- **positive**: Зеленый
- **neutral**: Серый
- **negative**: Красный
- **unclear_instruction**: Оранжевый
- **delay_warning**: Желтый
