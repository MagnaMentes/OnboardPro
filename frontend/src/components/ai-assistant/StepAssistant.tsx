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
        setInsight(data);
      } catch (error) {
        console.error("Ошибка при получении подсказки:", error);
        // Если ошибка критичная, можно показать уведомление,
        // но лучше не мешать пользователю, если подсказка не загрузилась
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
      await clientAssistantApi.dismissInsight(insight.id);
      setInsight(null);
      toast({
        title: "Подсказка скрыта",
        description: "Эта подсказка больше не будет отображаться",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Ошибка при скрытии подсказки:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось скрыть подсказку, попробуйте еще раз",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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
