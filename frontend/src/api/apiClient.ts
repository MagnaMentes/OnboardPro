// apiClient.ts - базовый клиент для API запросов
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,
} from "../store/authStore";

// Получаем переменные окружения
const API_URL = import.meta.env.VITE_API_URL || "";
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "10000");

// Если API_URL задан, добавляем API_PREFIX, иначе используем только префикс (для работы с Vite proxy)
const baseURL = API_URL
  ? `${API_URL}${API_PREFIX.startsWith("/") ? API_PREFIX : `/${API_PREFIX}`}`
  : API_PREFIX;

// Выводим конфигурацию для отладки
console.log("API Configuration:", {
  API_URL,
  API_PREFIX,
  API_TIMEOUT,
  baseURL,
  DOCKER_ENV: import.meta.env.DOCKER_ENV,
});

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
  timeout: API_TIMEOUT,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Интерцептор запросов
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        `Request to ${config.url} with token: ${token.substring(0, 10)}...`
      );
    }
    return config;
  },
  (error) => {
    console.error("Request error:", error);
    return Promise.reject(error);
  }
);

// Интерцептор ответов
apiClient.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    console.error("Response error:", {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    // Обработка ошибок сети
    if (!error.response) {
      console.error("Network error:", error.message);
      toast.error("Ошибка сети. Проверьте подключение к интернету.");
      return Promise.reject(error);
    }

    // Обработка 401 и обновление токена
    if (error.response.status === 401 && !originalRequest._retry) {
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
          {
            headers: { "Content-Type": "application/json" },
          }
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

    // Обработка 500
    if (error.response.status >= 500) {
      console.error("Server error:", error.response.data);
      toast.error("Произошла ошибка сервера. Попробуйте позже.");
    }

    return Promise.reject(error);
  }
);

export default apiClient;
