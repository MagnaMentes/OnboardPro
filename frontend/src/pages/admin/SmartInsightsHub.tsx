import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  VStack,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Button,
  useDisclosure,
  Alert,
  AlertIcon,
  Spinner,
  SimpleGrid,
} from "@chakra-ui/react";
import { InsightsOverview } from "@/components/AIInsights/InsightsOverview";
import { RecommendationsOverview } from "@/components/AIInsights/RecommendationsOverview";
import {
  SmartInsightsService,
  AIRecommendationsService,
} from "@/services/aiInsights";
import { InsightStats, RecommendationStats } from "@/types/aiInsights";

const SmartInsightsHub = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [insightStats, setInsightStats] = useState<InsightStats | null>(null);
  const [recommendationStats, setRecommendationStats] =
    useState<RecommendationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAggregating, setIsAggregating] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    status: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [insightStatsData, recommendationStatsData] = await Promise.all([
        SmartInsightsService.getInsightStats(),
        AIRecommendationsService.getRecommendationStats(),
      ]);
      setInsightStats(insightStatsData);
      setRecommendationStats(recommendationStatsData);
    } catch (error) {
      setAlertInfo({
        status: "error",
        message:
          "Не удалось загрузить статистику. Пожалуйста, попробуйте позже.",
      });
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      const response =
        await AIRecommendationsService.generateAllRecommendations();
      setAlertInfo({
        status: "success",
        message: "Генерация рекомендаций запущена успешно",
      });
      setTimeout(() => {
        fetchStats();
      }, 3000);
    } catch (error) {
      setAlertInfo({
        status: "error",
        message: "Ошибка при запуске генерации рекомендаций",
      });
      console.error("Error generating recommendations:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAggregateInsights = async () => {
    setIsAggregating(true);
    try {
      const response = await SmartInsightsService.aggregateInsights();
      setAlertInfo({
        status: "success",
        message: "Агрегация инсайтов запущена успешно",
      });
      setTimeout(() => {
        fetchStats();
      }, 3000);
    } catch (error) {
      setAlertInfo({
        status: "error",
        message: "Ошибка при запуске агрегации инсайтов",
      });
      console.error("Error aggregating insights:", error);
    } finally {
      setIsAggregating(false);
    }
  };

  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Heading as="h1" fontSize="2xl">
          Smart Insights Hub
        </Heading>
        <HStack spacing={4}>
          <Button
            colorScheme="teal"
            isLoading={isGenerating}
            loadingText="Генерация..."
            onClick={handleGenerateRecommendations}
          >
            Сгенерировать рекомендации
          </Button>
          <Button
            colorScheme="blue"
            isLoading={isAggregating}
            loadingText="Агрегация..."
            onClick={handleAggregateInsights}
          >
            Агрегировать инсайты
          </Button>
        </HStack>
      </Flex>

      {alertInfo && (
        <Alert status={alertInfo.status} mb={4} borderRadius="md">
          <AlertIcon />
          {alertInfo.message}
        </Alert>
      )}

      {isLoading ? (
        <Flex justifyContent="center" my={10}>
          <VStack>
            <Spinner size="xl" />
            <Text mt={4}>Загрузка данных...</Text>
          </VStack>
        </Flex>
      ) : (
        <>
          <SimpleGrid columns={{ base: 2, lg: 4 }} spacing={5} mb={6}>
            <Box
              bg={bgColor}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              shadow="sm"
            >
              <Stat>
                <StatLabel fontSize="sm">Всего инсайтов</StatLabel>
                <StatNumber>{insightStats?.total || 0}</StatNumber>
              </Stat>
            </Box>
            <Box
              bg={bgColor}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              shadow="sm"
            >
              <Stat>
                <StatLabel fontSize="sm">Критические инсайты</StatLabel>
                <StatNumber color="red.500">
                  {insightStats?.by_level.critical || 0}
                </StatNumber>
              </Stat>
            </Box>
            <Box
              bg={bgColor}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              shadow="sm"
            >
              <Stat>
                <StatLabel fontSize="sm">Всего рекомендаций</StatLabel>
                <StatNumber>{recommendationStats?.total || 0}</StatNumber>
              </Stat>
            </Box>
            <Box
              bg={bgColor}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              p={4}
              shadow="sm"
            >
              <Stat>
                <StatLabel fontSize="sm">Высокий приоритет</StatLabel>
                <StatNumber color="orange.500">
                  {recommendationStats?.by_priority.high || 0}
                </StatNumber>
              </Stat>
            </Box>
          </SimpleGrid>

          <Box
            bg={bgColor}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
          >
            <Tabs
              colorScheme="blue"
              index={activeTab}
              onChange={handleTabChange}
            >
              <TabList px={4} borderBottomColor={borderColor}>
                <Tab>Инсайты</Tab>
                <Tab>Рекомендации</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <InsightsOverview />
                </TabPanel>
                <TabPanel>
                  <RecommendationsOverview />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </>
      )}
    </Box>
  );
};

export default SmartInsightsHub;
