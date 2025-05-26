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
  Tooltip,
  Icon,
} from "@chakra-ui/react";
import { FaExclamationTriangle, FaExclamation } from "react-icons/fa";
import { AIInsight } from "../../types/aiInsight";
import adminApi from "../../api/adminApi";

const RiskInsightsPanel: React.FC = () => {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>("");
  const [limit, setLimit] = useState<number>(10);

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        const params: any = { limit };

        if (riskFilter) params.risk_level = riskFilter;

        const data = await adminApi.getInsights(params);
        setInsights(data);
        setError(null);
      } catch (err) {
        setError("Ошибка при загрузке данных о рисках");
        console.error("Error fetching insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [riskFilter, limit]);

  const getRiskIcon = (level?: string) => {
    if (!level) {
      return (
        <Tooltip label="Уровень риска не определен" placement="top">
          <Box>
            <Icon as={FaExclamation} color="gray.400" boxSize={5} />
          </Box>
        </Tooltip>
      );
    }

    switch (level) {
      case "high":
        return (
          <Tooltip label="Высокий риск" placement="top">
            <Box>
              <Icon as={FaExclamationTriangle} color="red.500" boxSize={5} />
            </Box>
          </Tooltip>
        );
      case "medium":
        return (
          <Tooltip label="Средний риск" placement="top">
            <Box>
              <Icon as={FaExclamation} color="orange.400" boxSize={5} />
            </Box>
          </Tooltip>
        );
      default:
        return (
          <Tooltip label="Низкий риск" placement="top">
            <Box>
              <Icon as={FaExclamation} color="green.400" boxSize={5} />
            </Box>
          </Tooltip>
        );
    }
  };

  const getCategoryBadge = (category?: string) => {
    if (!category) {
      return (
        <Badge colorScheme="gray" mr={1} mb={1}>
          Не указана
        </Badge>
      );
    }

    let colorScheme;

    switch (category) {
      case "отсутствие":
        colorScheme = "red";
        break;
      case "низкая активность":
        colorScheme = "orange";
        break;
      case "негативные отзывы":
        colorScheme = "purple";
        break;
      case "задержка выполнения":
        colorScheme = "yellow";
        break;
      default:
        colorScheme = "blue";
    }

    return (
      <Badge colorScheme={colorScheme} mr={1} mb={1}>
        {category}
      </Badge>
    );
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
        AI-инсайты: Риски
      </Heading>
      <HStack spacing={4} mb={4}>
        <Select
          placeholder="Все уровни риска"
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          size="sm"
          w="200px"
        >
          <option value="high">Высокий риск</option>
          <option value="medium">Средний риск</option>
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
                <Th>Уровень риска</Th>
                <Th>Категория</Th>
                <Th>Описание</Th>
                <Th>Рекомендация</Th>
                <Th>Дата</Th>
              </Tr>
            </Thead>
            <Tbody>
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <Tr key={insight.id}>
                    <Td>{insight.id}</Td>
                    <Td>{`${insight.user.first_name} ${insight.user.last_name}`}</Td>
                    <Td>{getRiskIcon(insight.risk_level)}</Td>
                    <Td>{getCategoryBadge(insight.category)}</Td>
                    <Td>
                      <Text noOfLines={2}>{insight.description}</Text>
                    </Td>
                    <Td>
                      <Text noOfLines={2}>{insight.recommendation}</Text>
                    </Td>
                    <Td>{new Date(insight.created_at).toLocaleDateString()}</Td>
                  </Tr>
                ))
              ) : (
                <Tr>
                  <Td colSpan={7} textAlign="center">
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

export default RiskInsightsPanel;
