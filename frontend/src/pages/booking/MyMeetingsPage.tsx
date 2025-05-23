import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Select,
  Button,
  Input,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  SimpleGrid,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FiArrowLeft, FiFilter } from "react-icons/fi";
import bookingApi, {
  VirtualMeetingSlot,
  MeetingsFilter,
} from "../../api/bookingApi";
import MeetingCard from "../../components/booking/MeetingCard";
import { format, isAfter } from "date-fns";

const MyMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<VirtualMeetingSlot[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<
    VirtualMeetingSlot[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MeetingsFilter>({});

  const bgColor = useColorModeValue("gray.50", "gray.800");

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setIsLoading(true);
        const data = await bookingApi.getUserMeetings();

        // Сортируем по дате начала (сначала будущие, затем прошедшие)
        const sortedData = data.sort((a, b) => {
          const now = new Date();
          const aDate = new Date(a.start_time);
          const bDate = new Date(b.start_time);

          const aIsFuture = isAfter(aDate, now);
          const bIsFuture = isAfter(bDate, now);

          if (aIsFuture && !bIsFuture) return -1;
          if (!aIsFuture && bIsFuture) return 1;

          return (
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
          );
        });

        setMeetings(sortedData);
        setFilteredMeetings(sortedData);
      } catch (err) {
        console.error("Ошибка при загрузке встреч:", err);
        setError("Не удалось загрузить данные о встречах");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  // Обновляем отфильтрованные встречи при изменении фильтров
  useEffect(() => {
    if (!meetings.length) return;

    let result = [...meetings];

    // Фильтр по дате
    if (filters.date) {
      const filterDate = filters.date;
      result = result.filter((meeting) => {
        const meetingDate = format(new Date(meeting.start_time), "yyyy-MM-dd");
        return meetingDate === filterDate;
      });
    }

    // Фильтр по типу шага
    if (filters.stepType && filters.stepType !== "all") {
      result = result.filter(
        (meeting) => meeting.step_type === filters.stepType
      );
    }

    setFilteredMeetings(result);
  }, [filters, meetings]);

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, date: e.target.value || undefined }));
  };

  const handleTypeFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      stepType: e.target.value === "all" ? undefined : e.target.value,
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack align="stretch" spacing={6}>
        <HStack justifyContent="space-between">
          <Button
            as={RouterLink}
            to="/dashboard"
            leftIcon={<FiArrowLeft />}
            variant="outline"
          >
            Назад
          </Button>
          <Heading as="h1" size="xl">
            Мои виртуальные встречи
          </Heading>
          <Box></Box> {/* Пустой блок для выравнивания */}
        </HStack>

        {/* Блок фильтров */}
        <Box bg="white" p={5} borderRadius="lg" shadow="md">
          <Heading as="h3" size="md" mb={4}>
            Фильтры
          </Heading>
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={4}
            align={{ md: "center" }}
          >
            <Box flex={1}>
              <Text mb={2}>Дата</Text>
              <Input
                type="date"
                value={filters.date || ""}
                onChange={handleDateFilterChange}
              />
            </Box>
            <Box flex={1}>
              <Text mb={2}>Тип шага</Text>
              <Select
                value={filters.stepType || "all"}
                onChange={handleTypeFilterChange}
              >
                <option value="all">Все типы</option>
                <option value="task">Задача</option>
                <option value="meeting">Встреча</option>
                <option value="training">Обучение</option>
              </Select>
            </Box>
            <Button
              leftIcon={<FiFilter />}
              onClick={clearFilters}
              alignSelf={{ md: "flex-end" }}
              mb={{ base: 0, md: 0 }}
              mt={{ base: 2, md: 6 }}
            >
              Сбросить
            </Button>
          </Flex>
        </Box>

        {/* Список встреч */}
        {isLoading ? (
          <Flex justify="center" my={10}>
            <Spinner size="xl" />
          </Flex>
        ) : error ? (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        ) : filteredMeetings.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {filteredMeetings.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </SimpleGrid>
        ) : (
          <Alert status="info">
            <AlertIcon />
            {filters.date || filters.stepType
              ? "Нет встреч, соответствующих выбранным фильтрам"
              : "У вас пока нет назначенных виртуальных встреч"}
          </Alert>
        )}
      </VStack>
    </Container>
  );
};

export default MyMeetingsPage;
