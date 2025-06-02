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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Textarea,
  useDisclosure,
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
  FiExternalLink,
} from "react-icons/fi";
import {
  AIRecommendationsService,
  SmartInsightsService,
} from "@/services/aiInsights";
import {
  AIRecommendationDetail,
  RecommendationPriority,
  RecommendationStatus,
  InsightTag,
  SmartInsightMinimal,
} from "@/types/aiInsights";

export const RecommendationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [recommendation, setRecommendation] =
    useState<AIRecommendationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const {
    isOpen: isAcceptOpen,
    onOpen: onAcceptOpen,
    onClose: onAcceptClose,
  } = useDisclosure();
  const {
    isOpen: isRejectOpen,
    onOpen: onRejectOpen,
    onClose: onRejectClose,
  } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();

  // Загрузка детальной информации о рекомендации
  useEffect(() => {
    const fetchRecommendation = async () => {
      try {
        setLoading(true);
        if (id) {
          const data = await AIRecommendationsService.getRecommendationById(
            parseInt(id)
          );
          setRecommendation(data);
        }
      } catch (error) {
        console.error("Error fetching recommendation details:", error);
        toast({
          title: "Ошибка загрузки",
          description: "Не удалось загрузить детали рекомендации",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendation();
  }, [id, toast]);

  // Форматирование даты
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: ru });
  };

  // Получение цвета для приоритета
  const getPriorityColor = (priority: RecommendationPriority) => {
    switch (priority) {
      case RecommendationPriority.HIGH:
        return "red";
      case RecommendationPriority.MEDIUM:
        return "orange";
      default:
        return "blue";
    }
  };

  // Получение цвета для статуса
  const getStatusColor = (status: RecommendationStatus) => {
    switch (status) {
      case RecommendationStatus.ACCEPTED:
        return "green";
      case RecommendationStatus.REJECTED:
        return "red";
      case RecommendationStatus.EXPIRED:
        return "gray";
      default:
        return "blue";
    }
  };

  // Обработчики действий с рекомендацией
  const handleAccept = async () => {
    if (!recommendation) return;

    try {
      await AIRecommendationsService.acceptRecommendation(recommendation.id, {
        reason,
      });

      // Обновляем состояние локально
      setRecommendation({
        ...recommendation,
        status: RecommendationStatus.ACCEPTED,
        status_display: "Accepted",
        accepted_reason: reason,
        resolved_at: new Date().toISOString(),
      });

      toast({
        title: "Рекомендация принята",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setReason("");
      onAcceptClose();
    } catch (error) {
      console.error("Error accepting recommendation:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось принять рекомендацию",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleReject = async () => {
    if (!recommendation) return;

    try {
      await AIRecommendationsService.rejectRecommendation(recommendation.id, {
        reason,
      });

      // Обновляем состояние локально
      setRecommendation({
        ...recommendation,
        status: RecommendationStatus.REJECTED,
        status_display: "Rejected",
        rejected_reason: reason,
        resolved_at: new Date().toISOString(),
      });

      toast({
        title: "Рекомендация отклонена",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setReason("");
      onRejectClose();
    } catch (error) {
      console.error("Error rejecting recommendation:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось отклонить рекомендацию",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Переход к инсайту
  const navigateToInsight = (insightId: number) => {
    navigate(`/admin/insights/${insightId}`);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" height="400px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (!recommendation) {
    return (
      <Box textAlign="center" p={8}>
        <Heading size="lg">Рекомендация не найдена</Heading>
        <Button
          as={Link}
          to="/admin/recommendations"
          mt={4}
          leftIcon={<FiArrowLeft />}
        >
          Вернуться к списку
        </Button>
      </Box>
    );
  }

  return (
    <>
      <VStack spacing={6} align="stretch">
        {/* Заголовок и навигация */}
        <Box>
          <Button
            as={Link}
            to="/admin/recommendations"
            variant="link"
            leftIcon={<FiArrowLeft />}
            mb={2}
          >
            Назад к списку
          </Button>
          <Heading size="lg">{recommendation.title}</Heading>
        </Box>

        {/* Основная информация и действия */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Card variant="outline" gridColumn={{ md: "span 2" }}>
            <CardHeader pb={0}>
              <Heading size="md">Информация о рекомендации</Heading>
            </CardHeader>
            <CardBody>
              <Text mb={4}>{recommendation.recommendation_text}</Text>

              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} mb={4}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" mb={1}>
                    Статус:
                  </Text>
                  <Badge colorScheme={getStatusColor(recommendation.status)}>
                    {recommendation.status_display}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="sm" mb={1}>
                    Приоритет:
                  </Text>
                  <Badge
                    colorScheme={getPriorityColor(recommendation.priority)}
                  >
                    {recommendation.priority_display}
                  </Badge>
                </Box>

                <Box>
                  <Text fontWeight="bold" fontSize="sm" mb={1}>
                    Тип:
                  </Text>
                  <Badge>{recommendation.recommendation_type_display}</Badge>
                </Box>
              </SimpleGrid>

              {/* Причина и влияние */}
              <SimpleGrid columns={{ base: 1, sm: 1 }} spacing={4} mb={4}>
                {recommendation.reason && (
                  <Box bg="gray.50" p={3} borderRadius="md">
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Причина:
                    </Text>
                    <Text fontSize="sm">{recommendation.reason}</Text>
                  </Box>
                )}

                {recommendation.impact_description && (
                  <Box bg="blue.50" p={3} borderRadius="md">
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Ожидаемый эффект:
                    </Text>
                    <Text fontSize="sm">
                      {recommendation.impact_description}
                    </Text>
                  </Box>
                )}
              </SimpleGrid>

              {/* Принятие/отклонение */}
              {recommendation.status === RecommendationStatus.ACCEPTED &&
                recommendation.accepted_reason && (
                  <Box bg="green.50" p={3} borderRadius="md" mb={4}>
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Причина принятия:
                    </Text>
                    <Text fontSize="sm">{recommendation.accepted_reason}</Text>
                    {recommendation.processed_by_name && (
                      <Text fontSize="xs" mt={1} color="gray.600">
                        Принята пользователем:{" "}
                        {recommendation.processed_by_name}
                      </Text>
                    )}
                  </Box>
                )}

              {recommendation.status === RecommendationStatus.REJECTED &&
                recommendation.rejected_reason && (
                  <Box bg="red.50" p={3} borderRadius="md" mb={4}>
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Причина отклонения:
                    </Text>
                    <Text fontSize="sm">{recommendation.rejected_reason}</Text>
                    {recommendation.processed_by_name && (
                      <Text fontSize="xs" mt={1} color="gray.600">
                        Отклонена пользователем:{" "}
                        {recommendation.processed_by_name}
                      </Text>
                    )}
                  </Box>
                )}

              {/* Теги */}
              {recommendation.tags && recommendation.tags.length > 0 && (
                <Box mb={4}>
                  <Text fontWeight="bold" fontSize="sm" mb={2}>
                    Теги:
                  </Text>
                  <HStack spacing={2} flexWrap="wrap">
                    {recommendation.tags.map((tag) => (
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
                    Создана:
                  </Text>
                  <HStack>
                    <Icon as={FiClock} />
                    <Text fontSize="sm">
                      {formatDate(recommendation.generated_at)}
                    </Text>
                  </HStack>
                </Box>

                {recommendation.expires_at && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Срок действия до:
                    </Text>
                    <HStack>
                      <Icon as={FiClock} />
                      <Text fontSize="sm">
                        {formatDate(recommendation.expires_at)}
                      </Text>
                    </HStack>
                  </Box>
                )}

                {recommendation.resolved_at && (
                  <Box>
                    <Text fontWeight="bold" fontSize="sm" mb={1}>
                      Обработана:
                    </Text>
                    <HStack>
                      <Icon as={FiClock} />
                      <Text fontSize="sm">
                        {formatDate(recommendation.resolved_at)}
                      </Text>
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
                  {recommendation.status === RecommendationStatus.ACTIVE && (
                    <>
                      <Button
                        leftIcon={<FiCheckCircle />}
                        colorScheme="green"
                        onClick={onAcceptOpen}
                        size="sm"
                        width="full"
                      >
                        Принять
                      </Button>

                      <Button
                        leftIcon={<FiXCircle />}
                        colorScheme="red"
                        variant="outline"
                        onClick={onRejectOpen}
                        size="sm"
                        width="full"
                      >
                        Отклонить
                      </Button>
                    </>
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
                  {recommendation.user && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" mb={1}>
                        Пользователь:
                      </Text>
                      <Link to={`/admin/users/${recommendation.user.id}`}>
                        <Text
                          color="blue.500"
                          _hover={{ textDecoration: "underline" }}
                        >
                          {recommendation.user_full_name ||
                            `${recommendation.user.first_name} ${recommendation.user.last_name}`.trim() ||
                            recommendation.user.email}
                        </Text>
                      </Link>
                    </Box>
                  )}

                  {recommendation.program_name && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" mb={1}>
                        Программа:
                      </Text>
                      <Text>{recommendation.program_name}</Text>
                    </Box>
                  )}

                  {recommendation.step_name && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" mb={1}>
                        Шаг:
                      </Text>
                      <Text>{recommendation.step_name}</Text>
                    </Box>
                  )}

                  {recommendation.insight_detail && (
                    <Box>
                      <Text fontWeight="bold" fontSize="sm" mb={1}>
                        Связанный инсайт:
                      </Text>
                      <Button
                        variant="link"
                        color="blue.500"
                        leftIcon={<FiExternalLink />}
                        onClick={() =>
                          navigateToInsight(recommendation.insight_detail.id)
                        }
                        size="sm"
                      >
                        {recommendation.insight_detail.title}
                      </Button>
                      <Badge
                        ml={2}
                        colorScheme={
                          recommendation.insight_detail.level === "critical"
                            ? "red"
                            : recommendation.insight_detail.level === "high"
                            ? "orange"
                            : recommendation.insight_detail.level === "medium"
                            ? "yellow"
                            : "blue"
                        }
                      >
                        {recommendation.insight_detail.level_display}
                      </Badge>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </SimpleGrid>
      </VStack>

      {/* Модальное окно для принятия рекомендации */}
      <Modal isOpen={isAcceptOpen} onClose={onAcceptClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Принять рекомендацию</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>{recommendation.recommendation_text}</Text>
            <FormControl>
              <FormLabel>Комментарий (необязательно)</FormLabel>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Опишите, почему вы принимаете эту рекомендацию или какие действия будут предприняты..."
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="green" mr={3} onClick={handleAccept}>
              Принять
            </Button>
            <Button onClick={onAcceptClose}>Отмена</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Модальное окно для отклонения рекомендации */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Отклонить рекомендацию</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text mb={4}>{recommendation.recommendation_text}</Text>
            <FormControl>
              <FormLabel>Причина отклонения (необязательно)</FormLabel>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Опишите, почему вы отклоняете эту рекомендацию..."
              />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={handleReject}>
              Отклонить
            </Button>
            <Button onClick={onRejectClose}>Отмена</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
