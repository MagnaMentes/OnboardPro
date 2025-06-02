import React from "react";
import { Box, Text, Badge, Flex, Tooltip } from "@chakra-ui/react";
import { StepFeedback } from "../../api/feedback";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  FaSmileBeam as SmileBeamIcon,
  FaSmile as SmileIcon,
  FaMeh as MehIcon,
  FaFrown as FrownIcon,
  FaSadTear as SadIcon,
} from "react-icons/fa";
import FeedbackIcon from "../ui/FeedbackIcon";

interface StepFeedbackCardProps {
  feedback: StepFeedback;
}

// Функция для получения цвета бейджа в зависимости от тега
const getTagColor = (tag?: string): string => {
  if (!tag) return "gray";

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
const getSentimentIcon = (score?: number) => {
  if (score === undefined) {
    return { icon: MehIcon, color: "gray.400", label: "Не указано" };
  }

  if (score >= 0.6) {
    return {
      icon: SmileBeamIcon,
      color: "green.500",
      label: "Очень позитивный",
    };
  } else if (score >= 0.2) {
    return { icon: SmileIcon, color: "green.300", label: "Позитивный" };
  } else if (score >= -0.2) {
    return { icon: MehIcon, color: "gray.500", label: "Нейтральный" };
  } else if (score >= -0.6) {
    return { icon: FrownIcon, color: "red.300", label: "Негативный" };
  } else {
    return { icon: SadIcon, color: "red.500", label: "Очень негативный" };
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
          <span>
            <FeedbackIcon
              icon={sentiment.icon}
              color={sentiment.color}
              size="20px"
              marginRight="0.5rem"
            />
          </span>
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
