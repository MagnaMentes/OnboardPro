# Техническая документация по обновлениям HR Dashboard

## Обзор модулей

### Компоненты

#### AnalyticsTabs.jsx
Компонент вкладок для навигации между различными разделами HR Dashboard.

```jsx
import React, { useMemo } from "react";
import { ChartBarIcon, CalendarDaysIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

/**
 * Компонент для отображения вкладок аналитики на странице HR Dashboard
 *
 * @param {string} activeTab - Активная вкладка
 * @param {function} setActiveTab - Функция для переключения вкладки
 */
const AnalyticsTabs = ({ activeTab, setActiveTab }) => {
  // Структура вкладок для масштабируемости
  const tabs = useMemo(() => [
    { id: "analytics", label: "Аналитика", icon: ChartBarIcon },
    { id: "calendar", label: "Календарь", icon: CalendarDaysIcon },
    { id: "reports", label: "Отчеты", icon: DocumentTextIcon }
  ], []);
  
  // ... рендеринг вкладок
};
```

#### StatCard.jsx
Переиспользуемый компонент для отображения карточек со статистическими данными.

```jsx
/**
 * Компонент для отображения карточки со статистикой
 *
 * @param {string} title - Заголовок карточки
 * @param {number|string} value - Значение статистики
 * @param {Component} icon - Иконка (из Heroicons)
 * @param {string} color - Цвет темы карточки
 * @param {number|string} prevValue - Предыдущее значение (опционально)
 */
export const StatCard = ({ title, value, icon: Icon, color, prevValue }) => {
  // ... рендеринг карточки
};
```

#### FilterPanels.jsx
Компоненты для фильтрации данных на странице.

```jsx
/**
 * Компонент панели фильтров для аналитики
 *
 * @param {Object} filters - Текущие фильтры
 * @param {Array} departments - Список отделов
 * @param {Function} onFilterChange - Функция обработки изменения фильтров
 * @param {Function} onClose - Функция закрытия панели
 * @param {Function} onApply - Функция применения фильтров
 * @param {Function} onReset - Функция сброса фильтров
 */
export const FilterPanel = ({ filters, departments, onFilterChange, onClose, onApply, onReset }) => {
  // ... рендеринг панели фильтров
};
```

#### KPIPanel.jsx
Компонент для отображения ключевых показателей эффективности.

```jsx
/**
 * Компонент для отображения ключевых показателей аналитики (KPI)
 *
 * @param {Object} kpiData - Данные KPI
 * @param {Object} filters - Текущие фильтры
 * @param {Object} taskStats - Статистика по задачам
 * @param {Object} prevTaskStats - Статистика по задачам за предыдущий период
 */
const KPIPanel = ({ kpiData, filters, taskStats, prevTaskStats }) => {
  // ... рендеринг панели KPI
};
```

#### InProgressTasksList.jsx
Отображает задачи, находящиеся в процессе выполнения.

```jsx
/**
 * Компонент для отображения задач, находящихся в процессе выполнения
 *
 * @param {Array} inProgressTasks - Массив задач в процессе выполнения
 */
const InProgressTasksList = ({ inProgressTasks = [] }) => {
  // ... рендеринг списка задач
};
```

### Утилиты

#### hrAnalyticsHelpers.js
Содержит функции для обработки и подготовки аналитических данных.

```javascript
/**
 * Проверяет и исправляет структуру данных аналитики
 * @param {Object} analyticsData - Данные аналитики
 * @returns {Object} Исправленные данные
 */
export const verifyAndFixAnalyticsData = (analyticsData) => {
  // ... логика проверки и исправления
};

/**
 * Готовит данные для отображения на графиках
 * @param {Object} analytics - Данные аналитики
 * @param {Object} taskAnalytics - Данные аналитики задач
 * @returns {Object} Подготовленные данные для графиков
 */
export const prepareChartData = (analytics, taskAnalytics) => {
  // ... логика подготовки данных
};

/**
 * Извлекает данные KPI из аналитики
 * @param {Object} analytics - Данные аналитики
 * @param {Object} previousAnalytics - Данные предыдущей аналитики
 * @returns {Object} KPI данные
 */
export const extractKPIData = (analytics, previousAnalytics) => {
  // ... логика извлечения KPI
};
```

#### hrWebSocketHelpers.js
Содержит функции для работы с WebSocket соединениями.

```javascript
/**
 * Инициализирует обработчики WebSocket в HR Dashboard
 * @param {Object} webSocketService - Сервис WebSocket
 * @param {Function} setAnalytics - Функция установки аналитики
 * @param {Function} setPreviousAnalytics - Функция установки предыдущей аналитики
 * @param {Function} setTaskAnalytics - Функция установки аналитики задач
 * @param {Function} setUserAnalytics - Функция установки аналитики пользователей
 * @param {Function} setHasRealtimeUpdates - Функция установки флага реального времени
 * @param {Function} setLastUpdate - Функция установки времени последнего обновления
 * @param {Function} toast - Функция отображения уведомлений
 * @returns {Object} Объект с функциями-обработчиками
 */
export const setupHRWebSocketHandlers = (
  webSocketService,
  // ... другие параметры
) => {
  // ... реализация обработчиков
};
```

## Устранённые проблемы

1. **Несоответствие счетчиков задач**
   - Проблема: Счетчик задач в процессе не соответствовал фактическому количеству задач в списке
   - Решение: Синхронизация счетчика с длиной массива задач в WebSocket обработчиках

2. **Нестабильность WebSocket в Docker**
   - Проблема: В Docker-среде иногда терялись WebSocket соединения без уведомлений
   - Решение: Улучшенная обработка ошибок и автоматическое восстановление соединений

3. **Низкая производительность при обновлении данных**
   - Проблема: Излишние ререндеры компонентов при обновлении данных
   - Решение: Использование useMemo для вычислений и создания производных данных

## Рекомендации по использованию

### Работа с компонентами

```jsx
// Импорт компонентов
import AnalyticsTabs from "../components/specific/hr/AnalyticsTabs";
import { StatCard } from "../components/specific/hr/StatCard";
import KPIPanel from "../components/specific/hr/KPIPanel";

// Использование компонентов
<AnalyticsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

<StatCard 
  title="Всего задач" 
  value={taskStats.total} 
  icon={DocumentTextIcon} 
  color="blue" 
  prevValue={prevTaskStats?.total} 
/>

<KPIPanel
  kpiData={kpiData}
  filters={filters}
  taskStats={taskStats}
  prevTaskStats={prevTaskStats}
/>
```

### Работа с утилитами

```jsx
import { verifyAndFixAnalyticsData, prepareChartData } from "../utils/hrAnalyticsHelpers";
import { setupHRWebSocketHandlers } from "../utils/hrWebSocketHelpers";

// Использование функций обработки данных
const fixedAnalyticsResponse = verifyAndFixAnalyticsData(analyticsResponse);
const chartData = prepareChartData(analytics, taskAnalytics);

// Настройка WebSocket обработчиков
const {
  handleAnalyticsUpdate,
  handleTaskStatusChanged,
  handleConnectionEstablished,
  handleError,
  cleanupWebSocket,
} = setupHRWebSocketHandlers(
  webSocketService,
  setAnalytics,
  setPreviousAnalytics,
  // ... другие параметры
);

// Подписка на события
webSocketService.onAnalyticsUpdate(handleAnalyticsUpdate);
webSocketService.onTaskStatusChanged(handleTaskStatusChanged);
// ... другие обработчики
```
