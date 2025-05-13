/**
 * Утилиты для работы с WebSocket подключениями в HR Dashboard
 */

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
 * @returns {Object} - Объект с функциями-обработчиками и функцией подключения
 */
export const setupHRWebSocketHandlers = (
  webSocketService,
  setAnalytics,
  setPreviousAnalytics,
  setTaskAnalytics,
  setUserAnalytics,
  setHasRealtimeUpdates,
  setLastUpdate,
  toast
) => {
  // Обработчик сообщений от WebSocket для аналитики
  const handleAnalyticsUpdate = (data) => {
    console.log("[HR Dashboard] Получено WebSocket обновление аналитики", data);

    // Проверяем, что данные содержат правильную структуру
    if (!data.data) {
      console.error("[HR Dashboard] Неверный формат данных аналитики:", data);
      return;
    }

    // Перед обновлением данных проверяем, что новые данные содержат все необходимые поля
    if (data.data.current) {
      // Получаем данные о задачах из обновления аналитики
      const newTaskStats = data.data.current.task_stats || {};

      // Убедимся, что у нас всегда есть массив задач в процессе
      if (!Array.isArray(newTaskStats.in_progress_tasks_details)) {
        newTaskStats.in_progress_tasks_details = [];
        console.log(
          `[HR Dashboard] Создан пустой массив для in_progress_tasks_details`
        );
      }

      // Проверка на null или undefined элементы в массиве
      if (
        newTaskStats.in_progress_tasks_details.some(
          (item) => item === null || item === undefined
        )
      ) {
        console.warn(
          `[HR Dashboard] Найдены null/undefined элементы в массиве in_progress_tasks_details, выполняем фильтрацию`
        );
        newTaskStats.in_progress_tasks_details =
          newTaskStats.in_progress_tasks_details.filter(
            (item) => item !== null && item !== undefined
          );
      }

      // Получаем актуальное количество задач в процессе
      const detailsCount = newTaskStats.in_progress_tasks_details.length;

      // Логируем информацию о полученных данных (для отладки)
      console.log(`[HR Dashboard] Получены данные о задачах в процессе: 
        - Счетчик in_progress из API: ${newTaskStats.in_progress}
        - Количество задач в списке: ${detailsCount}
        - Первая задача: ${
          detailsCount > 0
            ? JSON.stringify(newTaskStats.in_progress_tasks_details[0].title)
            : "нет задач"
        }`);

      // Устанавливаем счетчик задач в процессе равным длине списка задач
      // Это ключевое изменение, которое гарантирует согласованность данных
      if (newTaskStats.in_progress !== detailsCount) {
        console.log(
          `[HR Dashboard] Исправляем несоответствие - счетчик in_progress = ${newTaskStats.in_progress}, но найдено ${detailsCount} задач`
        );

        // Корректируем счетчик задач в процессе на основе фактического списка
        newTaskStats.in_progress = detailsCount;
        console.log(
          `[HR Dashboard] Счетчик in_progress исправлен на ${newTaskStats.in_progress}`
        );

        // Фиксируем исправленные данные в объекте
        data.data.current.task_stats = newTaskStats;
      }

      // Обновляем данные аналитики с исправленным счетчиком, создавая новый объект
      setAnalytics({
        ...data.data.current,
        task_stats: {
          ...data.data.current.task_stats,
          in_progress: detailsCount, // Гарантированно устанавливаем правильное значение
        },
      });

      // Форматируем данные для taskAnalytics в правильном формате
      const analyticsResponse = data.data.current;

      const taskAnalyticsData = {
        summary: {
          tasksByPriority: analyticsResponse.task_stats?.priority || {},
          departmentStats: analyticsResponse.task_stats?.department_stats || {},
        },
      };

      setTaskAnalytics(taskAnalyticsData);
    }

    if (data.data.previous) {
      setPreviousAnalytics(data.data.previous);
    }

    if (data.data.user_analytics) {
      setUserAnalytics(data.data.user_analytics);
    }

    // Устанавливаем флаг обновления в реальном времени и время последнего обновления
    if (setHasRealtimeUpdates && typeof setHasRealtimeUpdates === "function") {
      setHasRealtimeUpdates(true);
    }
    setLastUpdate(new Date());

    // Показываем уведомление пользователю
    toast.info("Данные аналитики обновлены в реальном времени");
  };

  // Обработчик изменения статуса задачи
  const handleTaskStatusChanged = (data) => {
    console.log(
      "[HR Dashboard] Получено уведомление об изменении статуса задачи:",
      data
    );

    // Показываем уведомление, если оно есть в данных
    if (data.notificationMessage) {
      toast.info(data.notificationMessage, { autoClose: 3000 });
    }

    // При изменении статуса задачи обновляем время последнего обновления
    setLastUpdate(new Date());
    if (setHasRealtimeUpdates && typeof setHasRealtimeUpdates === "function") {
      setHasRealtimeUpdates(true);
    }
  };

  // Обработчик установления соединения
  const handleConnectionEstablished = () => {
    console.log("[HR Dashboard] WebSocket соединение установлено");

    // После успешного подключения запрашиваем актуальные данные аналитики
    setTimeout(() => {
      webSocketService.requestAnalyticsUpdate();
    }, 500); // Небольшая задержка для стабильности
  };

  // Обработчик ошибок WebSocket
  const handleError = (error) => {
    console.error("[HR Dashboard] WebSocket ошибка:", error);
    toast.error("Ошибка WebSocket соединения: " + error.message);
  };

  // Функция для инициализации соединения
  const initializeWebSocket = (token) => {
    if (!token) {
      console.error("[HR Dashboard] Отсутствует токен аутентификации");
      return Promise.reject(new Error("Отсутствует токен аутентификации"));
    }

    console.log("[HR Dashboard] Инициализация WebSocket соединения");

    // Подписываемся на WebSocket события
    webSocketService.onAnalyticsUpdate(handleAnalyticsUpdate);
    webSocketService.onTaskStatusChanged(handleTaskStatusChanged);
    webSocketService.onConnectionEstablished(handleConnectionEstablished);
    webSocketService.onError(handleError);

    // Инициализируем соединение с передачей токена
    return webSocketService
      .connect(token)
      .then(() => {
        console.log("[HR Dashboard] WebSocket соединение инициализировано");
      })
      .catch((err) => {
        console.error("[HR Dashboard] Ошибка подключения WebSocket:", err);
        toast.error("Не удалось подключиться к серверу аналитики");
        throw err;
      });
  };

  // Функция для отписки от событий и разрыва соединения
  const cleanupWebSocket = () => {
    console.log("[HR Dashboard] Очистка WebSocket соединения");

    // Отписываемся от всех событий
    webSocketService.removeListener("analytics_update", handleAnalyticsUpdate);
    webSocketService.removeListener(
      "task_status_changed",
      handleTaskStatusChanged
    );
    webSocketService.removeListener(
      "connection_established",
      handleConnectionEstablished
    );
    webSocketService.removeListener("error", handleError);

    // Разрываем соединение
    webSocketService.disconnect();
  };

  return {
    handleAnalyticsUpdate,
    handleTaskStatusChanged,
    handleConnectionEstablished,
    handleError,
    initializeWebSocket,
    cleanupWebSocket,
  };
};
