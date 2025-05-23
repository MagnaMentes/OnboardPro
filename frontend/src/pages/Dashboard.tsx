import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Text,
  VStack,
  Link,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { gamificationApi, UserLevel, UserReward } from "../api/gamificationApi";
import LevelProgressBar from "../components/gamification/LevelProgressBar";
import RewardCard from "../components/gamification/RewardCard";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import toast from "react-hot-toast";
import { FiBarChart2 } from "react-icons/fi";
import { useAuthStore } from "../store/authStore";

function Dashboard() {
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [gamificationLoading, setGamificationLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );
  const navigate = useNavigate();

  const { user: authUser, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Проверяем аутентификацию
    if (!isAuthenticated || !authUser) {
      toast.error("Требуется авторизация");
      navigate("/login");
      return;
    }

    setUser({
      name: authUser.full_name,
      email: authUser.email,
    });

    // Загрузка данных геймификации
    const fetchGamificationData = async () => {
      if (authUser) {
        try {
          setGamificationLoading(true);
          const levelData = await gamificationApi.getUserLevel();
          setUserLevel(levelData);
          const rewardsData = await gamificationApi.getUserRewards(); // Получаем все награды
          // Отображаем только последние 3 награды для дашборда
          setUserRewards(rewardsData.slice(0, 3));
        } catch (error) {
          console.error("Ошибка загрузки данных геймификации:", error);
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

  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success("Вы вышли из системы");
    navigate("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <Box>
      {/* Навигационная панель */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding={4}
        bg="blue.500"
        color="white"
      >
        <Flex align="center" mr={5}>
          <Heading as="h1" size="lg">
            OnboardPro
          </Heading>
        </Flex>

        <Flex align="center">
          <Text mr={4}>Привет, {user.name}!</Text>

          {/* Ссылка на онбординг для всех пользователей */}
          <Box mr={4}>
            <Link
              as={RouterLink}
              to="/onboarding/progress"
              color="white"
              display="flex"
              alignItems="center"
            >
              <Box mr={2}>📋</Box>
              Мой онбординг
            </Link>
          </Box>

          {/* Ссылка на встречи для всех пользователей */}
          <Box mr={4}>
            <Link
              as={RouterLink}
              to="/booking/meetings"
              color="white"
              display="flex"
              alignItems="center"
            >
              <Box mr={2}>📅</Box>
              Мои встречи
            </Link>
          </Box>

          {/* Навигация для HR и админов */}
          {authUser &&
            (authUser.role === "admin" || authUser.role === "hr") && (
              <>
                <Box mr={4}>
                  <Link
                    as={RouterLink}
                    to="/admin/analytics"
                    color="white"
                    display="flex"
                    alignItems="center"
                  >
                    <Box as={FiBarChart2} mr={2} />
                    BI-аналитика
                  </Link>
                </Box>
                <Box mr={4}>
                  <Link
                    as={RouterLink}
                    to="/admin/booking/manage"
                    color="white"
                    display="flex"
                    alignItems="center"
                  >
                    <Box mr={2}>📊</Box>
                    Управление встречами
                  </Link>
                </Box>
              </>
            )}

          <Button onClick={handleLogout} colorScheme="whiteAlpha">
            Выйти
          </Button>
        </Flex>
      </Flex>

      {/* Основное содержимое */}
      <Container maxW="container.xl" py={10}>
        <VStack spacing={8} align="stretch">
          <Heading as="h2" size="xl">
            Добро пожаловать в панель управления
          </Heading>

          <Text fontSize="lg">
            Это заглушка для панели управления OnboardPro. Здесь будет
            размещаться основной интерфейс платформы.
          </Text>

          <Grid
            templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
            gap={6}
            mt={6}
          >
            {/* Здесь будут компоненты для панели управления */}
            <Box
              as={RouterLink}
              to="/onboarding/progress"
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="md"
              bg="white"
              cursor="pointer"
              _hover={{
                shadow: "lg",
                borderColor: "blue.400",
              }}
            >
              <Heading fontSize="xl">Мой онбординг-план</Heading>
              <Text mt={4}>
                Отслеживайте свой прогресс по онбордингу и общайтесь с
                AI-ассистентом Solomia.
              </Text>
              <Text color="blue.500" mt={2}>
                Перейти к моему плану →
              </Text>
            </Box>

            <Box
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="md"
              bg="white"
            >
              <Heading fontSize="xl">Прогресс команды</Heading>
              <Text mt={4}>
                Мониторинг прогресса выполнения задач онбординга по командам.
              </Text>
            </Box>

            <Box
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="md"
              bg="white"
            >
              <Heading fontSize="xl">Управление шаблонами</Heading>
              <Text mt={4}>
                Создание и редактирование шаблонов онбординга для разных ролей.
              </Text>
            </Box>
          </Grid>

          {/* Блок геймификации */}
          <Box mt={10}>
            <Heading as="h3" size="lg" mb={4}>
              Ваш прогресс и достижения
            </Heading>
            <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6}>
              <VStack spacing={4} align="stretch">
                <LevelProgressBar
                  userLevel={userLevel}
                  isLoading={gamificationLoading}
                />
              </VStack>
              <VStack spacing={4} align="stretch">
                <Heading as="h4" size="md">
                  Последние награды
                </Heading>
                {gamificationLoading ? (
                  <Text>Загрузка наград...</Text>
                ) : userRewards.length > 0 ? (
                  userRewards.map((reward) => (
                    <RewardCard key={reward.id} reward={reward} />
                  ))
                ) : (
                  <Text>У вас пока нет наград.</Text>
                )}
                {userRewards.length > 0 && (
                  <Button
                    as={RouterLink}
                    to="/rewards"
                    colorScheme="blue"
                    alignSelf="flex-start"
                  >
                    Все награды
                  </Button>
                )}
              </VStack>
            </Grid>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}

export default Dashboard;
