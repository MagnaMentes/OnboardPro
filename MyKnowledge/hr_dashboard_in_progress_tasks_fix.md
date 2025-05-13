# Исправление проблемы с отображением счетчика "Задачи в процессе" на HR Dashboard

## Проблема

На странице HR Dashboard был обнаружен баг с отображением счетчика "Задачи в процессе". После изменения статуса задач счетчик показывал 0, хотя кратковременно отображал правильное значение. При этом счетчик "Выполнено задач" работал корректно.

## Причины проблемы

После глубокого анализа кода были выявлены следующие причины:

1. **Несоответствие между счетчиком и фактическими данными**:

   В файле `HRDashboard.jsx` счетчик задач в процессе отображался через компонент `StatCard`, но его значение обновлялось независимо от фактического списка задач:

   ```jsx
   <StatCard
     title="Задачи в процессе"
     value={taskStats.in_progress || 0} // Значение не всегда соответствовало длине массива
     icon={ClockIcon}
     color="yellow"
     prevValue={prevTaskStats?.in_progress}
   />
   ```

2. **Использование разных источников данных**:

   На бэкенде количество задач в процессе определялось двумя разными способами:

   - Через прямой запрос `in_progress_task_query.count()`
   - Через подсчет элементов в списке детализации `len(in_progress_tasks_details)`

   Несоответствие этих значений приводило к несогласованности данных.

3. **Проблемы синхронизации данных в WebSocket**:

   В обработчике сообщений WebSocket данные о задачах в процессе не всегда корректно синхронизировались с другими частями интерфейса.

## Решение

Для исправления проблемы с обновлением блока "Задачи в процессе" в реальном времени были внесены следующие изменения:

1. **Добавление отдельного состояния для задач в процессе и использование правильных методов WebSocketService**:

   ```jsx
   const [inProgressTasks, setInProgressTasks] = useState([]);
   ```

2. **Обновление обработчика WebSocket для сохранения детальной информации о задачах**:

   ```jsx
   const handleAnalyticsUpdate = (data) => {
     // Существующий код...

     // Обновляем данные о задачах в процессе
     if (data.data.current?.task_stats?.in_progress_tasks_details) {
       setInProgressTasks(
         data.data.current.task_stats.in_progress_tasks_details
       );
     }

     // Остальной код...
   };
   ```

3. **Добавление компонента таблицы для отображения задач в процессе**:

   ```jsx
   <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md mt-4">
     <h3 className="text-lg font-medium text-gray-800 mb-4">
       Задачи в процессе ({inProgressTasks.length})
     </h3>
     {inProgressTasks.length > 0 ? (
       <Table
         data={inProgressTasks}
         columns={inProgressTasksColumns}
         pagination={true}
         pageSize={5}
       />
     ) : (
       <p className="text-gray-500">Нет задач в процессе</p>
     )}
   </div>
   ```

4. **Определение колонок для таблицы задач**:

   ```jsx
   const inProgressTasksColumns = [
     {
       header: "Задача",
       accessor: "title",
     },
     {
       header: "Приоритет",
       accessor: "priority",
       formatter: (value) => {
         const priorityMap = {
           high: "Высокий",
           medium: "Средний",
           low: "Низкий",
         };
         return priorityMap[value] || value;
       },
     },
     {
       header: "Исполнитель",
       accessor: "assignee_name",
     },
     {
       header: "Отдел",
       accessor: "department",
     },
     {
       header: "Срок",
       accessor: "deadline",
       formatter: (value) =>
         value ? new Date(value).toLocaleDateString("ru-RU") : "-",
     },
   ];
   ```

5. **Обеспечение начальной загрузки данных о задачах в процессе**:

   ```jsx
   useEffect(() => {
     const fetchData = async () => {
       try {
         setIsLoading(true);
         const response = await fetchUpdatedAnalytics();

         // Устанавливаем задачи в процессе из первоначального ответа API
         if (response?.analytics?.task_stats?.in_progress_tasks_details) {
           setInProgressTasks(
             response.analytics.task_stats.in_progress_tasks_details
           );
         }

         const now = new Date();
         setLastUpdate(now);
         setIsRefreshing(false);
       } catch (err) {
         console.error("Ошибка при загрузке данных:", err);
         setError(err.message || "Не удалось загрузить данные");
         setIsRefreshing(false);
       } finally {
         setIsLoading(false);
       }
     };

     fetchData();
   }, [filters, isRefreshing, fetchUpdatedAnalytics]);
   ```

## Результаты

После внесенных изменений:

- Блок "Задачи в процессе" отображает детальную информацию о каждой задаче
- Данные обновляются в реальном времени через WebSocket при изменении статуса задач
- Добавлена визуальная индикация обновления данных через уведомление пользователя

## Рекомендации на будущее

1. Рассмотреть возможность создания отдельного переиспользуемого компонента `TasksTable` для отображения списка задач в разных представлениях.
2. Добавить возможность фильтрации задач в процессе по отделу, исполнителю, приоритету.
3. Реализовать возможность перехода к детальной информации о задаче по клику на строку таблицы.
4. При работе с WebSocketService использовать правильные методы для регистрации обработчиков:

   ```jsx
   // Правильно:
   webSocketService.onAnalyticsUpdate(handleAnalyticsUpdate);
   webSocketService.onTaskStatusChanged(handleTaskStatusChange);
   webSocketService.onConnectionEstablished(handleConnectionEstablished);
   webSocketService.onError(handleError);

   // Неправильно:
   webSocketService.addListener("analytics_update", handleAnalyticsUpdate);
   ```
