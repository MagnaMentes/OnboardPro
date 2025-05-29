// @ts-ignore
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
// @ts-ignore
import toast from "react-hot-toast";
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_DATA_KEY,
} from "../store/authStore";

// Получаем переменные окружения
const API_URL = import.meta.env.VITE_API_URL || "";
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "10000");

// Формируем базовый URL на основе переменных окружения
// Убедимся, что между базовым URL и префиксом API есть слэш
const baseURL = API_URL
  ? `${API_URL}${API_PREFIX.startsWith("/") ? API_PREFIX : `/${API_PREFIX}`}`
  : API_PREFIX;

// Создание экземпляра Axios с базовым URL
const axiosInstance: AxiosInstance = axios.create({
  baseURL, // Используем значение из переменных окружения
  timeout: API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерсептор запросов - добавляет JWT из localStorage при каждом запросе
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    // Добавляем логирование для отладки
    console.log(`Request to: ${config.url}`);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`Setting auth header: Bearer ${token.substring(0, 10)}...`);
    } else {
      console.log(
        "No token found in localStorage or headers object is undefined"
      );
    }

    // Добавляем полный URL в логи
    if (config.baseURL && config.url) {
      console.log(`Full URL: ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Интерсептор ответов - обрабатывает ошибки и обновляет токен при необходимости
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}[] = [];

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

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Проверяем, что ошибка 401 и запрос еще не повторялся
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log("401 Unauthorized error detected", originalRequest.url);
      console.log("Response data:", error.response.data);
      console.log(
        "Current token:",
        localStorage.getItem(ACCESS_TOKEN_KEY) ? "present" : "missing"
      );

      // Если уже обновляем токен, добавляем запрос в очередь
      if (isRefreshing) {
        console.log("Token refresh is already in progress, queueing request");
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            console.log("Updated authorization header with new token");
          }
          return axiosInstance(originalRequest);
        } catch (err) {
          console.error("Error while waiting for token refresh:", err);
          return Promise.reject(err);
        }
      }

      // Помечаем, что начали обновлять токен
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log("Starting token refresh attempt");
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

        if (!refreshToken) {
          console.log("No refresh token found in localStorage");
          // Если нет refresh токена, очищаем аутентификацию
          processQueue(error, null);
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_DATA_KEY);
          window.location.href = "/login";
          return Promise.reject(error);
        }

        console.log("Refresh token found, attempting to refresh access token");

        // Запрос на обновление токена - используем напрямую axios без интерцепторов
        // чтобы избежать зацикливания
        // Используем базовый URL без /api/ префикса, так как он уже включен в baseURL
        const response = await axios.post(
          `${baseURL.replace(API_PREFIX, "")}/auth/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const { access } = response.data;
        console.log("New access token received successfully");

        // Обновляем токен
        localStorage.setItem(ACCESS_TOKEN_KEY, access);

        // Обновляем заголовок
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        // Обрабатываем очередь запросов
        processQueue(null, access);
        isRefreshing = false;

        // Повторяем исходный запрос
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Если не удалось обновить токен, очищаем аутентификацию
        processQueue(refreshError, null);
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);

        isRefreshing = false;

        // Перенаправляем на логин
        toast.error("Сессия истекла. Пожалуйста, войдите снова.");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Обработка 500 - Internal Server Error
    if (error.response && error.response.status >= 500) {
      toast.error("Произошла ошибка сервера. Пожалуйста, попробуйте позже.");
    } else if (error.request) {
      // Запрос был отправлен, но не получен ответ
      toast.error("Нет ответа от сервера. Проверьте подключение к интернету.");
    } else {
      // Произошла ошибка при настройке запроса
      toast.error(`Ошибка запроса: ${error.message}`);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
