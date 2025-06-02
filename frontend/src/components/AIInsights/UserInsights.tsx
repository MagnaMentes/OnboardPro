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
} from "@chakra-ui/react";
import { FiRefreshCw, FiZap } from "react-icons/fi";
import {
  SmartInsightsService,
  AIRecommendationsService,
} from "@/services/aiInsights";
import InsightCard from "@/components/AIInsights/InsightCard";
import RecommendationCard from "@/components/AIInsights/RecommendationCard";
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

  // Загрузка инсайтов пользователя
  const fetchUserInsights = async (userId: string) => {
    try {
      setLoadingInsights(true);
      const response = await SmartInsightsService.getInsightsByUser(
        parseInt(userId)
      );
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
  const fetchUserRecommendations = async (userId: string) => {
    try {
      setLoadingRecommendations(true);
      const response = await AIRecommendationsService.getRecommendationsByUser(
        parseInt(userId)
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
  const fetchUserInfo = async (userId: string) => {
    try {
      // Здесь нужно использовать API для загрузки данных пользователя
      // const response = await UserService.getUserById(parseInt(userId));
      // setUserData(response);

      // Временно используем первый доступный инсайт для получения информации о пользователе
      setLoadingInsights(true);
      const response = await SmartInsightsService.getInsightsByUser(
        parseInt(userId)
      );
      if (response.results.length > 0 && response.results[0].user) {
        setUserData(response.results[0].user);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    } finally {
      setLoadingInsights(false);
    }
  };

  // Начальная загрузка данных
  useEffect(() => {
    if (id) {
      fetchUserInfo(id);
      fetchUserInsights(id);
      fetchUserRecommendations(id);
    }
  }, [id]);

  // Обновление данных
  const handleRefresh = async () => {
    if (!id) return;

    setRefreshing(true);
    await Promise.all([fetchUserInsights(id), fetchUserRecommendations(id)]);
    setRefreshing(false);

    toast({
      title: "Данные обновлены",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // Генерация рекомендаций для пользователя
  const handleGenerateRecommendations = async () => {
    if (!id) return;

    try {
      setGenerating(true);
      await AIRecommendationsService.generateRecommendations({
        user_id: parseInt(id),
      });
      await fetchUserRecommendations(id);

      toast({
        title: "Рекомендации сгенерированы",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сгенерировать рекомендации",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setGenerating(false);
    }
  };

  // Обработчики для инсайтов
  const handleResolveInsight = async (id: number) => {
    try {
      await SmartInsightsService.resolveInsight(id);

      // Обновляем локальное состояние
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
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error resolving insight:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус инсайта",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDismissInsight = async (id: number) => {
    try {
      await SmartInsightsService.dismissInsight(id);

      // Обновляем локальное состояние
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
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error dismissing insight:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус инсайта",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Обработчики для рекомендаций
  const handleAcceptRecommendation = async (id: number, reason?: string) => {
    try {
      await AIRecommendationsService.acceptRecommendation(id, { reason });

      // Обновляем локальное состояние
      setRecommendations(
        recommendations.map((rec) =>
          rec.id === id
            ? {
                ...rec,
                status: RecommendationStatus.ACCEPTED,
                status_display: "Accepted",
              }
            : rec
        )
      );

      toast({
        title: "Рекомендация принята",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error accepting recommendation:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось принять рекомендацию",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRejectRecommendation = async (id: number, reason?: string) => {
    try {
      await AIRecommendationsService.rejectRecommendation(id, { reason });

      // Обновляем локальное состояние
      setRecommendations(
        recommendations.map((rec) =>
          rec.id === id
            ? {
                ...rec,
                status: RecommendationStatus.REJECTED,
                status_display: "Rejected",
              }
            : rec
        )
      );

      toast({
        title: "Рекомендация отклонена",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error rejecting recommendation:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить рекомендацию",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box>
      {/* Заголовок с информацией о пользователе */}
      <Flex mb={6} alignItems="center">
        <Avatar
          size="lg"
          name={userData ? `${userData.first_name} ${userData.last_name}` : ""}
          mr={4}
        />
        <Box>
          <Heading size="lg">
            {userData
              ? `${userData.first_name} ${userData.last_name}`.trim() ||
                userData.email
              : "Загрузка..."}
          </Heading>
          {userData && <Text color="gray.600">{userData.email}</Text>}
          <Heading size="sm" mt={1}>
            AI-инсайты и рекомендации
          </Heading>
        </Box>
        <HStack ml="auto">
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
            onClick={handleGenerateRecommendations}
            isLoading={generating}
            size="sm"
          >
            Сгенерировать рекомендации
          </Button>
        </HStack>
      </Flex>

      {/* Вкладки с инсайтами и рекомендациями */}
      <Tabs variant="enclosed">
        <TabList>
          <Tab>Инсайты</Tab>
          <Tab>Рекомендации</Tab>
        </TabList>

        <TabPanels>
          {/* Вкладка с инсайтами */}
          <TabPanel p={0} pt={4}>
            {loadingInsights ? (
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
                  />
                ))}
              </VStack>
            ) : (
              <Box textAlign="center" p={8} bg="gray.50" borderRadius="md">
                <Text>Для этого пользователя пока нет инсайтов.</Text>
              </Box>
            )}
          </TabPanel>

          {/* Вкладка с рекомендациями */}
          <TabPanel p={0} pt={4}>
            {loadingRecommendations ? (
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
              </VStack>
            ) : (
              <Box textAlign="center" p={8} bg="gray.50" borderRadius="md">
                <Text>Для этого пользователя пока нет рекомендаций.</Text>
                <Button
                  mt={4}
                  colorScheme="blue"
                  leftIcon={<FiZap />}
                  onClick={handleGenerateRecommendations}
                  isLoading={generating}
                >
                  Сгенерировать рекомендации
                </Button>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default UserInsights;
