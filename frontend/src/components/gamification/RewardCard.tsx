import React from "react";
import { Box, Text, Image, VStack, HStack, Tag } from "@chakra-ui/react";
import { UserReward } from "../../api/gamificationApi";

interface RewardCardProps {
  reward: UserReward;
}

// Функция для получения читаемого типа награды
const getReadableRewardType = (type: UserReward["reward_type"]) => {
  if (!type) {
    return "Не указано";
  }

  switch (type) {
    case "achievement":
      return "Достижение";
    case "medal":
      return "Медаль";
    case "level":
      return "Уровень";
    case "badge":
      return "Значок";
    default:
      return type;
  }
};

const RewardCard: React.FC<RewardCardProps> = ({ reward }) => {
  // TODO: Заменить заглушку иконки на реальную логику отображения иконок
  // Возможно, понадобится маппинг reward.icon (slug) на URL изображения или компонент иконки
  const iconPlaceholder = "https://via.placeholder.com/50"; // Пример заглушки

  return (
    <Box borderWidth="1px" borderRadius="lg" p={4} shadow="md" w="100%">
      <HStack spacing={4} align="start">
        <Image
          src={iconPlaceholder}
          alt={reward.title}
          boxSize="50px"
          borderRadius="md"
        />
        <VStack align="start" spacing={1} flex={1}>
          <HStack justifyContent="space-between" w="100%">
            <Text fontWeight="bold" fontSize="lg">
              {reward.title}
            </Text>
            <Tag size="sm" colorScheme="blue">
              {getReadableRewardType(reward.reward_type)}
            </Tag>
          </HStack>
          <Text fontSize="sm" color="gray.600">
            {reward.description}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Получено: {new Date(reward.created_at).toLocaleDateString()}
          </Text>
        </VStack>
      </HStack>
    </Box>
  );
};

export default RewardCard;
