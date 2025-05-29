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
      console.log(
        `[AICopilotService] Запрашиваем подсказку для шага ${stepId}`
      );

      // Явно формируем URL, чтобы избежать проблем со слэшами
      const url = `ai/assistant/step/${stepId}/insight/`;
      console.log(`[AICopilotService] Используем URL: ${url}`);

      const response = await api.get<AIHintResponse>(url);
      console.log(
        `[AICopilotService] Успешно получена подсказка для шага ${stepId}`,
        response.data
      );
      return response.data;
    } catch (error: any) {
      console.error(
        `Ошибка при получении подсказки для шага ${stepId}:`,
        error
      );

      // Дополнительная отладочная информация
      if (error.response) {
        console.error(`Код ответа: ${error.response.status}`);
        console.error(`Данные ответа:`, error.response.data);
        console.error(`Заголовки ответа:`, error.response.headers);
      } else if (error.request) {
        console.error(
          `Запрос был отправлен, но ответ не получен:`,
          error.request
        );
      } else {
        console.error(`Ошибка при настройке запроса:`, error.message);
      }

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
      console.log(`[AICopilotService] Генерируем подсказку для шага ${stepId}`);

      // Явно формируем URL, чтобы избежать проблем со слэшами
      const url = `ai/assistant/step/${stepId}/insight/`;
      console.log(`[AICopilotService] Используем URL для POST запроса: ${url}`);

      const response = await api.post<AIHintResponse>(url);
      console.log(
        `[AICopilotService] Успешно сгенерирована подсказка для шага ${stepId}`,
        response.data
      );
      return response.data;
    } catch (error: any) {
      console.error(
        `Ошибка при генерации подсказки для шага ${stepId}:`,
        error
      );

      // Дополнительная отладочная информация
      if (error.response) {
        console.error(`Код ответа: ${error.response.status}`);
        console.error(`Данные ответа:`, error.response.data);
        console.error(`Заголовки ответа:`, error.response.headers);
      } else if (error.request) {
        console.error(
          `Запрос был отправлен, но ответ не получен:`,
          error.request
        );
      } else {
        console.error(`Ошибка при настройке запроса:`, error.message);
      }

      return null;
    }
  },
};

export default AICopilotService;
