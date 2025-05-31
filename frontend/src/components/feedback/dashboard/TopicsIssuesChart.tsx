import React from "react";
import {
  Box,
  Heading,
  useColorModeValue,
  Flex,
  Spinner,
  Text,
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface TopicIssueData {
  name: string;
  count: number;
  percentage: number;
}

interface TopicsIssuesChartProps {
  title: string;
  data: TopicIssueData[];
  isLoading: boolean;
  colors?: string[];
}

const TopicsIssuesChart: React.FC<TopicsIssuesChartProps> = ({
  title,
  data,
  isLoading,
  colors = ["#3182CE", "#63B3ED", "#90CDF4", "#BEE3F8", "#4299E1", "#2B6CB0"],
}) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const tooltipBg = useColorModeValue("white", "gray.700");

  // Сортируем данные по количеству (по убыванию)
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  // Берем только топ-10 для отображения
  const limitedData = sortedData.slice(0, 10);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          bg={tooltipBg}
          p={2}
          borderRadius="md"
          boxShadow="sm"
          border="1px solid"
          borderColor={borderColor}
        >
          <Text fontWeight="bold">{label}</Text>
          <Text>{`Количество: ${payload[0].value}`}</Text>
          <Text>{`Доля: ${payload[0].payload.percentage.toFixed(1)}%`}</Text>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box
      bg={bgColor}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
      p={4}
      h="400px"
    >
      <Heading size="md" mb={4}>
        {title}
      </Heading>

      {isLoading ? (
        <Flex justify="center" align="center" h="300px">
          <Spinner data-testid="loading-spinner" />
        </Flex>
      ) : limitedData.length === 0 ? (
        <Flex justify="center" align="center" h="300px">
          <Text color="gray.500">Нет данных для отображения</Text>
        </Flex>
      ) : (
        <ResponsiveContainer width="100%" height={330}>
          <BarChart
            data={limitedData}
            margin={{ top: 5, right: 20, bottom: 60, left: 0 }}
            layout="vertical"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
            />
            <XAxis type="number" tick={{ fill: textColor }} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: textColor }}
              width={150}
              tickFormatter={(value) => {
                // Ограничиваем длину названия темы
                return value.length > 20
                  ? `${value.substring(0, 18)}...`
                  : value;
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" fill="#3182CE" radius={[0, 4, 4, 0]}>
              {limitedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default TopicsIssuesChart;
