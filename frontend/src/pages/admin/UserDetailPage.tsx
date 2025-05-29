import { useParams, Link as RouterLink, useNavigate } from "react-router-dom";
import {
  useColorModeValue,
  Box,
  Spinner,
  Text,
  Button,
  Heading,
  Alert,
  VStack,
  Flex,
} from "@chakra-ui/react";
import { AppLayout } from "../../components/layout/AppLayout";

const UserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/admin/employees");
  };

  return (
    <AppLayout>
      <Box p={6}>
        <Heading mb={4}>Детальная страница сотрудника {userId}</Heading>
        <Button onClick={handleBack}>Вернуться к списку</Button>
        <Text mt={4}>Аналитика пользователя временно недоступна.</Text>
      </Box>
    </AppLayout>
  );
};

export default UserDetailPage;
