import React, { useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import EmployeesTable from "../../components/admin/EmployeesTable";
import AssignmentsOverview from "../../components/admin/AssignmentsOverview";
import LatestFeedbacks from "../../components/admin/LatestFeedbacks";
import RiskInsightsPanel from "../../components/admin/RiskInsightsPanel";
import ReportsExport from "../../components/admin/ReportsExport";

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const bgColor = useColorModeValue("gray.50", "gray.900");

  // Проверяем права доступа пользователя
  useEffect(() => {
    if (user && !["admin", "hr"].includes(user.role.toLowerCase())) {
      // Если пользователь не админ и не HR, перенаправляем на главную страницу
      navigate("/");
    }
  }, [user, navigate]);

  // Если пользователь не авторизован или не загружен, не показываем содержимое
  if (!user) {
    return null;
  }

  // Если у пользователя нет нужных прав
  if (!["admin", "hr"].includes(user.role.toLowerCase())) {
    return (
      <Container maxW="container.xl" p={5}>
        <Alert
          status="error"
          variant="solid"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
          mb={6}
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Доступ запрещен
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            У вас нет прав для просмотра этой страницы. Эта страница доступна
            только для администраторов и HR-специалистов.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Box bg={bgColor} minH="100vh" py={5}>
      <Container maxW="container.xl">
        <VStack align="start" spacing={8} mb={10}>
          <Box w="100%">
            <Heading mb={2}>Административная панель</Heading>
            <Text color="gray.600">
              Обзор сотрудников, заданий, обратной связи и инсайтов для HR и
              администраторов
            </Text>
          </Box>

          {/* Секция 1: Таблица сотрудников */}
          <Box w="100%">
            <EmployeesTable />
          </Box>

          {/* Секция 2: Обзор назначений */}
          <Box w="100%">
            <AssignmentsOverview />
          </Box>

          {/* Секция 3: Отзывы и Инсайты (в 2 колонки) */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="100%">
            <LatestFeedbacks />
            <RiskInsightsPanel />
          </SimpleGrid>

          {/* Секция 4: Экспорт отчетов */}
          <Box w="100%">
            <ReportsExport />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
