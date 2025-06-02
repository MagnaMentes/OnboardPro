import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Button,
  Divider,
  Spinner,
  useToast,
  SimpleGrid,
  Flex,
  Tag,
  TagLeftIcon,
  TagLabel,
  Card,
  CardBody,
  CardHeader,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Icon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  FiTag,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiClock,
  FiInfo,
  FiPlay,
} from "react-icons/fi";
import { SmartInsightsService } from "@/services/aiInsights";
import {
  SmartInsightDetail,
  InsightStatus,
  InsightLevel,
  RecommendationMinimal,
} from "@/types/aiInsights";

const InsightDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [insight, setInsight] = useState<SmartInsightDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  // Загрузка детальной информации об инсайте
  useEffect(() => {
    const fetchInsight = async () => {
      try {
        setLoading(true);
        if (id) {
          const data = await SmartInsightsService.getInsightById(parseInt(id));
          setInsight(data);
        }
      } catch (error) {
        console.error("Error fetching insight details:", error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить детали инсайта",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, [id, toast]);

  // Форматирование даты
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: ru });
  };

  // Получение цвета для уровня важности
  const getLevelColor = (level: InsightLevel) => {
    switch (level) {
      case InsightLevel.CRITICAL:
        return "red";
      case InsightLevel.HIGH:
        return "orange";
      case InsightLevel.MEDIUM:
        return "yellow";
      case InsightLevel.LOW:
        return "blue";
      default:
        return "gray";
    }
  };

  // Получение цвета для статуса
  const getStatusColor = (status: InsightStatus) => {
    switch (status) {
      case InsightStatus.RESOLVED:
        return "green";
      case InsightStatus.DISMISSED:
        return "gray";
      case InsightStatus.ACKNOWLEDGED:
        return "blue";
      case InsightStatus.IN_PROGRESS:
        return "purple";
      default:
        return "orange";
    }
  };

  // Обработчики действий с инсайтом
  const handleResolve = async () => {
    if (!insight) return;

    try {
      await SmartInsightsService.resolveInsight(insight.id);

      // Обновляем состояние локально
      setInsight({
        ...insight,
        status: InsightStatus.RESOLVED,
        status_display: "Resolved",
        resolved_at: new Date().toISOString(),
      });

      toast({
        title: "Инсайт разрешен",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error resolving insight:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось разрешить инсайт",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleDismiss = async () => {
    if (!insight) return;

    try {
      await SmartInsightsService.dismissInsight(insight.id);

      // Обновляем состояние локально
      setInsight({
        ...insight,
        status: InsightStatus.DISMISSED,
        status_display: "Dismissed",
      });

      toast({
        title: "Инсайт отклонен",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error dismissing insight:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить инсайт",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAcknowledge = async () => {
    if (!insight) return;

    try {
      await SmartInsightsService.acknowledgeInsight(insight.id);

      // Обновляем состояние локально
      setInsight({
        ...insight,
        status: InsightStatus.ACKNOWLEDGED,
        status_display: "Acknowledged",
      });

      toast({
        title: "Инсайт подтвержден",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error acknowledging insight:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось подтвердить инсайт",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleMarkInProgress = async () => {
    if (!insight) return;

    try {
      await SmartInsightsService.markInsightInProgress(insight.id);

      // Обновляем состояние локально
      setInsight({
        ...insight,
        status: InsightStatus.IN_PROGRESS,
        status_display: "In Progress",
      });

      toast({
        title: 'Инсайт отмечен как "в работе"',
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error marking insight in progress:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось изменить статус инсайта",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Переход к рекомендации
  const navigateToRecommendation = (recommendationId: number) => {
    navigate(`/admin/recommendations/${recommendationId}`);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="400px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!insight) {
    return (
      <Box textAlign="center" p={8}>
        <Heading size="lg">Инсайт не найден</Heading>
        <Button
          as={Link}
          to="/admin/insights"
          mt={4}
          leftIcon={<FiArrowLeft />}
        >
          Вернуться к списку
        </Button>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Заголовок и навигация */}
      <Box>
        <Button
          as={Link}
          to="/admin/insights"
          variant="link"
          leftIcon={<FiArrowLeft />}
          mb={2}
        >
          Назад к списку
        </Button>
        <Heading size="lg">{insight.title}</Heading>
      </Box>

      {/* Основная информация и действия */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Card variant="outline" gridColumn={{ md: "span 2" }}>
          <CardHeader pb={0}>
            <Heading size="md">Информация об инсайте</Heading>
          </CardHeader>
          <CardBody>
            <Text mb={4}>{insight.description}</Text>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={4}>
              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={1}>
                  Статус:
                </Text>
                <Badge colorScheme={getStatusColor(insight.status)}>
                  {insight.status_display}
                </Badge>
              </Box>

              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={1}>
                  Уровень важности:
                </Text>
                <Badge colorScheme={getLevelColor(insight.level)}>
                  {insight.level_display}
                </Badge>
              </Box>

              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={1}>
                  Тип:
                </Text>
                <Badge>{insight.insight_type_display}</Badge>
              </Box>

              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={1}>
                  Источник:
                </Text>
                <Badge colorScheme="purple">{insight.source}</Badge>
                {insight.source_id && (
                  <Text fontSize="xs" color="gray.500">
                    ID: {insight.source_id}
                  </Text>
                )}
              </Box>
            </SimpleGrid>

            {/* Теги */}
            {insight.tags && insight.tags.length > 0 && (
              <Box mb={4}>
                <Text fontWeight="bold" fontSize="sm" mb={2}>
                  Теги:
                </Text>
                <HStack spacing={2} flexWrap="wrap">
                  {insight.tags.map((tag) => (
                    <Tag
                      key={tag.id}
                      colorScheme={tag.color}
                      borderRadius="full"
                      size="md"
                    >
                      <TagLeftIcon boxSize="12px" as={FiTag} />
                      <TagLabel>{tag.name}</TagLabel>
                    </Tag>
                  ))}
                </HStack>
              </Box>
            )}

            {/* Временные метки */}
            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={4}>
              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={1}>
                  Создан:
                </Text>
                <HStack>
                  <Icon as={FiClock} />
                  <Text fontSize="sm">{formatDate(insight.created_at)}</Text>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="bold" fontSize="sm" mb={1}>
                  Обновлен:
                </Text>
                <HStack>
                  <Icon as={FiClock} />
                  <Text fontSize="sm">{formatDate(insight.updated_at)}</Text>
                </HStack>
              </Box>

              {insight.resolved_at && (
                <Box>
                  <Text fontWeight="bold" fontSize="sm" mb={1}>
                    Разрешен:
                  </Text>
                  <HStack>
                    <Icon as={FiClock} />
                    <Text fontSize="sm">{formatDate(insight.resolved_at)}</Text>
                  </HStack>
                </Box>
              )}
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Связи и действия */}
        <VStack spacing={4} align="stretch">
          {/* Действия */}
          <Card variant="outline">
            <CardHeader pb={0}>
              <Heading size="md">Действия</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {insight.status !== InsightStatus.RESOLVED && (
                  <Button
                    leftIcon={<FiCheckCircle />}
                    colorScheme="green"
                    onClick={handleResolve}
                    size="sm"
                    width="full"
                  >
                    Разрешить
                  </Button>
                )}

                {insight.status !== InsightStatus.DISMISSED && (
                  <Button
                    leftIcon={<FiXCircle />}
                    colorScheme="red"
                    variant="outline"
                    onClick={handleDismiss}
                    size="sm"
                    width="full"
                  >
                    Отклонить
                  </Button>
                )}

                {insight.status !== InsightStatus.ACKNOWLEDGED && (
                  <Button
                    leftIcon={<FiInfo />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={handleAcknowledge}
                    size="sm"
                    width="full"
                  >
                    Подтвердить
                  </Button>
                )}

                {insight.status !== InsightStatus.IN_PROGRESS && (
                  <Button
                    leftIcon={<FiPlay />}
                    colorScheme="purple"
                    variant="outline"
                    onClick={handleMarkInProgress}
                    size="sm"
                    width="full"
                  >
                    В работу
                  </Button>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Связанные объекты */}
          <Card variant="outline">
            <CardHeader pb={0}>
              <Heading size="md">Связанная информация</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3} align="stretch">
                {insight.user && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Пользователь:
                    </Text>
                    <Link to={`/admin/users/${insight.user.id}`}>
                      <Text
                        color="blue.500"
                        _hover={{ textDecoration: "underline" }}
                      >
                        {insight.user_full_name ||
                          `${insight.user.first_name} ${insight.user.last_name}`.trim() ||
                          insight.user.email}
                      </Text>
                    </Link>
                  </Box>
                )}

                {insight.department_name && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Отдел:
                    </Text>
                    <Text>{insight.department_name}</Text>
                  </Box>
                )}

                {insight.program_name && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Программа:
                    </Text>
                    <Text>{insight.program_name}</Text>
                  </Box>
                )}

                {insight.step_name && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Шаг:
                    </Text>
                    <Text>{insight.step_name}</Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        </VStack>
      </SimpleGrid>

      {/* Дополнительная информация */}
      <Box>
        <Accordion allowToggle>
          {/* Метаданные */}
          {insight.metadata && Object.keys(insight.metadata).length > 0 && (
            <AccordionItem>
              <h2>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    <Heading size="sm">Метаданные</Heading>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel pb={4}>
                <pre
                  style={{
                    overflowX: "auto",
                    padding: "10px",
                    background: "#f5f5f5",
                    borderRadius: "4px",
                  }}
                >
                  {JSON.stringify(insight.metadata, null, 2)}
                </pre>
              </AccordionPanel>
            </AccordionItem>
          )}

          {/* Связанные рекомендации */}
          {insight.related_recommendations &&
            insight.related_recommendations.length > 0 && (
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <Heading size="sm">
                        Связанные рекомендации (
                        {insight.related_recommendations.length})
                      </Heading>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Название</Th>
                        <Th>Тип</Th>
                        <Th>Приоритет</Th>
                        <Th>Статус</Th>
                        <Th></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {insight.related_recommendations.map(
                        (rec: RecommendationMinimal) => (
                          <Tr key={rec.id}>
                            <Td>{rec.title}</Td>
                            <Td>{rec.recommendation_type}</Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  rec.priority === "high"
                                    ? "red"
                                    : rec.priority === "medium"
                                    ? "orange"
                                    : "blue"
                                }
                              >
                                {rec.priority}
                              </Badge>
                            </Td>
                            <Td>
                              <Badge
                                colorScheme={
                                  rec.status === "accepted"
                                    ? "green"
                                    : rec.status === "rejected"
                                    ? "red"
                                    : rec.status === "expired"
                                    ? "gray"
                                    : "blue"
                                }
                              >
                                {rec.status}
                              </Badge>
                            </Td>
                            <Td>
                              <Button
                                size="xs"
                                variant="link"
                                onClick={() => navigateToRecommendation(rec.id)}
                              >
                                Перейти
                              </Button>
                            </Td>
                          </Tr>
                        )
                      )}
                    </Tbody>
                  </Table>
                </AccordionPanel>
              </AccordionItem>
            )}
        </Accordion>
      </Box>
    </VStack>
  );
};

export default InsightDetail;
