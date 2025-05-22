import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  Stack,
  Select,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Spinner,
  Button,
  Center,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { FiSearch } from "react-icons/fi";
import { StepFeedback } from "../../api/feedback";
import StepFeedbackCard from "./StepFeedbackCard";

interface FeedbackListProps {
  feedbacks: StepFeedback[];
  isLoading: boolean;
}

const FeedbackList: React.FC<FeedbackListProps> = ({
  feedbacks,
  isLoading,
}) => {
  const [filteredFeedbacks, setFilteredFeedbacks] = useState<StepFeedback[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("all");

  // Обновляем фильтрованный список при изменении данных или фильтров
  useEffect(() => {
    if (!feedbacks) {
      setFilteredFeedbacks([]);
      return;
    }

    let filtered = feedbacks;

    // Фильтр по тегу
    if (tagFilter !== "all") {
      filtered = filtered.filter((feedback) => feedback.auto_tag === tagFilter);
    }

    // Поиск по комментарию или названию шага
    if (searchTerm) {
      filtered = filtered.filter(
        (feedback) =>
          feedback.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
          feedback.step_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredFeedbacks(filtered);
  }, [feedbacks, tagFilter, searchTerm]);

  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        Отзывы отсутствуют.
      </Alert>
    );
  }

  return (
    <Box>
      <Flex mb={4} gap={4} flexDirection={{ base: "column", md: "row" }}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <FiSearch color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Поиск отзывов"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>

        <Select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          maxW={{ md: "200px" }}
        >
          <option value="all">Все метки</option>
          <option value="positive">Положительные</option>
          <option value="neutral">Нейтральные</option>
          <option value="negative">Отрицательные</option>
          <option value="unclear_instruction">Неясные инструкции</option>
          <option value="delay_warning">Задержки</option>
        </Select>
      </Flex>

      {filteredFeedbacks.length === 0 ? (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Отзывы не найдены по заданным критериям.
        </Alert>
      ) : (
        <Stack spacing={4}>
          {filteredFeedbacks.map((feedback) => (
            <StepFeedbackCard key={feedback.id} feedback={feedback} />
          ))}
        </Stack>
      )}

      <Text fontSize="sm" color="gray.500" mt={4} textAlign="right">
        Всего отзывов: {filteredFeedbacks.length}
      </Text>
    </Box>
  );
};

export default FeedbackList;
