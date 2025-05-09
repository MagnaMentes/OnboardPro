# Стандарты UI/UX проекта OnboardPro

## Общие сведения

Данный документ описывает стандартизированную систему дизайна, применяемую в проекте OnboardPro. Соблюдение этих стандартов обеспечивает единообразие пользовательского интерфейса и улучшает опыт взаимодействия с системой.

Разработано magna_mentes, 2025 г.

## Структура системы дизайна

Система дизайна OnboardPro включает:

1. **Константы дизайна** - набор переменных с фиксированными значениями для цветов, размеров, отступов и т.д.
2. **Компоненты UI** - готовые компоненты React с заданными стилями
3. **CSS-классы** - утилитарные классы для общих элементов интерфейса
4. **Функции-помощники** - вспомогательные функции для генерации стилей
5. **Стандартные анимации** - набор единых анимаций для обеспечения единообразного опыта взаимодействия

## Расположение файлов

- `/frontend/src/config/theme/theme.js` - константы дизайна
- `/frontend/src/config/theme/UIComponents.jsx` - компоненты React UI
- `/frontend/src/config/theme/index.js` - точка входа для импорта всех компонентов
- `/frontend/src/index.css` - утилитарные CSS-классы
- `/frontend/src/components/common/Modal.jsx` - компонент модального окна с анимациями

## Основные константы

### Цветовая палитра (COLORS)

Основные цвета:

- **primary** - основной цвет бренда - оттенки синего
- **secondary** - вторичный цвет - оттенки серого
- **success** - цвет успеха - оттенки зеленого
- **warning** - цвет предупреждения - оттенки желтого
- **danger** - цвет опасности - оттенки красного

Для каждого цвета доступны оттенки от 50 (самый светлый) до 900 (самый темный).

**Пример использования:**

```jsx
import { COLORS } from "../config/theme";

<div style={{ backgroundColor: COLORS.primary[500] }}>Текст на синем фоне</div>;
```

### Отступы (SPACING)

Стандартные размеры отступов:

- **none** - без отступа: "0"
- **xs** - очень маленький: "0.25rem" (4px)
- **sm** - маленький: "0.5rem" (8px)
- **md** - средний: "1rem" (16px)
- **lg** - большой: "1.5rem" (24px)
- **xl** - очень большой: "2rem" (32px)
- **xxl** - огромный: "3rem" (48px)

**Пример использования:**

```jsx
import { SPACING } from "../config/theme";

<div style={{ margin: SPACING.md, padding: SPACING.lg }}>
  Контент с отступами
</div>;
```

### Отступы между элементами (LAYOUT_SPACING)

Стандартные отступы между элементами интерфейса:

- **section** - отступ между секциями: "2.5rem" (40px)
- **component** - отступ между компонентами: "1.5rem" (24px)
- **element** - отступ между элементами в компоненте: "1rem" (16px)
- **item** - минимальный отступ между соседними элементами: "0.5rem" (8px)

**Пример использования:**

```jsx
import { LAYOUT_SPACING } from "../config/theme";

<div style={{ marginBottom: LAYOUT_SPACING.section }}>
  <SectionContent />
</div>;
```

### Другие константы

- **FONT_SIZE** - размеры шрифта
- **BORDER_RADIUS** - скругление углов
- **SHADOWS** - тени
- **TRANSITIONS** - анимации переходов
- **TASK_STATUS_CLASSES** - стили для статусов задач
- **TASK_PRIORITY_CLASSES** - стили для приоритетов задач
- **BUTTON_STYLES** - стили для кнопок
- **FORM_STYLES** - стили для элементов форм
- **CARD_STYLES** - стили для карточек
- **TABLE_STYLES** - стили для таблиц

## Стандартные компоненты

### Button

Стандартная кнопка с поддержкой разных вариантов и размеров.

```jsx
import { Button } from '../config/theme';

// Стандартная кнопка
<Button>Текст кнопки</Button>

// Кнопка с вариантом стиля
<Button variant="success">Сохранить</Button>

// Кнопка с указанием размера
<Button size="lg">Большая кнопка</Button>

// Отключенная кнопка
<Button disabled={true}>Недоступная кнопка</Button>

// Кнопка с иконкой
<Button>
  <PlusIcon className="h-5 w-5 mr-2" />
  Добавить
</Button>
```

### Card

Стандартная карточка для отображения информационных блоков.

```jsx
import { Card } from '../config/theme';

// Простая карточка
<Card>Содержимое карточки</Card>

// Карточка с заголовком
<Card title="Заголовок карточки">
  Содержимое карточки
</Card>

// Карточка с подзаголовком
<Card
  title="Заголовок карточки"
  subtitle="Дополнительная информация"
>
  Содержимое карточки
</Card>

// Карточка с футером
<Card
  title="Заголовок карточки"
  footer={<Button>Действие</Button>}
>
  Содержимое карточки
</Card>
```

### FormField

Стандартное поле ввода с лейблом и дополнительными возможностями.

```jsx
import { FormField } from '../config/theme';

// Простое текстовое поле
<FormField
  label="Имя"
  id="name"
  value={name}
  onChange={e => setName(e.target.value)}
/>

// Обязательное поле
<FormField
  label="Email"
  id="email"
  required={true}
  value={email}
  onChange={e => setEmail(e.target.value)}
/>

// Поле с ошибкой
<FormField
  label="Пароль"
  id="password"
  type="password"
  value={password}
  onChange={e => setPassword(e.target.value)}
  error="Пароль должен содержать не менее 8 символов"
/>

// Поле с иконкой
<FormField
  label="Поиск"
  id="search"
  icon={<MagnifyingGlassIcon className="h-5 w-5" />}
  value={search}
  onChange={e => setSearch(e.target.value)}
/>
```

### Другие компоненты

- **TaskStatus** - отображение статуса задачи с иконкой
- **TaskPriority** - отображение приоритета задачи
- **SelectField** - поле выбора из списка
- **CheckboxField** - чекбокс с лейблом
- **PriorityField** - поле выбора приоритета с цветовым индикатором
- **StatusField** - поле выбора статуса с иконкой

## CSS-классы

Для стандартизации стилей доступны следующие CSS-классы:

### Отступы

```jsx
// Отступы между секциями
<div className="section-spacing">...</div>

// Отступы между компонентами
<div className="component-spacing">...</div>

// Отступы между элементами
<div className="element-spacing">...</div>

// Отступы между мелкими элементами
<div className="item-spacing">...</div>
```

### Карточки

```jsx
// Стандартная карточка
<div className="standard-card">
  <div className="standard-card-header">
    <h3 className="standard-card-title">Заголовок</h3>
    <button>Действие</button>
  </div>
  <div className="standard-card-body">Содержимое</div>
  <div className="standard-card-footer">Футер карточки</div>
</div>
```

### Кнопки с иконками

```jsx
// Стандартная кнопка с иконкой
<button className="icon-button-primary">
  <svg>...</svg>
  Текст кнопки
</button>

// Иконка-кнопка с другими вариантами
<button className="icon-button-secondary">...</button>
<button className="icon-button-success">...</button>
<button className="icon-button-danger">...</button>
```

### Таблицы

```jsx
// Стандартная таблица
<table className="standard-table">
  <thead>
    <tr>
      <th>Заголовок 1</th>
      <th>Заголовок 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Ячейка 1</td>
      <td>Ячейка 2</td>
    </tr>
  </tbody>
</table>
```

## Стандартные анимации

Для обеспечения единообразного пользовательского опыта, в системе определены стандартные анимации для повторяющихся элементов интерфейса.

### Анимация панелей фильтров

Все раскрывающиеся/сворачивающиеся панели фильтров должны использовать одинаковую анимацию:

```jsx
// Стандартный заголовок для раскрывающихся панелей фильтров
<div
  className="flex justify-between items-center py-2 px-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
  onClick={() => setIsFiltersVisible(!isFiltersVisible)}
>
  <div className="flex items-center">
    <AdjustmentsVerticalIcon className="h-5 w-5 text-blue-600 mr-2" />
    <span className="text-sm font-medium text-gray-800">
      Фильтры и поиск
    </span>
  </div>
  <ChevronDownIcon
    className={`h-5 w-5 text-blue-600 transition-transform duration-200 ${
      isFiltersVisible ? "transform rotate-180" : ""
    }`}
  />
</div>

// Контейнер с анимацией для содержимого фильтров
<div 
  className={`overflow-hidden transition-all duration-300 ease-in-out ${
    isFiltersVisible ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
  }`}
>
  {/* Содержимое фильтров */}
</div>
```

Для больших списков, как например списки шаблонов, можно использовать увеличенное значение max-h:
```jsx
<div 
  className={`overflow-hidden transition-all duration-300 ease-in-out ${
    isVisible ? "max-h-[2000px] opacity-100 mt-3" : "max-h-0 opacity-0"
  }`}
>
  {/* Много содержимого */}
</div>
```

### Анимация модальных окон

Все модальные окна должны иметь плавную анимацию при открытии и закрытии:

1. При открытии:
   - Фон плавно становится непрозрачным
   - Окно плавно появляется из масштаба 95% до 100% с увеличением прозрачности

2. При закрытии:
   - Фон плавно становится прозрачным
   - Окно плавно уменьшается до 95% с уменьшением прозрачности

Компонент `Modal` в `/frontend/src/components/common/Modal.jsx` уже имеет эти анимации. При использовании:

```jsx
import Modal from "../components/common/Modal";

// В компоненте
const [isModalOpen, setIsModalOpen] = useState(false);

// В JSX
<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Заголовок модального окна"
>
  Содержимое модального окна
</Modal>
```

Интегрированная анимация обеспечит плавное появление и исчезновение модального окна без дополнительных настроек.

## Рекомендации по использованию

### 1. Единообразие отступов

Всегда используйте стандартизированные отступы между компонентами:

- Секции страницы: отступ 40px (LAYOUT_SPACING.section)
- Компоненты внутри секции: отступ 24px (LAYOUT_SPACING.component)
- Элементы внутри компонента: отступ 16px (LAYOUT_SPACING.element)
- Мелкие элементы (иконки, текст): отступ 8px (LAYOUT_SPACING.item)

### 2. Правильное использование цветов

- Основной цвет (синий): брендовые элементы, кнопки действий, ссылки
- Зеленый: положительные уведомления, статусы успеха, кнопки подтверждения
- Желтый: предупреждения, индикаторы в процессе
- Красный: ошибки, удаление, критические предупреждения
- Серый: неактивные элементы, фон, второстепенная информация

### 3. Адаптивная верстка

- Все интерфейсы должны корректно отображаться на устройствах с шириной экрана:

  - Мобильные (375px и выше)
  - Планшеты (768px и выше)
  - Десктопы (1280px и выше)
  - Большие экраны (1920px и выше)

- Используйте брейкпоинты Tailwind:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

### 4. Карточки и контейнеры

- Для всех информационных блоков используйте карточки с единым стилем
- Карточки должны иметь стандартные отступы (padding: 1.5rem)
- Внутренние элементы должны иметь стандартные отступы между собой

### 5. Кнопки и взаимодействие

- Используйте стандартные размеры кнопок:

  - xs: очень маленькие кнопки (только для компактных интерфейсов)
  - sm: компактные кнопки (для вторичных действий)
  - md: стандартные кнопки (по умолчанию для большинства случаев)
  - lg: большие кнопки (для основных действий)
  - xl: очень большие кнопки (для call-to-action)

- Кнопки должны иметь:
  - Визуальную обратную связь при наведении и нажатии
  - Фокусное кольцо для доступности с клавиатуры
  - Иконку слева от текста (если используется)

### 6. Формы и поля ввода

- Все поля должны иметь явные лейблы
- Обязательные поля отмечаются звездочкой
- Поля с ошибками отображаются с красной рамкой и текстом ошибки
- Стандартная высота полей ввода должна быть одинаковой

### 7. Анимации и интерактивные элементы

- Для всех раскрывающихся блоков (коллапсов) используйте стандартную анимацию с классами:
  ```
  transition-all duration-300 ease-in-out
  ```

- Для анимации раскрывающихся панелей используйте комбинацию:
  - Изменение максимальной высоты: от `max-h-0` до `max-h-96` (или больше)
  - Изменение прозрачности: от `opacity-0` до `opacity-100`
  - Добавление отступа сверху: `mt-3` для видимого состояния

- Для всех кнопок и интерактивных элементов добавляйте отклик при наведении с помощью классов `transition-colors` или `transition-all`

- Для иконок-индикаторов состояния (стрелки) используйте:
  ```
  transition-transform duration-200 transform rotate-180
  ```

- Для модальных окон всегда используйте компонент `Modal` с встроенными анимациями открытия и закрытия

### 8. Скорость и плавность анимаций

- Стандартная длительность анимации - 300мс (`duration-300`)
- Стандартная функция сглаживания - `ease-in-out`
- Для мелких элементов (кнопки, переключатели) - 200мс (`duration-200`)
- Для крупных элементов (модальные окна) - 300мс (`duration-300`)

## Заключение

Соблюдение этих стандартов обеспечит единообразие интерфейса во всем приложении OnboardPro, улучшит пользовательский опыт и упростит разработку новых компонентов.

При создании новых компонентов или страниц следует использовать существующие компоненты из системы дизайна и придерживаться описанных стандартов.
