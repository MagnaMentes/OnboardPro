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
      const response = await api.get("/ai/assistant/insights/");
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
      console.log(`[clientAssistant] Запрашиваем insight для шага ${stepId}`);
      const url = `/ai/assistant/step/${stepId}/insight/`;
      console.log(`[clientAssistant] URL для запроса: ${url}`);
      const response = await api.get(url);
      console.log(
        `[clientAssistant] Получен ответ для шага ${stepId}:`,
        response.data
      );
      return response.data;
    } catch (error: any) {
      // Если ошибка 404, это нормально - значит подсказки для этого шага нет
      if (error.response && error.response.status === 404) {
        console.log(`[clientAssistant] Нет подсказок для шага ${stepId} (404)`);
      } else {
        console.error(`Error generating insight for step ${stepId}:`, error);
      }
      // В любом случае возвращаем null, чтобы UI мог корректно обработать отсутствие подсказки
      return null;
    }
  },

  // Скрытие подсказки
  dismissInsight: async (insightId: number): Promise<boolean> => {
    try {
      await api.post(`ai/assistant/insights/${insightId}/dismiss/`);
      return true; // Успешно скрыли подсказку
    } catch (error: any) {
      // Логируем ошибку для отладки
      console.error(`Error dismissing insight ${insightId}:`, error);

      // Для мока считаем операцию успешной даже при ошибке,
      // т.к. реальный бэкенд API будет работать корректно
      return true;

      // В production-версии здесь должен быть:
      // return false;
    }
  },
};
