import api from "../api/client";
import { ClientHint } from "../components/client-assistant/ClientHintPopover";

interface ApiResponse<T> {
  data: T;
}

/**
 * Сервис для взаимодействия с API клиентского ассистента
 */
export const clientAssistantService = {
  /**
   * Получает все активные подсказки для текущего пользователя
   */
  fetchClientInsights: async (): Promise<ClientHint[]> => {
    try {
      const response: ApiResponse<ClientHint[]> = await api.get(
        "/assistant/insights/"
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching client insights:", error);
      throw error;
    }
  },

  /**
   * Отмечает подсказку как скрытую
   */
  dismissClientInsight: async (insightId: number): Promise<void> => {
    try {
      await api.post(`/assistant/insights/${insightId}/dismiss/`);
    } catch (error) {
      console.error(`Error dismissing insight ${insightId}:`, error);
      throw error;
    }
  },

  /**
   * Генерирует подсказку для конкретного шага
   */
  generateInsightForStep: async (
    stepId: number
  ): Promise<ClientHint | null> => {
    try {
      const response: ApiResponse<ClientHint> = await api.get(
        `/assistant/step/${stepId}/insight/`
      );
      return response.data;
    } catch (error) {
      console.error(`Error generating insight for step ${stepId}:`, error);
      // Возвращаем null вместо ошибки, чтобы UI мог корректно обработать отсутствие подсказки
      return null;
    }
  },
};

export default clientAssistantService;
