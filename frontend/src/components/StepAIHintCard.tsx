import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  Text,
  useToast,
  Spinner,
} from "@chakra-ui/react";
import { FiMessageSquare } from "react-icons/fi";
import AICopilotService from "../api/AICopilotService";

interface StepAIHintCardProps {
  stepId: number;
  isActiveStep: boolean;
}

/**
 * Компонент для отображения AI-подсказки к шагу онбординга
 */
const StepAIHintCard: React.FC<StepAIHintCardProps> = ({
  stepId,
  isActiveStep,
}) => {
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialFetched, setIsInitialFetched] = useState<boolean>(false);

  const toast = useToast();

  // При первой загрузке компонента проверяем наличие существующей подсказки
  React.useEffect(() => {
    const fetchExistingHint = async () => {
      try {
        setLoading(true);
        const response = await AICopilotService.getHint(stepId);
        if (response) {
          setHint(response.hint_text);
        }
        setIsInitialFetched(true);
      } catch (err: any) {
        // Если подсказки нет (код 404), это нормальное состояние - просто не показываем её
        if (err.response && err.response.status !== 404) {
          setError("Ошибка при загрузке подсказки");
          toast({
            title: "Ошибка",
            description: "Не удалось загрузить подсказку",
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        }
        setIsInitialFetched(true);
      } finally {
        setLoading(false);
      }
    };

    if (isActiveStep && !isInitialFetched) {
      fetchExistingHint();
    }
  }, [stepId, isActiveStep, toast, isInitialFetched]);

  // Обработчик для генерации новой подсказки
  const handleGenerateHint = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AICopilotService.generateHint(stepId);
      if (response) {
        setHint(response.hint_text);

        toast({
          title: "Подсказка получена",
          description: "AI-ассистент Solomia сгенерировал подсказку",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        throw new Error("Не удалось получить подсказку");
      }
    } catch (err: any) {
      setError("Ошибка при генерации подсказки");
      toast({
        title: "Ошибка",
        description: "Не удалось получить подсказку от AI-ассистента",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Если шаг не активен, не показываем компонент
  if (!isActiveStep) {
    return null;
  }

  return (
    <Card my={4} borderWidth="1px" borderRadius="lg" boxShadow="md" bg="white">
      <CardHeader
        bg="blue.50"
        borderTopRadius="lg"
        display="flex"
        alignItems="center"
      >
        <FiMessageSquare size={20} style={{ marginRight: "8px" }} />
        <Heading size="md">AI-ассистент Solomia</Heading>
      </CardHeader>

      <CardBody>
        {loading ? (
          <Box textAlign="center" py={4}>
            <Spinner size="md" color="blue.500" />
            <Text mt={2}>Генерация AI-подсказки...</Text>
          </Box>
        ) : hint ? (
          <Text>{hint}</Text>
        ) : error ? (
          <Text color="red.500">{error}</Text>
        ) : (
          <Text>
            Получите персонализированную подсказку для прохождения этого шага
            онбординга от AI-ассистента Solomia.
          </Text>
        )}
      </CardBody>

      <CardFooter justifyContent="center">
        {!loading && (
          <Button
            colorScheme={hint ? "blue" : "teal"}
            onClick={handleGenerateHint}
            leftIcon={<FiMessageSquare />}
            isDisabled={loading}
          >
            {hint ? "Запросить новую подсказку" : "Запросить помощь у Solomia"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default StepAIHintCard;
