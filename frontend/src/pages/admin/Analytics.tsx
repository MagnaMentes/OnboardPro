import { FC, useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  useToast,
  Divider,
  VStack,
  Text,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
import analyticsApi, {
  AnalyticsSummary,
  AssignmentAnalytics,
  FeedbackSummary,
} from "../../api/analytics";
import aiInsightsApi, { AIInsight } from "../../api/aiInsights";
import AnalyticsSummaryCards from "../../components/analytics/AnalyticsSummaryCards";
import AssignmentsTable from "../../components/analytics/AssignmentsTable";
import MoodChart from "../../components/analytics/MoodChart";
import AIInsightCard from "../../components/analytics/AIInsightCard";
import AIInsightTable from "../../components/analytics/AIInsightTable";
import { AppLayout } from "../../components/layout/AppLayout";

const Analytics: FC = () => {
  // Состояния для хранения данных
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null);
  const [assignmentsData, setAssignmentsData] = useState<
    AssignmentAnalytics[] | null
  >(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackSummary | null>(
    null
  );
  const [aiInsights, setAiInsights] = useState<AIInsight[] | null>(null);

  // Состояния для отслеживания загрузки
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [loadingAiInsights, setLoadingAiInsights] = useState(true);

  // Уведомления
  const toast = useToast();

  // Загрузка общих аналитических данных
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoadingSummary(true);
        const data = await analyticsApi.getSummary();
        setSummaryData(data);
      } catch (error) {
        toast({
          title: "Ошибка загрузки данных",
          description: "Не удалось загрузить сводку по онбордингу",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error("Error fetching summary data:", error);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummaryData();
  }, [toast]);

  // Загрузка данных о назначениях
  useEffect(() => {
    const fetchAssignmentsData = async () => {
      try {
        setLoadingAssignments(true);
        const data = await analyticsApi.getAssignments();
        setAssignmentsData(data);
      } catch (error) {
        toast({
          title: "Ошибка загрузки данных",
          description: "Не удалось загрузить таблицу назначений",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error("Error fetching assignments data:", error);
      } finally {
        setLoadingAssignments(false);
      }
    };

    fetchAssignmentsData();
  }, [toast]);

  // Загрузка данных о настроении
  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        setLoadingFeedback(true);
        const data = await analyticsApi.getFeedbackSummary();
        setFeedbackData(data);
      } catch (error) {
        toast({
          title: "Ошибка загрузки данных",
          description: "Не удалось загрузить данные о настроении",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error("Error fetching feedback data:", error);
      } finally {
        setLoadingFeedback(false);
      }
    };

    fetchFeedbackData();
  }, [toast]);

  // Загрузка AI-инсайтов
  useEffect(() => {
    const fetchAiInsights = async () => {
      try {
        setLoadingAiInsights(true);
        const data = await aiInsightsApi.getAllInsights();
        setAiInsights(data);
      } catch (error) {
        toast({
          title: "Ошибка загрузки данных",
          description: "Не удалось загрузить AI-инсайты",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        console.error("Error fetching AI insights:", error);
      } finally {
        setLoadingAiInsights(false);
      }
    };

    fetchAiInsights();
  }, [toast]);

  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  return (
    <AppLayout>
      <Box mb={8}>
        <Heading size="xl" mb={3} color="brand.700">
          Аналитика онбординга
        </Heading>
        <Text color="gray.600" fontSize="lg" mb={6}>
          Детальная аналитика процесса адаптации новых сотрудников
        </Text>

        <VStack spacing={8} align="stretch">
          {/* Карточки с ключевыми метриками */}
          <Box
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
            p={5}
          >
            <Heading as="h2" size="md" mb={4} color="brand.600">
              Ключевые метрики
            </Heading>
            <AnalyticsSummaryCards
              data={summaryData}
              isLoading={loadingSummary}
            />
          </Box>

          {/* График настроения */}
          <Box
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
            p={5}
          >
            <Heading as="h2" size="md" mb={4} color="brand.600">
              Динамика настроения
            </Heading>
            <MoodChart data={feedbackData} isLoading={loadingFeedback} />
          </Box>

          {/* Таблица с назначениями */}
          <Box
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
            p={5}
          >
            <Heading as="h2" size="md" mb={4} color="brand.600">
              Статистика назначений
            </Heading>
            <AssignmentsTable
              data={assignmentsData}
              isLoading={loadingAssignments}
            />
          </Box>

          {/* Раздел AI-инсайты */}
          <Box
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
            p={5}
          >
            <Heading as="h2" size="md" mb={4} color="brand.600">
              AI-инсайты
            </Heading>

            {aiInsights && aiInsights.length > 0 && (
              <Box mb={6}>
                <Text fontSize="md" mb={4}>
                  Приоритетные сотрудники с высоким риском:
                </Text>
                <SimpleGrid
                  columns={{ base: 1, md: 2, lg: 3 }}
                  spacing={4}
                  mb={8}
                >
                  {aiInsights
                    .filter((insight) => insight.risk_level === "high")
                    .slice(0, 3)
                    .map((insight) => (
                      <AIInsightCard key={insight.id} insight={insight} />
                    ))}
                </SimpleGrid>
              </Box>
            )}

            <AIInsightTable data={aiInsights} isLoading={loadingAiInsights} />
          </Box>
        </VStack>
      </Box>
    </AppLayout>
  );
};

export default Analytics;
