import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Heading,
  Text,
  Button,
  Badge,
  Flex,
  VStack,
  HStack,
  Divider,
  useDisclosure,
} from "@chakra-ui/react";
import {
  FiCheck,
  FiClock,
  FiAlertCircle,
  FiMessageSquare,
} from "react-icons/fi";
import SolomiaChatWidget from "./SolomiaChatWidget";

interface StepCardProps {
  stepId: number;
  name: string;
  description: string;
  status: "not_started" | "in_progress" | "done";
  type: string;
  isRequired: boolean;
  order: number;
  completedAt?: string | null;
}

/**
 * Компонент карточки шага онбординга с интегрированным AI-чатом
 */
const StepCard: React.FC<StepCardProps> = ({
  stepId,
  name,
  description,
  status,
  type,
  isRequired,
  order,
  completedAt,
}) => {
  const { isOpen, onToggle } = useDisclosure();
  const [isStepActive, setIsStepActive] = useState<boolean>(
    status === "in_progress"
  );

  // Определяем стили в зависимости от статуса
  const getStatusConfig = () => {
    switch (status) {
      case "done":
        return { color: "green", icon: FiCheck, text: "Выполнено" };
      case "in_progress":
        return { color: "blue", icon: FiClock, text: "В процессе" };
      case "not_started":
      default:
        return { color: "gray", icon: FiAlertCircle, text: "Не начато" };
    }
  };

  // Определяем тип шага
  const getTypeDisplay = () => {
    switch (type) {
      case "task":
        return "Задача";
      case "meeting":
        return "Встреча";
      case "training":
        return "Обучение";
      default:
        return type;
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card
      borderWidth="1px"
      borderRadius="lg"
      boxShadow="md"
      mb={4}
      borderColor={`${statusConfig.color}.100`}
      bg="white"
    >
      <CardHeader
        bg={`${statusConfig.color}.50`}
        borderBottom="1px"
        borderColor={`${statusConfig.color}.100`}
        pb={3}
      >
        <Flex justify="space-between" align="center">
          <HStack>
            <Heading size="md">
              {order}. {name}
            </Heading>
            {isRequired && (
              <Badge colorScheme="red" ml={2}>
                Обязательно
              </Badge>
            )}
          </HStack>
          <HStack>
            <Badge
              colorScheme={
                statusConfig.color === "gray" ? "gray" : statusConfig.color
              }
              display="flex"
              alignItems="center"
              px={3}
              py={1}
              borderRadius="full"
            >
              <Box as={statusConfig.icon} mr={1} />
              {statusConfig.text}
            </Badge>
          </HStack>
        </Flex>
      </CardHeader>

      <CardBody>
        <VStack align="stretch" spacing={4}>
          <Text>{description}</Text>

          <HStack>
            <Badge colorScheme="purple">{getTypeDisplay()}</Badge>
            {completedAt && (
              <Text fontSize="sm" color="gray.500">
                Выполнено: {new Date(completedAt).toLocaleDateString()}
              </Text>
            )}
          </HStack>
        </VStack>
      </CardBody>

      <Divider />

      <CardFooter>
        <Flex width="100%" justifyContent="space-between" alignItems="center">
          <Button
            leftIcon={<FiMessageSquare />}
            colorScheme={isOpen ? "purple" : "gray"}
            onClick={onToggle}
            size="sm"
          >
            {isOpen ? "Скрыть чат" : "Открыть AI-чат"}
          </Button>

          {status !== "done" && (
            <Button
              colorScheme="green"
              size="sm"
              isDisabled={status === "not_started"}
            >
              Отметить выполненным
            </Button>
          )}
        </Flex>
      </CardFooter>

      {isOpen && (
        <Box px={4} pb={4}>
          <SolomiaChatWidget
            stepId={stepId}
            isStepActive={isStepActive || status === "in_progress"}
            stepSupportsAI={true}
          />
        </Box>
      )}
    </Card>
  );
};

export default StepCard;
