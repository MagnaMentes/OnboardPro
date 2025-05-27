// API сервис для работы с аутентификацией
import axiosInstance from "./client";
import axios from "axios";

interface LoginResponse {
  access: string;
  refresh: string;
  user?: {
    id: string;
    email: string;
    username: string;
    full_name: string;
    position: string;
    role: string;
    is_active: boolean;
    created_at: string;
  };
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

interface UserResponse {
  id: string;
  email: string;
  username: string;
  full_name: string;
  position: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

// Сервис для работы с API аутентификации
const authApi = {
  // Логин пользователя
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosInstance.post<LoginResponse>(
      "auth/login/",
      data
    );
    return response.data;
  },

  // Обновление токена доступа
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await axiosInstance.post<TokenRefreshResponse>(
      "auth/refresh/",
      { refresh: refreshToken }
    );
    return response.data;
  },

  // Получение данных текущего пользователя
  getCurrentUser: async (): Promise<UserResponse> => {
    try {
      const token = localStorage.getItem("accessToken");
      console.log("Current token:", token ? "present" : "missing");

      // Для отладки выведем больше информации о запросе
      console.log("Making request to: users/me/");
      console.log(
        "Authorization header:",
        token ? `Bearer ${token.substring(0, 10)}...` : "not set"
      );

      // Устанавливаем заголовок Authorization вручную для этого запроса
      const response = await axiosInstance.get<UserResponse>("users/me/", {
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
