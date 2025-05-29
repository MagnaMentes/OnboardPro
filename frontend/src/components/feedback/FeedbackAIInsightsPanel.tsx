import React from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  CardBody,
  Badge,
  Divider,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Flex,
  Icon,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiInfo,
} from "react-icons/fi";
import { FeedbackInsight } from "../../types/feedback";

interface FeedbackAIInsightsPanelProps {
  insights: FeedbackInsight[];
  isLoading?: boolean;
}

const FeedbackAIInsightsPanel: React.FC<FeedbackAIInsightsPanelProps> = ({
  insights,
  isLoading = false,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Группировка инсайтов по типам
  const summaryInsights = insights.filter(
    (insight) => insight.type === "summary"
  );
  const problemInsights = insights.filter(
    (insight) => insight.type === "problem_area"
  );
  const riskInsights = insights.filter((insight) => insight.type === "risk");
  const satisfactionInsights = insights.filter(
    (insight) => insight.type === "satisfaction"
  );

  // Извлечение численного значения из строки с индексом удовлетворенности
  const getSatisfactionScore = (content: string): number => {
    const match = content.match(/(\d+)\/100/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Определение цвета для индекса удовлетворенности
  const getSatisfactionColor = (score: number): string => {
    if (score >= 80) return "green";
    if (score >= 60) return "teal";
    if (score >= 40) return "yellow";
    if (score >= 20) return "orange";
    return "red";
  };

  // Отображение для состояний загрузки или отсутствия данных
  if (isLoading) {
    return (
      <Card>
        <CardBody>
          <Box textAlign="center" py={6}>
            <Text>Загрузка AI-инсайтов...</Text>
          </Box>
        </CardBody>
      </Card>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardBody>
          <Box textAlign="center" py={6}>
            <Text>AI-инсайты отсутствуют для данных обратной связи.</Text>
          </Box>
        </CardBody>
      </Card>
    );
  }

  return (
    <Box>
      {/* Сводка */}
      {summaryInsights.length > 0 && (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              <HStack>
                <Icon as={FiInfo} />
                <Text>Общая сводка</Text>
              </HStack>
            </Heading>
            <VStack spacing={4} align="stretch">
              {summaryInsights.map((insight) => (
                <Box key={insight.id}>
                  <Text>{insight.content}</Text>
                  <HStack mt={2}>
                    <Badge colorScheme="blue">
                      Уверенность: {Math.round(insight.confidence_score * 100)}%
                    </Badge>
                    <Text fontSize="sm" color="gray.500">
                      Создано:{" "}
                      {new Date(insight.created_at).toLocaleDateString()}
                    </Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Индекс удовлетворенности */}
      {satisfactionInsights.length > 0 && (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              <HStack>
                <Icon as={FiCheckCircle} />
                <Text>Индекс удовлетворенности</Text>
              </HStack>
            </Heading>
            <VStack spacing={6} align="stretch">
              {satisfactionInsights.map((insight) => {
                const score = getSatisfactionScore(insight.content);
                const colorScheme = getSatisfactionColor(score);

                return (
                  <Box key={insight.id}>
                    <Stat mb={2}>
                      <StatLabel>Индекс удовлетворенности</StatLabel>
                      <StatNumber>{score}/100</StatNumber>
                      <StatHelpText>
                        {score >= 50 ? (
                          <HStack>
                            <Icon as={FiTrendingUp} color="green.500" />
                            <Text>Положительная оценка</Text>
                          </HStack>
                        ) : (
                          <HStack>
                            <Icon as={FiTrendingDown} color="red.500" />
                            <Text>Отрицательная оценка</Text>
                          </HStack>
                        )}
                      </StatHelpText>
                    </Stat>
                    <Progress
                      value={score}
                      colorScheme={colorScheme}
                      size="lg"
                      borderRadius="md"
                      mb={3}
                    />
                    <Text>
                      {insight.content.replace(
                        /Satisfaction Index: \d+\/100\.\s*/,
                        ""
                      )}
                    </Text>
                    <HStack mt={2}>
                      <Badge colorScheme="blue">
                        Уверенность:{" "}
                        {Math.round(insight.confidence_score * 100)}%
                      </Badge>
                    </HStack>
                  </Box>
                );
              })}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Проблемные зоны */}
      {problemInsights.length > 0 && (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              <HStack>
                <Icon as={FiAlertCircle} color="orange.500" />
                <Text>Проблемные зоны</Text>
              </HStack>
            </Heading>
            <VStack spacing={4} align="stretch">
              {problemInsights.map((insight, index) => (
                <Box
                  key={insight.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={borderColor}
                  bg={bgColor}
                >
                  <Flex justify="space-between">
                    <Heading size="sm" mb={2}>
                      Проблема #{index + 1}
                    </Heading>
                    <Tooltip
                      label={`Уверенность: ${Math.round(
                        insight.confidence_score * 100
                      )}%`}
                    >
                      <Badge
                        colorScheme={
                          insight.confidence_score >= 0.8
                            ? "red"
                            : insight.confidence_score >= 0.6
                            ? "orange"
                            : "yellow"
                        }
                      >
                        {insight.confidence_score >= 0.8
                          ? "Высокий приоритет"
                          : insight.confidence_score >= 0.6
                          ? "Средний приоритет"
                          : "Низкий приоритет"}
                      </Badge>
                    </Tooltip>
                  </Flex>
                  <Text>{insight.content}</Text>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}

      {/* Риски */}
      {riskInsights.length > 0 && (
        <Card mb={6}>
          <CardBody>
            <Heading size="md" mb={4}>
              <HStack>
                <Icon as={FiAlertCircle} color="red.500" />
                <Text>Идентифицированные риски</Text>
              </HStack>
            </Heading>
            <VStack spacing={4} align="stretch">
              {riskInsights.map((insight, index) => (
                <Box
                  key={insight.id}
                  p={4}
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor={borderColor}
                  bg={bgColor}
                  borderLeftWidth="4px"
                  borderLeftColor="red.500"
                >
                  <Flex justify="space-between">
                    <Heading size="sm" mb={2}>
                      Риск #{index + 1}
                    </Heading>
                    <Badge colorScheme="red">
                      Уверенность: {Math.round(insight.confidence_score * 100)}%
                    </Badge>
                  </Flex>
                  <Text>{insight.content}</Text>
                </Box>
              ))}
            </VStack>
          </CardBody>
        </Card>
      )}
    </Box>
  );
};

export default FeedbackAIInsightsPanel;
