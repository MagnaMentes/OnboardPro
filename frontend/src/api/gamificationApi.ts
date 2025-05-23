import apiClient from "./apiClient";
import { UserReward, UserLevel } from "./types";
import config from "./config";
import { formatApiError } from "./utils";

// Реэкспортируем типы для использования компонентами
export type { UserReward, UserLevel };

/**
 * Обработка ошибок API
 */
const handleApiError = (error: unknown) => {
  const errorMessage = formatApiError(error);
  console.error("API Error:", errorMessage);
  throw new Error(errorMessage);
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
        "/gamification/rewards/",
        { params }
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Получить информацию об уровне пользователя
   */
  getUserLevel: async (): Promise<UserLevel> => {
    try {
      const response = await apiClient.get<UserLevel>("/gamification/level/");
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Экспорт по умолчанию для совместимости с теми, кто мог бы импортировать default
export default gamificationApi;
