import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Select,
  SimpleGrid,
  Text,
  Button,
  Container,
  Flex,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { gamificationApi, UserReward } from "../api/gamificationApi";
import RewardCard from "../components/gamification/RewardCard";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore"; // Для проверки аутентификации
import { useNavigate } from "react-router-dom";

const RewardsPage: React.FC = () => {
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<UserReward[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Для доступа к этой странице необходимо войти в систему.");
      navigate("/login");
      return;
    }

    const fetchRewards = async () => {
      try {
        setIsLoading(true);
        const data = await gamificationApi.getUserRewards();
        setRewards(data);
        setFilteredRewards(data);
      } catch (error) {
        console.error("Ошибка загрузки наград:", error);
        toast.error("Не удалось загрузить список наград.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRewards();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (filterType === "") {
      setFilteredRewards(rewards);
    } else {
      setFilteredRewards(
        rewards.filter((reward) => reward.reward_type === filterType)
      );
    }
  }, [filterType, rewards]);

  const rewardTypes: {
    value: UserReward["reward_type"] | "";
    label: string;
  }[] = [
    { value: "", label: "Все типы" },
    { value: "achievement", label: "Достижения" },
    { value: "medal", label: "Медали" },
    { value: "level", label: "Уровни" },
    { value: "badge", label: "Значки" },
  ];

  return (
    <Box>
      {/* Навигационная панель - можно вынести в отдельный компонент Layout */}
      <Flex
        as="nav"
        align="center"
        justify="space-between"
        wrap="wrap"
        padding={4}
        bg="blue.500"
        color="white"
      >
        <Heading as="h1" size="lg" letterSpacing={"-.1rem"}>
          <RouterLink to="/dashboard">OnboardPro</RouterLink>
        </Heading>
        <Button as={RouterLink} to="/dashboard" colorScheme="whiteAlpha">
          На главную
        </Button>
      </Flex>

      <Container maxW="container.xl" py={10}>
        <VStack spacing={8} align="stretch">
          <Heading as="h2" size="xl">
            Мои Награды
          </Heading>

          <HStack spacing={4}>
            <Text>Фильтр по типу:</Text>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              placeholder="Все типы"
              w="200px"
            >
              {rewardTypes.slice(1).map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </Select>
          </HStack>

          {isLoading ? (
            <Text>Загрузка наград...</Text>
          ) : filteredRewards.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {filteredRewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </SimpleGrid>
          ) : (
            <Text>Награды не найдены или у вас их пока нет.</Text>
          )}
        </VStack>
      </Container>
    </Box>
  );
};

export default RewardsPage;
