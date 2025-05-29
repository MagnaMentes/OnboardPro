import apiClient from "./apiClient";
import { User } from "../types/user";
import { Assignment } from "../types/assignment";
import { Feedback } from "../types/feedback";
import { AIInsight } from "../types/aiInsight";

const BASE_URL = "/admin";

// Интерфейсы для параметров запросов
interface GetUsersParams {
  role?: string;
  status?: string;
  search?: string;
}

interface GetAssignmentsParams {
  status?: string;
}

interface GetFeedbacksParams {
  sentiment?: "positive" | "negative" | "neutral";
  auto_tag?: string;
  limit?: number;
}

interface GetInsightsParams {
  risk_level?: "high" | "medium";
  limit?: number;
}

// Admin API класс
class AdminApi {
  constructor() {
    // И��пользуем напрямую apiClient
  }

  // Получение списка пользователей для административной панели
  async getUsers(params?: GetUsersParams): Promise<User[]> {
    const url = `${BASE_URL}/users/`;
    const response = await apiClient.get(url, { params });
    return response.data;
  }

  // Получение списка назначений для административной панели
  async getAssignments(params?: GetAssignmentsParams): Promise<Assignment[]> {
    const url = `${BASE_URL}/onboarding/assignments/`;
    const response = await apiClient.get(url, { params });
    return response.data;
  }

  // Получение списка обратной связи для административной панели
  async getFeedbacks(params?: GetFeedbacksParams): Promise<Feedback[]> {
    const url = `${BASE_URL}/onboarding/feedbacks/`;
    const response = await apiClient.get(url, { params });
    return response.data;
  }

  // Получение списка AI-инсайтов для административной панели
  async getInsights(params?: GetInsightsParams): Promise<AIInsight[]> {
    const url = `${BASE_URL}/ai/insights/`;
    const response = await apiClient.get(url, { params });
    return response.data;
  }
}

export default new AdminApi();
