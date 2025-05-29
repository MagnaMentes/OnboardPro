import React from "react";
import {
  Box,
  Flex,
  Text,
  Icon,
  Badge,
  IconButton,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  FiInfo,
  FiAlertTriangle,
  FiClock,
  FiSettings,
  FiCheck,
  FiTrash2,
} from "react-icons/fi";
import { Notification } from "../../api/notificationApi";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
  onDelete: (id: number) => void;
}

/**
 * Компонент для отображения одного уведомления
 */
const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  // Настройка иконки и цвета в зависимости от типа уведомления
  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "info":
        return {
          icon: FiInfo,
          color: "blue.500",
          badgeColor: "blue",
          label: "Информация",
        };
      case "warning":
        return {
          icon: FiAlertTriangle,
          color: "orange.500",
          badgeColor: "orange",
          label: "Предупреждение",
        };
      case "deadline":
        return {
          icon: FiClock,
          color: "red.500",
          badgeColor: "red",
          label: "Дедлайн",
        };
      case "system":
      default:
        return {
          icon: FiSettings,
          color: "gray.500",
          badgeColor: "gray",
          label: "Системное",
        };
    }
  };

  const config = getNotificationConfig(notification.notification_type);

  // Форматирование даты
  const formattedDate = format(
    new Date(notification.created_at),
    "d MMMM yyyy HH:mm",
    {
      locale: ru,
    }
  );

  return (
    <Box
      p={4}
      mb={3}
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="sm"
      transition="all 0.2s"
      opacity={notification.is_read ? 0.7 : 1}
      _hover={{ boxShadow: "md", bg: hoverBg }}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Flex alignItems="center">
          <Icon as={config.icon} boxSize={5} color={config.color} mr={3} />
          <Badge colorScheme={config.badgeColor} mr={3}>
            {config.label}
          </Badge>
          <Text fontSize="sm" color="gray.500">
            {formattedDate}
          </Text>
        </Flex>
        <Flex>
          {!notification.is_read && (
            <Tooltip label="Отметить как прочитанное">
              <IconButton
                icon={<FiCheck />}
                aria-label="Отметить как прочитанное"
                size="sm"
                variant="ghost"
                colorScheme="green"
                mr={2}
                onClick={() => onMarkAsRead(notification.id)}
              />
            </Tooltip>
          )}
          <Tooltip label="Удалить">
            <IconButton
              icon={<FiTrash2 />}
              aria-label="Удалить уведомление"
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={() => onDelete(notification.id)}
            />
          </Tooltip>
        </Flex>
      </Flex>
      <Text fontWeight="bold" mb={1}>
        {notification.title}
      </Text>
      <Text>{notification.message}</Text>
    </Box>
  );
};

export default NotificationItem;
