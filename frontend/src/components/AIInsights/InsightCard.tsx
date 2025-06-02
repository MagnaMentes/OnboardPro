import {
  SmartInsight,
  InsightLevel,
  InsightStatus,
  InsightTag,
} from "@/types/aiInsights";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Badge,
  Button,
  Text,
  HStack,
  VStack,
  Box,
  Tag,
  TagLeftIcon,
  TagLabel,
  Tooltip,
  Flex,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  FiClock,
  FiTag,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiMoreVertical,
  FiExternalLink,
  FiPlay,
} from "react-icons/fi";
import { Link } from "react-router-dom";

interface InsightCardProps {
  insight: SmartInsight;
  onResolve?: (id: number) => void;
  onDismiss?: (id: number) => void;
  onAcknowledge?: (id: number) => void;
  onMarkInProgress?: (id: number) => void;
}

const InsightCard = ({
  insight,
  onResolve,
  onDismiss,
  onAcknowledge,
  onMarkInProgress,
}: InsightCardProps) => {
  // Определение цвета карточки в зависимости от уровня важности
  const getLevelColor = () => {
    switch (insight.level) {
      case InsightLevel.CRITICAL:
        return "red.500";
      case InsightLevel.HIGH:
        return "orange.500";
      case InsightLevel.MEDIUM:
        return "yellow.500";
      case InsightLevel.LOW:
        return "blue.500";
      default:
        return "gray.500";
    }
  };

  // Определение статуса
  const getStatusColor = () => {
    switch (insight.status) {
      case InsightStatus.RESOLVED:
        return "green.500";
      case InsightStatus.DISMISSED:
        return "gray.500";
      case InsightStatus.ACKNOWLEDGED:
        return "blue.500";
      case InsightStatus.IN_PROGRESS:
        return "purple.500";
      default:
        return "orange.500";
    }
  };

  // Иконка для уровня важности
  const getLevelIcon = () => {
    switch (insight.level) {
      case InsightLevel.CRITICAL:
      case InsightLevel.HIGH:
        return FiAlertCircle;
      case InsightLevel.MEDIUM:
        return FiAlertTriangle;
      default:
        return FiInfo;
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ru });
  };

  return (
    <Card
      borderLeft="4px"
      borderLeftColor={getLevelColor()}
      overflow="hidden"
      variant="outline"
      mb={4}
    >
      <CardHeader pb={2}>
        <Flex justify="space-between" align="center">
          <Text fontWeight="bold" fontSize="md">
            {insight.title}
          </Text>

          <HStack>
            <Badge
              colorScheme={
                insight.level === InsightLevel.CRITICAL
                  ? "red"
                  : insight.level === InsightLevel.HIGH
                  ? "orange"
                  : insight.level === InsightLevel.MEDIUM
                  ? "yellow"
                  : "blue"
              }
            >
              {insight.level_display}
            </Badge>
            <Badge
              colorScheme={
                insight.status === InsightStatus.RESOLVED
                  ? "green"
                  : insight.status === InsightStatus.IN_PROGRESS
                  ? "purple"
                  : insight.status === InsightStatus.ACKNOWLEDGED
                  ? "blue"
                  : insight.status === InsightStatus.DISMISSED
                  ? "gray"
                  : "orange"
              }
            >
              {insight.status_display}
            </Badge>

            {/* Меню действий */}
            <Menu>
              <MenuButton as={Button} size="sm" variant="ghost">
                <Icon as={FiMoreVertical} />
              </MenuButton>
              <MenuList>
                {onResolve && insight.status !== InsightStatus.RESOLVED && (
                  <MenuItem
                    icon={<FiCheck />}
                    onClick={() => onResolve(insight.id)}
                  >
                    Разрешить
                  </MenuItem>
                )}
                {onDismiss && insight.status !== InsightStatus.DISMISSED && (
                  <MenuItem
                    icon={<FiX />}
                    onClick={() => onDismiss(insight.id)}
                  >
                    Отклонить
                  </MenuItem>
                )}
                {onAcknowledge &&
                  insight.status !== InsightStatus.ACKNOWLEDGED && (
                    <MenuItem
                      icon={<FiInfo />}
                      onClick={() => onAcknowledge(insight.id)}
                    >
                      Подтвердить
                    </MenuItem>
                  )}
                {onMarkInProgress &&
                  insight.status !== InsightStatus.IN_PROGRESS && (
                    <MenuItem
                      icon={<FiPlay />}
                      onClick={() => onMarkInProgress(insight.id)}
                    >
                      В работу
                    </MenuItem>
                  )}
                <MenuItem
                  icon={<FiExternalLink />}
                  as={Link}
                  to={`/admin/ai/insights/${insight.id}`}
                >
                  Перейти к деталям
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </CardHeader>

      <CardBody py={2}>
        <Text fontSize="sm" mb={2}>
          {insight.description}
        </Text>

        {/* Дополнительная информация о пользователе */}
        {insight.user && (
          <Flex alignItems="center" mb={1}>
            <Text fontSize="xs" fontWeight="bold" mr={1}>
              Пользователь:
            </Text>
            <Link to={`/admin/users/${insight.user.id}`}>
              <Text fontSize="xs" color="blue.500" textDecoration="underline">
                {`${insight.user.first_name} ${insight.user.last_name}`.trim() ||
                  insight.user.email}
              </Text>
            </Link>
          </Flex>
        )}

        {/* Теги */}
        {insight.tags.length > 0 && (
          <Box mb={2}>
            <HStack spacing={2} mt={2}>
              {insight.tags.slice(0, 3).map((tag: InsightTag) => (
                <Tag
                  size="sm"
                  key={tag.id}
                  colorScheme={tag.color}
                  borderRadius="full"
                >
                  <TagLeftIcon boxSize="12px" as={FiTag} />
                  <TagLabel>{tag.name}</TagLabel>
                </Tag>
              ))}

              {/* Показываем +N, если тегов больше 3 */}
              {insight.tags.length > 3 && (
                <Tooltip
                  label={insight.tags
                    .slice(3)
                    .map((t) => t.name)
                    .join(", ")}
                >
                  <Tag size="sm" colorScheme="gray" borderRadius="full">
                    +{insight.tags.length - 3}
                  </Tag>
                </Tooltip>
              )}
            </HStack>
          </Box>
        )}
      </CardBody>

      <CardFooter pt={0} justifyContent="space-between" alignItems="center">
        <HStack spacing={2}>
          <Icon as={FiClock} fontSize="xs" />
          <Text fontSize="xs" color="gray.500">
            {formatDate(insight.created_at)}
          </Text>
        </HStack>

        <HStack spacing={2}>
          <Badge fontSize="xx-small" colorScheme="purple">
            {insight.source}
          </Badge>
          <Badge fontSize="xx-small" colorScheme="teal">
            {insight.insight_type_display}
          </Badge>
        </HStack>
      </CardFooter>
    </Card>
  );
};

export default InsightCard;
