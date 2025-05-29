import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  useDisclosure,
  Flex,
} from "@chakra-ui/react";
import { FiSettings, FiCheckCircle } from "react-icons/fi";

import { AppLayout } from "../components/layout/AppLayout";
import notificationApi, {
  Notification,
  NotificationFilters,
} from "../api/notificationApi";
import NotificationItem from "../components/notifications/NotificationItem";
import NotificationFilterBar from "../components/notifications/NotificationFilterBar";
import NotificationSettingsModal from "../components/notifications/NotificationSettingsModal";

/**
 * Страница Центра уведомлений
 */
const NotificationCenterPage: React.FC = () => {
  // Состояния для хранения уведомлений и статуса загрузки
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<NotificationFilters>({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Загрузка уведомлений при монтировании компонента и изменении фильтров
  useEffect(() => {
    fetchNotifications();
  }, [filters]);

  // Получение уведомлений с сервера
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await notificationApi.getNotifications(filters);
      setNotifications(data);
    } catch (error) {
      console.error("Ошибка при загрузке уведомлений:", error);
      setError(
        "Не удалось загрузить уведомления. Пожалуйста, попробуйте позже."
      );

      // Добавляем тестовые данные для разработки
      if (process.env.NODE_ENV === "development") {
        console.log("DEV: Используем тестовые данные для уведомлений");
        const testNotifications: Notification[] = [
          {
            id: 1,
            title: "Добро пожаловать в OnboardPro!",
            message: "Мы рады приветствовать вас в нашей системе онбординга.",
            notification_type: "info",
            is_read: false,
            created_at: new Date().toISOString(),
          },
          {
            id: 2,
            title: "Напоминание о встрече",
            message: "Завтра в 14:00 состоится встреча с HR-менеджером.",
            notification_type: "deadline",
            is_read: false,
            created_at: new Date().toISOString(),
          },
          {
            id: 3,
            title: "Заполните профиль",
            message:
              "Не забудьте заполнить свой профиль для улучшения опыта использования системы.",
            notification_type: "warning",
            is_read: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
        ];
        setNotifications(testNotifications);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик отметки уведомления как прочитанное
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
      toast({
        title: "Отмечено как прочитанное",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Ошибка при отметке уведомления:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отметить уведомление как прочитанное",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Обработчик удаления уведомления
  const handleDeleteNotification = async (id: number) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== id)
      );
      toast({
        title: "Уведомление удалено",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Ошибка при удалении уведомления:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить уведомление",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Обработчик отметки всех уведомлений как прочитанные
  const handleMarkAllAsRead = async () => {
    try {
      const response = await notificationApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );
      toast({
        title: `${response.count} уведомлений отмечено как прочитанные`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Ошибка при отметке всех уведомлений:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отметить все уведомления как прочитанные",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Обработчик изменения фильтров
  const handleFilterChange = (newFilters: NotificationFilters) => {
    setFilters(newFilters);
  };

  // Обработчик сброса фильтров
  const handleClearFilters = () => {
    setFilters({});
  };

  // Функция для фильтрации непрочитанных уведомлений
  const unreadNotifications = notifications.filter(
    (notification) => !notification.is_read
  );

  return (
    <AppLayout>
      <Box maxW="1200px" mx="auto" px={4}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "flex-start", md: "center" }}
          mb={6}
        >
          <Box mb={{ base: 4, md: 0 }}>
            <Heading size="xl" mb={2} color="brand.700">
              Центр уведомлений
            </Heading>
            <Text color="gray.600" fontSize="lg">
              Просмотр и управление всеми уведомлениями
            </Text>
          </Box>
          <HStack>
            <Button
              leftIcon={<FiSettings />}
              onClick={onOpen}
              variant="outline"
              colorScheme="blue"
            >
              Настройки
            </Button>
            <Button
              leftIcon={<FiCheckCircle />}
              onClick={handleMarkAllAsRead}
              colorScheme="green"
              isDisabled={unreadNotifications.length === 0}
            >
              Прочитать все
            </Button>
          </HStack>
        </Flex>

        <NotificationFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Содержимое в зависимости от состояния загрузки и наличия ошибок */}
        {isLoading ? (
          <Flex justify="center" align="center" py={10}>
            <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
          </Flex>
        ) : error ? (
          <Alert
            status="error"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="md"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Произошла ошибка
            </AlertTitle>
            <AlertDescription maxWidth="sm">{error}</AlertDescription>
          </Alert>
        ) : notifications.length === 0 ? (
          <Alert
            status="info"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="md"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Нет уведомлений
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              У вас пока нет уведомлений, соответствующих выбранным фильтрам.
            </AlertDescription>
          </Alert>
        ) : (
          <VStack spacing={3} align="stretch">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDeleteNotification}
              />
            ))}
          </VStack>
        )}
      </Box>

      {/* Модальное окно настроек уведомлений */}
      <NotificationSettingsModal isOpen={isOpen} onClose={onClose} />
    </AppLayout>
  );
};

export default NotificationCenterPage;
