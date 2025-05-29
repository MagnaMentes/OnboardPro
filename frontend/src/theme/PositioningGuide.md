# Руководство по использованию констант позиционирования

## Обзор

Система позиционирования OnboardPro позволяет стандартизировать расположение элементов интерфейса на экране, что обеспечивает единообразие и предсказуемость UI во всём приложении.

## Основные константы позиционирования

Все константы доступны из файла `designTokens.ts` и могут быть импортированы следующим образом:

```tsx
import designTokens, {
  positioning,
  spacing,
  margins,
} from "../../theme/designTokens";
```

### Flex позиционирование

```tsx
// Центрирование по горизонтали и вертикали
<Box {...positioning.center}>
  <Text>Центрированный контент</Text>
</Box>

// Центрирование только по горизонтали
<Box {...positioning.centerHorizontal}>
  <Text>Контент по центру горизонтально</Text>
</Box>

// Центрирование только по вертикали
<Box {...positioning.centerVertical}>
  <Text>Контент по центру вертикально</Text>
</Box>

// Выравнивание по краям
<Box {...positioning.spaceBetween}>
  <Text>Слева</Text>
  <Text>Справа</Text>
</Box>

// Равномерное распределение
<Box {...positioning.spaceAround}>
  <Text>Элемент 1</Text>
  <Text>Элемент 2</Text>
  <Text>Элемент 3</Text>
</Box>

// В начале
<Box {...positioning.flexStart}>
  <Text>В начале</Text>
</Box>

// В конце
<Box {...positioning.flexEnd}>
  <Text>В конце</Text>
</Box>
```

## Отступы и размеры

Используйте константы `spacing` и `margins` для задания согласованных отступов:

```tsx
// Внутренние отступы
<Box p={spacing.md}>
  <Text>Контент с отступом</Text>
</Box>

// Внешние отступы
<Box mt={margins.md}>
  <Text>Контент с верхним margin</Text>
</Box>

// Специфические отступы
<Box
  pt={spacing.lg}
  pb={spacing.md}
  px={spacing.xl}
>
  <Text>Контент с различными отступами</Text>
</Box>
```

## Z-индексы

Для контроля слоев интерфейса используйте константы из объекта `zIndex`:

```tsx
import { zIndex } from '../../theme/designTokens';

<Box position="fixed" zIndex={zIndex.sticky}>
  Прилипающий элемент
</Box>

<Modal zIndex={zIndex.modal}>
  Модальное окно
</Modal>
```

## Размеры компонентов

Для обеспечения консистентных размеров компонентов используйте константы из `componentSizes`:

```tsx
import { componentSizes } from "../../theme/designTokens";

const size = "md"; // или "sm", "lg"
const buttonSize = componentSizes.button[size];

<Button
  height={buttonSize.height}
  fontSize={buttonSize.fontSize}
  px={buttonSize.padding}
>
  Кнопка
</Button>;
```

## Примеры использования для компонентов

### Карточка с константами позиционирования

```tsx
<Card>
  <CardHeader {...positioning.spaceBetween}>
    <Heading size="md">Заголовок карточки</Heading>
    <Badge>Статус</Badge>
  </CardHeader>
  <CardBody p={spacing.md}>
    <Text mb={margins.md}>Содержимое карточки</Text>
    <Progress value={80} />
  </CardBody>
  <CardFooter {...positioning.flexEnd}>
    <Button variant="primary" mr={spacing.sm}>
      Сохранить
    </Button>
    <Button variant="secondary">Отмена</Button>
  </CardFooter>
</Card>
```

### Таблица данных с константами

```tsx
<DataTable
  columns={columns}
  data={data}
  // Остальные пропсы
/>
```

## Рекомендации по использованию

1. **Всегда используйте константы** вместо хардкодинга значений позиционирования
2. **Используйте предопределенные стили** из объекта positioning, чтобы избежать дублирования кода
3. **Поддерживайте консистентность** между компонентами, используя одинаковые константы для похожих элементов
4. **Расширяйте систему** при необходимости, добавляя новые константы в designTokens.ts
5. **Документируйте новые константы** в этом руководстве

## Лучшие практики

- Используйте `{...positioning.center}` вместо `display="flex" justifyContent="center" alignItems="center"`
- Для отступов всегда пользуйтесь токенами spacing и margins вместо произвольных значений
- При создании новых компонентов, придерживайтесь существующих паттернов позиционирования
- Если нужно модифицировать позиционирование, лучше создать новую константу в designTokens.ts

## Частые проблемы и их решения

### Элементы не выравниваются как ожидалось

Убедитесь, что родительский контейнер имеет достаточные размеры и правильно заданный display (flex/grid).

### Отступы не соответствуют макету

Проверьте, что вы используете правильные константы из spacing/margins и применяете их к правильным сторонам компонента.

### Z-index конфликты

Используйте константы из zIndex для обеспечения корректного порядка отображения слоев интерфейса.
