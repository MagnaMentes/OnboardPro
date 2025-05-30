// API сервис для работы с аутентификацией
import apiClient from "./apiClient"; // Используем единый apiClient для всех запросов
import axios from "axios";
import { ACCESS_TOKEN_KEY, User } from "../store/authStore";

interface LoginResponse {
  access: string;
  refresh: string;
  user?: User; // Используем унифицированный интерфейс User
}

interface LoginRequest {
  email: string;
  password: string;
}

interface TokenRefreshRequest {
  refresh: string;
}

interface TokenRefreshResponse {
  access: string;
}

// Используем унифицированный интерфейс User из authStore
type UserResponse = User;

// Сервис для работы с API аутентификации
const authApi = {
  // Логин пользователя
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    // Добавляем логирование для отладки
    console.log("Отправляем запрос на логин с данными:", data);
    try {
      const response = await apiClient.post<LoginResponse>("auth/login/", data);
      console.log("Получен успешный ответ:", response.data);
      return response.data;
    } catch (error) {
      console.error("Ошибка при авторизации:", error);
      if (axios.isAxiosError(error)) {
        console.error("Данные ошибки:", error.response?.data);
        console.error("Статус ошибки:", error.response?.status);
        console.error("Конфигурация запроса:", error.config);
      }
      throw error;
    }
  },

  // Обновление токена доступа
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await apiClient.post<TokenRefreshResponse>(
      "auth/refresh/",
      { refresh: refreshToken }
    );
    return response.data;
  },

  // Получение данных текущего пользователя
  getCurrentUser: async (): Promise<UserResponse> => {
    try {
      const token = localStorage.getItem(ACCESS_TOKEN_KEY);
      console.log("Current token:", token ? "present" : "missing");

      // Для отладки выведем больше информации о запросе
      console.log("Making request to: /users/me/");
      console.log(
        "Authorization header:",
        token ? `Bearer ${token.substring(0, 10)}...` : "not set"
      );

      // Устанавливаем заголовок Authorization вручную для этого запроса
      const response = await apiClient.get<UserResponse>("/users/me/", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      console.log("User data received successfully");
      return response.data;
    } catch (error) {
      console.error("Error fetching current user:", error);
      // Добавляем больше информации об ошибке
      if (axios.isAxiosError(error)) {
        console.error("Response status:", error.response?.status);
        console.error("Response data:", error.response?.data);
        console.error("Request config:", error.config);
      }
      throw error;
    }
  },
};

export type { UserResponse, LoginResponse };
export default authApi;
