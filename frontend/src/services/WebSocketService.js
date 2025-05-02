/**
 * Сервис для работы с WebSocket соединением
 * Позволяет получать обновления в реальном времени с сервера
 */

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = {
      analytics_update: [],
      task_status_changed: [],
      tasks_update: [],
      user_notification: [],
      error: [],
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
  }

  /**
   * Инициализация подключения к WebSocket серверу
   * @param {string} token - JWT токен для авторизации
   * @returns {Promise<boolean>} - Результат подключения
   */
  connect(token) {
    return new Promise((resolve, reject) => {
      if (this.socket && this.isConnected) {
        console.log("[WebSocket] Уже подключен");
        resolve(true);
        return;
      }

      try {
        // Определяем протокол
        const wsProtocol =
          window.location.protocol === "https:" ? "wss:" : "ws:";

        // Используем относительный путь или window.location.host для работы в Docker
        // вместо жестко заданного localhost:8000
        const host = window.location.host.includes(":")
          ? window.location.host.split(":")[0] // Если есть порт в хосте, берём только имя хоста
          : window.location.host;

        // Используем относительный URL для работы как в контейнере, так и локально
        const wsUrl = `${wsProtocol}//${host}:8000/ws`;

        console.log("[WebSocket] Попытка подключения к WebSocket");
        console.log("[WebSocket] URL соединения (без токена):", wsUrl);

        // Добавляем токен аутентификации
        const serverUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;
        this.socket = new WebSocket(serverUrl);

        // Обработчик успешного подключения
        this.socket.onopen = () => {
          console.log("[WebSocket] Подключение установлено успешно");
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Токен уже передан в URL, дополнительная аутентификация через сообщение не требуется

          this.startPingInterval(); // Запускаем пинг для поддержания соединения
          resolve(true);
        };

        // Обработчик получения сообщений
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("[WebSocket] Получено сообщение:", data);

            // Вызываем соответствующие обработчики в зависимости от типа сообщения
            if (data.type && this.listeners[data.type]) {
              this.listeners[data.type].forEach((callback) => {
                try {
                  callback(data);
                } catch (err) {
                  console.error(
                    `[WebSocket] Ошибка в обработчике ${data.type}:`,
                    err
                  );
                }
              });
            }
          } catch (err) {
            console.error("[WebSocket] Ошибка при обработке сообщения:", err);
          }
        };

        // Обработчик ошибок
        this.socket.onerror = (error) => {
          console.error("[WebSocket] Ошибка соединения:", error);
          this.notifyErrorListeners("Ошибка WebSocket соединения");
          reject(error);
        };

        // Обработчик закрытия соединения
        this.socket.onclose = (event) => {
          console.log("[WebSocket] Соединение закрыто:", event);
          this.isConnected = false;
          this.stopPingInterval();

          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectTimeout = setTimeout(() => {
              console.log(
                `[WebSocket] Попытка переподключения ${
                  this.reconnectAttempts + 1
                }/${this.maxReconnectAttempts}`
              );
              this.reconnectAttempts++;
              this.connect(token).catch((err) => {
                console.log("[WebSocket] Ошибка при переподключении:", err);
                // Если это последняя попытка, уведомляем об ошибке
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                  this.notifyErrorListeners(
                    "Не удалось восстановить соединение после нескольких попыток"
                  );
                }
              });
            }, 5000); // Пытаемся переподключиться через 5 секунд
          } else {
            this.notifyErrorListeners(
              "Не удалось восстановить соединение после нескольких попыток"
            );
          }
        };
      } catch (err) {
        console.error("[WebSocket] Ошибка при создании соединения:", err);
        reject(err);
      }
    });
  }

  /**
   * Отправка pong сообщений для поддержания соединения
   * @private
   */
  startPingInterval() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({ type: "ping" });
      }
    }, 30000); // Пинг каждые 30 секунд
  }

  /**
   * Остановка отправки ping сообщений
   * @private
   */
  stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
  }

  /**
   * Закрытие WebSocket соединения
   */
  disconnect() {
    if (this.socket) {
      this.stopPingInterval();
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      console.log("[WebSocket] Соединение закрыто вручную");
    }
  }

  /**
   * Отправка сообщения на сервер
   * @param {Object} message - Сообщение для отправки
   * @returns {boolean} - Результат отправки
   */
  sendMessage(message) {
    if (!this.socket || !this.isConnected) {
      console.error(
        "[WebSocket] Невозможно отправить сообщение: нет соединения"
      );
      return false;
    }

    try {
      this.socket.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error("[WebSocket] Ошибка при отправке сообщения:", err);
      return false;
    }
  }

  /**
   * Запрос на обновление аналитических данных
   * @returns {boolean} - Результат запроса
   */
  requestAnalyticsUpdate() {
    return this.sendMessage({ type: "request_analytics_update" });
  }

  /**
   * Запрос на обновление задач
   * @returns {boolean} - Результат запроса
   */
  requestTasksUpdate() {
    return this.sendMessage({ type: "request_tasks_update" });
  }

  /**
   * Регистрация обработчика для обновлений аналитики
   * @param {Function} callback - Функция-обработчик
   */
  onAnalyticsUpdate(callback) {
    this.listeners.analytics_update.push(callback);
  }

  /**
   * Регистрация обработчика для изменения статуса задачи
   * @param {Function} callback - Функция-обработчик
   */
  onTaskStatusChanged(callback) {
    this.listeners.task_status_changed.push(callback);
  }

  /**
   * Регистрация обработчика для обновлений задач
   * @param {Function} callback - Функция-обработчик
   */
  onTasksUpdate(callback) {
    this.listeners.tasks_update.push(callback);
  }

  /**
   * Регистрация обработчика для уведомлений пользователя
   * @param {Function} callback - Функция-обработчик
   */
  onNotification(callback) {
    this.listeners.user_notification.push(callback);
  }

  /**
   * Регистрация обработчика для ошибок
   * @param {Function} callback - Функция-обработчик
   */
  onError(callback) {
    this.listeners.error.push(callback);
  }

  /**
   * Удаление обработчика
   * @param {string} eventType - Тип события
   * @param {Function} callback - Функция-обработчик
   */
  removeListener(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType] = this.listeners[eventType].filter(
        (cb) => cb !== callback
      );
    }
  }

  /**
   * Оповещение обработчиков об ошибке
   * @param {string} message - Сообщение об ошибке
   * @private
   */
  notifyErrorListeners(message) {
    this.listeners.error.forEach((callback) => {
      try {
        callback({ type: "error", message });
      } catch (err) {
        console.error("[WebSocket] Ошибка в обработчике ошибок:", err);
      }
    });
  }
}

// Создаем и экспортируем единственный экземпляр сервиса
const webSocketService = new WebSocketService();
export default webSocketService;
