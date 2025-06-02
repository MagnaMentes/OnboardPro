import React from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
import { PageHeader } from "../../../components/layout/PageHeader";
import IntelligenceOverviewPanel from "../../../components/intelligence/IntelligenceOverviewPanel";
import RiskPredictionPanel from "../../../components/intelligence/RiskPredictionPanel";
import AnomalyTable from "../../../components/intelligence/AnomalyTable";

/**
 * Главная страница панели AI Intelligence Dashboard.
 * Отображает общие метрики, прогнозы рисков и обнаруженные аномалии.
 */
const IntelligenceDashboardPage: React.FC = () => {
  const bgColor = useColorModeValue("white", "gray.800");

  return (
    <Container maxW="container.xl" p={0}>
      <PageHeader
        title="AI Intelligence Dashboard"
        description="Аналитическая панель с ИИ-аналитикой процессов онбординга"
      />

      <Box mb={8}>
        <Text fontSize="md" color="gray.600" mb={6}>
          Эта панель использует искусственный интеллект для анализа данных
          онбординга, выявления рисков и аномалий, а также предоставления
          рекомендаций для оптимизации процессов.
        </Text>

        <Tabs colorScheme="brand" variant="enclosed">
          <TabList mb="1em">
            <Tab fontWeight="medium">Обзор процессов</Tab>
            <Tab fontWeight="medium">Прогноз рисков</Tab>
            <Tab fontWeight="medium">Аномалии</Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <Box
                bg={bgColor}
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
              >
                <IntelligenceOverviewPanel />
              </Box>
            </TabPanel>

            <TabPanel p={0}>
              <Box
                bg={bgColor}
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
              >
                <RiskPredictionPanel />
              </Box>
            </TabPanel>

            <TabPanel p={0}>
              <Box
                bg={bgColor}
                borderRadius="lg"
                boxShadow="sm"
                overflow="hidden"
              >
                <AnomalyTable showResolved={false} />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default IntelligenceDashboardPage;
