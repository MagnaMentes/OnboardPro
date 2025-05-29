import React, { useEffect, useState } from "react";
import { Box, Flex, useToast } from "@chakra-ui/react";
import ClientHintPopover from "./ClientHintPopover";
import { clientAssistantApi, ClientAIInsight } from "../../api/clientAssistant";

interface StepAssistantProps {
  stepId: number;
}

const StepAssistant: React.FC<StepAssistantProps> = ({ stepId }) => {
  const [insight, setInsight] = useState<ClientAIInsight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Получаем подсказку при входе в шаг
  useEffect(() => {
    const fetchInsight = async () => {
      try {
        setIsLoading(true);
        const data = await clientAssistantApi.getInsightForStep(stepId);
        // Устанавливаем подсказку только если получили валидные данные
        if (data) {
          setInsight(data);
        }
      } catch (error) {
        console.error("Ошибка при получении подсказки:", error);
        // Мы не показываем ошибки пользователю, просто логируем для отладки
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsight();
  }, [stepId]);

  // Обработчик скрытия подсказки
  const handleDismiss = async () => {
    if (!insight) return;

    try {
      const result = await clientAssistantApi.dismissInsight(insight.id);

      // Независимо от результата запроса к API, скрываем подсказку в UI
      // В реальном приложении можно было бы проверять результат запроса
      setInsight(null);

      // Показываем уведомление только если скрытие прошло успешно
      if (result) {
        toast({
          title: "Подсказка скрыта",
          description: "Эта подсказка больше не будет отображаться",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      // В режиме разработки просто логируем ошибку и продолжаем работу
      console.error("Ошибка при скрытии подсказки:", error);

      // Всё равно скрываем подсказку в UI
      setInsight(null);
    }
  };

  if (isLoading || !insight) return null;

  return (
    <Box position="absolute" top={2} right={2} zIndex={2}>
      <ClientHintPopover
        stepId={stepId}
        hint={insight}
        onDismiss={handleDismiss}
        position="right"
      />
    </Box>
  );
};

export default StepAssistant;
