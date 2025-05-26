import React from "react";
import {
  Box,
  Text,
  Badge,
  Flex,
  Link,
  Heading,
  HStack,
  Icon,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { VirtualMeetingSlot } from "../../api/bookingApi";
import { FiCalendar, FiClock, FiVideo, FiUser } from "react-icons/fi";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface MeetingCardProps {
  meeting: VirtualMeetingSlot;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting }) => {
  const bgColor = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Форматирование даты и времени
  const formatDate = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), "d MMMM yyyy", { locale: ru });
    } catch (err) {
      console.error("Ошибка форматирования даты:", err);
      return dateStr;
    }
  };

  const formatTime = (dateStr: string): string => {
    try {
      return format(new Date(dateStr), "HH:mm");
    } catch (err) {
      console.error("Ошибка форматирования времени:", err);
      return dateStr;
    }
  };

  // Определение типа шага
  const getTypeDisplay = (type?: string): string => {
    if (!type) {
      return "Не указан";
    }

    switch (type) {
      case "task":
        return "Задача";
      case "meeting":
        return "Встреча";
      case "training":
        return "Обучение";
      default:
        return type;
    }
  };

  // Определение цвета бейджа для типа шага
  const getTypeColor = (type?: string): string => {
    if (!type) {
      return "gray";
    }

    switch (type) {
      case "task":
        return "blue";
      case "meeting":
        return "purple";
      case "training":
        return "green";
      default:
        return "gray";
    }
  };

  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      mb={4}
      transition="transform 0.3s"
      _hover={{ transform: "translateY(-2px)", shadow: "lg" }}
    >
      <Flex justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Heading as="h3" size="md">
          {meeting.step_name}
        </Heading>
        <Badge colorScheme={getTypeColor(meeting.step_type)}>
          {getTypeDisplay(meeting.step_type)}
        </Badge>
      </Flex>

      <HStack spacing={4} mb={3}>
        <Flex align="center">
          <Icon as={FiCalendar} mr={1} />
          <Text>{formatDate(meeting.start_time)}</Text>
        </Flex>

        <Flex align="center">
          <Icon as={FiClock} mr={1} />
          <Text>
            {formatTime(meeting.start_time)} - {formatTime(meeting.end_time)}
          </Text>
        </Flex>
      </HStack>

      <HStack spacing={4} mb={3}>
        <Flex align="center">
          <Icon as={FiUser} mr={1} />
          <Text>{meeting.assigned_user_email}</Text>
        </Flex>
      </HStack>

      <Flex justify="space-between" align="center">
        {meeting.meeting_link && (
          <Flex align="center">
            <Icon as={FiVideo} mr={2} color="purple.500" />
            <Link
              href={meeting.meeting_link}
              isExternal
              color="purple.500"
              fontWeight="medium"
            >
              Присоединиться к встрече
            </Link>
          </Flex>
        )}
        <Tooltip label="Добавить встречу в календарь" hasArrow placement="top">
          <Link
            href={`/api/booking/calendar/ical/?id=${meeting.id}`}
            download
            ml="auto"
          >
            <Icon as={FiCalendar} boxSize={5} color="purple.400" />
          </Link>
        </Tooltip>
      </Flex>
    </Box>
  );
};

export default MeetingCard;
