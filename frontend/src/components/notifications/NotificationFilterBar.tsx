import React from "react";
import {
  HStack,
  Select,
  Button,
  Flex,
  Box,
  FormControl,
  FormLabel,
  useColorModeValue,
  Input,
} from "@chakra-ui/react";
import { NotificationFilters } from "../../api/notificationApi";

interface NotificationFilterBarProps {
  filters: NotificationFilters;
  onFilterChange: (filters: NotificationFilters) => void;
  onClearFilters: () => void;
}

/**
 * Компонент панели фильтрации уведомлений
 */
const NotificationFilterBar: React.FC<NotificationFilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Обработчики изменения фильтров
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value || undefined;
    onFilterChange({ ...filters, type });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const is_read =
      value === "read" ? true : value === "unread" ? false : undefined;
    onFilterChange({ ...filters, is_read });
  };

  const handleDateAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const created_after = e.target.value || undefined;
    onFilterChange({ ...filters, created_after });
  };

  const handleDateBeforeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const created_before = e.target.value || undefined;
    onFilterChange({ ...filters, created_before });
  };

  return (
    <Box
      p={4}
      mb={4}
      bg={bgColor}
      borderWidth="1px"
      borderRadius="md"
      borderColor={borderColor}
    >
      <Flex
        direction={{ base: "column", md: "row" }}
        gap={4}
        alignItems={{ base: "stretch", md: "flex-end" }}
      >
        <FormControl w={{ base: "full", md: "200px" }}>
          <FormLabel fontSize="sm">Тип уведомления</FormLabel>
          <Select
            value={filters.type || ""}
            onChange={handleTypeChange}
            placeholder="Все типы"
          >
            <option value="info">Информация</option>
            <option value="warning">Предупреждение</option>
            <option value="deadline">Дедлайн</option>
            <option value="system">Системное</option>
          </Select>
        </FormControl>

        <FormControl w={{ base: "full", md: "200px" }}>
          <FormLabel fontSize="sm">Статус</FormLabel>
          <Select
            value={
              filters.is_read === true
                ? "read"
                : filters.is_read === false
                ? "unread"
                : ""
            }
            onChange={handleStatusChange}
            placeholder="Все статусы"
          >
            <option value="read">Прочитанные</option>
            <option value="unread">Непрочитанные</option>
          </Select>
        </FormControl>

        <FormControl w={{ base: "full", md: "200px" }}>
          <FormLabel fontSize="sm">С даты</FormLabel>
          <Input
            type="date"
            value={filters.created_after || ""}
            onChange={handleDateAfterChange}
          />
        </FormControl>

        <FormControl w={{ base: "full", md: "200px" }}>
          <FormLabel fontSize="sm">По дату</FormLabel>
          <Input
            type="date"
            value={filters.created_before || ""}
            onChange={handleDateBeforeChange}
          />
        </FormControl>

        <Button
          colorScheme="gray"
          onClick={onClearFilters}
          alignSelf={{ base: "flex-start", md: "flex-end" }}
        >
          Сбросить
        </Button>
      </Flex>
    </Box>
  );
};

export default NotificationFilterBar;
