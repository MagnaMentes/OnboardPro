import React from "react";
import {
  Box,
  Text,
  Badge,
  Flex,
  Icon,
  Button,
  Spacer,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiAlertTriangle,
  FiCheck,
  FiTrendingDown,
  FiTrendingUp,
  FiInfo,
  FiMessageSquare,
} from "react-icons/fi";

interface FeedbackTrendAlertProps {
  alert: {
    id: number;
    title: string;
    description: string;
    severity: "low" | "medium" | "high" | "critical";
    created_at: string;
    is_resolved: boolean;
    rule_type: string;
    percentage_change: number | null;
    template_name?: string;
    department_name?: string;
  };
  onResolve?: (alertId: number) => void;
  onShowDetails?: (alertId: number) => void;
}

const FeedbackTrendAlert: React.FC<FeedbackTrendAlertProps> = ({
  alert,
  onResolve,
  onShowDetails,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "low":
        return "blue";
      case "medium":
        return "yellow";
      case "high":
        return "orange";
      case "critical":
        return "red";
      default:
        return "gray";
    }
  };

  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case "sentiment_drop":
      case "satisfaction_drop":
        return FiTrendingDown;
      case "response_rate_drop":
        return FiTrendingDown;
      case "issue_frequency_rise":
        return FiTrendingUp;
      case "topic_shift":
        return FiInfo;
      default:
        return FiAlertTriangle;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      borderLeftWidth="4px"
      borderLeftColor={`${getSeverityColor(alert.severity)}.500`}
      mb={3}
      shadow="sm"
      transition="all 0.2s"
      _hover={{
        shadow: "md",
        transform: "translateY(-2px)",
      }}
    >
      <Flex alignItems="center" mb={2}>
        <Icon
          as={getRuleTypeIcon(alert.rule_type)}
          color={`${getSeverityColor(alert.severity)}.500`}
          boxSize={5}
          mr={2}
        />
        <Text fontWeight="bold" fontSize="md">
          {alert.title}
        </Text>
        <Spacer />
        <Badge colorScheme={getSeverityColor(alert.severity)}>
          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
        </Badge>
      </Flex>

      <Text fontSize="sm" color="gray.600" mb={3}>
        {alert.description}
      </Text>

      <Flex
        justifyContent="space-between"
        alignItems="center"
        fontSize="xs"
        color="gray.500"
        mt={2}
      >
        <Flex alignItems="center">
          <Text mr={4}>
            {alert.template_name && `Шаблон: ${alert.template_name}`}
            {alert.department_name && alert.template_name && " | "}
            {alert.department_name && `Департамент: ${alert.department_name}`}
          </Text>
          <Text>{formatDate(alert.created_at)}</Text>
        </Flex>

        <Flex>
          {!alert.is_resolved && onResolve && (
            <Button
              size="sm"
              variant="outline"
              colorScheme="green"
              leftIcon={<FiCheck />}
              mr={2}
              onClick={() => onResolve(alert.id)}
            >
              Решено
            </Button>
          )}

          {onShowDetails && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<FiMessageSquare />}
              onClick={() => onShowDetails(alert.id)}
            >
              Подробности
            </Button>
          )}

          {alert.is_resolved && (
            <Tooltip label="Этот алерт уже решен">
              <Badge colorScheme="green" ml={2}>
                Решено
              </Badge>
            </Tooltip>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};

export default FeedbackTrendAlert;
