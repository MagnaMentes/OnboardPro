import api from "./client";

// Типы данных для API клиентского ассистента
export interface ClientAIInsight {
  id: number;
  user: number;
  assignment: number;
  step: number;
  step_name: string;
  program_name: string;
  hint_text: string;
  generated_at: string;
  dismissed: boolean;
}

// API запросы для работы с подсказками AI ассистента
export const clientAssistantApi = {
  // Получение всех активных подсказок для текущего пользователя
  getInsights: async (): Promise<ClientAIInsight[]> => {
    const response = await api.get("/ai/assistant/insights/");
    return response.data;
  },

  // Получение или генерация подсказки для конкретного шага
  getInsightForStep: async (stepId: number): Promise<ClientAIInsight> => {
    const response = await api.get(`/ai/assistant/step/${stepId}/insight/`);
    return response.data;
  },

  // Скрытие подсказки
  dismissInsight: async (insightId: number): Promise<void> => {
    await api.post(`/ai/assistant/insights/${insightId}/dismiss/`);
  },
};
