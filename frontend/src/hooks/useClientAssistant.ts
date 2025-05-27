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
          setError("Подсказка недоступна");
        }
      } catch (err) {
        setError("Не удалось загрузить подсказку");
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
      await clientAssistantApi.dismissInsight(insightId);
      setInsight(null);
    } catch (err) {
      setError("Не удалось скрыть подсказку");
      console.error("Error dismissing insight:", err);
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
