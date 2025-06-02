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
import { PageHeader } from "../../components/layout/PageHeader";

const UserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/admin/employees");
  };

  return (
    <>
      <PageHeader
        title={`Сотрудник #${userId}`}
        actions={
          <Flex gap={2}>
            <Button
              as={RouterLink}
              to={`/admin/ai/user/${userId}`}
              colorScheme="blue"
              variant="outline"
            >
              AI-инсайты и рекомендации
            </Button>
            <Button
              as={RouterLink}
              to={`/admin/intelligence/user/${userId}`}
              colorScheme="teal"
              variant="outline"
            >
              Intelligence Dashboard
            </Button>
            <Button onClick={handleBack}>Вернуться к списку</Button>
          </Flex>
        }
      />
      <Box maxW="1200px" mx="auto" px={4} py={6}>
        <Text>Аналитика пользователя временно недоступна.</Text>
      </Box>
    </>
  );
};

export default UserDetailPage;
