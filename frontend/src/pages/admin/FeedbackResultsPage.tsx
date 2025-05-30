import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Flex,
  Text,
  Divider,
  Select,
  Button,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Spinner,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiDownload, FiFilter, FiRefreshCw } from "react-icons/fi";
import FeedbackResultTable from "../../components/feedback/FeedbackResultTable";
import FeedbackAIInsightsPanel from "../../components/feedback/FeedbackAIInsightsPanel";
import {
  UserFeedback,
  FeedbackInsight,
  FeedbackTemplate,
} from "../../types/feedback";
import axios from "axios";

// Моковые данные для демонстрации
const mockFeedbacks: UserFeedback[] = [
  {
    id: 1,
    template_id: 1,
    template: {
      id: 1,
      title: "Оценка прохождения онбординга",
      description: "Форма для оценки качества прохождения онбординга",
      type: "manual",
      is_anonymous: false,
      created_at: "2025-04-15T10:30:00Z",
      updated_at: "2025-04-15T10:30:00Z",
    },
    user_id: 101,
    user: {
      id: 101,
      first_name: "Алексей",
      last_name: "Иванов",
      email: "a.ivanov@example.com",
    },
    submitter_id: 5,
    submitter_name: "Ольга Смирнова",
    onboarding_step_id: 3,
    onboarding_step_name: "Знакомство с командой",
    is_anonymous: false,
    created_at: "2025-05-20T14:30:00Z",
    updated_at: "2025-05-20T14:30:00Z",
  },
  {
    id: 2,
    template_id: 1,
    template: {
      id: 1,
      title: "Оценка прохождения онбординга",
      description: "Форма для оценки качества прохождения онбординга",
      type: "manual",
      is_anonymous: false,
      created_at: "2025-04-15T10:30:00Z",
      updated_at: "2025-04-15T10:30:00Z",
    },
    user_id: 102,
    user: {
      id: 102,
      first_name: "Мария",
      last_name: "Петрова",
      email: "m.petrova@example.com",
    },
    submitter_id: 5,
    submitter_name: "Ольга Смирнова",
    onboarding_step_id: 4,
    onboarding_step_name: "Изучение продукта",
    is_anonymous: false,
    created_at: "2025-05-19T10:15:00Z",
    updated_at: "2025-05-19T10:15:00Z",
  },
];

const mockInsights: FeedbackInsight[] = [
  {
    id: 1,
    template_id: 1,
    type: "summary",
    content:
      "Большинство сотрудников положительно оценивают процесс онбординга, особенно выделяя этап знакомства с командой. Средний балл удовлетворенности - 8.2 из 10.",
    confidence_score: 0.89,
    created_at: "2025-05-22T08:30:00Z",
  },
  {
    id: 2,
    template_id: 1,
    type: "problem_area",
    content:
      "Выявлена проблемная область: документация по настройке рабочего окружения требует доработки. 35% новых сотрудников отметили сложности с данным этапом.",
    confidence_score: 0.75,
    created_at: "2025-05-22T08:31:00Z",
  },
  {
    id: 3,
    template_id: 1,
    type: "risk",
    content:
      "Потенциальный риск: длительность обучающих материалов может привести к задержкам в завершении онбординга. Рекомендуется оптимизировать содержание обучающих курсов.",
    confidence_score: 0.68,
    created_at: "2025-05-22T08:32:00Z",
  },
  {
    id: 4,
    template_id: 1,
    type: "satisfaction",
    content:
      "78% новых сотрудников удовлетворены качеством и организацией онбординга. Индекс удовлетворенности составляет 8.2/10.",
    confidence_score: 0.92,
    created_at: "2025-05-22T08:33:00Z",
  },
];

const mockTemplates: FeedbackTemplate[] = [
  {
    id: 1,
    title: "Оценка прохождения онбординга",
    description: "Форма для оценки качества процесса онбординга",
    type: "manual",
    creator_id: 1,
    creator_name: "Анна Смирнова",
    is_anonymous: false,
    created_at: "2025-04-15T10:30:00Z",
    updated_at: "2025-04-15T10:30:00Z",
  },
  {
    id: 2,
    title: "Отзыв о наставнике",
    description: "Анонимная форма для оценки работы наставника",
    type: "automatic",
    creator_id: 2,
    creator_name: "Иван Петров",
    is_anonymous: true,
    created_at: "2025-04-10T14:20:00Z",
    updated_at: "2025-04-12T11:15:00Z",
  },
];

const FeedbackResultsPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>(mockFeedbacks);
  const [insights, setInsights] = useState<FeedbackInsight[]>(mockInsights);
  const [templates, setTemplates] = useState<FeedbackTemplate[]>(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<string>("all");

  // Парсинг URL параметров для начальной фильтрации
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const templateId = params.get("template");

    if (templateId) {
      setSelectedTemplate(Number(templateId));
    }
  }, [location]);

  // Загрузка данных (в реальном приложении здесь будут запросы к API)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Раскомментировать для реальной реализации
        // const templatesResponse = await axios.get('/api/feedback/templates/');
        // setTemplates(templatesResponse.data);

        // const feedbacksResponse = await axios.get('/api/feedback/results/', {
        //   params: {
        //     template_id: selectedTemplate,
        //     date_range: dateRange !== 'all' ? dateRange : undefined,
        //   }
        // });
        // setFeedbacks(feedbacksResponse.data);

        // const insightsResponse = await axios.get('/api/feedback/insights/', {
        //   params: {
        //     template_id: selectedTemplate,
        //   }
        // });
        // setInsights(insightsResponse.data);

        // Временно используем моковые данные с задержкой для демонстрации
        setTimeout(() => {
          setTemplates(mockTemplates);

          if (selectedTemplate) {
            setFeedbacks(
              mockFeedbacks.filter((f) => f.template_id === selectedTemplate)
            );
            setInsights(
              mockInsights.filter((i) => i.template_id === selectedTemplate)
            );
          } else {
            setFeedbacks(mockFeedbacks);
            setInsights(mockInsights);
          }

          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить результаты обратной связи",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedTemplate, dateRange, toast]);

  // Обработчик изменения выбранного шаблона
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTemplate(value ? Number(value) : null);

    // Обновляем URL для сохранения выбранного фильтра
    const params = new URLSearchParams(location.search);
    if (value) {
      params.set("template", value);
    } else {
      params.delete("template");
    }
    navigate(`${location.pathname}?${params.toString()}`);
  };

  // Обработчик изменения диапазона дат
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDateRange(e.target.value);
  };

  // Обработчик для экспорта данных
  const handleExportData = () => {
    toast({
      title: "Экспорт данных",
      description: "Экспорт результатов в Excel. Функция в разработке.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  // Обработчик для обновления аналитики
  const handleRefreshAnalytics = async () => {
    setIsLoading(true);
    try {
      // В реальном приложении здесь будет запрос на обновление аналитики
      // await axios.post('/api/feedback/insights/refresh/', {
      //   template_id: selectedTemplate,
      // });

      toast({
        title: "Аналитика обновлена",
        description: "AI-аналитика успешно обновлена с учетом последних данных",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Повторный запрос на получение обновленных инсайтов
      setTimeout(() => {
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Ошибка при обновлении аналитики:", error);
      toast({
        title: "Ошибка обновления",
        description: "Не удалось обновить аналитику",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsLoading(false);
    }
  };

  // Открытие детальной страницы пользователя
  const handleViewUserDetails = (userId: number) => {
    navigate(`/admin/feedback/user/${userId}`);
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Heading as="h1" size="lg" mb={6}>
        Результаты обратной связи
      </Heading>

      <Card mb={6}>
        <CardHeader>
          <Heading size="md">Фильтры и управление</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={4}>
            <GridItem>
              <Text mb={2}>Шаблон обратной связи:</Text>
              <Select
                placeholder="Все шаблоны"
                value={selectedTemplate || ""}
                onChange={handleTemplateChange}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </Select>
            </GridItem>
            <GridItem>
              <Text mb={2}>Период:</Text>
              <Select value={dateRange} onChange={handleDateRangeChange}>
                <option value="all">За все время</option>
                <option value="week">За последнюю неделю</option>
                <option value="month">За последний месяц</option>
                <option value="quarter">За последние 3 месяца</option>
              </Select>
            </GridItem>
            <GridItem display="flex" alignItems="flex-end">
              <HStack spacing={4} w="100%" justify="flex-end">
                <Button leftIcon={<FiDownload />} onClick={handleExportData}>
                  Экспорт
                </Button>
                <Button
                  leftIcon={<FiRefreshCw />}
                  colorScheme="blue"
                  onClick={handleRefreshAnalytics}
                  isLoading={isLoading}
                >
                  Обновить
                </Button>
              </HStack>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>

      <Tabs variant="enclosed" colorScheme="blue">
        <TabList>
          <Tab>Результаты</Tab>
          <Tab>AI-аналитика</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <FeedbackResultTable
              feedbacks={feedbacks}
              isLoading={isLoading}
              onViewUserDetails={handleViewUserDetails}
            />
          </TabPanel>

          <TabPanel px={0}>
            <FeedbackAIInsightsPanel
              insights={insights}
              isLoading={isLoading}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default FeedbackResultsPage;
