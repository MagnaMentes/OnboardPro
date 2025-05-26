import { FC } from "react";
import {
  Box,
  Text,
  Badge,
  VStack,
  HStack,
  useColorModeValue,
  Heading,
} from "@chakra-ui/react";
import { AIInsight } from "../../api/aiInsights";

interface AIInsightCardProps {
  insight: AIInsight;
}

const AIInsightCard: FC<AIInsightCardProps> = ({ insight }) => {
  // Определяем цвет бейджа в зависимости от уровня риска
  const getRiskBadgeColor = () => {
    if (!insight.risk_level) {
      return "gray";
    }

    switch (insight.risk_level) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "gray";
    }
  };

  // Цвета для карточки
  const cardBg = useColorModeValue("white", "gray.700");
  const cardBorderColor = useColorModeValue("gray.200", "gray.600");
  const reasonColor = useColorModeValue("gray.600", "gray.300");

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={cardBorderColor}
      overflow="hidden"
      bg={cardBg}
      p={4}
      shadow="sm"
      transition="all 0.3s"
      _hover={{ shadow: "md" }}
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Heading size="md" fontWeight="semibold" isTruncated>
            {insight.user_full_name || insight.user_email}
          </Heading>
          <Badge
            colorScheme={getRiskBadgeColor()}
            fontSize="sm"
            py={1}
            px={2}
            borderRadius="md"
          >
            {insight.risk_level_display}
          </Badge>
        </HStack>

        <Text fontSize="sm" color="gray.500">
          Программа: {insight.program_name}
        </Text>

        <Box>
          <Heading size="xs" mb={1}>
            Причины:
          </Heading>
          <Text fontSize="md" color={reasonColor} whiteSpace="pre-line">
            {insight.reason}
          </Text>
        </Box>

        <Text fontSize="xs" color="gray.400" alignSelf="flex-end">
          {new Date(insight.created_at).toLocaleDateString()}{" "}
          {new Date(insight.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </VStack>
    </Box>
  );
};

export default AIInsightCard;
