import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  HStack,
  Flex,
  Spinner,
  useColorModeValue,
  Link,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { gamificationApi, UserLevel, UserReward } from "../api/gamificationApi";
import LevelProgressBar from "../components/gamification/LevelProgressBar";
import RewardCard from "../components/gamification/RewardCard";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { AppLayout } from "../components/layout/AppLayout";
import { Button, Card } from "../components/common";
import {
  FiCalendar,
  FiCheckCircle,
  FiBook,
  FiUsers,
  FiAward,
} from "react-icons/fi";

function Dashboard() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [gamificationLoading, setGamificationLoading] = useState(true);
  const navigate = useNavigate();

  const { user: authUser, isAuthenticated } = useAuthStore();
  const cardBg = useColorModeValue("white", "gray.700");
  const cardBorderColor = useColorModeValue("gray.200", "gray.600");
  const cardHoverBorderColor = useColorModeValue("brand.500", "brand.300");

  useEffect(() => {
    // Проверяем аутентификацию
    if (!isAuthenticated || !authUser) {
      toast.error("Требуется авторизация");
      navigate("/login");
      return;
    }

    // Загрузка данных геймификации
    const fetchGamificationData = async () => {
      if (authUser) {
        try {
          setGamificationLoading(true);

          // Используем Promise.allSettled для запросов
          const [levelResult, rewardsResult] = await Promise.allSettled([
            gamificationApi.getUserLevel(),
            gamificationApi.getUserRewards(),
          ]);

          // Обработка результата уровня
          if (levelResult.status === "fulfilled") {
            setUserLevel(levelResult.value);
          } else {
            console.error("Не удалось загрузить уровень:", levelResult.reason);
            toast.error("Не удалось загрузить данные об уровне");
          }

          // Обработка результата наград
          if (rewardsResult.status === "fulfilled") {
            // Отображаем только последние 3 награды для дашборда
            setUserRewards(rewardsResult.value.slice(0, 3));
          } else {
            console.error(
              "Не удалось загрузить награды:",
              rewardsResult.reason
            );
            toast.error("Не удалось загрузить данные о наградах");
          }
        } catch (error) {
          console.error("Общая ошибка загрузки данных геймификации:", error);
          toast.error("Не удалось загрузить данные геймификации.");
        } finally {
          setGamificationLoading(false);
        }
      }
    };

    if (isAuthenticated && authUser) {
      fetchGamificationData();
    }
  }, [navigate, authUser, isAuthenticated]);

  // Показываем состояние загрузки
  if (gamificationLoading && !authUser) {
    return (
      <Flex
        height="100vh"
        width="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size="xl" color="brand.500" thickness="4px" />
      </Flex>
    );
  }

  return (
    <AppLayout>
      {/* Секция приветствия и общий обзор */}
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2} color="brand.700">
            Добро пожаловать, {authUser?.full_name || "Пользователь"}
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Ваш персональный портал для успешной адаптации в компании
          </Text>
        </Box>

        {/* Секция с краткой статистикой */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3, xl: 4 }} spacing={6}>
          <Card
            variant="outline"
            p={6}
            transition="all 0.3s"
            _hover={{
              transform: "translateY(-4px)",
              shadow: "md",
              borderColor: "brand.400",
            }}
          >
            <HStack spacing={4}>
              <Box p={3} borderRadius="lg" bg="brand.50" color="brand.500">
                <FiCheckCircle size={24} />
              </Box>
              <VStack align="start" spacing={1}>
                <Text color="gray.500" fontSize="sm" fontWeight="medium">
                  Прогресс онбординга
                </Text>
                <Heading size="md">68%</Heading>
              </VStack>
            </HStack>
          </Card>

          <Card
            variant="outline"
            p={6}
            transition="all 0.3s"
            _hover={{
              transform: "translateY(-4px)",
              shadow: "md",
              borderColor: "brand.400",
            }}
          >
            <HStack spacing={4}>
              <Box p={3} borderRadius="lg" bg="purple.50" color="purple.500">
                <FiCalendar size={24} />
              </Box>
              <VStack align="start" spacing={1}>
                <Text color="gray.500" fontSize="sm" fontWeight="medium">
                  Запланировано встреч
                </Text>
                <Heading size="md">3</Heading>
              </VStack>
            </HStack>
          </Card>

          <Card
            variant="outline"
            p={6}
            transition="all 0.3s"
            _hover={{
              transform: "translateY(-4px)",
              shadow: "md",
              borderColor: "brand.400",
            }}
          >
            <HStack spacing={4}>
              <Box p={3} borderRadius="lg" bg="green.50" color="green.500">
                <FiBook size={24} />
              </Box>
              <VStack align="start" spacing={1}>
                <Text color="gray.500" fontSize="sm" fontWeight="medium">
                  Изучено материалов
                </Text>
                <Heading size="md">12</Heading>
              </VStack>
            </HStack>
          </Card>

          <Card
            variant="outline"
            p={6}
            transition="all 0.3s"
            _hover={{
              transform: "translateY(-4px)",
              shadow: "md",
              borderColor: "brand.400",
            }}
          >
            <HStack spacing={4}>
              <Box p={3} borderRadius="lg" bg="orange.50" color="orange.500">
                <FiAward size={24} />
              </Box>
              <VStack align="start" spacing={1}>
                <Text color="gray.500" fontSize="sm" fontWeight="medium">
                  Заработано наград
                </Text>
                <Heading size="md">{userRewards.length}</Heading>
              </VStack>
            </HStack>
          </Card>
        </SimpleGrid>

        {/* Основные действия */}
        <Heading as="h2" size="lg" mt={6} mb={4} color="gray.700">
          Основные разделы
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mb={8}>
          <Link
            as={RouterLink}
            to="/onboarding/progress"
            textDecoration="none"
            _hover={{ textDecoration: "none" }}
          >
            <Card
              variant="outline"
              p={6}
              cursor="pointer"
              transition="all 0.3s"
              _hover={{
                transform: "translateY(-4px)",
                shadow: "md",
                borderColor: "brand.400",
              }}
              height="100%"
            >
              <VStack spacing={4} align="start" height="100%">
                <Box p={3} borderRadius="lg" bg="brand.50" color="brand.500">
                  <FiCheckCircle size={24} />
                </Box>

                <Heading size="md">Мой онбординг-план</Heading>

                <Text color="gray.600" flex="1">
                  Отслеживайте прогресс своего онбординга и выполняйте
                  назначенные задачи. Общайтесь с AI-ассистентом Solomia.
                </Text>

                <Text color="brand.500" fontWeight="medium">
                  Открыть план →
                </Text>
              </VStack>
            </Card>
          </Link>

          <Link
            as={RouterLink}
            to="/booking/meetings"
            textDecoration="none"
            _hover={{ textDecoration: "none" }}
          >
            <Card
              variant="outline"
              p={6}
              cursor="pointer"
              transition="all 0.3s"
              _hover={{
                transform: "translateY(-4px)",
                shadow: "md",
                borderColor: "brand.400",
              }}
              height="100%"
            >
              <VStack spacing={4} align="start" height="100%">
                <Box p={3} borderRadius="lg" bg="purple.50" color="purple.500">
                  <FiCalendar size={24} />
                </Box>

                <Heading size="md">Мои встречи</Heading>

                <Text color="gray.600" flex="1">
                  Просматривайте запланированные встречи, видеозвонки и
                  тренинги. Добавляйте события в свой календарь.
                </Text>

                <Text color="brand.500" fontWeight="medium">
                  Управление встречами →
                </Text>
              </VStack>
            </Card>
          </Link>

          <Link
            as={RouterLink}
            to="/rewards"
            textDecoration="none"
            _hover={{ textDecoration: "none" }}
          >
            <Card
              variant="outline"
              p={6}
              cursor="pointer"
              transition="all 0.3s"
              _hover={{
                transform: "translateY(-4px)",
                shadow: "md",
                borderColor: "brand.400",
              }}
              height="100%"
            >
              <VStack spacing={4} align="start" height="100%">
                <Box p={3} borderRadius="lg" bg="orange.50" color="orange.500">
                  <FiAward size={24} />
                </Box>

                <Heading size="md">Мои награды</Heading>

                <Text color="gray.600" flex="1">
                  Просматривайте заработанные достижения и награды.
                  Зарабатывайте новые, выполняя задачи онбординга.
                </Text>

                <Text color="brand.500" fontWeight="medium">
                  Смотреть награды →
                </Text>
              </VStack>
            </Card>
          </Link>
        </SimpleGrid>

        {/* Блок геймификации */}
        <Card variant="elevated" p={{ base: 4, md: 6 }} mt={6}>
          <Heading as="h3" size="lg" mb={6} color="gray.700">
            Ваш прогресс и достижения
          </Heading>

          <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={8}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="md" fontWeight="medium" color="gray.600">
                Ваш текущий уровень
              </Text>
              {gamificationLoading ? (
                <Spinner
                  size="xl"
                  thickness="4px"
                  color="brand.500"
                  alignSelf="center"
                  my={8}
                />
              ) : (
                <LevelProgressBar userLevel={userLevel} isLoading={false} />
              )}
            </VStack>

            <VStack spacing={4} align="stretch">
              <Text fontSize="md" fontWeight="medium" color="gray.600">
                Последние награды
              </Text>

              {gamificationLoading ? (
                <Spinner
                  size="xl"
                  thickness="4px"
                  color="brand.500"
                  alignSelf="center"
                  my={8}
                />
              ) : userRewards.length > 0 ? (
                <VStack spacing={4} align="stretch">
                  {userRewards.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))}

                  <Link as={RouterLink} to="/rewards" textDecoration="none">
                    <Button variant="primary" size="md" mt={2}>
                      Все награды
                    </Button>
                  </Link>
                </VStack>
              ) : (
                <Text color="gray.500" py={8}>
                  У вас пока нет наград. Выполняйте задачи онбординга, чтобы
                  получить первые достижения!
                </Text>
              )}
            </VStack>
          </Grid>
        </Card>
      </VStack>
    </AppLayout>
  );
}

export default Dashboard;
