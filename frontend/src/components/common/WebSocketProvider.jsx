import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import { getApiBaseUrl } from "../../config/api";

// Создаем контекст для WebSocket
const WebSocketContext = createContext(null);

export function useWebSocket() {
  return useContext(WebSocketContext);
}

// Получаем базовый URL WebSocket (ws:// или wss://)
const getWebSocketBaseUrl = () => {
  const apiBaseUrl = getApiBaseUrl();
  const isSecureProtocol =
    window.location.protocol === "https:" || apiBaseUrl.startsWith("https:");
  const protocol = isSecureProtocol ? "wss:" : "ws:";

  // Извлекаем хост из API URL
  let host;
  if (apiBaseUrl.includes("://")) {
    host = apiBaseUrl.split("://")[1].split("/")[0];
  } else {
    host = window.location.host.includes("localhost")
      ? "localhost:8000"
      : window.location.host;
  }

  return `${protocol}//${host}`;
};

// Константы для статусов задач
const TASK_STATUS_TEXT = {
  pending: "ожидает выполнения",
  not_started: "не начата",
  in_progress: "в процессе",
  completed: "завершена",
  blocked: "заблокирована",
};

// Константы для повторного подключения
const RECONNECT_INTERVAL = 5000; // 5 секунд
const MAX_RECONNECT_ATTEMPTS = 10;
const PING_INTERVAL = 30000; // 30 секунд

export default function WebSocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [taskUpdates, setTaskUpdates] = useState([]);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const manuallyClosedRef = useRef(false);
  const lastAnalyticsRequestRef = useRef(null);

  // Функция для установления соединения
  const connectWebSocket = useCallback(() => {
    // Получаем токен и user_id из localStorage
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");

    if (!token || !userId) {
      console.log(
        "WebSocket: отсутствуют токен или user_id. Соединение не установлено."
      );
      return;
    }

    try {
      // Закрываем существующее соединение, если оно есть
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        manuallyClosedRef.current = true;
        socket.close();
      }

      // Создаем URL подключения с токеном в query параметре
      const wsBaseUrl = getWebSocketBaseUrl();
      const wsUrl = `${wsBaseUrl}/ws/${userId}?token=${token}`;

      console.log(`Устанавливается WebSocket соединение с ${wsUrl}`);

      // Создаем новый WebSocket
      const newSocket = new WebSocket(wsUrl);
      manuallyClosedRef.current = false;

      // Обработчики событий WebSocket
      newSocket.onopen = () => {
        console.log("WebSocket соединение установлено");
        setConnected(true);
        reconnectAttemptsRef.current = 0; // Сбрасываем счетчик попыток

        // Запускаем пинги для поддержания соединения
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }

        pingIntervalRef.current = setInterval(() => {
          if (newSocket.readyState === WebSocket.OPEN) {
            newSocket.send(JSON.stringify({ type: "ping" }));
          }
        }, PING_INTERVAL);
      };

      newSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Получено WebSocket сообщение:", data.type);

          // Обрабатываем разные типы сообщений
          switch (data.type) {
            case "pong":
              // Просто игнорируем pong-ответы
              break;

            case "analytics_update":
              // Обновляем аналитические данные и сбрасываем таймстамп последнего запроса
              setAnalyticsData(data.data);
              lastAnalyticsRequestRef.current = null;
              console.log(
                "Получены обновленные данные аналитики через WebSocket:",
                data.data
              );
              break;

            case "task_status_changed":
              // Обрабатываем уведомление об изменении задачи
              handleTaskStatusChanged(data);
              break;

            case "user_notification":
              // Уведомление для пользователя
              if (data.message) {
                toast.info(data.message, { autoClose: 5000 });
              }
              break;

            case "error":
              // Сообщение об ошибке
              if (data.message) {
                toast.error(data.message, { autoClose: 5000 });
              }
              console.error("Ошибка WebSocket:", data.message);
              break;

            default:
              console.log("Получено неизвестное сообщение WebSocket:", data);
          }
        } catch (error) {
          console.error("Ошибка при обработке WebSocket сообщения:", error);
        }
      };

      newSocket.onclose = (event) => {
        console.log(
          `WebSocket соединение закрыто с кодом: ${event.code}. Причина: ${
            event.reason || "Не указана"
          }`
        );
        setConnected(false);

        // Очищаем интервал пингов
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Пытаемся переподключиться только если соединение не было закрыто вручную
        // и не превышено максимальное количество попыток
        if (
          !manuallyClosedRef.current &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          reconnectAttemptsRef.current++;
          console.log(
            `Попытка переподключения: ${reconnectAttemptsRef.current} из ${MAX_RECONNECT_ATTEMPTS}`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, RECONNECT_INTERVAL);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.log(
            "Достигнуто максимальное количество попыток переподключения"
          );
          toast.error(
            "Не удалось установить соединение с сервером. Попробуйте обновить страницу.",
            { autoClose: false }
          );
        }
      };

      newSocket.onerror = (error) => {
        console.error("WebSocket ошибка:", error);
        // WebSocket автоматически попытается закрыть соединение после ошибки
      };

      setSocket(newSocket);
    } catch (error) {
      console.error("Ошибка при создании WebSocket:", error);
      // Планируем следующую попытку подключения
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectAttemptsRef.current++;
        reconnectTimeoutRef.current = setTimeout(
          connectWebSocket,
          RECONNECT_INTERVAL
        );
      }
    }
  }, []);

  // Обработчик изменения статуса задачи
  const handleTaskStatusChanged = (data) => {
    const taskData = data.data;

    // Добавляем задачу в список обновлений
    setTaskUpdates((prev) => [...prev, taskData]);

    // Формируем правильное уведомление в зависимости от роли пользователя
    let notificationMessage;

    if (taskData.new_status) {
      // Формат уведомления для сотрудника
      const statusText =
        TASK_STATUS_TEXT[taskData.new_status] || taskData.new_status;
      notificationMessage = `Задача "${taskData.title}" изменила статус на "${statusText}"`;
    } else if (taskData.status) {
      // Формат уведомления для HR/менеджера
      const statusText = TASK_STATUS_TEXT[taskData.status] || taskData.status;
      notificationMessage = `Обновлен статус задачи "${taskData.title}" на "${statusText}"`;
    }

    if (notificationMessage) {
      toast.info(notificationMessage, { autoClose: 3000 });
    }

    // Если сообщение содержит требование обновить аналитику
    if (data.action === "refresh_analytics") {
      // Можно запросить обновление через API или уведомить компоненты о необходимости обновления
      console.log("Требуется обновить аналитические данные");
    }

    // Если сообщение содержит требование обновить задачи
    if (data.action === "refresh_tasks") {
      // Можно запросить обновление через API или уведомить компоненты о необходимости обновления
      console.log("Требуется обновить список задач");
    }
  };

  // Функция для отправки сообщения
  const sendMessage = useCallback(
    (message) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        console.log("Отправка WebSocket сообщения:", message);
        socket.send(JSON.stringify(message));
        return true;
      } else {
        console.error(
          "Невозможно отправить сообщение: соединение WebSocket не открыто"
        );
        return false;
      }
    },
    [socket]
  );

  // Функция для принудительного обновления аналитики
  const requestAnalyticsUpdate = useCallback(() => {
    // Проверяем, не был ли запрос отправлен недавно (в течение 5 секунд)
    const now = Date.now();
    if (
      lastAnalyticsRequestRef.current &&
      now - lastAnalyticsRequestRef.current < 5000
    ) {
      console.log(
        "Запрос на обновление аналитики уже был отправлен недавно, пропускаем"
      );
      return false;
    }

    // Запоминаем время запроса
    lastAnalyticsRequestRef.current = now;

    return sendMessage({ type: "request_analytics_update" });
  }, [sendMessage]);

  // Функция для принудительного обновления задач
  const requestTasksUpdate = useCallback(() => {
    return sendMessage({ type: "request_tasks_update" });
  }, [sendMessage]);

  // Очищаем все обновления задач (например, после их обработки)
  const clearTaskUpdates = useCallback(() => {
    setTaskUpdates([]);
  }, []);

  // Функция для принудительного переподключения
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connectWebSocket();
  }, [connectWebSocket]);

  // Устанавливаем соединение при монтировании компонента,
  // если пользователь авторизован
  useEffect(() => {
    connectWebSocket();

    // Функция для обработки видимости страницы
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        (!socket || socket.readyState !== WebSocket.OPEN)
      ) {
        console.log("Страница стала видимой, проверка соединения WebSocket");
        connectWebSocket();
      }
    };

    // Слушаем изменения видимости страницы для восстановления соединения
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Очистка при размонтировании компонента
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (socket) {
        manuallyClosedRef.current = true;
        socket.close();
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [connectWebSocket]);

  // Обновляем соединение при изменении токена
  useEffect(() => {
    const handleTokenChange = () => {
      reconnectAttemptsRef.current = 0;
      connectWebSocket();
    };

    window.addEventListener("tokenChanged", handleTokenChange);

    return () => {
      window.removeEventListener("tokenChanged", handleTokenChange);
    };
  }, [connectWebSocket]);

  // Значение контекста, предоставляемое потребителям
  const value = {
    socket,
    connected,
    analyticsData,
    taskUpdates,
    clearTaskUpdates,
    sendMessage,
    requestAnalyticsUpdate,
    requestTasksUpdate,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}
