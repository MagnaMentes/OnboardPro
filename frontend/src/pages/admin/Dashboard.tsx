import React, { useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import EmployeesTable from "../../components/admin/EmployeesTable";
import AssignmentsOverview from "../../components/admin/AssignmentsOverview";
import LatestFeedbacks from "../../components/admin/LatestFeedbacks";
import RiskInsightsPanel from "../../components/admin/RiskInsightsPanel";
import ReportsExport from "../../components/admin/ReportsExport";
import { PageHeader } from "../../components/layout/PageHeader";

const AdminDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const cardBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

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
      <>
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
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Административная панель"
        subtitle="Обзор сотрудников, заданий, обратной связи и инсайтов для HR и администраторов"
      />
      <VStack align="start" spacing={8} mb={10}>
        {/* Секция 1: Таблица сотрудников */}
        <Box
          w="100%"
          bg={cardBg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
          p={5}
        >
          <EmployeesTable />
        </Box>

        {/* Секция 2: Обзор назначений */}
        <Box
          w="100%"
          bg={cardBg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
          p={5}
        >
          <AssignmentsOverview />
        </Box>

        {/* Секция 3: Отзывы и Инсайты (в 2 колонки) */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6} w="100%">
          <Box
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
            p={5}
          >
            <LatestFeedbacks />
          </Box>
          <Box
            bg={cardBg}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
            p={5}
          >
            <RiskInsightsPanel />
          </Box>
        </SimpleGrid>

        {/* Секция 4: Экспорт отчетов */}
        <Box
          w="100%"
          bg={cardBg}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
          p={5}
        >
          <ReportsExport />
        </Box>
      </VStack>
    </>
  );
};

export default AdminDashboard;
