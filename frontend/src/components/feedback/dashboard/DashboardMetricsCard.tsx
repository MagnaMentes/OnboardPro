import React from "react";
import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  useColorModeValue,
  Icon,
  Flex,
} from "@chakra-ui/react";
import {
  FiSmile,
  FiUsers,
  FiPercent,
  FiMessageCircle,
  FiTrendingUp,
  FiTrendingDown,
} from "react-icons/fi";

interface Metric {
  title: string;
  value: string | number;
  previousValue?: string | number;
  helpText?: string;
  icon: React.ElementType;
  colorScheme: string;
}

interface DashboardMetricsCardProps {
  metrics: {
    sentiment: number;
    previousSentiment?: number;
    satisfaction: number;
    previousSatisfaction?: number;
    responseCount: number;
    previousResponseCount?: number;
    responseRate: number;
    previousResponseRate?: number;
  };
}

const DashboardMetricsCard: React.FC<DashboardMetricsCardProps> = ({
  metrics,
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const sentimentChange = metrics.previousSentiment
    ? ((metrics.sentiment - metrics.previousSentiment) /
        metrics.previousSentiment) *
      100
    : 0;
  const satisfactionChange = metrics.previousSatisfaction
    ? ((metrics.satisfaction - metrics.previousSatisfaction) /
        metrics.previousSatisfaction) *
      100
    : 0;
  const responseCountChange = metrics.previousResponseCount
    ? ((metrics.responseCount - metrics.previousResponseCount) /
        metrics.previousResponseCount) *
      100
    : 0;
  const responseRateChange = metrics.previousResponseRate
    ? ((metrics.responseRate - metrics.previousResponseRate) /
        metrics.previousResponseRate) *
      100
    : 0;

  const getSentimentLabel = (score: number) => {
    if (score >= 0.7) return "Отличное";
    if (score >= 0.5) return "Хорошее";
    if (score >= 0.3) return "Нейтральное";
    if (score >= 0.1) return "Низкое";
    return "Критическое";
  };

  const getSatisfactionLabel = (score: number) => {
    if (score >= 85) return "Отличная";
    if (score >= 70) return "Хорошая";
    if (score >= 50) return "Средняя";
    if (score >= 30) return "Низкая";
    return "Критическая";
  };

  const formatMetricValue = (metric: string, value: number) => {
    switch (metric) {
      case "sentiment":
        return `${(value * 10).toFixed(1)}/10`;
      case "satisfaction":
        return `${value.toFixed(1)}%`;
      case "responseRate":
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };

  const metricsList: Metric[] = [
    {
      title: "Настроение",
      value: formatMetricValue("sentiment", metrics.sentiment),
      previousValue: metrics.previousSentiment
        ? formatMetricValue("sentiment", metrics.previousSentiment)
        : undefined,
      helpText: getSentimentLabel(metrics.sentiment),
      icon: FiSmile,
      colorScheme:
        metrics.sentiment >= 0.5
          ? "green"
          : metrics.sentiment >= 0.3
          ? "blue"
          : "orange",
    },
    {
      title: "Удовлетворенность",
      value: formatMetricValue("satisfaction", metrics.satisfaction),
      previousValue: metrics.previousSatisfaction
        ? formatMetricValue("satisfaction", metrics.previousSatisfaction)
        : undefined,
      helpText: getSatisfactionLabel(metrics.satisfaction),
      icon: FiPercent,
      colorScheme:
        metrics.satisfaction >= 70
          ? "green"
          : metrics.satisfaction >= 50
          ? "blue"
          : "orange",
    },
    {
      title: "Количество отзывов",
      value: metrics.responseCount,
      previousValue: metrics.previousResponseCount,
      helpText: "За текущий период",
      icon: FiMessageCircle,
      colorScheme: "purple",
    },
    {
      title: "Активность отзывов",
      value: formatMetricValue("responseRate", metrics.responseRate),
      previousValue: metrics.previousResponseRate
        ? formatMetricValue("responseRate", metrics.previousResponseRate)
        : undefined,
      helpText: "% заполнения форм",
      icon: FiUsers,
      colorScheme:
        metrics.responseRate >= 60
          ? "green"
          : metrics.responseRate >= 40
          ? "blue"
          : "orange",
    },
  ];

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
      {metricsList.map((metric, index) => (
        <Box
          key={index}
          bg={bgColor}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          p={4}
          shadow="sm"
        >
          <Flex align="center" mb={2}>
            <Box
              borderRadius="md"
              bg={`${metric.colorScheme}.100`}
              color={`${metric.colorScheme}.500`}
              p={2}
              mr={3}
            >
              <Icon as={metric.icon} boxSize="24px" />
            </Box>
            <Stat>
              <StatLabel color="gray.500" fontSize="sm">
                {metric.title}
              </StatLabel>
              <StatNumber fontSize="2xl">{metric.value}</StatNumber>
              {metric.previousValue !== undefined && (
                <StatHelpText>
                  {index === 0 && (
                    <>
                      <StatArrow
                        type={sentimentChange >= 0 ? "increase" : "decrease"}
                      />
                      {Math.abs(sentimentChange).toFixed(1)}%
                    </>
                  )}
                  {index === 1 && (
                    <>
                      <StatArrow
                        type={satisfactionChange >= 0 ? "increase" : "decrease"}
                      />
                      {Math.abs(satisfactionChange).toFixed(1)}%
                    </>
                  )}
                  {index === 2 && (
                    <>
                      <StatArrow
                        type={
                          responseCountChange >= 0 ? "increase" : "decrease"
                        }
                      />
                      {Math.abs(responseCountChange).toFixed(1)}%
                    </>
                  )}
                  {index === 3 && (
                    <>
                      <StatArrow
                        type={responseRateChange >= 0 ? "increase" : "decrease"}
                      />
                      {Math.abs(responseRateChange).toFixed(1)}%
                    </>
                  )}
                </StatHelpText>
              )}
              {metric.helpText && !metric.previousValue && (
                <StatHelpText>{metric.helpText}</StatHelpText>
              )}
            </Stat>
          </Flex>
        </Box>
      ))}
    </SimpleGrid>
  );
};

export default DashboardMetricsCard;
