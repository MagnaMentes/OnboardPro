import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Flex,
  Button,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Avatar,
  Badge,
  Spinner,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { FeedbackAnswerCard } from "../../components/feedback/FeedbackAnswerCard";
import { FeedbackAIInsightsPanel } from "../../components/feedback/FeedbackAIInsightsPanel";
import {
  UserFeedback,
  FeedbackAnswer,
  FeedbackInsight,
} from "../../types/feedback";
import axios from "axios";

// Моковые данные для демонстрации
const mockUserFeedbacks: UserFeedback[] = [
  {
    id: 1,
    template_id: 1,
    template: {
      id: 1,
      title: "Оценка прохождения онбординга",
      description: "Форма для оценки качества процесса онбординга",
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
];

const mockAnswers: FeedbackAnswer[] = [
  {
    id: 1,
    feedback_id: 1,
    question_id: 101,
    question_text: "Оцените качество материалов онбординга от 1 до 10",
    question_type: "scale",
    scale_answer: 8,
  },
  {
    id: 2,
    feedback_id: 1,
    question_id: 102,
    question_text: "Что вам больше всего понравилось в процессе онбординга?",
    question_type: "text",
    text_answer:
      "Понравилась дружелюбная атмосфера и подробные материалы. Наставник всегда помогал с вопросами и давал понятные объяснения. Было очень комфортно влиться в команду.",
  },
  {
    id: 3,
    feedback_id: 1,
    question_id: 103,
    question_text: "Что можно улучшить в процессе онбординга?",
    question_type: "text",
    text_answer:
      "Хотелось бы получить более структурированную документацию по настройке рабочего окружения. Некоторые инструкции были не очень понятными.",
  },
  {
    id: 4,
    feedback_id: 1,
    question_id: 104,
    question_text: "Какие навыки вы приобрели за время онбординга?",
    question_type: "multiple_choice",
    choice_answer: [
      "Технические навыки",
      "Коммуникационные навыки",
      "Понимание продукта",
    ],
  },
];

const mockInsights: FeedbackInsight[] = [
  {
    id: 1,
    feedback_id: 1,
    type: "summary",
    content:
      "Сотрудник в целом положительно оценивает процесс онбординга. Особенно отмечает дружелюбную атмосферу и помощь наставника. Однако есть замечания по документации для настройки рабочего окружения.",
    confidence_score: 0.91,
    created_at: "2025-05-21T08:30:00Z",
  },
  {
    id: 2,
    feedback_id: 1,
    type: "problem_area",
    content:
      "Выявлена проблемная область: документация по настройке рабочего окружения. Рекомендуется пересмотреть и упростить инструкции.",
    confidence_score: 0.83,
    created_at: "2025-05-21T08:31:00Z",
  },
  {
    id: 3,
    feedback_id: 1,
    type: "satisfaction",
    content:
      "Общий индекс удовлетворенности: 8/10. Сотрудник успешно освоил основные аспекты онбординга и приобрел необходимые навыки.",
    confidence_score: 0.89,
    created_at: "2025-05-21T08:32:00Z",
  },
];

const FeedbackUserDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [userFeedbacks, setUserFeedbacks] = useState<UserFeedback[]>([]);
  const [currentFeedback, setCurrentFeedback] = useState<UserFeedback | null>(
    null
  );
  const [answers, setAnswers] = useState<FeedbackAnswer[]>([]);
  const [insights, setInsights] = useState<FeedbackInsight[]>([]);

  // В реальном приложении здесь будет загрузка данных пользователя
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);

        // Раскомментировать для реальной реализации
        // const feedbacksResponse = await axios.get(`/api/feedback/user/${userId}/results/`);
        // setUserFeedbacks(feedbacksResponse.data);

        // Для демонстрации используем моковые данные
        setTimeout(() => {
          // Фильтрация данных по id пользователя
          const userIdNum = parseInt(userId);
          const filteredFeedbacks = mockUserFeedbacks.filter(
            (feedback) => feedback.user_id === userIdNum
          );

          setUserFeedbacks(filteredFeedbacks);

          if (filteredFeedbacks.length > 0) {
            setCurrentFeedback(filteredFeedbacks[0]);
            setAnswers(
              mockAnswers.filter(
                (a) => a.feedback_id === filteredFeedbacks[0].id
              )
            );
            setInsights(
              mockInsights.filter(
                (i) => i.feedback_id === filteredFeedbacks[0].id
              )
            );
          }

          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error("Ошибка при загрузке данных пользователя:", error);
        toast({
          title: "Ошибка загрузки",
          description:
            "Не удалось загрузить данные обратной связи пользователя",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, toast]);

  // Обработчик возврата к списку
  const handleBackToList = () => {
    navigate("/admin/feedback/results");
  };

  // Если данные отсутствуют
  if (!isLoading && (!currentFeedback || userFeedbacks.length === 0)) {
    return (
      <Container maxW="container.xl" py={6}>
        <Button
          leftIcon={<FiArrowLeft />}
          variant="outline"
          mb={6}
          onClick={handleBackToList}
        >
          Вернуться к списку
        </Button>
        <Box textAlign="center" py={10}>
          <Heading as="h3" size="md" mb={4}>
            Данные не найдены
          </Heading>
          <Text>
            Для данного пользователя не найдено записей обратной связи или
            пользователь не существует.
          </Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={6}>
      <Button
        leftIcon={<FiArrowLeft />}
        variant="outline"
        mb={6}
        onClick={handleBackToList}
      >
        Вернуться к списку
      </Button>

      {isLoading ? (
        <Flex justify="center" align="center" height="300px">
          <VStack spacing={4}>
            <Spinner size="xl" color="blue.500" />
            <Text>Загрузка данных пользователя...</Text>
          </VStack>
        </Flex>
      ) : currentFeedback ? (
        <>
          {/* Информация о пользователе */}
          <Card mb={6}>
            <CardBody>
              <Grid templateColumns={{ base: "1fr", md: "150px 1fr" }} gap={6}>
                <GridItem>
                  <Avatar
                    size="xl"
                    name={`${currentFeedback.user.first_name} ${currentFeedback.user.last_name}`}
                  />
                </GridItem>
                <GridItem>
                  <Heading as="h2" size="lg" mb={2}>
                    {currentFeedback.user.first_name}{" "}
                    {currentFeedback.user.last_name}
                  </Heading>
                  <HStack spacing={4} mb={4}>
                    <Flex align="center">
                      <FiMail size="14px" />
                      <Text ml={2} fontSize="sm">
                        {currentFeedback.user.email}
                      </Text>
                    </Flex>
                    <Flex align="center">
                      <FiCalendar size="14px" />
                      <Text ml={2} fontSize="sm">
                        Отзыв от{" "}
                        {new Date(
                          currentFeedback.created_at
                        ).toLocaleDateString("ru-RU")}
                      </Text>
                    </Flex>
                  </HStack>

                  <VStack align="start" spacing={2}>
                    <Text>
                      <strong>Шаблон обратной связи:</strong>{" "}
                      {currentFeedback.template.title}
                    </Text>
                    {currentFeedback.onboarding_step_name && (
                      <Text>
                        <strong>Этап онбординга:</strong>{" "}
                        {currentFeedback.onboarding_step_name}
                      </Text>
                    )}
                    {currentFeedback.submitter_name && (
                      <Text>
                        <strong>Отправитель отзыва:</strong>{" "}
                        {currentFeedback.submitter_name}
                      </Text>
                    )}
                  </VStack>
                </GridItem>
              </Grid>
            </CardBody>
          </Card>

          {/* Основной контент */}
          <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={6}>
            {/* Левая колонка - ответы на вопросы */}
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">Ответы на вопросы</Heading>
                </CardHeader>
                <CardBody>
                  <VStack spacing={5} align="stretch">
                    {answers.map((answer) => (
                      <FeedbackAnswerCard key={answer.id} answer={answer} />
                    ))}
                  </VStack>
                </CardBody>
              </Card>
            </GridItem>

            {/* Правая колонка - AI-аналитика */}
            <GridItem>
              <Card>
                <CardHeader>
                  <Heading size="md">AI-аналитика</Heading>
                </CardHeader>
                <CardBody>
                  <FeedbackAIInsightsPanel insights={insights} />
                </CardBody>
              </Card>
            </GridItem>
          </Grid>
        </>
      ) : null}
    </Container>
  );
};

export default FeedbackUserDetailPage;
