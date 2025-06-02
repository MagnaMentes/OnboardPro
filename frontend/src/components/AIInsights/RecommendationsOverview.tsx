import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Button,
  useToast,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { FiRefreshCw, FiBarChart2, FiZap } from "react-icons/fi";
import { AIRecommendationsService } from "@/services/aiInsights";
import RecommendationCard from "@/components/AIInsights/RecommendationCard";
import RecommendationFiltersPanel from "@/components/AIInsights/RecommendationFiltersPanel";
import {
  AIRecommendation,
  RecommendationFilters,
  RecommendationStatus,
  RecommendationStats,
} from "@/types/aiInsights";

export const RecommendationsOverview = () => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    []
  );
  const [filters, setFilters] = useState<RecommendationFilters>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<RecommendationStats | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const toast = useToast();

  // Загрузка рекомендаций
  const fetchRecommendations = async (
    newPage = 1,
    newFilters?: RecommendationFilters
  ) => {
    try {
      setLoading(true);
      const filtersToUse = newFilters || filters;
      const response = await AIRecommendationsService.getRecommendations(
        filtersToUse,
        newPage
      );

      if (newPage === 1) {
        setRecommendations(response.results);
      } else {
        setRecommendations([...recommendations, ...response.results]);
      }

      setHasMore(!!response.next);
      setPage(newPage);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить рекомендации",
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
      const stats = await AIRecommendationsService.getRecommendationStats();
      setStats(stats);
    } catch (error) {
      console.error("Error fetching recommendation stats:", error);
    }
  };

  // Начальная загрузка данных
  useEffect(() => {
    fetchRecommendations(1);
    fetchStats();
  }, []);

  // Обработка изменения фильтров
  const handleFilterChange = (newFilters: RecommendationFilters) => {
    setFilters(newFilters);
    fetchRecommendations(1, newFilters);
  };

  // Обновление данных
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations(1);
    await fetchStats();
    setRefreshing(false);

    toast({
      title: "Данные обновлены",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Генерация рекомендаций
  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const result =
        await AIRecommendationsService.generateAllRecommendations();

      toast({
        title: "Генерация запущена",
        description: result.message,
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Обновляем данные после генерации
      await fetchRecommendations(1);
      await fetchStats();
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось запустить генерацию рекомендаций",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  // Обработчики действий с рекомендациями
  const handleAcceptRecommendation = async (id: number, reason?: string) => {
    try {
      await AIRecommendationsService.acceptRecommendation(id, { reason });

      // Обновляем состояние локально
      setRecommendations(
        recommendations.map((rec) =>
          rec.id === id
            ? {
                ...rec,
                status: RecommendationStatus.ACCEPTED,
                status_display: "Accepted",
                accepted_reason: reason,
              }
            : rec
        )
      );

      toast({
        title: "Рекомендация принята",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error accepting recommendation:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось принять рекомендацию",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRejectRecommendation = async (id: number, reason?: string) => {
    try {
      await AIRecommendationsService.rejectRecommendation(id, { reason });

      // Обновляем состояние локально
      setRecommendations(
        recommendations.map((rec) =>
          rec.id === id
            ? {
                ...rec,
                status: RecommendationStatus.REJECTED,
                status_display: "Rejected",
                rejected_reason: reason,
              }
            : rec
        )
      );

      toast({
        title: "Рекомендация отклонена",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error rejecting recommendation:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить рекомендацию",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Загрузка следующей страницы
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchRecommendations(page + 1);
    }
  };

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">AI-Рекомендации</Heading>
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
            leftIcon={<FiZap />}
            onClick={handleGenerate}
            isLoading={generating}
            size="sm"
          >
            Сгенерировать рекомендации
          </Button>
        </HStack>
      </Flex>

      {/* Статистика */}
      {stats && (
        <Box mb={6} p={4} bg="white" borderRadius="md" shadow="sm">
          <Flex align="center" mb={3}>
            <FiBarChart2 size="20px" />
            <Heading size="md" ml={2}>
              Статистика рекомендаций
            </Heading>
          </Flex>

          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Stat>
              <StatLabel>Всего рекомендаций</StatLabel>
              <StatNumber>{stats.total}</StatNumber>
            </Stat>

            <Box>
              <Text fontWeight="medium" mb={1}>
                По приоритету:
              </Text>
              <HStack spacing={4}>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="bold" color="red.500">
                    {stats.by_priority?.high || 0}
                  </Box>{" "}
                  высоких
                </Text>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="bold" color="orange.500">
                    {stats.by_priority?.medium || 0}
                  </Box>{" "}
                  средних
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
                    {stats.by_status?.active || 0}
                  </Box>{" "}
                  активных
                </Text>
                <Text fontSize="sm">
                  <Box as="span" fontWeight="bold" color="green.500">
                    {stats.by_status?.accepted || 0}
                  </Box>{" "}
                  принятых
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
                    {stats.by_type?.progress || 0}
                  </Box>{" "}
                  прогресс
                </Text>
              </HStack>
            </Box>
          </SimpleGrid>
        </Box>
      )}

      {/* Фильтры */}
      <RecommendationFiltersPanel onFilterChange={handleFilterChange} />

      {/* Список рекомендаций */}
      <Box mt={6}>
        {loading && page === 1 ? (
          <Flex justify="center" align="center" height="200px">
            <Spinner size="xl" color="blue.500" />
          </Flex>
        ) : recommendations.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {recommendations.map((recommendation) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onAccept={handleAcceptRecommendation}
                onReject={handleRejectRecommendation}
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
              Рекомендации не найдены. Попробуйте изменить фильтры или
              сгенерировать новые рекомендации.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
