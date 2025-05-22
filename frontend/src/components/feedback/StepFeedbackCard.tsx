import React from "react";
import { Box, Text, Badge, Flex, Icon, Tooltip } from "@chakra-ui/react";
import { StepFeedback } from "../../api/feedback";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  FaSmileBeam,
  FaSmile,
  FaMeh,
  FaFrown,
  FaSadTear,
} from "react-icons/fa";

interface StepFeedbackCardProps {
  feedback: StepFeedback;
}

// Функция для получения цвета бейджа в зависимости от тега
const getTagColor = (tag: string): string => {
  switch (tag) {
    case "positive":
      return "green";
    case "negative":
      return "red";
    case "unclear_instruction":
      return "orange";
    case "delay_warning":
      return "yellow";
    case "neutral":
    default:
      return "gray";
  }
};

// Функция для получения иконки в зависимости от sentiment_score
const getSentimentIcon = (score: number) => {
  if (score >= 0.6) {
    return { icon: FaSmileBeam, color: "green.500", label: "Очень позитивный" };
  } else if (score >= 0.2) {
    return { icon: FaSmile, color: "green.300", label: "Позитивный" };
  } else if (score >= -0.2) {
    return { icon: FaMeh, color: "gray.500", label: "Нейтральный" };
  } else if (score >= -0.6) {
    return { icon: FaFrown, color: "red.300", label: "Негативный" };
  } else {
    return { icon: FaSadTear, color: "red.500", label: "Очень негативный" };
  }
};

const StepFeedbackCard: React.FC<StepFeedbackCardProps> = ({ feedback }) => {
  const sentiment = getSentimentIcon(feedback.sentiment_score);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      mb={4}
      bg="white"
      boxShadow="sm"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Text fontWeight="bold">{feedback.step_name}</Text>
        <Text fontSize="sm" color="gray.500">
          {format(new Date(feedback.created_at), "d MMMM yyyy HH:mm", {
            locale: ru,
          })}
        </Text>
      </Flex>

      <Flex alignItems="center" mb={3}>
        <Tooltip label={sentiment.label}>
          <Icon
            as={sentiment.icon}
            color={sentiment.color}
            mr={2}
            boxSize={5}
          />
        </Tooltip>
        {feedback.auto_tag && (
          <Badge colorScheme={getTagColor(feedback.auto_tag)} mr={2}>
            {feedback.auto_tag_display}
          </Badge>
        )}
      </Flex>

      <Text>{feedback.comment}</Text>
    </Box>
  );
};

export default StepFeedbackCard;
