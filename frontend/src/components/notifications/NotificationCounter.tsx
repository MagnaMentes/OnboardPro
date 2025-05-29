import React, { useEffect, useState } from "react";
import { Box, Text, Circle } from "@chakra-ui/react";
import notificationApi from "../../api/notificationApi";

interface NotificationCounterProps {
  maxCount?: number;
}

/**
 * Компонент счетчика непрочитанных уведомлений
 * Отображает количество непрочитанных уведомлений
 */
export const NotificationCounter: React.FC<NotificationCounterProps> = ({
  maxCount = 99,
}) => {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        // Получаем только непрочитанные уведомления
        const notifications = await notificationApi.getNotifications({
          is_read: false,
        });
        setUnreadCount(notifications.length);
      } catch (error) {
        console.error("Ошибка при получении непрочитанных уведомлений:", error);
        // При ошибке связи, показываем тестовые данные для разработки
        if (process.env.NODE_ENV === "development") {
          setUnreadCount(3); // Для тестирования отображения счетчика
          console.log(
            "DEV: Используем тестовые данные для счетчика уведомлений"
          );
        }
      }
    };

    fetchUnreadCount();

    // Можно добавить интервал для периодического обновления счетчика
    const intervalId = setInterval(fetchUnreadCount, 60000); // обновление каждую минуту

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Если нет непрочитанных уведомлений, ничего не отображаем
  if (unreadCount === 0) {
    return null;
  }

  // Форматируем отображение количества
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount;

  return (
    <Circle
      size="20px"
      bg="red.500"
      color="white"
      position="absolute"
      top="-5px"
      right="-5px"
      fontSize="xs"
      fontWeight="bold"
    >
      {displayCount}
    </Circle>
  );
};

export default NotificationCounter;
