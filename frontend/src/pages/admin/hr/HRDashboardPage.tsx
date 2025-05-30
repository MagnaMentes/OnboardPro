import React from "react";
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import {
  useHRDashboardOverview,
  useAlerts,
  useDepartmentMetrics,
} from "../../../api/useHRDashboard";
import HRDashboardWidgets from "../../../components/hr/dashboard/HRDashboardWidgets";
import HRTrendChart from "../../../components/hr/dashboard/HRTrendChart";
import HRAlertTable from "../../../components/hr/dashboard/HRAlertTable";

const HRDashboardPage: React.FC = () => {
  const { data: metrics, isLoading: isLoadingMetrics } =
    useHRDashboardOverview();
  const { data: alerts, isLoading: isLoadingAlerts } = useAlerts();
  const { data: departmentMetrics, isLoading: isLoadingDepartments } =
    useDepartmentMetrics();

  const bgColor = useColorModeValue("gray.50", "gray.900");

  if (isLoadingMetrics || !metrics) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg={bgColor}>
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          {/* Заголовок */}
          <Box>
            <Heading size="lg" mb={2}>
              HR Dashboard
            </Heading>
            <Text color="gray.500">
              Мониторинг онбординга и ключевых метрик
            </Text>
          </Box>

          {/* Виджеты с основными метриками */}
          <HRDashboardWidgets metrics={metrics} />

          {/* Табы с разделами */}
          <Tabs isLazy colorScheme="blue">
            <TabList>
              <Tab>Тренды</Tab>
              <Tab>Алерты</Tab>
              <Tab>Департаменты</Tab>
            </TabList>

            <TabPanels>
              {/* Панель трендов */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  <HRTrendChart
                    metricKey="avg_completion_rate"
                    title="Прогресс онбординга"
                    color="#3182ce"
                    valueFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <HRTrendChart
                    metricKey="avg_sentiment_score"
                    title="Настроение сотрудников"
                    color="#38A169"
                    valueFormatter={(value) => value.toFixed(2)}
                  />
                  <HRTrendChart
                    metricKey="negative_feedback_rate"
                    title="Негативные отзывы"
                    color="#E53E3E"
                    valueFormatter={(value) => `${value.toFixed(1)}%`}
                  />
                  <HRTrendChart
                    metricKey="overdue_steps_count"
                    title="Просроченные шаги"
                    color="#D69E2E"
                    valueFormatter={(value) => Math.round(value).toString()}
                  />
                </SimpleGrid>
              </TabPanel>

              {/* Панель алертов */}
              <TabPanel px={0}>
                <HRAlertTable
                  alerts={alerts || []}
                  isLoading={isLoadingAlerts}
                />
              </TabPanel>

              {/* Панель департаментов */}
              <TabPanel px={0}>
                <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                  {departmentMetrics?.map((dept) => (
                    <HRTrendChart
                      key={dept.department_id}
                      metricKey="department_completion_rate"
                      departmentId={dept.department_id}
                      title={`Прогресс: ${dept.department_name}`}
                      color="#805AD5"
                      valueFormatter={(value) => `${value.toFixed(1)}%`}
                    />
                  ))}
                </SimpleGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    </Box>
  );
};

export default HRDashboardPage;
