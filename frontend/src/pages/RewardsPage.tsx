import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Select,
  SimpleGrid,
  Text,
  Flex,
  Spinner,
  InputGroup,
  InputRightElement,
  useColorModeValue,
  Link,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { gamificationApi, UserReward } from "../api/gamificationApi";
import RewardCard from "../components/gamification/RewardCard";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Button, Input, Card } from "../components/common";
import { FiFilter, FiSearch } from "react-icons/fi";

const RewardsPage: React.FC = () => {
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [filteredRewards, setFilteredRewards] = useState<UserReward[]>([]);
  const [filterType, setFilterType] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const bgColor = useColorModeValue("white", "gray.700");

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
    let result = [...rewards];

    // Фильтрация по типу
    if (filterType) {
      result = result.filter((reward) => reward.reward_type === filterType);
    }

    // Поиск по названию
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (reward) =>
          (reward.name && reward.name.toLowerCase().includes(query)) ||
          (reward.description &&
            reward.description.toLowerCase().includes(query))
      );
    }

    setFilteredRewards(result);
  }, [filterType, searchQuery, rewards]);

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

  const handleClearFilters = () => {
    setFilterType("");
    setSearchQuery("");
  };

  return (
    <AppLayout>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2} color="brand.700">
            Награды
          </Heading>
          <Text color="gray.600" fontSize="lg">
            Просмотрите ваши достижения и награды в системе OnboardPro
          </Text>
        </Box>

        {/* Панель фильтрации */}
        <Card variant="outline" p={{ base: 4, md: 6 }}>
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={4}
            justifyContent="space-between"
            alignItems={{ base: "stretch", md: "flex-end" }}
          >
            <Box flex="1">
              <Text mb={2} fontWeight="medium" color="gray.700">
                Поиск наград
              </Text>
              <InputGroup>
                <Input
                  placeholder="Введите название награды"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <InputRightElement>
                  <FiSearch color="gray.500" />
                </InputRightElement>
              </InputGroup>
            </Box>

            <Box flex="1">
              <Text mb={2} fontWeight="medium" color="gray.700">
                Фильтр по типу
              </Text>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                bg={bgColor}
              >
                {rewardTypes.map((rt) => (
                  <option key={rt.value} value={rt.value}>
                    {rt.label}
                  </option>
                ))}
              </Select>
            </Box>

            <Button
              leftIcon={<FiFilter />}
              variant="secondary"
              onClick={handleClearFilters}
              alignSelf={{ base: "stretch", md: "flex-end" }}
              isDisabled={!filterType && !searchQuery}
            >
              Сбросить фильтры
            </Button>
          </Flex>
        </Card>

        {/* Список наград */}
        {isLoading ? (
          <Flex justifyContent="center" py={12}>
            <Spinner size="xl" thickness="4px" color="brand.500" />
          </Flex>
        ) : filteredRewards.length > 0 ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} mt={4}>
            {filteredRewards.map((reward) => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </SimpleGrid>
        ) : (
          <Card variant="outline" p={8} textAlign="center">
            <VStack spacing={4}>
              <Text fontSize="lg" fontWeight="medium" color="gray.500">
                {searchQuery || filterType
                  ? "Награды не найдены. Попробуйте изменить параметры поиска."
                  : "У вас пока нет наград."}
              </Text>
              <Text color="gray.500">
                Выполняйте задачи онбординга, чтобы получать новые достижения и
                награды.
              </Text>
            </VStack>
          </Card>
        )}
      </VStack>
    </AppLayout>
  );
};

export default RewardsPage;
