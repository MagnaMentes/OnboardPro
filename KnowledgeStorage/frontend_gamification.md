# Frontend Gamification

## Обзор

Фронтенд-часть системы геймификации в OnboardPro обеспечивает интерактивное отображение прогресса и достижений пользователя в процессе онбординга.

## Компоненты

### GamificationBlock

Основной компонент для отображения прогресса и последних наград на странице онбординга.

```tsx
interface GamificationBlockProps {
  isLoading: boolean;
  userLevel: UserLevel | null;
  recentRewards: UserReward[];
}
```

### LevelProgressBar

Компонент для визуализации текущего уровня и прогресса пользователя.

```tsx
interface LevelProgressBarProps {
  userLevel: UserLevel;
}
```

Особенности:

- Отображение текущего уровня
- Прогресс-бар до следующего уровня
- Информация о набранных очках
- Анимация при повышении уровня

### RewardCard

Компонент для отображения отдельной награды.

```tsx
interface RewardCardProps {
  reward: UserReward;
}
```

Особенности:

- Иконка награды
- Название и описание
- Тип награды (достижение, медаль, уровень, значок)
- Дата получения

## API Интеграция

### GamificationAPI

```typescript
interface UserReward {
  id: number;
  reward_type: "achievement" | "medal" | "level" | "badge";
  title: string;
  description: string;
  icon: string;
  awarded_at: string;
}

interface UserLevel {
  id: number;
  level: number;
  points: number;
  updated_at: string;
  next_level_points: number | null;
  progress_percentage: number;
}

const gamificationApi = {
  getUserRewards: (type?: string) => Promise<UserReward[]>;
  getUserLevel: () => Promise<UserLevel>;
}
```

## Страницы

### RewardsPage (/rewards)

Страница со списком всех наград пользователя:

- Фильтрация по типу наград
- Сортировка по дате получения
- Детальная информация о каждой награде
- Прогресс по текущему уровню

### OnboardingProgressDemo (/onboarding/progress)

Интеграция геймификации в страницу онбординга:

- Блок с текущим уровнем и прогрессом
- Отображение последних полученных наград
- Визуальная обратная связь при получении новых наград

## Состояние приложения

### Геймификация в контексте пользователя

```typescript
interface GamificationState {
  userLevel: UserLevel | null;
  recentRewards: UserReward[];
  isLoading: boolean;
  error: string | null;
}
```

## Стилизация

Использование Chakra UI для создания современного и отзывчивого интерфейса:

- Адаптивный дизайн для всех устройств
- Анимации и переходы
- Единообразие с общим стилем приложения
- Тёмная/светлая темы

## Примеры использования

### Блок геймификации в онбординге

```tsx
<GamificationBlock
  isLoading={isGamificationLoading}
  userLevel={userLevel}
  recentRewards={recentRewards}
/>
```

### Компонент прогресса уровня

```tsx
<LevelProgressBar userLevel={userLevel} />
```

### Карточка награды

```tsx
<RewardCard reward={reward} />
```

## Рекомендации по расширению

1. Добавление новых типов наград
2. Реализация анимаций для получения наград
3. Интеграция социальных элементов
4. Добавление лидерборда
5. Расширение статистики и аналитики

## Тестирование

1. Unit-тесты для компонентов
2. Integration-тесты для API
3. E2E-тесты для пользовательских сценариев
4. Тестирование UI на различных устройствах
