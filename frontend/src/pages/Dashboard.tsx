import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  Heading,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Dashboard() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем аутентификацию
    const token = localStorage.getItem("authToken");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      toast.error("Требуется авторизация");
      navigate("/login");
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch (e) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
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
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="md"
              bg="white"
            >
              <Heading fontSize="xl">Задачи онбординга</Heading>
              <Text mt={4}>
                Отслеживайте и управляйте задачами онбординга для новых
                сотрудников.
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
        </VStack>
      </Container>
    </Box>
  );
}

export default Dashboard;
