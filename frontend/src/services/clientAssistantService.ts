/**
 * @deprecated Используйте импорт из '../api/clientAssistant' вместо этого сервиса
 * Этот файл оставлен для обратной совместимости, чтобы избежать поломки существующих компонентов
 */

import { clientAssistantApi, ClientAIInsight } from "../api/clientAssistant";

/**
 * Сервис для взаимодействия с API клиентского ассистента
 * @deprecated Используйте clientAssistantApi из '../api/clientAssistant' вместо этого сервиса
 */
export const clientAssistantService = {
  /**
   * Получает все активные подсказки для текущего пользователя
   */
  fetchClientInsights: clientAssistantApi.getInsights,

  /**
   * Отмечает подсказку как скрытую
   */
  dismissClientInsight: clientAssistantApi.dismissInsight,

  /**
   * Генерирует подсказку для конкретного шага
   */
  generateInsightForStep: clientAssistantApi.getInsightForStep,
};

export { ClientAIInsight };
export default clientAssistantService;
