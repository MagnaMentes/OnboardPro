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
// Убедимся, что между базовым URL и префиксом API есть слэш
const baseURL = API_URL
  ? `${API_URL}${API_PREFIX.startsWith("/") ? API_PREFIX : `/${API_PREFIX}`}`
  : API_PREFIX;

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: API_TIMEOUT,
  withCredentials: true,
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        } catch (err) {
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
