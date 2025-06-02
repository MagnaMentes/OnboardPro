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
  Icon,
  Badge,
  Divider,
  Tag,
  TagLabel,
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
  SimpleGrid,
} from "@chakra-ui/react";
import { ChevronRightIcon, ArrowBackIcon } from "@chakra-ui/icons";
import InsightDetail from "@/components/AIInsights/InsightDetail";
import { SmartInsightDetail, InsightStatus } from "@/types/aiInsights";
import { SmartInsightsService } from "@/services/aiInsights";

const InsightDetailPage = () => {
  const { insightId } = useParams<{ insightId: string }>();
  const navigate = useNavigate();
  const [insight, setInsight] = useState<SmartInsightDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [actionType, setActionType] = useState<"resolve" | "dismiss" | null>(
    null
  );

  useEffect(() => {
    if (insightId) {
      fetchInsight(parseInt(insightId, 10));
    }
  }, [insightId]);

  const fetchInsight = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await SmartInsightsService.getInsightById(id);
      setInsight(data);
    } catch (error) {
      console.error("Error fetching insight:", error);
      setError("Не удалось загрузить данные инсайта");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    statusAction: "acknowledge" | "mark_in_progress" | "resolve" | "dismiss"
  ) => {
    if (!insight) return;

    setIsUpdating(true);
    try {
      let updatedInsight;

      switch (statusAction) {
        case "acknowledge":
          updatedInsight = await SmartInsightsService.acknowledgeInsight(
            insight.id
          );
          break;
        case "mark_in_progress":
          updatedInsight = await SmartInsightsService.markInsightInProgress(
            insight.id
          );
          break;
        case "resolve":
          updatedInsight = await SmartInsightsService.resolveInsight(
            insight.id
          );
          onClose();
          break;
        case "dismiss":
          updatedInsight = await SmartInsightsService.dismissInsight(
            insight.id
          );
          onClose();
          break;
      }

      fetchInsight(insight.id);
    } catch (error) {
      console.error("Error updating insight status:", error);
      setError("Ошибка при изменении статуса инсайта");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleActionClick = (action: "resolve" | "dismiss") => {
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

  if (error || !insight) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error || "Инсайт не найден"}
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
                <BreadcrumbLink onClick={goBack}>Все инсайты</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>Детали инсайта</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
            <Heading size="lg">{insight.title}</Heading>
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

        {/* Карточка с деталями инсайта */}
        <Box
          bg={bgColor}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          overflow="hidden"
        >
          <InsightDetail insight={insight} />
        </Box>

        {/* Действия в зависимости от статуса */}
        <Card bg={bgColor} borderColor={borderColor}>
          <CardHeader>
            <Heading size="md">Действия</Heading>
          </CardHeader>
          <CardBody>
            <HStack spacing={4}>
              {insight.status === InsightStatus.NEW && (
                <Button
                  colorScheme="blue"
                  onClick={() => handleStatusChange("acknowledge")}
                  isLoading={isUpdating}
                >
                  Принять к сведению
                </Button>
              )}

              {insight.status === InsightStatus.ACKNOWLEDGED && (
                <Button
                  colorScheme="purple"
                  onClick={() => handleStatusChange("mark_in_progress")}
                  isLoading={isUpdating}
                >
                  В работу
                </Button>
              )}

              {(insight.status === InsightStatus.NEW ||
                insight.status === InsightStatus.ACKNOWLEDGED ||
                insight.status === InsightStatus.IN_PROGRESS) && (
                <>
                  <Button
                    colorScheme="green"
                    onClick={() => handleActionClick("resolve")}
                    isLoading={isUpdating}
                  >
                    Решено
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleActionClick("dismiss")}
                    isLoading={isUpdating}
                  >
                    Отклонить
                  </Button>
                </>
              )}

              {(insight.status === InsightStatus.RESOLVED ||
                insight.status === InsightStatus.DISMISSED) && (
                <Text color="gray.500" fontStyle="italic">
                  Инсайт уже{" "}
                  {insight.status === InsightStatus.RESOLVED
                    ? "решен"
                    : "отклонен"}
                  .
                </Text>
              )}
            </HStack>
          </CardBody>
        </Card>

        {/* Связанные рекомендации */}
        {insight.related_recommendations &&
          insight.related_recommendations.length > 0 && (
            <Card bg={bgColor} borderColor={borderColor}>
              <CardHeader>
                <Heading size="md">Связанные рекомендации</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  {insight.related_recommendations.map((rec) => (
                    <Box
                      key={rec.id}
                      p={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor={borderColor}
                    >
                      <Flex justifyContent="space-between" alignItems="center">
                        <Text fontWeight="bold">{rec.title}</Text>
                        <Badge
                          colorScheme={
                            rec.priority === "high"
                              ? "red"
                              : rec.priority === "medium"
                              ? "yellow"
                              : "green"
                          }
                        >
                          {rec.priority}
                        </Badge>
                      </Flex>
                      <Text mt={2} fontSize="sm" color="gray.500">
                        Статус: {rec.status}
                      </Text>
                      <Button
                        size="sm"
                        mt={2}
                        colorScheme="blue"
                        variant="outline"
                        onClick={() =>
                          navigate(`/admin/ai/recommendations/${rec.id}`)
                        }
                      >
                        Просмотреть
                      </Button>
                    </Box>
                  ))}
                </SimpleGrid>
              </CardBody>
            </Card>
          )}
      </VStack>

      {/* Модальное окно подтверждения */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {actionType === "resolve"
              ? "Подтвердите решение инсайта"
              : "Подтвердите отклонение инсайта"}
          </ModalHeader>
          <ModalBody>
            <Text>
              {actionType === "resolve"
                ? "Вы уверены, что хотите отметить этот инсайт как решенный? Это действие не может быть отменено."
                : "Вы уверены, что хотите отклонить этот инсайт? Это действие не может быть отменено."}
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>
              Отмена
            </Button>
            <Button
              colorScheme={actionType === "resolve" ? "green" : "red"}
              onClick={() => handleStatusChange(actionType || "resolve")}
              isLoading={isUpdating}
            >
              Подтвердить
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default InsightDetailPage;
