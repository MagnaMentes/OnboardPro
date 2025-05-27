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
    try {
      const response = await api.get("ai/assistant/insights/");
      return response.data;
    } catch (error) {
      console.error("Error fetching client insights:", error);
      throw error;
    }
  },

  // Получение или генерация подсказки для конкретного шага
  getInsightForStep: async (
    stepId: number
  ): Promise<ClientAIInsight | null> => {
    try {
      const response = await api.get(`ai/assistant/step/${stepId}/insight/`);
      return response.data;
    } catch (error) {
      console.error(`Error generating insight for step ${stepId}:`, error);
      // Возвращаем null вместо ошибки, чтобы UI мог корректно обработать отсутствие подсказки
      return null;
    }
  },

  // Скрытие подсказки
  dismissInsight: async (insightId: number): Promise<void> => {
    try {
      await api.post(`ai/assistant/insights/${insightId}/dismiss/`);
    } catch (error) {
      console.error(`Error dismissing insight ${insightId}:`, error);
      throw error;
    }
  },
};
