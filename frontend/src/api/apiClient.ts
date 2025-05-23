// apiClient.ts - базовый клиент для API запросов
import axios from "axios";

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Добавляем перехватчик для обработки авторизации
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик для обработки ответов и ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Здесь можно обработать истекший токен, например, перенаправление на страницу входа
      localStorage.removeItem("token");
    }
    return Promise.reject(error);
  }
);

export default apiClient;
