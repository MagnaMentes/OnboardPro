import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Text,
  Badge,
  Spinner,
  Input,
  Select,
  HStack,
  VStack,
  IconButton,
  Flex,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useToast,
} from "@chakra-ui/react";
import {
  FiSearch,
  FiChevronDown,
  FiFilter,
  FiDownload,
  FiEye,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { UserFeedback } from "../../types/feedback";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface FeedbackResultTableProps {
  feedbacks: UserFeedback[];
  isLoading: boolean;
  onViewDetails?: (feedback: UserFeedback) => void;
  onExportData?: (format: "csv" | "pdf") => void;
}

const FeedbackResultTable: React.FC<FeedbackResultTableProps> = ({
  feedbacks,
  isLoading,
  onViewDetails,
  onExportData,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [templateFilter, setTemplateFilter] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedFeedback, setSelectedFeedback] = useState<UserFeedback | null>(
    null
  );
  const toast = useToast();

  // Уникальные шаблоны для фильтра
  const templates = useMemo(() => {
    const uniqueTemplates = new Set<string>();
    feedbacks.forEach((feedback) => {
      if (feedback.template_title) {
        uniqueTemplates.add(feedback.template_title);
      }
    });
    return Array.from(uniqueTemplates);
  }, [feedbacks]);

  // Фильтрованные данные
  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((feedback) => {
      // Поиск
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        (feedback.user_fullname &&
          feedback.user_fullname.toLowerCase().includes(searchLower)) ||
        (feedback.user_email &&
          feedback.user_email.toLowerCase().includes(searchLower)) ||
        (feedback.template_title &&
          feedback.template_title.toLowerCase().includes(searchLower));

      // Фильтр по шаблону
      const matchesTemplate =
        templateFilter === "" || feedback.template_title === templateFilter;

      // Фильтр по дате
      let matchesDate = true;
      if (dateFilter !== "all") {
        const now = new Date();
        const feedbackDate = new Date(feedback.created_at);
        const diffDays = Math.floor(
          (now.getTime() - feedbackDate.getTime()) / (1000 * 3600 * 24)
        );

        if (dateFilter === "today") {
          matchesDate = diffDays === 0;
        } else if (dateFilter === "week") {
          matchesDate = diffDays < 7;
        } else if (dateFilter === "month") {
          matchesDate = diffDays < 30;
        }
      }

      return matchesSearch && matchesTemplate && matchesDate;
    });
  }, [feedbacks, searchTerm, templateFilter, dateFilter]);

  // Обработчик для просмотра деталей
  const handleViewDetails = (feedback: UserFeedback) => {
    setSelectedFeedback(feedback);
    onOpen();

    // Если передан обработчик, вызываем его
    if (onViewDetails) {
      onViewDetails(feedback);
    }
  };

  // Обработчик экспорта данных
  const handleExport = (format: "csv" | "pdf") => {
    if (onExportData) {
      onExportData(format);
    } else {
      toast({
        title: "Экспорт данных",
        description: `Экспорт в формате ${format.toUpperCase()} будет доступен в ближайшем обновлении.`,
        status: "info",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Загрузка данных...</Text>
      </Box>
    );
  }

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="md">Результаты обратной связи</Heading>
        <HStack>
          <Menu>
            <MenuButton as={Button} rightIcon={<FiChevronDown />}>
              Экспорт
            </MenuButton>
            <MenuList>
              <MenuItem
                icon={<FiDownload />}
                onClick={() => handleExport("csv")}
              >
                Экспорт в CSV
              </MenuItem>
              <MenuItem
                icon={<FiDownload />}
                onClick={() => handleExport("pdf")}
              >
                Экспорт в PDF
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      <Box mb={6}>
        <VStack spacing={4}>
          <HStack w="full">
            <Box flex={1}>
              <Input
                placeholder="Поиск по имени или email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftElement={<FiSearch color="gray.300" />}
              />
            </Box>
            <Box w="250px">
              <Select
                placeholder="Все шаблоны"
                value={templateFilter}
                onChange={(e) => setTemplateFilter(e.target.value)}
                icon={<FiFilter />}
              >
                {templates.map((template) => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </Select>
            </Box>
            <Box w="200px">
              <Select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                icon={<FiFilter />}
              >
                <option value="all">Все даты</option>
                <option value="today">Сегодня</option>
                <option value="week">За неделю</option>
                <option value="month">За месяц</option>
              </Select>
            </Box>
          </HStack>
        </VStack>
      </Box>

      {filteredFeedbacks.length === 0 ? (
        <Box textAlign="center" py={10} bg="gray.50" borderRadius="md">
          <Text>Нет данных, соответствующих фильтрам</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Сотрудник</Th>
                <Th>Шаблон</Th>
                <Th>Шаг онбординга</Th>
                <Th>Анонимность</Th>
                <Th>Дата создания</Th>
                <Th>Действия</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredFeedbacks.map((feedback) => (
                <Tr key={feedback.id}>
                  <Td>{feedback.id}</Td>
                  <Td>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{feedback.user_fullname}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {feedback.user_email}
                      </Text>
                    </VStack>
                  </Td>
                  <Td>{feedback.template_title}</Td>
                  <Td>
                    {feedback.step_name ? (
                      feedback.step_name
                    ) : (
                      <Text color="gray.400">—</Text>
                    )}
                  </Td>
                  <Td>
                    {feedback.is_anonymous ? (
                      <Badge colorScheme="orange">Анонимно</Badge>
                    ) : (
                      <Badge colorScheme="green">Публично</Badge>
                    )}
                  </Td>
                  <Td>
                    {format(
                      new Date(feedback.created_at),
                      "dd MMM yyyy HH:mm",
                      {
                        locale: ru,
                      }
                    )}
                  </Td>
                  <Td>
                    <IconButton
                      aria-label="Просмотр деталей"
                      icon={<FiEye />}
                      size="sm"
                      onClick={() => handleViewDetails(feedback)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <Text mt={4} fontSize="sm" color="gray.500">
        Показано {filteredFeedbacks.length} из {feedbacks.length} записей
      </Text>

      {/* Модальное окно с деталями */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Детали обратной связи</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedFeedback && (
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontWeight="bold">Шаблон</Text>
                  <Text>{selectedFeedback.template_title}</Text>
                </Box>

                <Box>
                  <Text fontWeight="bold">Сотрудник</Text>
                  <Text>{selectedFeedback.user_fullname}</Text>
                  <Text fontSize="sm" color="gray.500">
                    {selectedFeedback.user_email}
                  </Text>
                </Box>

                {selectedFeedback.step_name && (
                  <Box>
                    <Text fontWeight="bold">Шаг онбординга</Text>
                    <Text>{selectedFeedback.step_name}</Text>
                  </Box>
                )}

                <Box>
                  <Text fontWeight="bold">Статус анонимности</Text>
                  {selectedFeedback.is_anonymous ? (
                    <Badge colorScheme="orange">Анонимно</Badge>
                  ) : (
                    <Badge colorScheme="green">Публично</Badge>
                  )}
                </Box>

                <Box>
                  <Text fontWeight="bold">Дата создания</Text>
                  <Text>
                    {format(
                      new Date(selectedFeedback.created_at),
                      "dd MMMM yyyy HH:mm",
                      { locale: ru }
                    )}
                  </Text>
                </Box>

                <Box>
                  <Text fontWeight="bold" mb={2}>
                    Ответы
                  </Text>
                  <Box>
                    {/* Здесь будет компонент для отображения ответов */}
                    <Text color="gray.500">Загрузка ответов...</Text>
                  </Box>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose}>Закрыть</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FeedbackResultTable;
