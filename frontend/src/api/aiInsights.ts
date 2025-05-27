import api from "./client";

// Типы данных для AI-инсайтов
export interface AIInsight {
  id: number;
  user: number;
  user_email: string;
  user_full_name: string;
  assignment: number;
  program_name: string;
  risk_level: "low" | "medium" | "high";
  risk_level_display: string;
  reason: string;
  created_at: string;
}

// API запросы для AI-инсайтов
const aiInsightsApi = {
  // Получение всех инсайтов
  getAllInsights: async (): Promise<AIInsight[]> => {
    const response = await api.get("ai/insights/");
    return response.data;
  },

  // Получение инсайтов для конкретного пользователя
  getUserInsights: async (userId: number): Promise<AIInsight[]> => {
    const response = await api.get(`ai/insights/user/${userId}/`);
    return response.data;
  },
};

export default aiInsightsApi;
