import React from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Skeleton,
  SimpleGrid,
} from "@chakra-ui/react";
import { UserLevel, UserReward } from "../../api/gamificationApi";
import LevelProgressBar from "./LevelProgressBar";
import RewardCard from "./RewardCard";

interface GamificationBlockProps {
  isLoading: boolean;
  userLevel: UserLevel | null;
  recentRewards?: UserReward[];
  userRewards?: UserReward[];
}

const GamificationBlock: React.FC<GamificationBlockProps> = ({
  isLoading,
  userLevel,
  recentRewards,
  userRewards,
}) => {
  // Используем переданные recentRewards или берем из userRewards (если они переданы)
  const displayRewards = recentRewards || userRewards || [];
  return (
    <Box bg="gray.50" p={6} borderRadius="lg" mb={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="start">
          <Heading as="h2" size="lg">
            Прогресс онбординга
          </Heading>
        </HStack>

        {isLoading ? (
          <Skeleton height="100px" />
        ) : userLevel ? (
          <LevelProgressBar userLevel={userLevel} />
        ) : null}

        {displayRewards.length > 0 && (
          <>
            <Heading as="h3" size="md" mt={4}>
              Последние награды
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {displayRewards.map((reward) => (
                <RewardCard key={reward.id} reward={reward} />
              ))}
            </SimpleGrid>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default GamificationBlock;
