import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  Alert,
  AlertIcon,
  Button,
  HStack,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";

import { UserInsights } from "@/components/AIInsights/UserInsightsV2";
import {
  SmartInsightsService,
  AIRecommendationsService,
} from "@/services/aiInsights";
import { GenerateRecommendationsRequest } from "@/types/aiInsights";

const UserInsightsPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userData, setUserData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  } | null>(null);
  const [alertInfo, setAlertInfo] = useState<{
    status: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // В реальном приложении здесь будет запрос к API для получения данных пользователя
      // Например:
      // const response = await userService.getUserById(Number(userId));
      // setUserData(response);

      // Для демонстрации используем временные данные
      setUserData({
        firstName: "Имя пользователя",
        lastName: "Фамилия пользователя",
        email: `user${userId}@example.com`,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setAlertInfo({
        status: "error",
        message: "Не удалось загрузить данные пользователя",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!userId) return;

    setIsGenerating(true);
    try {
      const request: GenerateRecommendationsRequest = {
        user_id: Number(userId),
      };

      await AIRecommendationsService.generateRecommendations(request);

      setAlertInfo({
        status: "success",
        message: "Генерация рекомендаций запущена успешно",
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setAlertInfo({
        status: "error",
        message: "Ошибка при генерации рекомендаций",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" height="50vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={4}>
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <VStack alignItems="flex-start" spacing={1}>
          <Heading as="h1" fontSize="2xl">
            Инсайты и рекомендации для пользователя
          </Heading>
          {userData && (
            <HStack>
              <Text fontWeight="bold">
                {userData.firstName} {userData.lastName}
              </Text>
              <Badge colorScheme="blue">{userData.email}</Badge>
            </HStack>
          )}
        </VStack>

        <Button
          colorScheme="teal"
          isLoading={isGenerating}
          loadingText="Генерация..."
          onClick={handleGenerateRecommendations}
        >
          Сгенерировать рекомендации
        </Button>
      </Flex>

      {alertInfo && (
        <Alert status={alertInfo.status} mb={4} borderRadius="md">
          <AlertIcon />
          {alertInfo.message}
        </Alert>
      )}

      <Box
        bg={bgColor}
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
        shadow="sm"
      >
        {userId && <UserInsights userId={parseInt(userId, 10)} />}
      </Box>
    </Box>
  );
};

export default UserInsightsPage;
