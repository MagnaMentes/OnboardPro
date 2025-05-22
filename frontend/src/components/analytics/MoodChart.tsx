import { FC, useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Spinner,
  Center,
} from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { FeedbackSummary } from "../../api/analytics";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

interface MoodChartProps {
  data: FeedbackSummary | null;
  isLoading: boolean;
}

interface ChartDataItem {
  date: string;
  Отлично: number;
  Хорошо: number;
  Нейтрально: number;
  Плохо: number;
  Ужасно: number;
  Всего: number;
  formattedDate: string;
}

const MoodChart: FC<MoodChartProps> = ({ data, isLoading }) => {
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Функция для преобразования данных API в формат для графика
  const processData = useCallback((data: FeedbackSummary) => {
    return data.days.map((day, index) => ({
      date: day,
      Отлично: data.great[index],
      Хорошо: data.good[index],
      Нейтрально: data.neutral[index],
      Плохо: data.bad[index],
      Ужасно: data.terrible[index],
      Всего: data.total[index],
      formattedDate: formatDate(day),
    }));
  }, []);

  // Форматирование даты
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd MMM", { locale: ru });
    } catch (e) {
      return dateString;
    }
  };

  // Обработка данных при их изменении
  useEffect(() => {
    if (data) {
      setChartData(processData(data));
    }
  }, [data, processData]);

  // Настройка автообновления каждые 30 секунд
  useEffect(() => {
    // Изобразим, что данные обновляются для демонстрации функционала
    // (В реальном приложении здесь был бы запрос к API)
    timerRef.current = setInterval(() => {
      if (data) {
        // Просто небольшое изменение для демонстрации обновления
        const updatedData = { ...data };
        // Случайное изменение значений для демонстрации
        data.days.forEach((_, index) => {
          if (Math.random() > 0.7) {
            // Только некоторые значения изменятся
            const change = Math.floor(Math.random() * 3) - 1; // -1, 0, или 1
            if (data.good[index] + change >= 0) {
              updatedData.good[index] += change;
            }
            if (data.neutral[index] + change >= 0) {
              updatedData.neutral[index] += change;
            }
          }
        });
        setChartData(processData(updatedData));
      }
    }, 30000); // 30 секунд

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [data, processData]);

  // Кастомный tooltip для графика
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <Box bg="white" p={3} borderRadius="md" boxShadow="md">
          <p>
            <strong>{item.formattedDate}</strong>
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
          <p>
            <strong>Всего: {item.Всего}</strong>
          </p>
        </Box>
      );
    }
    return null;
  };

  // Если данные загружаются
  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  // Если нет данных
  if (!data || chartData.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        Нет данных для отображения
      </Box>
    );
  }

  return (
    <Card shadow="md" borderRadius="lg" height="400px">
      <CardHeader>
        <Heading size="md">Динамика настроения сотрудников (14 дней)</Heading>
      </CardHeader>
      <CardBody>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 30,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} />
            <Bar dataKey="Отлично" stackId="a" fill="#48BB78" />
            <Bar dataKey="Хорошо" stackId="a" fill="#4299E1" />
            <Bar dataKey="Нейтрально" stackId="a" fill="#ECC94B" />
            <Bar dataKey="Плохо" stackId="a" fill="#ED8936" />
            <Bar dataKey="Ужасно" stackId="a" fill="#E53E3E" />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};

export default MoodChart;
