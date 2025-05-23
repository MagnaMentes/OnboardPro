import React from "react";
import { Box, Text, Progress, VStack, HStack, Tooltip } from "@chakra-ui/react";
import { UserLevel } from "../../api/gamificationApi";

interface LevelProgressBarProps {
  userLevel: UserLevel | null;
  isLoading?: boolean;
}

// Примерные пороговые значения для уровней (должны соответствовать бэкенду)
// Это можно получать с бэкенда или хранить в конфигурации
const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 50,
  3: 125,
  4: 250,
  5: 500,
  6: 1000,
  7: 2000,
  8: 4000,
  9: 8000,
  10: 16000,
  // ... и так далее
};

const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  userLevel,
  isLoading,
}) => {
  if (isLoading) {
    return <Text>Загрузка уровня...</Text>;
  }

  if (!userLevel) {
    return <Text>Информация об уровне недоступна.</Text>;
  }

  const { level, points } = userLevel;

  const currentLevelThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextLevelThreshold =
    LEVEL_THRESHOLDS[level + 1] ||
    (points > currentLevelThreshold
      ? points * 1.5
      : currentLevelThreshold + 50); // Примерная логика для последнего уровня

  const pointsInCurrentLevel = points - currentLevelThreshold;
  const pointsForNextLevel = nextLevelThreshold - currentLevelThreshold;

  const progressPercentage =
    pointsForNextLevel > 0
      ? Math.min((pointsInCurrentLevel / pointsForNextLevel) * 100, 100)
      : points >= currentLevelThreshold
      ? 100
      : 0; // Если это максимальный уровень или нет следующего

  return (
    <Box w="100%" p={4} borderWidth="1px" borderRadius="lg" shadow="sm">
      <VStack spacing={2} align="start">
        <HStack justifyContent="space-between" w="100%">
          <Text fontWeight="bold" fontSize="lg">
            Уровень {level}
          </Text>
          <Tooltip label={`Всего очков: ${points}`} placement="top">
            <Text fontSize="sm" color="gray.600">
              {pointsInCurrentLevel} / {pointsForNextLevel} очков до следующего
              уровня
            </Text>
          </Tooltip>
        </HStack>
        <Progress
          value={progressPercentage}
          size="lg"
          colorScheme="green"
          w="100%"
          borderRadius="md"
          hasStripe
          isAnimated={progressPercentage < 100}
        />
        {level < Math.max(...Object.keys(LEVEL_THRESHOLDS).map(Number)) && (
          <Text fontSize="xs" color="gray.500" alignSelf="flex-end">
            Следующий уровень: {level + 1} (при {nextLevelThreshold} очках)
          </Text>
        )}
      </VStack>
    </Box>
  );
};

export default LevelProgressBar;
