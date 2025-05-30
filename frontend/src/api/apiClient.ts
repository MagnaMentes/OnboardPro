// apiClient.ts - базовый клиент для API запросов
import axios from "axios";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,
} from "../store/authStore";

// Интерфейсы для typescript
interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

const processQueue = (error: unknown | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Получаем переменные окружения
const API_URL = import.meta.env.VITE_API_URL || "";
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "10000");

// Формируем базовый URL на основе переменных окружения
// Если API_URL задан, добавляем API_PREFIX, иначе используем только префикс (для работы с Vite proxy)
const baseURL = API_URL
  ? `${API_URL}${API_PREFIX.startsWith("/") ? API_PREFIX : `/${API_PREFIX}`}`
  : API_PREFIX;

console.log("Переменные окружения:");
console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
console.log("VITE_API_PREFIX:", import.meta.env.VITE_API_PREFIX);
console.log("VITE_API_TIMEOUT:", import.meta.env.VITE_API_TIMEOUT);
console.log("Формированный базовый URL API:", baseURL);
console.log("Режим Docker:", import.meta.env.DOCKER_ENV ? "Да" : "Нет");

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    // Добавляем заголовок для предотвращения кэширования
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "X-Requested-With": "XMLHttpRequest",
  },
  timeout: API_TIMEOUT,
  withCredentials: true,
  // Добавляем конфигурацию для лучшей работы в Docker
  proxy: false,
});

// Добавляем перехватчик для добавления токена к запросам
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Добавляем логирование для отладки
    console.log(`Setting auth header: Bearer ${token.substring(0, 10)}...`);
  } else {
    console.log("No token found in localStorage");
  }
  return config;
});

// Добавляем перехватчик для обработки ошибок и обновления токена
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Успешный ответ от ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    console.error("Ошибка запроса:", error.message);

    // Проверка наличия ошибок сети (ECONNREFUSED, ECONNRESET и т.д.)
    if (
      error.code === "ECONNREFUSED" ||
      error.code === "ECONNRESET" ||
      !error.response
    ) {
      console.error(
        `Ошибка сетевого соединения (${error.code || "неизвестная"}):`,
        error.config?.url
      );
      console.error("Проверьте работу контейнера бэкенда и сетевое соединение");
      console.error("URL запроса:", error.config?.baseURL + error.config?.url);
      console.error("Метод запроса:", error.config?.method);

      // Выводим все детали конфигурации для отладки
      console.log("Полная конфигурация запроса:", {
        baseURL: error.config?.baseURL,
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        withCredentials: error.config?.withCredentials,
        timeout: error.config?.timeout,
      });

      // Возвращаем понятный объект ошибки
      return Promise.reject({
        message:
          "Ошибка соединения с сервером. Сервер недоступен или перезапускается.",
        originalError: error,
      });
    }

    if (error.response) {
      console.error(
        `Статус ошибки: ${error.response.status}`,
        error.config?.url
      );
      console.error("Данные ошибки:", error.response.data);
    }

    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("Попытка обновить токен после 401 ошибки");
      if (isRefreshing) {
        try {
          console.log("Токен уже обновляется, добавляем запрос в очередь");
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (err) {
          console.error("Ошибка при ожидании обновления токена:", err);
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) {
          throw new Error("No refresh token found");
        }

        const { data } = await axios.post(
          `${baseURL}/auth/refresh/`,
          { refresh: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const { access } = data;
        localStorage.setItem(ACCESS_TOKEN_KEY, access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        processQueue(null, access);

        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
