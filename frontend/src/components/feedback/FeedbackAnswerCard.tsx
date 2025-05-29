import React from "react";
import {
  Box,
  Text,
  HStack,
  VStack,
  Badge,
  Progress,
  useColorModeValue,
  Divider,
  Flex,
} from "@chakra-ui/react";
import { FeedbackAnswer } from "../../types/feedback";

interface FeedbackAnswerCardProps {
  answer: FeedbackAnswer;
}

const FeedbackAnswerCard: React.FC<FeedbackAnswerCardProps> = ({ answer }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Отображение в зависимости от типа вопроса
  const renderAnswerContent = () => {
    switch (answer.question_type) {
      case "text":
        return (
          <Box p={3} bg="gray.50" borderRadius="md">
            <Text>{answer.text_answer || "Нет ответа"}</Text>
          </Box>
        );

      case "scale":
        const score = answer.scale_answer || 0;
        let colorScheme = "gray";

        if (score >= 8) colorScheme = "green";
        else if (score >= 6) colorScheme = "teal";
        else if (score >= 4) colorScheme = "yellow";
        else if (score >= 2) colorScheme = "orange";
        else colorScheme = "red";

        return (
          <VStack spacing={2} align="stretch">
            <Flex justifyContent="space-between">
              <Text fontWeight="bold">{score} / 10</Text>
            </Flex>
            <Progress
              value={score * 10}
              colorScheme={colorScheme}
              size="md"
              borderRadius="md"
            />
            <Flex justifyContent="space-between">
              <Text fontSize="xs">0 - Совсем не согласен</Text>
              <Text fontSize="xs">10 - Полностью согласен</Text>
            </Flex>
          </VStack>
        );

      case "multiple_choice":
        if (!answer.choice_answer)
          return <Text color="gray.500">Нет ответа</Text>;

        // Для отображения одиночного выбора (строка)
        if (typeof answer.choice_answer === "string") {
          return (
            <Badge colorScheme="blue" px={2} py={1}>
              {answer.choice_answer}
            </Badge>
          );
        }

        // Для отображения множественного выбора (массив)
        return (
          <HStack spacing={2} wrap="wrap">
            {Array.isArray(answer.choice_answer) &&
              answer.choice_answer.map((choice, index) => (
                <Badge key={index} colorScheme="blue" px={2} py={1}>
                  {choice}
                </Badge>
              ))}
          </HStack>
        );

      default:
        return <Text color="gray.500">Формат ответа не распознан</Text>;
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
      bg={bgColor}
      p={4}
      mb={4}
    >
      <VStack align="stretch" spacing={3}>
        <Text fontWeight="bold">{answer.question_text}</Text>
        <Box>{renderAnswerContent()}</Box>
      </VStack>
    </Box>
  );
};

export default FeedbackAnswerCard;
