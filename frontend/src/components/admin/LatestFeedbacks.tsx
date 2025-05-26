import React, { useState, useEffect } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Heading,
  Select,
  Badge,
  Spinner,
  Text,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  useColorModeValue,
} from "@chakra-ui/react";
import { BsEmojiSmile, BsEmojiNeutral, BsEmojiFrown } from "react-icons/bs";
import { Feedback } from "../../types/feedback";
import adminApi from "../../api/adminApi";

const LatestFeedbacks: React.FC = () => {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sentimentFilter, setSentimentFilter] = useState<string>("");
  const [autoTagFilter, setAutoTagFilter] = useState<string>("");
  const [limit, setLimit] = useState<number>(10);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const params: any = { limit };

        if (sentimentFilter) params.sentiment = sentimentFilter;
        if (autoTagFilter) params.auto_tag = autoTagFilter;

        const data = await adminApi.getFeedbacks(params);
        setFeedbacks(data);
        setError(null);
      } catch (err) {
        setError("Ошибка при загрузке данных об обратной связи");
        console.error("Error fetching feedbacks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [sentimentFilter, autoTagFilter, limit]);

  const getSentimentIcon = (sentiment?: string) => {
    if (!sentiment) {
      return (
        <Badge colorScheme="gray">
          <BsEmojiNeutral />
        </Badge>
      );
    }

    switch (sentiment) {
      case "positive":
        return (
          <Badge colorScheme="green">
            <BsEmojiSmile />
          </Badge>
        );
      case "neutral":
        return (
          <Badge colorScheme="blue">
            <BsEmojiNeutral />
          </Badge>
        );
      case "negative":
        return (
          <Badge colorScheme="red">
            <BsEmojiFrown />
          </Badge>
        );
      default:
        return (
          <Badge colorScheme="gray">
            <BsEmojiNeutral />
          </Badge>
        );
    }
  };

  return (
    <Box
      bg={bgColor}
      p={5}
      borderRadius="lg"
      boxShadow="md"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <Heading size="md" mb={4}>
        Последние отзывы
      </Heading>
      <HStack spacing={4} mb={4}>
        <Select
          placeholder="Все настроения"
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          size="sm"
          w="200px"
        >
          <option value="positive">Позитивные</option>
          <option value="neutral">Нейтральные</option>
          <option value="negative">Негативные</option>
        </Select>
        <Select
          placeholder="Все теги"
          value={autoTagFilter}
          onChange={(e) => setAutoTagFilter(e.target.value)}
          size="sm"
          w="200px"
        >
          <option value="process">Процессы</option>
          <option value="team">Команда</option>
          <option value="materials">Материалы</option>
          <option value="mentoring">Менторство</option>
        </Select>
        <Box>
          <Text fontSize="xs" mb={1}>
            Лимит
          </Text>
          <NumberInput
            size="sm"
            maxW="100px"
            value={limit}
            min={1}
            max={50}
            onChange={(_, valueAsNumber) => setLimit(valueAsNumber)}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Box>
      </HStack>

      {loading ? (
        <Box textAlign="center" py={10}>
          <Spinner />
          <Text mt={3}>Загрузка данных...</Text>
        </Box>
      ) : error ? (
        <Box textAlign="center" py={10}>
          <Text color="red.500">{error}</Text>
        </Box>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>ID</Th>
                <Th>Сотрудник</Th>
                <Th>Настроение</Th>
                <Th>Теги</Th>
                <Th>Комментарий</Th>
                <Th>Дата</Th>
              </Tr>
            </Thead>
            <Tbody>
              {feedbacks.length > 0 ? (
                feedbacks.map((feedback) => (
                  <Tr key={feedback.id}>
                    <Td>{feedback.id}</Td>
                    <Td>{`${feedback.user.first_name} ${feedback.user.last_name}`}</Td>
                    <Td>{getSentimentIcon(feedback.sentiment)}</Td>
                    <Td>
                      {feedback.auto_tags?.map((tag: string, index: number) => (
                        <Badge key={index} mr={1} mb={1} variant="subtle">
                          {tag}
                        </Badge>
                      ))}
                    </Td>
                    <Td>
                      <Text noOfLines={2}>{feedback.comment}</Text>
                    </Td>
                    <Td>
                      {new Date(feedback.created_at).toLocaleDateString()}
                    </Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={6} textAlign="center">
                    Нет данных для отображения
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default LatestFeedbacks;
