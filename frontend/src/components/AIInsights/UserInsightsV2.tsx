import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Spinner,
  useToast,
  Flex,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
  Badge,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { FiRefreshCw, FiZap } from "react-icons/fi";
import {
  SmartInsightsService,
  AIRecommendationsService,
} from "@/services/aiInsights";
import InsightCard from "./InsightCard";
import RecommendationCard from "./RecommendationCard";
import {
  SmartInsight,
  AIRecommendation,
  InsightStatus,
  RecommendationStatus,
} from "@/types/aiInsights";

interface UserInsightsProps {
  userId: number;
}

export const UserInsights: React.FC<UserInsightsProps> = ({ userId }) => {
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    []
  );
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const toast = useToast();
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Загрузка инсайтов пользователя
  const fetchUserInsights = async (userId: number) => {
    try {
      setLoadingInsights(true);
      const response = await SmartInsightsService.getInsightsByUser(userId);
      setInsights(response.results);
    } catch (error) {
      console.error("Error fetching user insights:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить инсайты пользователя",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  // Загрузка рекомендаций пользователя
  const fetchUserRecommendations = async (userId: number) => {
    try {
      setLoadingRecommendations(true);
      const response = await AIRecommendationsService.getRecommendationsByUser(
        userId
      );
      setRecommendations(response.results);
    } catch (error) {
      console.error("Error fetching user recommendations:", error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить рекомендации пользователя",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Загрузка информации о пользователе (упрощенная версия, можно расширить)
  const fetchUserInfo = async (userId: number) => {
    try {
      // Здесь нужно использовать API для загрузки данных пользователя
      // const response = await UserService.getUserById(parseInt(userId));
      // setUserData(response);

      // Временно используем первый доступный инсайт для получения информации о пользователе
      const response = await SmartInsightsService.getInsightsByUser(userId);
      if (response.results.length > 0 && response.results[0].user) {
        setUserData(response.results[0].user);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  // Начальная загрузка данных
  useEffect(() => {
    fetchUserInfo(userId);
    fetchUserInsights(userId);
    fetchUserRecommendations(userId);
  }, [userId]);

  // Обновление данных
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserInsights(userId),
      fetchUserRecommendations(userId),
    ]);
    setRefreshing(false);
    toast({
      title: "Данные обновлены",
      description: "Инсайты и рекомендации успешно обновлены",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Генерация новых рекомендаций
  const handleGenerateRecommendations = async () => {
    try {
      setGenerating(true);
      await AIRecommendationsService.generateRecommendations({
        user_id: userId,
      });
      toast({
        title: "Запрос отправлен",
        description: "Запущена генерация новых рекомендаций для пользователя",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Даем время для обработки запроса на сервере
      setTimeout(() => {
        fetchUserRecommendations(userId);
      }, 3000);
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

  // Обработчики для действий с инсайтами
  const handleResolveInsight = async (insightId: number) => {
    try {
      await SmartInsightsService.resolveInsight(insightId);
      toast({
        title: "Инсайт разрешен",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUserInsights(userId);
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

  const handleDismissInsight = async (insightId: number) => {
    try {
      await SmartInsightsService.dismissInsight(insightId);
      toast({
        title: "Инсайт отклонен",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUserInsights(userId);
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

  const handleAcknowledgeInsight = async (insightId: number) => {
    try {
      await SmartInsightsService.acknowledgeInsight(insightId);
      toast({
        title: "Инсайт подтвержден",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUserInsights(userId);
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

  const handleMarkInsightInProgress = async (insightId: number) => {
    try {
      await SmartInsightsService.markInsightInProgress(insightId);
      toast({
        title: 'Инсайт отмечен как "в работе"',
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUserInsights(userId);
    } catch (error) {
      console.error("Error marking insight in progress:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус инсайта",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Обработчики для действий с рекомендациями
  const handleAcceptRecommendation = async (
    recommendationId: number,
    reason?: string
  ) => {
    try {
      await AIRecommendationsService.acceptRecommendation(recommendationId, {
        reason,
      });
      toast({
        title: "Рекомендация принята",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUserRecommendations(userId);
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

  const handleRejectRecommendation = async (
    recommendationId: number,
    reason?: string
  ) => {
    try {
      await AIRecommendationsService.rejectRecommendation(recommendationId, {
        reason,
      });
      toast({
        title: "Рекомендация отклонена",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      fetchUserRecommendations(userId);
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

  return (
    <Box>
      <Tabs colorScheme="blue" variant="enclosed">
        <TabList mb={4}>
          <Tab>Инсайты</Tab>
          <Tab>Рекомендации</Tab>
        </TabList>

        <TabPanels>
          {/* Панель с инсайтами */}
          <TabPanel p={0}>
            <Box mb={4}>
              <HStack justifyContent="space-between" mb={4}>
                <Heading size="md">Инсайты пользователя</Heading>
                <Button
                  leftIcon={<FiRefreshCw />}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  isLoading={refreshing}
                  loadingText="Обновление"
                >
                  Обновить
                </Button>
              </HStack>

              {loadingInsights ? (
                <Flex justify="center" my={10}>
                  <Spinner />
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
                      onMarkInProgress={handleMarkInsightInProgress}
                    />
                  ))}
                </VStack>
              ) : (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  p={10}
                  bg={bgColor}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Text>
                    Для этого пользователя не найдено активных инсайтов
                  </Text>
                </Flex>
              )}
            </Box>
          </TabPanel>

          {/* Панель с рекомендациями */}
          <TabPanel p={0}>
            <Box mb={4}>
              <HStack justifyContent="space-between" mb={4}>
                <Heading size="md">Рекомендации для пользователя</Heading>
                <HStack>
                  <Button
                    leftIcon={<FiZap />}
                    colorScheme="teal"
                    size="sm"
                    onClick={handleGenerateRecommendations}
                    isLoading={generating}
                    loadingText="Генерация"
                  >
                    Сгенерировать
                  </Button>
                  <Button
                    leftIcon={<FiRefreshCw />}
                    colorScheme="blue"
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    isLoading={refreshing}
                    loadingText="Обновление"
                  >
                    Обновить
                  </Button>
                </HStack>
              </HStack>

              {loadingRecommendations ? (
                <Flex justify="center" my={10}>
                  <Spinner />
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
                </VStack>
              ) : (
                <Flex
                  direction="column"
                  align="center"
                  justify="center"
                  p={10}
                  bg={bgColor}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  <Text mb={4}>
                    Для этого пользователя не найдено активных рекомендаций
                  </Text>
                  <Button
                    leftIcon={<FiZap />}
                    colorScheme="teal"
                    size="sm"
                    onClick={handleGenerateRecommendations}
                    isLoading={generating}
                  >
                    Сгенерировать рекомендации
                  </Button>
                </Flex>
              )}
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};
