import { create } from "zustand";

// Константы для ключей localStorage
export const ACCESS_TOKEN_KEY = "accessToken";
export const REFRESH_TOKEN_KEY = "refreshToken";
export const USER_DATA_KEY = "user";

/**
 * Унифицированный интерфейс пользователя
 * Содержит все необходимые поля из API бэкенда
 */
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string; // Полное имя пользователя
  position: string; // Должность
  role: string; // Роль в системе: admin, hr, manager, employee
  is_active: boolean; // Статус активности аккаунта
  created_at: string; // Дата создания аккаунта
  avatar?: string; // URL аватара, необязательное поле
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setUser: (user) => set({ user }),

  setTokens: (accessToken, refreshToken) => {
    // Записываем токены в localStorage для сохранения между перезагрузками страницы
    if (accessToken && refreshToken) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    set({
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken && !!refreshToken,
    });
  },

  login: (accessToken, refreshToken, user) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));

    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
