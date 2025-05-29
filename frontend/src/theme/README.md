# OnboardPro Design System

## Обзор

Дизайн-система OnboardPro представляет собой набор принципов, паттернов и компонентов, разработанных для создания единого визуального языка приложения OnboardPro. Дизайн-система основана на библиотеке Chakra UI и расширяет её функциональность для соответствия брендингу и потребностям проекта.

## Принципы

1. **Последовательность** - Все элементы интерфейса должны быть стилистически согласованными.
2. **Доступность** - Интерфейс должен быть доступен для всех пользователей, включая людей с ограниченными возможностями.
3. **Адаптивность** - Все компоненты должны корректно отображаться на различных устройствах.
4. **Простота использования** - Интерфейс должен быть интуитивно понятным.

## Основные компоненты

### Типографика

```tsx
<Heading size="lg">Заголовок страницы</Heading>
<Text>Обычный текст</Text>
```

### Цветовая палитра

Основные цвета:

- `blue.500` - Основной цвет бренда
- `gray.800` - Цвет текста
- `gray.100` - Фоновый цвет элементов

### Кнопки

```tsx
<Button variant="primary">Основная кнопка</Button>
<Button variant="secondary">Вторичная кнопка</Button>
<Button variant="tertiary">Третичная кнопка</Button>
```

### Поля ввода

```tsx
<Input
  label="Email"
  placeholder="email@example.com"
  helperText="Введите ваш корпоративный email"
/>

<Input
  label="Пароль"
  type="password"
  error="Пароль должен содержать минимум 8 символов"
/>
```

### Уведомления (Alert)

```tsx
<Alert
  status="success"
  title="Успешно!"
  description="Задача успешно выполнена."
/>

<Alert
  status="error"
  title="Ошибка"
  description="Не удалось сохранить изменения."
/>
```

### Бейджи (Badge)

```tsx
<Badge>По умолчанию</Badge>
<Badge status="success">Выполнено</Badge>
<Badge status="warning">Требует внимания</Badge>
<Badge status="error">Просрочено</Badge>
<Badge status="info">В процессе</Badge>
```

### Карточки (Card)

```tsx
<Card>
  <CardHeader>
    <Heading size="md">Заголовок карточки</Heading>
  </CardHeader>
  <CardBody>
    <Text>Содержимое карточки</Text>
  </CardBody>
  <CardFooter>
    <Button>Действие</Button>
  </CardFooter>
</Card>
```

### Таблица данных (DataTable)

```tsx
const columns = [
  { key: "name", label: "Имя" },
  { key: "email", label: "Email" },
  { key: "department", label: "Отдел" },
];

<DataTable
  columns={columns}
  data={employees}
  isLoading={loading}
  onSearch={handleSearch}
  pagination={{
    currentPage: page,
    totalPages: totalPages,
    onPageChange: handlePageChange,
  }}
  actions={(row) => (
    <Button size="sm" variant="primary">
      Просмотр
    </Button>
  )}
/>;
```

### Формы (Form)

```tsx
<Form
  title="Создать задачу"
  subtitle="Заполните информацию о новой задаче"
  onSubmit={handleSubmit}
  submitButton={{ text: "Создать", isLoading: isSubmitting }}
  cancelButton={{ text: "Отмена", onClick: handleCancel }}
>
  <Input label="Название" isRequired />
  <Input label="Описание" />
  <Input label="Приоритет" />
</Form>
```

### Модальные окна (Modal)

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Подтверждение действия"
  primaryAction={{
    text: "Подтвердить",
    onClick: handleConfirm,
    isLoading: isSubmitting,
  }}
  secondaryAction={{
    text: "Отмена",
    onClick: onClose,
  }}
>
  <Text>Вы уверены, что хотите выполнить это действие?</Text>
</Modal>
```

## Тема (Theme)

Тема определена в файле `theme.ts` и содержит настройки для всех компонентов Chakra UI. Она включает в себя:

- Шрифты
- Цветовые схемы
- Размеры
- Стили компонентов
- Варианты компонентов

## Использование

### Импорт компонентов

Для использования дизайн-системы импортируйте компоненты из соответствующих файлов:

```tsx
import { Button } from "../components/common/Button";
import { Input } from "../components/common/Input";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
} from "../components/common/Card";
```

### Использование токенов дизайна

Дизайн-система включает централизованные токены для отступов, размеров и позиционирования:

```tsx
import designTokens, {
  spacing,
  margins,
  positioning,
  zIndex,
  componentSizes
} from "../theme/designTokens";

// Использование отступов
<Box p={spacing.md} mb={margins.lg}>
  <Text>Контент с отступами</Text>
</Box>

// Использование констант позиционирования
<Flex {...positioning.center}>
  <Text>Центрированный контент</Text>
</Flex>

// Размеры компонентов
<Box height={componentSizes.button.md.height}>
  Элемент с высотой как у средней кнопки
</Box>
```

Для получения подробной информации о константах позиционирования, пожалуйста, ознакомьтесь с `PositioningGuide.md` в директории `theme`.

```

## Развитие дизайн-системы

При добавлении новых компонентов или модификации существующих, убедитесь, что они:

1. Соответствуют общему стилю дизайн-системы
2. Поддерживают темный и светлый режимы
3. Доступны для людей с ограниченными возможностями
4. Имеют подробную документацию и примеры использования

## Контакты

При возникновении вопросов по дизайн-системе обращайтесь к [команде разработки].
```
