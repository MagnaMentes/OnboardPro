import React from "react";
import {
  Box,
  Text,
  Flex,
  Icon,
  Badge,
  Switch,
  IconButton,
  Tooltip,
  useColorModeValue,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FiEdit2,
  FiTrash2,
  FiAlertTriangle,
  FiTrendingDown,
  FiBarChart2,
  FiMessageSquare,
} from "react-icons/fi";

interface FeedbackTrendRuleProps {
  rule: {
    id: number;
    name: string;
    description: string;
    rule_type: string;
    threshold: number;
    measurement_period_days: number;
    is_active: boolean;
    templates?: { id: number; name: string }[];
    departments?: { id: number; name: string }[];
    created_at: string;
  };
  onEdit: (ruleId: number) => void;
  onDelete: (ruleId: number) => void;
  onToggleActive: (ruleId: number, newActiveState: boolean) => void;
}

const FeedbackTrendRule: React.FC<FeedbackTrendRuleProps> = ({
  rule,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case "sentiment_drop":
        return FiTrendingDown;
      case "satisfaction_drop":
        return FiTrendingDown;
      case "response_rate_drop":
        return FiBarChart2;
      case "issue_frequency_rise":
        return FiAlertTriangle;
      case "topic_shift":
        return FiMessageSquare;
      default:
        return FiAlertTriangle;
    }
  };

  const getRuleTypeText = (ruleType: string) => {
    switch (ruleType) {
      case "sentiment_drop":
        return "Падение настроения";
      case "satisfaction_drop":
        return "Падение удовлетворенности";
      case "response_rate_drop":
        return "Снижение активности";
      case "issue_frequency_rise":
        return "Увеличение проблем";
      case "topic_shift":
        return "Смена тематик";
      default:
        return ruleType;
    }
  };

  const handleToggleActive = () => {
    onToggleActive(rule.id, !rule.is_active);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU");
  };

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="md"
      borderWidth="1px"
      borderColor={borderColor}
      borderLeftWidth="4px"
      borderLeftColor={rule.is_active ? "blue.500" : "gray.300"}
      mb={3}
      shadow="sm"
      opacity={rule.is_active ? 1 : 0.7}
      transition="all 0.2s"
      _hover={{
        shadow: "md",
        transform: "translateY(-2px)",
      }}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Flex alignItems="center">
          <Icon
            as={getRuleTypeIcon(rule.rule_type)}
            color={rule.is_active ? "blue.500" : "gray.400"}
            mr={2}
            boxSize={5}
          />
          <Text fontWeight="bold">{rule.name}</Text>
        </Flex>
        <Flex alignItems="center">
          <Text mr={2} fontSize="sm" color="gray.500">
            Активно
          </Text>
          <Switch
            colorScheme="blue"
            isChecked={rule.is_active}
            onChange={handleToggleActive}
          />
        </Flex>
      </Flex>

      <Text fontSize="sm" color="gray.600" mb={3}>
        {rule.description}
      </Text>

      <Flex flexWrap="wrap" gap={2} mb={3}>
        <Badge colorScheme="blue">{getRuleTypeText(rule.rule_type)}</Badge>
        <Badge colorScheme="purple">Порог: {rule.threshold}</Badge>
        <Badge colorScheme="green">
          Период: {rule.measurement_period_days}{" "}
          {rule.measurement_period_days === 1
            ? "день"
            : rule.measurement_period_days < 5
            ? "дня"
            : "дней"}
        </Badge>
      </Flex>

      {(rule.templates?.length > 0 || rule.departments?.length > 0) && (
        <Box fontSize="xs" color="gray.500" mb={3}>
          {rule.templates?.length > 0 && (
            <Text mb={1}>
              Шаблоны: {rule.templates.map((t) => t.name).join(", ")}
            </Text>
          )}
          {rule.departments?.length > 0 && (
            <Text>
              Департаменты: {rule.departments.map((d) => d.name).join(", ")}
            </Text>
          )}
        </Box>
      )}

      <Flex justifyContent="space-between" alignItems="center">
        <Text fontSize="xs" color="gray.500">
          Создано: {formatDate(rule.created_at)}
        </Text>
        <Box>
          <Tooltip label="Редактировать правило">
            <IconButton
              aria-label="Edit rule"
              icon={<FiEdit2 />}
              size="sm"
              variant="ghost"
              onClick={() => onEdit(rule.id)}
              mr={1}
            />
          </Tooltip>
          <Tooltip label="Удалить правило">
            <IconButton
              aria-label="Delete rule"
              icon={<FiTrash2 />}
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={() => onDelete(rule.id)}
            />
          </Tooltip>
        </Box>
      </Flex>
    </Box>
  );
};

export default FeedbackTrendRule;
