import api from "./apiClient";
import { User } from "../types/user";
import { Department } from "../types/department";
import { UserAnalytics } from "../types/userAnalytics";

/**
 * API-сервис для работы с административной панелью пользователей
 */
const adminUserApi = {
  /**
   * Получить список всех пользователей с возможностью фильтрации
   */
  getAllUsers: async (params?: {
    role?: string;
    is_active?: boolean;
    department?: number;
    onboarding_status?: string;
    search?: string;
    ordering?: string;
  }): Promise<User[]> => {
    const response = await api.get("/admin/users/", { params });
    return response.data;
  },

  /**
   * Получить детальную аналитику по конкретному пользователю
   */
  getUserAnalytics: async (userId: number): Promise<UserAnalytics> => {
    const response = await api.get(`/admin/users/${userId}/analytics/`);
    return response.data;
  },

  /**
   * Получить сводную аналитику по департаментам
   */
  getDepartmentOverview: async (params?: {
    is_active?: boolean;
  }): Promise<Department[]> => {
    const response = await api.get("/admin/departments/overview/", { params });
    return response.data;
  },
};

export default adminUserApi;
