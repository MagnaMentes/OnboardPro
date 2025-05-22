import { FC, useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  useToast,
  Divider,
  VStack,
} from "@chakra-ui/react";
import analyticsApi, {
  AnalyticsSummary,
  AssignmentAnalytics,
  FeedbackSummary,
} from "../../api/analytics";
import AnalyticsSummaryCards from "../../components/analytics/AnalyticsSummaryCards";
import AssignmentsTable from "../../components/analytics/AssignmentsTable";
import MoodChart from "../../components/analytics/MoodChart";

const Analytics: FC = () => {
  // Состояния для хранения данных
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null);
  const [assignmentsData, setAssignmentsData] = useState<
    AssignmentAnalytics[] | null
  >(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackSummary | null>(
    null
  );

  // Состояния для отслеживания загрузки
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);

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

  return (
    <Box py={8}>
      <Container maxW="container.xl">
        <Heading as="h1" size="xl" mb={8}>
          Аналитика онбординга
        </Heading>

        <VStack spacing={8} align="stretch">
          {/* Карточки с ключевыми метриками */}
          <Box>
            <Heading as="h2" size="md" mb={4}>
              Ключевые метрики
            </Heading>
            <AnalyticsSummaryCards
              data={summaryData}
              isLoading={loadingSummary}
            />
          </Box>

          <Divider />

          {/* График настроения */}
          <Box>
            <MoodChart data={feedbackData} isLoading={loadingFeedback} />
          </Box>

          <Divider />

          {/* Таблица с назначениями */}
          <Box>
            <AssignmentsTable
              data={assignmentsData}
              isLoading={loadingAssignments}
            />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default Analytics;
