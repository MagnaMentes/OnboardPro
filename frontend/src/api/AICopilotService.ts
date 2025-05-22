import axios from "../api";

export interface AIHintResponse {
  hint: string;
}

/**
 * Сервис для работы с AI Copilot (Solomia) API
 */
const AICopilotService = {
  /**
   * Получить существующую подсказку для шага
   * @param stepId - ID шага
   * @returns Promise с результатом запроса
   */
  getHint: async (stepId: number): Promise<AIHintResponse> => {
    const response = await axios.get<AIHintResponse>(
      `/ai/step/${stepId}/hint/`
    );
    return response.data;
  },

  /**
   * Генерировать новую подсказку для шага
   * @param stepId - ID шага
   * @returns Promise с результатом запроса
   */
  generateHint: async (stepId: number): Promise<AIHintResponse> => {
    const response = await axios.post<AIHintResponse>(
      `/ai/step/${stepId}/hint/`
    );
    return response.data;
  },
};

export default AICopilotService;
