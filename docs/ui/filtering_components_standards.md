# Стандарты дизайна компонентов фильтрации в OnboardPro

## Общие принципы

Компоненты фильтрации в OnboardPro следуют единым принципам дизайна для обеспечения согласованного пользовательского опыта:

1. **Единообразие интерфейса** — компоненты фильтрации во всех разделах следуют одним и тем же паттернам дизайна
2. **Мгновенная обратная связь** — фильтры применяются автоматически при изменении
3. **Минимализм** — отсутствие избыточных элементов и дублирования информации
4. **Информативность** — отображение количества активных фильтров и текущего статуса
5. **Анимация** — плавные переходы при открытии/закрытии панелей фильтров

## Структура компонентов фильтрации

### 1. Кнопка переключения фильтров

```jsx
<div
  className="flex justify-between items-center py-2 px-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
  onClick={() => setIsPanelOpen(!isPanelOpen)}
>
  <div className="flex items-center">
    <AdjustmentsVerticalIcon className="h-5 w-5 text-blue-600 mr-2" />
    <span className="text-sm font-medium text-gray-800">
      Фильтры и поиск [название блока]
    </span>
  </div>
  <div className="flex items-center">
    {/* Индикатор активных фильтров */}
    {hasActiveFilters && (
      <span className="inline-flex items-center justify-center w-5 h-5 mr-2 text-xs font-semibold text-white bg-blue-600 rounded-full">
        {activeFiltersCount}
      </span>
    )}
    <ChevronDownIcon
      className={`h-5 w-5 text-blue-600 transition-transform duration-200 ${
        isPanelOpen ? "transform rotate-180" : ""
      }`}
    />
  </div>
</div>
```

### 2. Панель фильтрации

```jsx
<Card className="filter-panel transform transition-all shadow-lg border border-blue-100">
  {/* Строка поиска и кнопка закрытия */}
  <div className="flex items-center mb-4 gap-2">
    <div className="flex-grow relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Поиск по названию или описанию"
        className={FORM_STYLES.input}
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
          title="Очистить поиск"
        >
          <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
    <button
      onClick={() => onToggle(false)}
      className="text-gray-400 hover:text-gray-600 transition-colors"
      aria-label="Закрыть панель фильтров"
    >
      <XMarkIcon className="h-5 w-5" />
    </button>
  </div>

  {/* Группа фильтров */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Фильтры */}
  </div>

  {/* Кнопка сброса */}
  <div className="flex justify-end mt-6">
    <Button
      onClick={handleResetFilters}
      variant="secondary"
      className="mr-2"
    >
      Сбросить фильтры
    </Button>
  </div>
</Card>
```

### 3. Пустая область (отсутствие данных)

```jsx
<div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
  <IconComponent className="mx-auto h-12 w-12 text-gray-400" />
  <h3 className="mt-2 text-base font-medium text-gray-900">
    Нет доступных данных
  </h3>
  <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
    {hasFilters
      ? "Нет данных, соответствующих заданным фильтрам."
      : "Данные еще не были созданы."}
  </p>
</div>
```

## CSS-классы для анимации

```css
.filter-animation-wrapper {
  z-index: 20 !important;
  position: relative !important;
  width: 100% !important;
}

.filter-panel {
  transform-origin: top center !important;
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1),
    0 8px 10px -6px rgba(59, 130, 246, 0.1) !important;
  border-radius: 0.5rem !important;
}

.filter-animation-enter {
  opacity: 0 !important;
  transform: translateY(-20px) scale(0.95) !important;
  pointer-events: none !important;
}

.filter-animation-enter-active {
  opacity: 1 !important;
  transform: translateY(0) scale(1) !important;
  transition: opacity 400ms cubic-bezier(0.25, 0.1, 0.25, 1),
    transform 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  pointer-events: all !important;
}

.filter-animation-exit {
  opacity: 1 !important;
  transform: translateY(0) scale(1) !important;
  pointer-events: none !important;
}

.filter-animation-exit-active {
  opacity: 0 !important;
  transform: translateY(-10px) scale(0.95) !important;
  transition: opacity 300ms cubic-bezier(0.55, 0.055, 0.675, 0.19),
    transform 300ms cubic-bezier(0.6, 0.04, 0.98, 0.335) !important;
  pointer-events: none !important;
}

.filter-animation-appear {
  opacity: 0 !important;
  transform: translateY(-20px) scale(0.95) !important;
  pointer-events: none !important;
}

.filter-animation-appear-active {
  opacity: 1 !important;
  transform: translateY(0) scale(1) !important;
  transition: opacity 400ms cubic-bezier(0.25, 0.1, 0.25, 1),
    transform 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  pointer-events: all !important;
}
```

## Лучшие практики реализации

1. **Мемоизация фильтрации** - используйте `useMemo` для предотвращения лишних перерендеров:
   ```jsx
   const filteredItems = useMemo(() => {
     let result = [...items];
     
     if (searchQuery.trim()) {
       const query = searchQuery.toLowerCase();
       result = result.filter(item => 
         item.title.toLowerCase().includes(query) || 
         item.description.toLowerCase().includes(query)
       );
     }
     
     // Другие фильтры...
     
     return result;
   }, [items, searchQuery, otherFilter1, otherFilter2]);
   ```

2. **Анимация монтирования/размонтирования**:
   ```jsx
   useEffect(() => {
     if (isVisible && !isMounted) {
       setIsMounted(true);
     } else if (!isVisible && isMounted) {
       const timer = setTimeout(() => {
         setIsMounted(false);
       }, 500);
       return () => clearTimeout(timer);
     }
   }, [isVisible, isMounted]);
   ```

3. **Индикация количества активных фильтров**:
   ```jsx
   const activeFiltersCount = [
     filter1 !== defaultValue ? 1 : 0,
     filter2 !== defaultValue ? 1 : 0,
     searchQuery.trim() ? 1 : 0,
   ].reduce((a, b) => a + b, 0);
   ```

## Чек-лист внедрения компонентов фильтрации

- [ ] Кнопка переключения фильтров имеет единый вид во всех блоках
- [ ] Используется индикатор количества активных фильтров
- [ ] Поле поиска размещено в одной строке с кнопкой закрытия панели
- [ ] Поле поиска имеет кнопку для быстрой очистки
- [ ] Кнопка "Сбросить фильтры" использует компонент Button с вариантом "secondary"
- [ ] Отсутствует кнопка "Применить" (фильтры применяются автоматически)
- [ ] Пустые состояния имеют единый стиль отображения
- [ ] Настроены все классы анимации из CSS
- [ ] Имена фильтров соответствуют формату "Фильтры и поиск [название блока]"
