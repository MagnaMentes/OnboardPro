import React, { useState } from "react";
import {
  Box,
  useColorModeValue,
  Select,
  Flex,
  Spinner,
  Text,
  Heading,
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TrendData {
  date: string;
  value: number;
  formattedDate?: string;
}

interface TrendChartProps {
  title: string;
  data: TrendData[];
  isLoading: boolean;
  color?: string;
  valueFormatter?: (value: number) => string;
  periodOptions?: { label: string; value: string }[];
  onPeriodChange?: (value: string) => void;
}

const TrendChart: React.FC<TrendChartProps> = ({
  title,
  data,
  isLoading,
  color = "#3182CE",
  valueFormatter = (value) => value.toFixed(1),
  periodOptions = [
    { label: "7 дней", value: "7" },
    { label: "30 дней", value: "30" },
    { label: "90 дней", value: "90" },
  ],
  onPeriodChange,
}) => {
  const [period, setPeriod] = useState("30");
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const tooltipBg = useColorModeValue("white", "gray.700");

  const formatData = (data: TrendData[] = []) => {
    return data.map((item) => ({
      ...item,
      formattedDate: format(new Date(item.date), "dd MMM", { locale: ru }),
    }));
  };

  // Обработчик изменения периода
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value;
    setPeriod(newPeriod);
    if (onPeriodChange) {
      onPeriodChange(newPeriod);
    }
  };

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
          <Text fontWeight="bold">{payload[0].payload.formattedDate}</Text>
          <Text color={color}>{valueFormatter(payload[0].value)}</Text>
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
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">{title}</Heading>
        <Select
          value={period}
          onChange={handlePeriodChange}
          w="150px"
          size="sm"
        >
          {periodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" h="300px">
          <Spinner data-testid="loading-spinner" />
        </Flex>
      ) : data.length === 0 ? (
        <Flex justify="center" align="center" h="300px">
          <Text color="gray.500">Нет данных для отображения</Text>
        </Flex>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={formatData(data)}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" tick={{ fill: textColor }} />
            <YAxis tick={{ fill: textColor }} tickFormatter={valueFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={true}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default TrendChart;
