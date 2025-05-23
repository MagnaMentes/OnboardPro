// @ts-ignore
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
// @ts-ignore
import toast from "react-hot-toast";

// Создание экземпляра Axios с базовым URL
const axiosInstance: AxiosInstance = axios.create({
  baseURL: "http://localhost:8000/api/",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Интерсептор запросов - добавляет JWT из localStorage при каждом запросе
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
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
      // Если уже обновляем токен, добавляем запрос в очередь
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // Помечаем, что начали обновлять токен
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          // Если нет refresh токена, очищаем аутентификацию
          processQueue(error, null);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Запрос на обновление токена
        const response = await axios.post(
          "http://localhost:8000/api/auth/refresh/",
          {
            refresh: refreshToken,
          }
        );

        const { access } = response.data;

        // Обновляем токен
        localStorage.setItem("accessToken", access);

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
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

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
