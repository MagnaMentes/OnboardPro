import { useState, useEffect } from "react";
import { clientAssistantApi, ClientAIInsight } from "../api/clientAssistant";

/**
 * Хук для работы с клиентским ассистентом
 * @param stepId ID шага, для которого нужна подсказка
 * @returns Объект с подсказкой, состоянием загрузки и методами для управления
 */
export const useClientAssistant = (stepId?: number) => {
  const [insight, setInsight] = useState<ClientAIInsight | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Загружаем подсказку при загрузке компонента или изменении stepId
  useEffect(() => {
    // Если не указан stepId, не загружаем подсказку
    if (!stepId) return;

    const loadInsight = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await clientAssistantApi.getInsightForStep(stepId);
        if (result) {
          setInsight(result);
        } else {
          // Если результат null, это нормальное состояние (нет подсказки для данного шага)
          // Не устанавливаем ошибку, чтобы не показывать сообщение об ошибке
          // setError("Подсказка недоступна");
        }
      } catch (err) {
        // Не показываем ошибку на UI, только логируем для отладки
        console.error("Error loading client insight:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsight();
  }, [stepId]);

  // Метод для скрытия подсказки
  const dismissInsight = async (insightId: number) => {
    try {
      const success = await clientAssistantApi.dismissInsight(insightId);
      // Если API вернуло успешный результат или мы в режиме разработки - скрываем подсказку в UI
      if (success) {
        setInsight(null);
      }
    } catch (err) {
      // Просто логируем ошибку для отладки, но не показываем пользователю
      console.error("Error dismissing insight:", err);

      // В режиме разработки всё равно скрываем подсказку в UI
      setInsight(null);
    }
  };

  // Метод для загрузки всех активных подсказок
  const loadAllInsights = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const insights = await clientAssistantApi.getInsights();
      // Если нужна только первая подсказка
      setInsight(insights && insights.length > 0 ? insights[0] : null);
      return insights;
    } catch (err) {
      setError("Не удалось загрузить подсказки");
      console.error("Error loading client insights:", err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    insight,
    isLoading,
    error,
    dismissInsight,
    loadAllInsights,
  };
};

export default useClientAssistant;
