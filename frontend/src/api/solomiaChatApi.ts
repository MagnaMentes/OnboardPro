/**
 * API-клиент для работы с Solomia Chat
 */
import api from "./client";

export interface ChatMessage {
  id: number;
  role: "human" | "assistant";
  message: string;
  created_at: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}

/**
 * Сервис для работы с API AI-чата Solomia
 */
export const SolomiaChatApi = {
  /**
   * Получить историю чата для конкретного шага
   * @param stepId ID шага пользователя
   * @returns Список сообщений чата
   */
  getChatHistory: async (stepId: number): Promise<ChatMessage[]> => {
    try {
      const response = await api.get<ChatHistoryResponse>(
        `/solomia/chat/${stepId}/`
      );
      return response.data.messages;
    } catch (error) {
      console.error("Ошибка получения истории чата:", error);
      return [];
    }
  },

  /**
   * Отправить сообщение в чат и получить ответ
   * @param stepId ID шага пользователя
   * @param message Текст сообщения
   * @returns Последние сообщения (запрос и ответ)
   */
  sendMessage: async (
    stepId: number,
    message: string
  ): Promise<ChatMessage[]> => {
    try {
      const response = await api.post<ChatHistoryResponse>(
        `/solomia/chat/${stepId}/`,
        {
          message,
        }
      );
      return response.data.messages;
    } catch (error) {
      console.error("Ошибка отправки сообщения:", error);
      throw error;
    }
  },
};
