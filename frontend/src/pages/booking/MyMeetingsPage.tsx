import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Select,
  Input,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  SimpleGrid,
  useColorModeValue,
  Link,
  Icon,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { FiArrowLeft, FiFilter, FiCalendar, FiSearch } from "react-icons/fi";
import bookingApi, {
  VirtualMeetingSlot,
  MeetingsFilter,
} from "../../api/bookingApi";
import MeetingCard from "../../components/booking/MeetingCard";
import { format, isAfter } from "date-fns";
import { AppLayout } from "../../components/layout/AppLayout";
import { Card, Button } from "../../components/common";

const MyMeetingsPage: React.FC = () => {
  const [meetings, setMeetings] = useState<VirtualMeetingSlot[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<
    VirtualMeetingSlot[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MeetingsFilter>({});
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [pastCount, setPastCount] = useState(0);

  const bgColor = useColorModeValue("white", "gray.700");
  const cardBg = useColorModeValue("white", "gray.700");

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

        // Подсчитываем количество предстоящих и прошедших встреч
        const now = new Date();
        const upcoming = sortedData.filter((meeting) =>
          isAfter(new Date(meeting.start_time), now)
        ).length;
        const past = sortedData.length - upcoming;

        setUpcomingCount(upcoming);
        setPastCount(past);
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
    <AppLayout>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2} color="brand.700">
            Мои встречи
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Управляйте вашими запланированными встречами и мероприятиями
          </Text>
        </Box>

        {/* Панель фильтров */}
        <Card>
          <HStack spacing={4} alignItems="flex-end" flexWrap="wrap">
            <Box minW="150px">
              <Text mb={1} fontWeight="medium">
                Тип встречи:
              </Text>
              <Select
                value={filters.stepType || "all"}
                onChange={handleTypeFilterChange}
                bg={bgColor}
              >
                <option value="all">Все типы</option>
                <option value="introduction">Вводная встреча</option>
                <option value="team_meeting">Встреча с командой</option>
                <option value="technical">Техническая встреча</option>
                <option value="project_overview">Обзор проекта</option>
                <option value="goals_setting">Цели и KPI</option>
              </Select>
            </Box>

            <Box minW="180px">
              <Text mb={1} fontWeight="medium">
                Дата:
              </Text>
              <InputGroup>
                <Input
                  type="date"
                  value={filters.date || ""}
                  onChange={handleDateFilterChange}
                  bg={bgColor}
                />
                <InputRightElement>
                  <Icon as={FiCalendar} color="gray.500" />
                </InputRightElement>
              </InputGroup>
            </Box>

            <Button
              variant="ghost"
              colorScheme="blue"
              onClick={clearFilters}
              alignSelf="flex-end"
              leftIcon={<FiFilter />}
              size="sm"
              fontWeight="normal"
            >
              Сбросить фильтры
            </Button>
          </HStack>
        </Card>

        {/* Состояние загрузки */}
        {isLoading ? (
          <Flex justify="center" my={8}>
            <Spinner size="xl" color="brand.500" thickness="4px" />
          </Flex>
        ) : error ? (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        ) : meetings.length === 0 ? (
          <Card py={10}>
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="medium" textAlign="center">
                У вас пока нет запланированных встреч
              </Text>
              <Text color="gray.500" textAlign="center">
                Встречи будут отображаться здесь, когда они будут запланированы
              </Text>
            </VStack>
          </Card>
        ) : filteredMeetings.length === 0 ? (
          <Card py={10}>
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="medium" textAlign="center">
                Нет встреч, соответствующих выбранным фильтрам
              </Text>
              <Button
                variant="outline"
                colorScheme="brand"
                onClick={clearFilters}
              >
                Сбросить фильтры
              </Button>
            </VStack>
          </Card>
        ) : (
          <>
            <HStack justify="space-between" mb={2}>
              <Text color="gray.500" fontSize="sm">
                Найдено встреч: {filteredMeetings.length}
              </Text>
              <HStack spacing={4}>
                <Text fontSize="sm" fontWeight="medium">
                  Предстоящие:{" "}
                  <Text as="span" color="green.500">
                    {upcomingCount}
                  </Text>
                </Text>
                <Text fontSize="sm" fontWeight="medium">
                  Прошедшие:{" "}
                  <Text as="span" color="gray.500">
                    {pastCount}
                  </Text>
                </Text>
              </HStack>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </SimpleGrid>
          </>
        )}
      </VStack>
    </AppLayout>
  );
};

export default MyMeetingsPage;
