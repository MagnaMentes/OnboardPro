import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { ChevronLeftIcon } from "@chakra-ui/icons";
import { PageHeader } from "../../../components/layout/PageHeader";
import RiskPredictionPanel from "../../../components/intelligence/RiskPredictionPanel";
import AnomalyTable from "../../../components/intelligence/AnomalyTable";
import { getUserIntelligenceDashboard } from "../../../api/intelligenceApi";
import { UserIntelligenceDashboard } from "../../../types/intelligence";

/**
 * Страница детальной информации об онбординге сотрудника.
 * Отображает персональные метрики, прогнозы рисков и обнаруженные аномалии для конкретного сотрудника.
 */
const UserIntelligencePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] =
    useState<UserIntelligenceDashboard | null>(null);

  const bgColor = useColorModeValue("white", "gray.800");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setLoading(true);
        const data = await getUserIntelligenceDashboard(parseInt(userId));
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch user intelligence data:", err);
        setError(
          "Не удалось загрузить данные о сотруднике. Попробуйте обновить страницу."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <Container maxW="container.xl" p={0}>
        <Flex direction="column" align="center" justify="center" minH="50vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text mt={4} fontSize="lg" color="gray.600">
            Загрузка данных о сотруднике...
          </Text>
        </Flex>
      </Container>
    );
  }

  if (error || !dashboardData) {
    return (
      <Container maxW="container.xl" p={0}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Ошибка загрузки
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {error || "Не удалось загрузить данные пользователя"}
          </AlertDescription>
          <Button mt={4} colorScheme="red" onClick={() => navigate(-1)}>
            Вернуться назад
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" p={0}>
      <Box mb={4}>
        <Button
          leftIcon={<ChevronLeftIcon />}
          variant="ghost"
          onClick={() => navigate(-1)}
        >
          Вернуться назад
        </Button>
      </Box>

      <PageHeader
        title={`Аналитика онбординга: ${dashboardData.user_full_name}`}
        description={`Детальный анализ процесса онбординга сотрудника с оценкой рисков и аномалий`}
      />

      <Grid templateColumns="repeat(3, 1fr)" gap={4} mb={6}>
        <GridItem
          colSpan={1}
          bg={bgColor}
          borderRadius="lg"
          boxShadow="sm"
          p={4}
        >
          <Text fontSize="sm" color="gray.500">
            Email
          </Text>
          <Text fontSize="md" fontWeight="medium">
            {dashboardData.user_email}
          </Text>
        </GridItem>
        <GridItem
          colSpan={1}
          bg={bgColor}
          borderRadius="lg"
          boxShadow="sm"
          p={4}
        >
          <Text fontSize="sm" color="gray.500">
            Отдел
          </Text>
          <Text fontSize="md" fontWeight="medium">
            {dashboardData.department_name || "Не указан"}
          </Text>
        </GridItem>
        <GridItem
          colSpan={1}
          bg={bgColor}
          borderRadius="lg"
          boxShadow="sm"
          p={4}
        >
          <Text fontSize="sm" color="gray.500">
            Программа онбординга
          </Text>
          <Text fontSize="md" fontWeight="medium">
            {dashboardData.program_name}
          </Text>
        </GridItem>
      </Grid>

      <Box mb={8}>
        <Tabs colorScheme="brand" variant="enclosed">
          <TabList mb="1em">
            <Tab fontWeight="medium">Прогресс</Tab>
            <Tab fontWeight="medium">Прогноз рисков</Tab>
            <Tab fontWeight="medium">Аномалии</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <Box bg={bgColor} borderRadius="lg" boxShadow="sm" p={4}>
                <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={4}>
                  <GridItem
                    colSpan={1}
                    bg="blue.50"
                    borderRadius="md"
                    p={4}
                    textAlign="center"
                  >
                    <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                      {dashboardData.completion_percentage}%
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Прогресс
                    </Text>
                  </GridItem>

                  <GridItem
                    colSpan={1}
                    bg="green.50"
                    borderRadius="md"
                    p={4}
                    textAlign="center"
                  >
                    <Text fontSize="3xl" fontWeight="bold" color="green.500">
                      {dashboardData.steps_completed}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Завершено задач
                    </Text>
                  </GridItem>

                  <GridItem
                    colSpan={1}
                    bg="yellow.50"
                    borderRadius="md"
                    p={4}
                    textAlign="center"
                  >
                    <Text fontSize="3xl" fontWeight="bold" color="yellow.500">
                      {dashboardData.steps_in_progress}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      В процессе
                    </Text>
                  </GridItem>

                  <GridItem
                    colSpan={1}
                    bg="red.50"
                    borderRadius="md"
                    p={4}
                    textAlign="center"
                  >
                    <Text fontSize="3xl" fontWeight="bold" color="red.500">
                      {dashboardData.steps_overdue}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Просрочено
                    </Text>
                  </GridItem>
                </Grid>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <GridItem colSpan={1} bg="gray.50" borderRadius="md" p={4}>
                    <Text fontSize="sm" color="gray.500">
                      Среднее время выполнения задач
                    </Text>
                    <Text fontSize="lg" fontWeight="medium">
                      {dashboardData.avg_step_completion_time || "Нет данных"}
                    </Text>
                  </GridItem>

                  <GridItem colSpan={1} bg="gray.50" borderRadius="md" p={4}>
                    <Text fontSize="sm" color="gray.500">
                      Последняя активность
                    </Text>
                    <Text fontSize="lg" fontWeight="medium">
                      {dashboardData.last_activity_time
                        ? new Date(
                            dashboardData.last_activity_time
                          ).toLocaleString()
                        : "Нет данных"}
                    </Text>
                  </GridItem>
                </Grid>
              </Box>
            </TabPanel>

            <TabPanel p={0}>
              <Box
                bg={bgColor}
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
              >
                <RiskPredictionPanel userId={parseInt(userId || "0")} />
              </Box>
            </TabPanel>

            <TabPanel p={0}>
              <Box
                bg={bgColor}
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
              >
                <AnomalyTable userId={parseInt(userId || "0")} />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default UserIntelligencePage;
