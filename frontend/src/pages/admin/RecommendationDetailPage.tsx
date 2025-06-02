import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Spinner,
  useColorModeValue,
  Alert,
  AlertIcon,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  ButtonGroup,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { ChevronRightIcon, ArrowBackIcon } from "@chakra-ui/icons";
import { RecommendationDetail } from "@/components/AIInsights/RecommendationDetail";
import {
  AIRecommendationDetail,
  RecommendationStatus,
} from "@/types/aiInsights";
import { AIRecommendationsService } from "@/services/aiInsights";

const RecommendationDetailPage = () => {
  const { recommendationId } = useParams<{ recommendationId: string }>();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] =
    useState<AIRecommendationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(
    null
  );
  const [actionReason, setActionReason] = useState("");

  useEffect(() => {
    if (recommendationId) {
      fetchRecommendation(parseInt(recommendationId, 10));
    }
  }, [recommendationId]);

  const fetchRecommendation = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await AIRecommendationsService.getRecommendationById(id);
      setRecommendation(data);
    } catch (error) {
      console.error("Error fetching recommendation:", error);
      setError("Не удалось загрузить данные рекомендации");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!recommendation || !actionType) return;

    setIsUpdating(true);
    try {
      const data = { reason: actionReason };

      if (actionType === "accept") {
        await AIRecommendationsService.acceptRecommendation(
          recommendation.id,
          data
        );
      } else {
        await AIRecommendationsService.rejectRecommendation(
          recommendation.id,
          data
        );
      }

      fetchRecommendation(recommendation.id);
      onClose();
      setActionReason("");
    } catch (error) {
      console.error("Error updating recommendation status:", error);
      setError("Ошибка при изменении статуса рекомендации");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionClick = (action: "accept" | "reject") => {
    setActionType(action);
    onOpen();
  };

  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  if (error || !recommendation) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error || "Рекомендация не найдена"}
      </Alert>
    );
  }

  return (
    <Box p={4}>
      <VStack spacing={6} align="stretch">
        {/* Навигация и заголовок */}
        <HStack justifyContent="space-between">
          <VStack align="flex-start">
            <Breadcrumb
              separator={<ChevronRightIcon color="gray.500" />}
              fontSize="sm"
            >
              <BreadcrumbItem>
                <BreadcrumbLink onClick={goBack}>
                  Все рекомендации
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>Детали рекомендации</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
            <Heading size="lg">{recommendation.title}</Heading>
          </VStack>
          <ButtonGroup>
            <Button
              leftIcon={<ArrowBackIcon />}
              variant="outline"
              onClick={goBack}
            >
              Назад
            </Button>
          </ButtonGroup>
        </HStack>

        {/* Карточка с деталями рекомендации */}
        <Box
          bg={bgColor}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          <RecommendationDetail recommendation={recommendation} />
        </Box>

        {/* Действия в зависимости от статуса */}
        {recommendation.status === RecommendationStatus.ACTIVE && (
          <Card bg={bgColor} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Действия</Heading>
            </CardHeader>
            <CardBody>
              <HStack spacing={4}>
                <Button
                  colorScheme="green"
                  onClick={() => handleActionClick("accept")}
                  isLoading={isUpdating}
                >
                  Принять рекомендацию
                </Button>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleActionClick("reject")}
                  isLoading={isUpdating}
                >
                  Отклонить рекомендацию
                </Button>
              </HStack>
            </CardBody>
          </Card>
        )}

        {/* Информация о статусе */}
        {recommendation.status !== RecommendationStatus.ACTIVE && (
          <Card bg={bgColor} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Статус рекомендации</Heading>
            </CardHeader>
            <CardBody>
              <Alert
                status={
                  recommendation.status === RecommendationStatus.ACCEPTED
                    ? "success"
                    : "info"
                }
                variant="subtle"
                borderRadius="md"
              >
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">
                    {recommendation.status === RecommendationStatus.ACCEPTED &&
                      "Рекомендация принята"}
                    {recommendation.status === RecommendationStatus.REJECTED &&
                      "Рекомендация отклонена"}
                    {recommendation.status === RecommendationStatus.EXPIRED &&
                      "Срок действия рекомендации истек"}
                  </Text>
                  {recommendation.status === RecommendationStatus.ACCEPTED &&
                    recommendation.accepted_reason && (
                      <Text mt={2}>
                        Причина: {recommendation.accepted_reason}
                      </Text>
                    )}
                  {recommendation.status === RecommendationStatus.REJECTED &&
                    recommendation.rejected_reason && (
                      <Text mt={2}>
                        Причина: {recommendation.rejected_reason}
                      </Text>
                    )}
                  {recommendation.processed_by_name && (
                    <Text mt={1} fontSize="sm">
                      Обработано: {recommendation.processed_by_name}
                    </Text>
                  )}
                </Box>
              </Alert>
            </CardBody>
          </Card>
        )}

        {/* Связанный инсайт */}
        {recommendation.insight_detail && (
          <Card bg={bgColor} borderColor={borderColor}>
            <CardHeader>
              <Heading size="md">Связанный инсайт</Heading>
            </CardHeader>
            <CardBody>
              <Box
                p={4}
                borderWidth="1px"
                borderRadius="md"
                borderColor={borderColor}
              >
                <Flex justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold">
                    {recommendation.insight_detail.title}
                  </Text>
                  <Badge
                    colorScheme={
                      recommendation.insight_detail.level === "critical"
                        ? "red"
                        : recommendation.insight_detail.level === "high"
                        ? "orange"
                        : recommendation.insight_detail.level === "medium"
                        ? "yellow"
                        : "green"
                    }
                  >
                    {recommendation.insight_detail.level_display}
                  </Badge>
                </Flex>
                <Text mt={2} fontSize="sm" color="gray.500">
                  Источник: {recommendation.insight_detail.source}
                </Text>
                <Button
                  size="sm"
                  mt={3}
                  colorScheme="blue"
                  variant="outline"
                  onClick={() =>
                    navigate(
                      `/admin/ai/insights/${recommendation.insight_detail?.id}`
                    )
                  }
                >
                  Просмотреть инсайт
                </Button>
              </Box>
            </CardBody>
          </Card>
        )}
      </VStack>

      {/* Модальное окно для принятия/отклонения рекомендации */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === "accept"
              ? "Принятие рекомендации"
              : "Отклонение рекомендации"}
          </ModalHeader>
          <ModalBody>
            <Text mb={4}>
              {actionType === "accept"
                ? "Вы собираетесь принять эту рекомендацию. Пожалуйста, укажите причину или план действий."
                : "Вы собираетесь отклонить эту рекомендацию. Пожалуйста, укажите причину."}
            </Text>
            <FormControl>
              <FormLabel>
                {actionType === "accept"
                  ? "План действий"
                  : "Причина отклонения"}
              </FormLabel>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={
                  actionType === "accept"
                    ? "Опишите, какие действия будут предприняты..."
                    : "Укажите причину отклонения рекомендации..."
                }
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Отмена
            </Button>
            <Button
              colorScheme={actionType === "accept" ? "green" : "red"}
              onClick={handleAction}
              isLoading={isUpdating}
            >
              {actionType === "accept" ? "Принять" : "Отклонить"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default RecommendationDetailPage;
