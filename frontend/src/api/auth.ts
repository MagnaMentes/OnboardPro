// API сервис для работы с аутентификацией
import axiosInstance from "./client";

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
      "/auth/login/",
      data
    );
    return response.data;
  },

  // Обновление токена доступа
  refreshToken: async (refreshToken: string): Promise<TokenRefreshResponse> => {
    const response = await axiosInstance.post<TokenRefreshResponse>(
      "/auth/refresh/",
      { refresh: refreshToken }
    );
    return response.data;
  },

  // Получение данных текущего пользователя
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await axiosInstance.get<UserResponse>("/users/me/");
    return response.data;
  },
};

export type { UserResponse, LoginResponse };
export default authApi;
