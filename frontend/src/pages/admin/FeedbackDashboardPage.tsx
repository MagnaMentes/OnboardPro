import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  SimpleGrid,
  Flex,
  Button,
  Select,
  HStack,
  useToast,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Spinner,
} from "@chakra-ui/react";
import { PageHeader } from "../../components/layout/PageHeader";
import TrendChart from "../../components/feedback/dashboard/TrendChart";
import TopicsIssuesChart from "../../components/feedback/dashboard/TopicsIssuesChart";
import DashboardMetricsCard from "../../components/feedback/dashboard/DashboardMetricsCard";
import FeedbackAlertsList from "../../components/feedback/dashboard/FeedbackAlertsList";
import FeedbackRuleList from "../../components/feedback/dashboard/FeedbackRuleList";
import FeedbackRuleForm from "../../components/feedback/dashboard/FeedbackRuleForm";
import { FiRefreshCw } from "react-icons/fi";
import dashboardApi from "../../api/dashboardApi";
import {
  DashboardData,
  RuleFormData,
  FeedbackTrendRule,
  FeedbackTrendAlert,
} from "../../types/dashboard";

import { useAuthStore } from "../../store/authStore";

const FeedbackDashboardPage: React.FC = () => {
  // Состояния для загрузки данных и UI
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [rules, setRules] = useState<FeedbackTrendRule[]>([]);
  const [alerts, setAlerts] = useState<FeedbackTrendAlert[]>([]);
  const [templates, setTemplates] = useState<{ id: number; name: string }[]>(
    []
  );
  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [period, setPeriod] = useState<string>("30");

  // Состояния для загрузки данных и действий
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSnapshots, setIsGeneratingSnapshots] = useState(false);
  const [isCheckingRules, setIsCheckingRules] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<FeedbackTrendRule | null>(null);

  // Состояние для управления вкладками
  const [tabIndex, setTabIndex] = useState(0);

  const toast = useToast();
  const {
    isOpen: isRuleFormOpen,
    onOpen: onRuleFormOpen,
    onClose: onRuleFormClose,
  } = useDisclosure();
  const { user } = useAuthStore();

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchDashboardData();
    fetchRules();
    fetchAlerts();
    fetchTemplatesAndDepartments();
  }, []);

  // Перезагрузка данных дашборда при изменении фильтров
  useEffect(() => {
    fetchDashboardData();
  }, [selectedTemplateId, selectedDepartmentId, period]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { days: period };
      if (selectedTemplateId) params.template_id = selectedTemplateId;
      if (selectedDepartmentId) params.department_id = selectedDepartmentId;

      // getDashboardData теперь возвращает данные напрямую, а не response
      const data = await dashboardApi.getDashboardData(params);
      // Проверяем и логируем структуру данных
      console.log("API DASHBOARD DATA:", data);

      // Проверяем наличие необходимых полей
      if (!data.current_period || !data.previous_period) {
        console.error("API response does not have required structure:", data);

        // Если в полученных данных нет нужных полей, показываем предупреждение
        // но все равно используем данные, т.к. в getDashboardData уже есть fallback
        toast({
          title: "Некорректный формат данных",
          description:
            "Получены данные в неправильном формате. Используем заглушку.",
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
      }

      // Используем данные из ответа API
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Ошибка загрузки данных",
        description: "Не удалось загрузить данные дашборда",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const rules = await dashboardApi.getTrendRules();
      setRules(Array.isArray(rules) ? rules : []);
    } catch (error) {
      console.error("Error fetching rules:", error);
      toast({
        title: "Ошибка загрузки правил",
        description: "Не удалось загрузить правила трендов",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setRules([]);
    }
  };

  // Адаптер для преобразования типов FeedbackTrendAlert в формат, ожидаемый компонентом FeedbackAlertsList
  const adaptAlertsToComponentFormat = (alerts: FeedbackTrendAlert[]) => {
    return alerts.map((alert) => ({
      id: alert.id,
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      created_at: alert.created_at,
      is_resolved: alert.is_resolved,
      rule_type: alert.rule?.rule_type || "unknown", // Добавляем rule_type, которого не хватает
      percentage_change: alert.percentage_change,
      template_name: alert.template?.name,
      department_name: alert.department?.name,
    }));
  };

  const fetchAlerts = async () => {
    try {
      const alerts = await dashboardApi.getTrendAlerts();
      // Проверяем, что alerts - это массив, иначе устанавливаем пустой массив
      setAlerts(Array.isArray(alerts) ? alerts : []);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast({
        title: "Ошибка загрузки алертов",
        description: "Не удалось загрузить алерты трендов",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      // В случае ошибки устанавливаем пустой массив
      setAlerts([]);
    }
  };

  const fetchTemplatesAndDepartments = async () => {
    try {
      // В реальном приложении нужно использовать API для получения шаблонов и департаментов
      // Здесь мы мокаем данные для примера
      setTemplates([
        { id: 1, name: "Онбординг новых сотрудников" },
        { id: 2, name: "Обучение в продукт-команде" },
        { id: 3, name: "Отзыв по завершению проекта" },
      ]);

      setDepartments([
        { id: 1, name: "IT-отдел" },
        { id: 2, name: "Отдел продаж" },
        { id: 3, name: "Маркетинг" },
        { id: 4, name: "HR" },
      ]);
    } catch (error) {
      console.error("Error fetching templates and departments:", error);
    }
  };

  const handleRefreshData = async () => {
    await fetchDashboardData();
    await fetchAlerts();

    toast({
      title: "Данные обновлены",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleGenerateSnapshots = async () => {
    setIsGeneratingSnapshots(true);
    try {
      const result = await dashboardApi.generateTrendSnapshots();

      if (result && result.success) {
        toast({
          title: "Снимки трендов созданы",
          description: result.message || "Снимки трендов успешно созданы",
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        // Обновляем данные после создания снимков
        await fetchDashboardData();
      } else {
        toast({
          title: "Ошибка создания снимков",
          description: "Не удалось создать снимки трендов",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error generating snapshots:", error);
      toast({
        title: "Ошибка создания снимков",
        description: "Не удалось создать снимки трендов",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGeneratingSnapshots(false);
    }
  };

  const handleCheckAllRules = async () => {
    setIsCheckingRules(true);
    try {
      const result = await dashboardApi.checkAllTrendRules();

      toast({
        title: "Правила проверены",
        description:
          result && result.message
            ? result.message
            : "Правила успешно проверены",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Обновляем алерты после проверки правил
      await fetchAlerts();
    } catch (error) {
      console.error("Error checking rules:", error);
      toast({
        title: "Ошибка проверки правил",
        description: "Не удалось проверить правила трендов",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsCheckingRules(false);
    }
  };

  const handleSubmitRule = async (formData: RuleFormData) => {
    try {
      if (formData.id) {
        // Обновление существующего правила
        await dashboardApi.updateTrendRule(formData.id, formData);
        toast({
          title: "Правило обновлено",
          description: "Правило тренда успешно обновлено",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Создание нового правила
        await dashboardApi.createTrendRule(formData);
        toast({
          title: "Правило создано",
          description: "Новое правило тренда успешно создано",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }

      // Закрываем форму и обновляем список правил
      onRuleFormClose();
      setRuleToEdit(null);
      await fetchRules();
    } catch (error) {
      console.error("Error submitting rule:", error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить правило тренда",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleToggleRuleActive = async (ruleId: number, isActive: boolean) => {
    try {
      const ruleToUpdate = rules.find((rule) => rule.id === ruleId);
      if (!ruleToUpdate) return;

      await dashboardApi.updateTrendRule(ruleId, {
        ...ruleToUpdate,
        is_active: isActive,
        templates: ruleToUpdate.templates?.map((t) => t.id) || [],
        departments: ruleToUpdate.departments?.map((d) => d.id) || [],
      });

      // Обновляем список правил
      await fetchRules();
    } catch (error) {
      console.error("Error toggling rule active state:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус правила",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEditRule = (ruleId: number) => {
    const ruleToEdit = rules.find((rule) => rule.id === ruleId);
    if (ruleToEdit) {
      setRuleToEdit(ruleToEdit);
      onRuleFormOpen();
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      await dashboardApi.deleteTrendRule(ruleId);

      toast({
        title: "Правило удалено",
        description: "Правило тренда успешно удалено",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Обновляем список правил
      await fetchRules();
    } catch (error) {
      console.error("Error deleting rule:", error);
      toast({
        title: "Ошибка удаления",
        description: "Не удалось удалить правило тренда",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleResolveAlert = async (alertId: number, comment: string) => {
    try {
      await dashboardApi.resolveTrendAlert(alertId, {
        resolution_comment: comment,
      });

      toast({
        title: "Алерт закрыт",
        description: "Алерт тренда успешно закрыт",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      // Обновляем список алертов
      await fetchAlerts();
    } catch (error) {
      console.error("Error resolving alert:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось закрыть алерт тренда",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAddRule = () => {
    setRuleToEdit(null);
    onRuleFormOpen();
  };

  return (
    <Container maxW="container.xl" py={6}>
      <PageHeader
        title="Smart Feedback Dashboard"
        subtitle="Мониторинг и анализ трендов обратной связи от сотрудников"
      />

      <Flex justify="space-between" mb={6} flexWrap="wrap" gap={4}>
        <HStack spacing={4}>
          <Select
            placeholder="Все шаблоны"
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            w="200px"
          >
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>

          <Select
            placeholder="Все департаменты"
            value={selectedDepartmentId}
            onChange={(e) => setSelectedDepartmentId(e.target.value)}
            w="200px"
          >
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </Select>

          <Select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            w="150px"
          >
            <option value="7">7 дней</option>
            <option value="30">30 дней</option>
            <option value="90">90 дней</option>
          </Select>
        </HStack>

        <HStack spacing={4}>
          <Button
            leftIcon={<FiRefreshCw />}
            onClick={handleRefreshData}
            isLoading={isLoading}
          >
            Обновить данные
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleGenerateSnapshots}
            isLoading={isGeneratingSnapshots}
          >
            Создать снимок трендов
          </Button>
        </HStack>
      </Flex>

      {/* Карточки с ключевыми метриками */}
      {dashboardData && (
        <DashboardMetricsCard
          metrics={{
            sentiment: dashboardData.current_period.average_sentiment,
            previousSentiment: dashboardData.previous_period.average_sentiment,
            satisfaction: dashboardData.current_period.average_satisfaction,
            previousSatisfaction:
              dashboardData.previous_period.average_satisfaction,
            responseCount: dashboardData.current_period.total_responses,
            previousResponseCount:
              dashboardData.previous_period.total_responses,
            responseRate: dashboardData.current_period.response_rate,
            previousResponseRate: dashboardData.previous_period.response_rate,
          }}
        />
      )}

      {/* Основные вкладки дашборда */}
      <Tabs
        isLazy
        variant="enclosed"
        colorScheme="blue"
        index={tabIndex}
        onChange={setTabIndex}
      >
        <TabList mb="1em">
          <Tab>Тренды</Tab>
          <Tab>
            Алерты{" "}
            {alerts.filter((a) => !a.is_resolved).length > 0 &&
              `(${alerts.filter((a) => !a.is_resolved).length})`}
          </Tab>
          <Tab>Правила</Tab>
        </TabList>

        <TabPanels>
          {/* Вкладка трендов */}
          <TabPanel px={0}>
            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} mb={6}>
              <TrendChart
                title="Тренд настроения"
                data={dashboardData?.trends.sentiment_scores || []}
                isLoading={isLoading}
                color="green.500"
                valueFormatter={(value) => `${(value * 10).toFixed(1)}/10`}
              />
              <TrendChart
                title="Индекс удовлетворенности"
                data={dashboardData?.trends.satisfaction_indices || []}
                isLoading={isLoading}
                color="blue.500"
                valueFormatter={(value) => `${value.toFixed(1)}%`}
              />
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
              <TopicsIssuesChart
                title="Основные темы в отзывах"
                data={dashboardData?.topics || []}
                isLoading={isLoading}
                colors={["#3182CE", "#63B3ED", "#90CDF4", "#BEE3F8", "#4299E1"]}
              />
              <TopicsIssuesChart
                title="Выявленные проблемы"
                data={dashboardData?.issues || []}
                isLoading={isLoading}
                colors={["#E53E3E", "#F56565", "#FC8181", "#FEB2B2", "#C53030"]}
              />
            </SimpleGrid>
          </TabPanel>

          {/* Вкладка алертов */}
          <TabPanel px={0}>
            <FeedbackAlertsList
              alerts={adaptAlertsToComponentFormat(alerts)}
              isLoading={isLoading}
              onResolveAlert={handleResolveAlert}
            />
          </TabPanel>

          {/* Вкладка правил */}
          <TabPanel px={0}>
            <FeedbackRuleList
              rules={rules}
              isLoading={isLoading}
              onAddRule={handleAddRule}
              onEditRule={handleEditRule}
              onDeleteRule={handleDeleteRule}
              onToggleActive={handleToggleRuleActive}
              onCheckAllRules={handleCheckAllRules}
              isCheckingRules={isCheckingRules}
            />
          </TabPanel>
        </TabPanels>
      </Tabs>

      {/* Боковая панель с формой правила */}
      <Drawer
        isOpen={isRuleFormOpen}
        placement="right"
        onClose={() => {
          onRuleFormClose();
          setRuleToEdit(null);
        }}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            {ruleToEdit ? "Редактирование правила" : "Новое правило"}
          </DrawerHeader>
          <DrawerBody>
            <FeedbackRuleForm
              rule={ruleToEdit || undefined}
              templates={templates}
              departments={departments}
              onSubmit={handleSubmitRule}
              onCancel={() => {
                onRuleFormClose();
                setRuleToEdit(null);
              }}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Container>
  );
};

export default FeedbackDashboardPage;
