import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Divider,
  VStack,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import StepCard from "../components/StepCard";
import GamificationBlock from "../components/gamification/GamificationBlock";
import { gamificationApi, UserLevel, UserReward } from "../api/gamificationApi";
import toast from "react-hot-toast";

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
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading as="h1" size="xl">
            Прогресс онбординга
          </Heading>
          <Text mt={2} color="gray.600">
            Программа: Онбординг для новых разработчиков
          </Text>
        </Box>

        <GamificationBlock
          isLoading={isGamificationLoading}
          userLevel={userLevel}
          recentRewards={recentRewards}
        />

        <Divider />

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
    </Container>
  );
};

export default OnboardingProgressDemo;
