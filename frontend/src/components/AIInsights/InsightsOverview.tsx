import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Button,
  useToast,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { FiRefreshCw, FiBarChart2 } from "react-icons/fi";
import { SmartInsightsService } from "@/services/aiInsights";
import InsightCard from "@/components/AIInsights/InsightCard";
import InsightFiltersPanel from "@/components/AIInsights/InsightFiltersPanel";
import {
  SmartInsight,
  InsightFilters,
  InsightLevel,
  InsightStatus,
  InsightStats,
} from "@/types/aiInsights";

export const InsightsOverview = () => {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [filters, setFilters] = useState<InsightFilters>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<InsightStats | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const toast = useToast();

  // Загрузка инсайтов
  const fetchInsights = async (newPage = 1, newFilters?: InsightFilters) => {
    try {
      setLoading(true);
      const filtersToUse = newFilters || filters;
      const response = await SmartInsightsService.getInsights(
        filtersToUse,
        newPage
      );

      if (newPage === 1) {
        setInsights(response.results);
      } else {
        setInsights([...insights, ...response.results]);
      }

      setHasMore(!!response.next);
      setPage(newPage);
    } catch (error) {
      console.error("Error fetching insights:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить инсайты",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Загрузка статистики
  const fetchStats = async () => {
    try {
      const stats = await SmartInsightsService.getInsightStats();
      setStats(stats);
    } catch (error) {
      console.error("Error fetching insight stats:", error);
    }
  };

  // Начальная загрузка данных
  useEffect(() => {
    fetchInsights(1);
    fetchStats();
  }, []);

  // Обработка изменения фильтров
  const handleFilterChange = (newFilters: InsightFilters) => {
    setFilters(newFilters);
    fetchInsights(1, newFilters);
  };

  // Обновление данных
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInsights(1);
    await fetchStats();
    setRefreshing(false);

    toast({
      title: "Данные обновлены",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Запуск агрегации инсайтов
  const handleAggregate = async () => {
    try {
      setRefreshing(true);
      const result = await SmartInsightsService.aggregateInsights();

      toast({
        title: "Агрегация запущена",
        description: result.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Обновляем данные после агрегации
      await fetchInsights(1);
      await fetchStats();
    } catch (error) {
      console.error("Error aggregating insights:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось запустить агрегацию инсайтов",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Обработчики действий с инсайтами
  const handleResolveInsight = async (id: number) => {
    try {
      await SmartInsightsService.resolveInsight(id);

      // Обновляем состояние локально
      setInsights(
        insights.map((insight) =>
          insight.id === id
            ? {
                ...insight,
                status: InsightStatus.RESOLVED,
                status_display: "Resolved",
              }
            : insight
        )
      );

      toast({
        title: "Инсайт разрешен",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error resolving insight:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось разрешить инсайт",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDismissInsight = async (id: number) => {
    try {
      await SmartInsightsService.dismissInsight(id);

      // Обновляем состояние локально
      setInsights(
        insights.map((insight) =>
          insight.id === id
            ? {
                ...insight,
                status: InsightStatus.DISMISSED,
                status_display: "Dismissed",
              }
            : insight
        )
      );

      toast({
        title: "Инсайт отклонен",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error dismissing insight:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить инсайт",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAcknowledgeInsight = async (id: number) => {
    try {
      await SmartInsightsService.acknowledgeInsight(id);

      // Обновляем состояние локально
      setInsights(
        insights.map((insight) =>
          insight.id === id
            ? {
                ...insight,
                status: InsightStatus.ACKNOWLEDGED,
                status_display: "Acknowledged",
              }
            : insight
        )
      );

      toast({
        title: "Инсайт подтвержден",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error acknowledging insight:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось подтвердить инсайт",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleMarkInProgress = async (id: number) => {
    try {
      await SmartInsightsService.markInsightInProgress(id);

      // Обновляем состояние локально
      setInsights(
        insights.map((insight) =>
          insight.id === id
            ? {
                ...insight,
                status: InsightStatus.IN_PROGRESS,
                status_display: "In Progress",
              }
            : insight
        )
      );

      toast({
        title: "Инсайт в работе",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error marking insight as in progress:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус инсайта",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Загрузка следующей страницы
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchInsights(page + 1);
    }
  };

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Smart Insights Hub</Heading>
        <HStack>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={handleRefresh}
            isLoading={refreshing}
            size="sm"
          >
            Обновить
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleAggregate}
            isLoading={refreshing}
            size="sm"
          >
            Запустить агрегацию
          </Button>
        </HStack>
      </Flex>

      {/* Статистика */}
      {stats && (
        <Box mb={6} p={4} bg="white" borderRadius="md" shadow="sm">
          <Flex align="center" mb={3}>
            <FiBarChart2 size="20px" />
            <Heading size="md" ml={2}>
              Статистика инсайтов
            </Heading>
          </Flex>

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat>
              <StatLabel>Всего инсайтов</StatLabel>
              <StatNumber>{stats.total}</StatNumber>
            </Stat>

            <Box>
              <Text fontWeight="medium" mb={1}>
                По уровню:
              </Text>
              <HStack spacing={4}>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="bold" color="red.500">
                    {stats.by_level?.critical || 0}
                  </Box>{" "}
                  критических
                </Text>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="bold" color="orange.500">
                    {stats.by_level?.high || 0}
                  </Box>{" "}
                  важных
                </Text>
              </HStack>
            </Box>

            <Box>
              <Text fontWeight="medium" mb={1}>
                По статусу:
              </Text>
              <HStack spacing={4}>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="bold" color="orange.500">
                    {stats.by_status?.new || 0}
                  </Box>{" "}
                  новых
                </Text>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="bold" color="green.500">
                    {stats.by_status?.resolved || 0}
                  </Box>{" "}
                  решенных
                </Text>
              </HStack>
            </Box>

            <Box>
              <Text fontWeight="medium" mb={1}>
                По типу:
              </Text>
              <HStack spacing={4}>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="bold">
                    {stats.by_type?.training || 0}
                  </Box>{" "}
                  обучение
                </Text>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="bold">
                    {stats.by_type?.feedback || 0}
                  </Box>{" "}
                  отзывы
                </Text>
              </HStack>
            </Box>
          </SimpleGrid>
        </Box>
      )}

      {/* Фильтры */}
      <InsightFiltersPanel onFilterChange={handleFilterChange} />

      {/* Список инсайтов */}
      <Box mt={6}>
        {loading && page === 1 ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : insights.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onResolve={handleResolveInsight}
                onDismiss={handleDismissInsight}
                onAcknowledge={handleAcknowledgeInsight}
                onMarkInProgress={handleMarkInProgress}
              />
            ))}

            {hasMore && (
              <Flex justifyContent="center" mt={4}>
                <Button
                  onClick={handleLoadMore}
                  isLoading={loading}
                  loadingText="Загрузка..."
                  variant="outline"
                >
                  Загрузить еще
                </Button>
              </Flex>
            )}
          </VStack>
        ) : (
          <Box textAlign="center" p={8} bg="gray.50" borderRadius="md">
            <Text>
              Инсайты не найдены. Попробуйте изменить фильтры или запустить
              агрегацию.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
