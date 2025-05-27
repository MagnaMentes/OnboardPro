// @ts-ignore
import api from "./client";

export interface AIHintResponse {
  hint_text: string;
  id: number;
  user: number;
  assignment: number;
  step: number;
  step_name: string;
  program_name: string;
  generated_at: string;
  dismissed: boolean;
}

/**
 * Сервис для работы с AI Copilot (Solomia) API
 */
const AICopilotService = {
  /**
   * Получить существующую подсказку для шага
   * @param stepId - ID шага
   * @returns Promise с результатом запроса или null при ошибке
   */
  getHint: async (stepId: number): Promise<AIHintResponse | null> => {
    try {
      const response = await api.get<AIHintResponse>(
        `api/ai/assistant/step/${stepId}/insight/`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Ошибка при получении подсказки для шага ${stepId}:`,
        error
      );
      return null;
    }
  },

  /**
   * Генерировать новую подсказку для шага
   * @param stepId - ID шага
   * @returns Promise с результатом запроса или null при ошибке
   */
  generateHint: async (stepId: number): Promise<AIHintResponse | null> => {
    try {
      const response = await api.post<AIHintResponse>(
        `api/ai/assistant/step/${stepId}/insight/`
      );
      return response.data;
    } catch (error) {
      console.error(
        `Ошибка при генерации подсказки для шага ${stepId}:`,
        error
      );
      return null;
    }
  },
};

export default AICopilotService;
