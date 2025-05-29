import axios from "axios";
import apiClient from "./apiClient";
import { UserReward, UserLevel } from "./types";
import config from "./config";
import { formatApiError } from "./utils";
import { mockUserLevel, mockUserRewards } from "./mockData";

// Реэкспортируем типы для использования компонентами
export type { UserReward, UserLevel };

/**
 * Обработка ошибок API
 * Логгирует ошибки и форматирует сообщение об ошибке
 */
const formatErrorMessage = (error: unknown): string => {
  const errorMessage = formatApiError(error);
  console.error("API Error:", errorMessage);

  // Дополнительная диагностика для ошибок сети
  if (axios.isAxiosError(error) && !error.response) {
    console.error("Ошибка сетевого соединения:", error.message);
  }

  return errorMessage;
};

/**
 * API-клиент для работы с системой геймификации
 */
export const gamificationApi = {
  /**
   * Получить список наград пользователя
   * @param rewardType - Опциональный фильтр по типу награды
   */
  getUserRewards: async (rewardType?: string): Promise<UserReward[]> => {
    try {
      const params = rewardType ? { type: rewardType } : {};
      const response = await apiClient.get<UserReward[]>(
        "/gamification/achievements/",
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении наград:", error);
      // В режиме разработки возвращаем мок-данные
      if (import.meta.env.DEV) {
        console.warn("DEV: Возвращаем тестовые данные для наград");
        return mockUserRewards;
      }
      throw new Error(formatApiError(error));
    }
  },

  /**
   * Получить информацию об уровне пользователя
   */
  getUserLevel: async (): Promise<UserLevel> => {
    try {
      const response = await apiClient.get<UserLevel>("/gamification/profile/");
      return response.data;
    } catch (error) {
      console.error("Ошибка при получении уровня пользователя:", error);
      // В режиме разработки возвращаем мок-данные
      if (import.meta.env.DEV) {
        console.warn("DEV: Возвращаем тестовые данные для уровня пользователя");
        return mockUserLevel;
      }
      throw new Error(formatApiError(error));
    }
  },
};

// Экспорт по умолчанию для совместимости с теми, кто мог бы импортировать default
export default gamificationApi;
