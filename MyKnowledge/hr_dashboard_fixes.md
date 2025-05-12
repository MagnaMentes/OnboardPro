# Решение проблемы с графиками в HR Dashboard

## Проблема

Графики на странице HR Dashboard не отображали актуальные данные из-за того, что в функции `useMemo` для `chartData` использовались жестко закодированные (hardcoded) значения, а не реальные данные из API.

## Анализ

1. В файле `HRDashboard.jsx` функция `chartData` содержала жестко заданные значения:

```javascript
return {
  priority: {
    labels: ["Высокий", "Средний", "Низкий"],
    datasets: [
      {
        label: "Количество задач",
        data: [5, 10, 15], // Хардкодные данные вместо реальных
        // ...
      },
    ],
  },
  // ...
};
```

2. При этом данные с бэкенда корректно загружались через `fetchUpdatedAnalytics()`, но не использовались для отображения графиков:

```javascript
const taskAnalyticsData = {
  summary: {
    tasksByPriority: analyticsResponse.task_stats?.priority || {},
    departmentStats: {},
  },
};
```

## Решение

1. Изменена функция `useMemo` для `chartData` - теперь она использует реальные данные из `analytics.task_stats.priority`:

```javascript
const chartData = useMemo(() => {
  if (
    !analytics ||
    !analytics.task_stats ||
    !taskAnalytics ||
    !taskAnalytics.summary
  )
    return null;

  // Получаем данные о задачах по приоритету из API
  const tasksByPriority = analytics.task_stats.priority || {};

  // Создаем правильные метки и данные для графика приоритетов
  const priorityLabels = [];
  const priorityData = [];

  // Сопоставление приоритетов с русскими названиями
  const priorityMapping = {
    high: "Высокий",
    medium: "Средний",
    low: "Низкий",
  };

  // Создаем массивы меток и данных из реальных данных API
  for (const [priority, stats] of Object.entries(tasksByPriority)) {
    priorityLabels.push(priorityMapping[priority] || priority);
    priorityData.push(stats.total || 0);
  }

  // Аналогичные изменения для графика отделов
  // ...
}, [analytics, taskAnalytics]);
```

2. Исправлен обработчик WebSocket сообщений для корректного форматирования данных:

```javascript
const handleAnalyticsUpdate = (data) => {
  // ...
  if (data.data.current) {
    setAnalytics(data.data.current);

    // Форматируем данные для taskAnalytics в правильном формате
    const analyticsResponse = data.data.current;

    const taskAnalyticsData = {
      summary: {
        tasksByPriority: analyticsResponse.task_stats?.priority || {},
        departmentStats: analyticsResponse.department_stats || {},
      },
    };

    setTaskAnalytics(taskAnalyticsData);
  }
  // ...
};
```

3. Устранены предупреждения линтера React Hooks, добавлены зависимости где требовалось.

## Результат

Графики на странице HR Dashboard теперь отображают реальные данные из API. Обновления через WebSocket также корректно отображаются на графиках в режиме реального времени.

## Рекомендации по поддержке

1. При добавлении новых типов графиков убедитесь, что формат данных соответствует ожидаемому в компоненте AnalyticsChart
2. При изменении структуры данных API обновите соответствующую обработку в useMemo для chartData
3. Используйте console.log для отладки при возникновении проблем с обновлением графиков через WebSocket
