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
      connection_established: [], // Добавляем поддержку события установления соединения
      pong: [], // Добавляем поддержку pong для проверки соединения
      error: [],
    };
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.authToken = null; // Сохраняем токен для возможного переподключения
    this.debug = true; // Флаг для включения/выключения отладочных сообщений
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

      // Сохраняем токен для возможного переподключения
      this.authToken = token;

      try {
        // Определяем протокол
        const wsProtocol =
          window.location.protocol === "https:" ? "wss:" : "ws:";

        // Корректируем URL для работы в Docker
        // Используем определение на основе текущего URL
        const host = window.location.hostname; // Берем только имя хоста без порта
        const port = "8000"; // Порт API всегда 8000

        // Формируем полный URL для сокета
        const wsUrl = `${wsProtocol}//${host}:${port}/ws`;

        console.log("[WebSocket] Попытка подключения к WebSocket");
        console.log("[WebSocket] URL соединения (без токена):", wsUrl);

        // Добавляем токен аутентификации
        const serverUrl = `${wsUrl}?token=${encodeURIComponent(token)}`;

        // Закрываем предыдущее соединение, если оно существует
        if (this.socket) {
          try {
            this.socket.close();
            console.log(
              "[WebSocket] Закрыто предыдущее соединение перед новым подключением"
            );
          } catch (e) {
            console.warn(
              "[WebSocket] Ошибка при закрытии предыдущего соединения:",
              e
            );
          }
        }

        this.socket = new WebSocket(serverUrl);

        // Обработчик успешного подключения
        this.socket.onopen = () => {
          console.log("[WebSocket] Подключение установлено успешно");
          this.isConnected = true;
          this.reconnectAttempts = 0;

          // Токен уже передан в URL, дополнительная аутентификация через сообщение не требуется

          this.startPingInterval(); // Запускаем пинг для поддержания соединения

          // Уведомляем обработчики события connection_established
          this.listeners.connection_established.forEach((callback) => {
            try {
              callback({ type: "connection_established" });
            } catch (err) {
              console.error(
                "[WebSocket] Ошибка в обработчике connection_established:",
                err
              );
            }
          });

          resolve(true);
        };

        // Обработчик получения сообщений
        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("[WebSocket] Получено сообщение:", data);

            // Проверяем тип сообщения явно для улучшения отладки
            if (data.type) {
              console.log(
                `[WebSocket] Тип сообщения: ${
                  data.type
                }, количество обработчиков: ${
                  (this.listeners[data.type] || []).length
                }`
              );

              // Если есть обработчики для данного типа
              if (
                this.listeners[data.type] &&
                this.listeners[data.type].length > 0
              ) {
                this.listeners[data.type].forEach((callback) => {
                  try {
                    console.log(
                      `[WebSocket] Вызываем обработчик для ${data.type}`
                    );
                    callback(data);
                  } catch (err) {
                    console.error(
                      `[WebSocket] Ошибка в обработчике ${data.type}:`,
                      err
                    );
                  }
                });
              } else {
                console.warn(
                  `[WebSocket] Нет обработчиков для типа: ${data.type}`
                );
              }
            } else {
              console.warn("[WebSocket] Получено сообщение без типа:", data);
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
              this.connect(this.authToken).catch((err) => {
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
      console.log("[WebSocket] Отправка сообщения:", message);
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
    console.log("[WebSocket] Запрос на обновление аналитики");
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
    console.log("[WebSocket] Регистрация обработчика analytics_update");
    this.listeners.analytics_update.push(callback);
  }

  /**
   * Регистрация обработчика для изменения статуса задачи
   * @param {Function} callback - Функция-обработчик
   */
  onTaskStatusChanged(callback) {
    console.log("[WebSocket] Регистрация обработчика task_status_changed");
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
   * Регистрация обработчика для события установления соединения
   * @param {Function} callback - Функция-обработчик
   */
  onConnectionEstablished(callback) {
    this.listeners.connection_established.push(callback);
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
