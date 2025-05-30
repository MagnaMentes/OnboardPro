import React from "react";
import {
  Box,
  useColorModeValue,
  Select,
  Flex,
  Spinner,
  Text,
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
import { useMetricHistory } from "../../../api/useHRDashboard";

interface HRTrendChartProps {
  metricKey: string;
  departmentId?: number;
  title: string;
  color?: string;
  valueFormatter?: (value: number) => string;
}

const HRTrendChart: React.FC<HRTrendChartProps> = ({
  metricKey,
  departmentId,
  title,
  color = "#3182ce",
  valueFormatter = (value) => value.toFixed(1),
}) => {
  const [period, setPeriod] = React.useState("30");
  const { data: metrics, isLoading } = useMetricHistory(
    metricKey,
    departmentId,
    parseInt(period)
  );

  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.300");
  const tooltipBg = useColorModeValue("white", "gray.700");

  const formatData = (data: any[] = []) => {
    return data.map((item) => ({
      ...item,
      date: format(new Date(item.timestamp), "dd MMM", { locale: ru }),
      value: item.metric_value,
    }));
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
          <Text fontWeight="bold">{label}</Text>
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
        <Text fontSize="lg" fontWeight="medium">
          {title}
        </Text>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          w="150px"
          size="sm"
        >
          <option value="7">7 дней</option>
          <option value="30">30 дней</option>
          <option value="90">90 дней</option>
        </Select>
      </Flex>

      {isLoading ? (
        <Flex justify="center" align="center" h="300px">
          <Spinner data-testid="loading-spinner" />
        </Flex>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={formatData(metrics)}
            margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: textColor }} />
            <YAxis tick={{ fill: textColor }} tickFormatter={valueFormatter} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default HRTrendChart;
