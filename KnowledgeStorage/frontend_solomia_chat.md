# Solomia Chat - Frontend Documentation

## Обзор

Solomia Chat - интерактивный чат с AI-ассистентом, встроенный в интерфейс OnboardPro. Чат предоставляет персонализированную помощь пользователям на каждом шаге онбординга и сохраняет историю общения, что позволяет контекстно отвечать на вопросы пользователей.

## Компоненты

### SolomiaChatWidget

Основной компонент для отображения чата с AI-ассистентом Solomia на странице шага онбординга.

**Путь**: `src/components/SolomiaChatWidget.tsx`

**Props**:

```typescript
interface SolomiaChatWidgetProps {
  stepId: number;
  isStepActive?: boolean;
  stepSupportsAI?: boolean;
}
```

**Функциональность:**

- При загрузке запрашивает историю сообщений для текущего шага
- Отображает историю сообщений с разделением по ролям (пользователь/AI)
- Обеспечивает поле ввода для отправки новых сообщений
- Отправляет сообщения на сервер и получает ответы
- Обрабатывает состояния загрузки и ошибок
- Автоматически прокручивает к последнему сообщению
- Визуально различает сообщения пользователя и AI

**Состояния:**

- `messages`: массив сообщений чата
- `newMessage`: текст нового сообщения
- `isLoading`: флаг процесса загрузки/отправки

### StepCard (интеграция)

Компонент карточки шага с интегрированным чатом Solomia.

**Путь**: `src/components/StepCard.tsx`

**Props**:

```typescript
interface StepCardProps {
  stepId: number;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "done";
  type: string;
  isRequired: boolean;
  order: number;
  completedAt?: string | null;
}
```

**Функциональность:**

- Отображает информацию о шаге онбординга
- Включает кнопку для показа/скрытия чата
- Условно отображает чат только для активных шагов
- Использует компонент SolomiaChatWidget

## API-клиент

**Файл**: `src/api/solomiaChatApi.ts`

**Интерфейсы**:

```typescript
export interface ChatMessage {
  id: number;
  role: "human" | "assistant";
  message: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}
```

**Методы**:

### getChatHistory

Получает историю чата для конкретного шага.

```typescript
getChatHistory: async (stepId: number): Promise<ChatMessage[]>
```

### sendMessage

Отправляет сообщение и получает ответ.

```typescript
sendMessage: async (stepId: number, message: string): Promise<ChatMessage[]>
```

## Внешний вид и UX

- **Цветовое кодирование**: Сообщения пользователя и AI различаются по цвету и позиции
- **Индикаторы загрузки**: Отображаются при ожидании ответа от сервера
- **Пустое состояние**: Приветственное сообщение, если история чата пуста
- **Автопрокрутка**: Автоматическая прокрутка к последнему сообщению

## Интеграция с другими компонентами

Чат Solomia доступен через кнопку в карточке шага онбординга. Он загружается для каждого шага отдельно, что позволяет получать контекстно-зависимые подсказки.

## Примеры использования

### Базовое использование

```tsx
<SolomiaChatWidget stepId={123} isStepActive={true} stepSupportsAI={true} />
```

### Интеграция в карточку шага

```tsx
<StepCard
  stepId={123}
  name="Знакомство с командой"
  description="Познакомьтесь с вашей новой командой"
  status="in_progress"
  type="meeting"
  isRequired={true}
  order={1}
/>
```

## Маршрутизация

Демонстрационная страница доступна по маршруту `/onboarding/progress` и защищена авторизацией через компонент `ProtectedRoute`.

## Дальнейшее развитие

Запланированные доработки:

- Интеграция с настоящим AI API (GPT/OpenRouter)
- Добавление кнопок быстрых ответов
- Возможность отправки изображений в чат
- Добавление обучения на истории сообщений
