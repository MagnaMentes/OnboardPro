# Исправление ошибки в WebSocket обработчике аналитики

## Описание проблемы

В консоли браузера возникала ошибка при обработке сообщений WebSocket:

```
WebSocketService.js:131 [WebSocket] Ошибка в обработчике analytics_update: TypeError: setHasRealtimeUpdates is not a function
    at handleAnalyticsUpdate (hrWebSocketHelpers.js:126:1)
    at WebSocketService.js:129:1
    at Array.forEach (<anonymous>)
    at socket.onmessage (WebSocketService.js:124:1)
```

Ошибка возникала из-за попытки вызвать функцию `setHasRealtimeUpdates`, когда вместо нее в компоненте `HRDashboard.jsx` передавалось значение `null`.

## Анализ причины

Проблема была связана с изменениями в компоненте `HRDashboard.jsx`, где при вызове функции `setupHRWebSocketHandlers` параметр `setHasRealtimeUpdates` передавался как `null`:

```jsx
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
  setTaskAnalytics,
  setUserAnalytics,
  null, // раньше здесь было setHasRealtimeUpdates
  setLastUpdate,
  toast
);
```

Однако в файле `hrWebSocketHelpers.js` этот параметр использовался без проверки на `null` или `undefined`:

```javascript
// Устанавливаем флаг обновления в реальном времени
if (setHasRealtimeUpdates) {
  setHasRealtimeUpdates(true);
}
```

Хотя здесь есть проверка на существование `setHasRealtimeUpdates`, JavaScript интерпретирует `null` как объект, который проходит эту проверку, в результате код пытался вызвать `null` как функцию.

## Решение

Было добавлено дополнительное условие для проверки того, что `setHasRealtimeUpdates` является функцией:

```javascript
// Устанавливаем флаг обновления в реальном времени и время последнего обновления
if (setHasRealtimeUpdates && typeof setHasRealtimeUpdates === 'function') {
  setHasRealtimeUpdates(true);
}
```

Такая же проверка была добавлена в обработчик `handleTaskStatusChanged`, где также использовался этот параметр.

## Выводы

1. При разработке кода с функциями обратного вызова важно проверять не только наличие переменной, но и ее тип.
2. Особое внимание следует уделять проверке аргументов функций, которые могут быть опциональными или изменены в будущем.
3. Использование TypeScript могло бы предотвратить эту ошибку на этапе компиляции.

## Рекомендации для будущих изменений

1. Добавить более строгую типизацию с помощью PropTypes или TypeScript.
2. Использовать значения по умолчанию для опциональных функций обратного вызова.
3. При передаче `null` или отсутствии параметра, лучше использовать нулевую функцию вместо `null`:
   ```javascript
   const noop = () => {}; // Функция, которая ничего не делает
   
   setupHRWebSocketHandlers(
     // ...другие параметры,
     hasRealtimeUpdatesHandler || noop,
     // ...другие параметры
   );
   ```
