import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Divider,
  VStack,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  SimpleGrid,
  Flex,
  Progress,
  HStack,
  Icon,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import StepCard from "../components/StepCard";
import GamificationBlock from "../components/gamification/GamificationBlock";
import { gamificationApi, UserLevel, UserReward } from "../api/gamificationApi";
import toast from "react-hot-toast";
import { AppLayout } from "../components/layout/AppLayout";
import { Button, Card } from "../components/common";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
} from "react-icons/fi";

// Моковые данные для демонстрации функционала
const mockStepsProgress = [
  {
    step_id: 1,
    name: "Знакомство с командой",
    description:
      "Познакомьтесь с вашей новой командой и руководителем. Обсудите рабочие процессы и культуру компании.",
    type: "meeting",
    order: 1,
    is_required: true,
    status: "done",
    completed_at: "2025-05-15T14:30:00Z",
  },
  {
    step_id: 2,
    name: "Настройка рабочего места",
    description:
      "Получите необходимое оборудование и настройте рабочее окружение. Установите все требуемые программы.",
    type: "task",
    order: 2,
    is_required: true,
    status: "in_progress",
    completed_at: null,
  },
  {
    step_id: 3,
    name: "Обучение по продукту",
    description:
      "Пройдите базовое обучение по нашим продуктам. Ознакомьтесь с документацией и видеоматериалами.",
    type: "training",
    order: 3,
    is_required: true,
    status: "not_started",
    completed_at: null,
  },
  {
    step_id: 4,
    name: "Встреча с HR",
    description:
      "Обсудите ваши первые впечатления, задайте вопросы по процессам и получите обратную связь.",
    type: "meeting",
    order: 4,
    is_required: false,
    status: "not_started",
    completed_at: null,
  },
];

const OnboardingProgressDemo: React.FC = () => {
  const [steps, setSteps] = useState(mockStepsProgress);
  const [isLoading, setIsLoading] = useState(false);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [recentRewards, setRecentRewards] = useState<UserReward[]>([]);
  const [isGamificationLoading, setIsGamificationLoading] = useState(false);

  const cardBg = useColorModeValue("white", "gray.700");
  const progressBg = useColorModeValue("gray.100", "gray.600");

  // Рассчитываем прогресс выполнения
  const completedSteps = steps.filter((step) => step.status === "done").length;
  const totalSteps = steps.length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  // Загрузка данных геймификации
  useEffect(() => {
    const loadGamificationData = async () => {
      setIsGamificationLoading(true);
      try {
        const [levelData, rewardsData] = await Promise.all([
          gamificationApi.getUserLevel(),
          gamificationApi.getUserRewards(),
        ]);
        setUserLevel(levelData);
        // Берем только 3 последние награды для отображения
        setRecentRewards(rewardsData.slice(0, 3));
      } catch (error) {
        console.error("Ошибка загрузки данных геймификации:", error);
        toast.error("Не удалось загрузить данные геймификации");
      } finally {
        setIsGamificationLoading(false);
      }
    };

    loadGamificationData();
  }, []);

  // В реальном приложении здесь будет запрос к API для шагов онбординга
  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  return (
    <AppLayout>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2} color="brand.700">
            Прогресс онбординга
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Программа: Онбординг для новых разработчиков
          </Text>
        </Box>

        {/* Блок статистики */}
        <Card variant="outline">
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} p={6}>
            <Box>
              <Text fontSize="md" fontWeight="medium" color="gray.600" mb={2}>
                Общий прогресс
              </Text>
              <HStack spacing={4} mb={3}>
                <Heading size="xl">{progressPercentage}%</Heading>
                <Badge
                  colorScheme={
                    progressPercentage < 30
                      ? "red"
                      : progressPercentage < 70
                      ? "orange"
                      : "green"
                  }
                  fontSize="md"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  {progressPercentage < 30
                    ? "Начало"
                    : progressPercentage < 70
                    ? "В процессе"
                    : "Почти завершено"}
                </Badge>
              </HStack>
              <Progress
                value={progressPercentage}
                size="lg"
                borderRadius="md"
                colorScheme="brand"
                bg={progressBg}
                mb={3}
              />
              <Text fontSize="sm" color="gray.500">
                Выполнено {completedSteps} из {totalSteps} шагов
              </Text>
            </Box>

            <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4}>
              <Card variant="outline" p={4} bg={cardBg}>
                <HStack spacing={3}>
                  <Icon as={FiCheckCircle} color="green.500" boxSize={5} />
                  <VStack spacing={0} align="start">
                    <Text fontSize="sm" color="gray.500">
                      Завершено
                    </Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {steps.filter((step) => step.status === "done").length}
                    </Text>
                  </VStack>
                </HStack>
              </Card>

              <Card variant="outline" p={4} bg={cardBg}>
                <HStack spacing={3}>
                  <Icon as={FiClock} color="orange.500" boxSize={5} />
                  <VStack spacing={0} align="start">
                    <Text fontSize="sm" color="gray.500">
                      В процессе
                    </Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {
                        steps.filter((step) => step.status === "in_progress")
                          .length
                      }
                    </Text>
                  </VStack>
                </HStack>
              </Card>

              <Card variant="outline" p={4} bg={cardBg}>
                <HStack spacing={3}>
                  <Icon as={FiCalendar} color="blue.500" boxSize={5} />
                  <VStack spacing={0} align="start">
                    <Text fontSize="sm" color="gray.500">
                      Предстоит
                    </Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {
                        steps.filter((step) => step.status === "not_started")
                          .length
                      }
                    </Text>
                  </VStack>
                </HStack>
              </Card>

              <Card variant="outline" p={4} bg={cardBg}>
                <HStack spacing={3}>
                  <Icon as={FiAlertTriangle} color="red.500" boxSize={5} />
                  <VStack spacing={0} align="start">
                    <Text fontSize="sm" color="gray.500">
                      Обязательные
                    </Text>
                    <Text fontSize="xl" fontWeight="bold">
                      {steps.filter((step) => step.is_required).length}
                    </Text>
                  </VStack>
                </HStack>
              </Card>
            </SimpleGrid>
          </SimpleGrid>
        </Card>

        {/* Блок геймификации */}
        <Card variant="elevated" p={{ base: 4, md: 6 }}>
          <Heading as="h2" size="lg" mb={6} color="gray.700">
            Ваши достижения и уровень
          </Heading>
          <GamificationBlock
            isLoading={isGamificationLoading}
            userLevel={userLevel}
            recentRewards={recentRewards}
          />
        </Card>

        <Divider my={4} />

        <Heading as="h2" size="lg" mb={4} color="gray.700">
          Шаги онбординга
        </Heading>

        {isLoading ? (
          <VStack spacing={4}>
            <Skeleton height="200px" width="100%" borderRadius="lg" />
            <Skeleton height="200px" width="100%" borderRadius="lg" />
            <Skeleton height="200px" width="100%" borderRadius="lg" />
          </VStack>
        ) : steps.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {steps.map((step) => (
              <StepCard
                key={step.step_id}
                stepId={step.step_id}
                name={step.name}
                description={step.description}
                status={step.status as "not_started" | "in_progress" | "done"}
                type={step.type}
                isRequired={step.is_required}
                order={step.order}
                completedAt={step.completed_at}
              />
            ))}
          </VStack>
        ) : (
          <Alert
            status="info"
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
              Нет активных шагов
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              У вас пока нет назначенных шагов онбординга. Обратитесь к вашему
              HR-менеджеру.
            </AlertDescription>
          </Alert>
        )}
      </VStack>
    </AppLayout>
  );
};

export default OnboardingProgressDemo;
