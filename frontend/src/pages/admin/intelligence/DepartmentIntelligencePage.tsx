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
import { getDepartmentIntelligenceDashboard } from "../../../api/intelligenceApi";
import { DepartmentIntelligenceDashboard } from "../../../types/intelligence";

/**
 * Страница детальной информации об онбординге по департаменту.
 * Отображает агрегированные метрики, прогнозы рисков и обнаруженные аномалии для конкретного департамента.
 */
const DepartmentIntelligencePage: React.FC = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] =
    useState<DepartmentIntelligenceDashboard | null>(null);

  const bgColor = useColorModeValue("white", "gray.800");

  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (!departmentId) return;

      try {
        setLoading(true);
        const data = await getDepartmentIntelligenceDashboard(
          parseInt(departmentId)
        );
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch department intelligence data:", err);
        setError(
          "Не удалось загрузить данные о департаменте. Попробуйте обновить страницу."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentData();
  }, [departmentId]);

  if (loading) {
    return (
      <Container maxW="container.xl" p={0}>
        <Flex direction="column" align="center" justify="center" minH="50vh">
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text mt={4} fontSize="lg" color="gray.600">
            Загрузка данных о департаменте...
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
            {error || "Не удалось загрузить данные департамента"}
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
        title={`Аналитика онбординга: ${dashboardData.department_name}`}
        description={`Агрегированная аналитика процессов онбординга по отделу с оценкой рисков и аномалий`}
      />

      <Grid templateColumns="repeat(4, 1fr)" gap={4} mb={6}>
        <GridItem
          colSpan={1}
          bg={bgColor}
          borderRadius="lg"
          boxShadow="sm"
          p={4}
        >
          <Text fontSize="sm" color="gray.500">
            Всего сотрудников в онбординге
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {dashboardData.total_users}
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
            Средний прогресс
          </Text>
          <Text fontSize="2xl" fontWeight="bold">
            {dashboardData.avg_completion_percentage}%
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
            Сотрудников с высоким риском
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="red.500">
            {dashboardData.high_risk_users}
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
            Аномалий обнаружено
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="orange.500">
            {dashboardData.total_anomalies}
          </Text>
        </GridItem>
      </Grid>

      <Box mb={8}>
        <Tabs colorScheme="brand" variant="enclosed">
          <TabList mb="1em">
            <Tab fontWeight="medium">Программы онбординга</Tab>
            <Tab fontWeight="medium">Прогноз рисков</Tab>
            <Tab fontWeight="medium">Аномалии</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <Box bg={bgColor} borderRadius="lg" boxShadow="sm" p={4}>
                <Heading as="h3" size="md" mb={4}>
                  Программы онбординга в департаменте
                </Heading>

                {dashboardData.program_metrics.map((program, index) => (
                  <Box key={index} mb={4} p={4} borderRadius="md" bg="gray.50">
                    <Flex justify="space-between" align="center" mb={2}>
                      <Text fontSize="lg" fontWeight="semibold">
                        {program.program_name}
                      </Text>
                      <Text>{program.active_users} сотрудников</Text>
                    </Flex>

                    <Grid templateColumns="repeat(4, 1fr)" gap={4} mt={3}>
                      <GridItem colSpan={1} textAlign="center">
                        <Text fontSize="sm" color="gray.600">
                          Средний прогресс
                        </Text>
                        <Text fontSize="lg" fontWeight="medium">
                          {program.avg_completion}%
                        </Text>
                      </GridItem>

                      <GridItem colSpan={1} textAlign="center">
                        <Text fontSize="sm" color="gray.600">
                          Среднее время задачи
                        </Text>
                        <Text fontSize="lg" fontWeight="medium">
                          {program.avg_task_time || "Н/Д"}
                        </Text>
                      </GridItem>

                      <GridItem colSpan={1} textAlign="center">
                        <Text fontSize="sm" color="gray.600">
                          С просрочкой
                        </Text>
                        <Text
                          fontSize="lg"
                          fontWeight="medium"
                          color={
                            program.overdue_tasks > 0 ? "red.500" : "inherit"
                          }
                        >
                          {program.overdue_tasks}
                        </Text>
                      </GridItem>

                      <GridItem colSpan={1} textAlign="center">
                        <Text fontSize="sm" color="gray.600">
                          Статус
                        </Text>
                        <Text
                          fontSize="lg"
                          fontWeight="medium"
                          color={
                            program.health_status === "good"
                              ? "green.500"
                              : program.health_status === "warning"
                              ? "orange.500"
                              : "red.500"
                          }
                        >
                          {program.health_status === "good"
                            ? "Хороший"
                            : program.health_status === "warning"
                            ? "Требует внимания"
                            : "Критический"}
                        </Text>
                      </GridItem>
                    </Grid>
                  </Box>
                ))}
              </Box>
            </TabPanel>

            <TabPanel p={0}>
              <Box
                bg={bgColor}
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
              >
                <RiskPredictionPanel
                  departmentId={parseInt(departmentId || "0")}
                />
              </Box>
            </TabPanel>

            <TabPanel p={0}>
              <Box
                bg={bgColor}
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
              >
                <AnomalyTable departmentId={parseInt(departmentId || "0")} />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default DepartmentIntelligencePage;
