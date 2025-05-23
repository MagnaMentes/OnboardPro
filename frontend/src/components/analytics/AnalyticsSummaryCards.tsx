import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  Stat,
  StatArrow,
  StatGroup,
  StatHelpText,
  StatLabel,
  StatNumber,
  Spinner,
  Center,
} from "@chakra-ui/react";
import { FC } from "react";
// @ts-ignore
import { AnalyticsSummary } from "../../api/analytics";
import {
  FiUsers,
  FiCheckCircle,
  FiBarChart2,
  FiSmile,
  FiMessageSquare,
  FiAward,
} from "react-icons/fi";

interface DashboardCardsProps {
  data: AnalyticsSummary | null;
  isLoading: boolean;
}

const AnalyticsSummaryCards: FC<DashboardCardsProps> = ({
  data,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Center py={10}>
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  if (!data) {
    return (
      <Box textAlign="center" py={10}>
        Нет данных для отображения
      </Box>
    );
  }

  const metrics = [
    {
      title: "Активные назначения",
      value: data.active_onboarding_count,
      icon: FiUsers,
      color: "blue.500",
      helpText: `${data.total_assignments_count} всего назначений`,
    },
    {
      title: "Завершённые",
      value: data.completed_assignments_count,
      icon: FiCheckCircle,
      color: "green.500",
      helpText: `${(
        (data.completed_assignments_count / data.total_assignments_count) *
        100
      ).toFixed(1)}% от общего числа`,
    },
    {
      title: "Средний прогресс",
      value: `${data.average_progress_percentage}%`,
      icon: FiBarChart2,
      color: "purple.500",
      helpText: "По всем активным назначениям",
    },
    {
      title: "Настроение",
      value: moodToText(data.feedback.average_mood_last_7_days),
      icon: FiSmile,
      color: getMoodColor(data.feedback.average_mood_last_7_days),
      helpText: `За последние 7 дней (${data.feedback.total_mood_count} отзывов)`,
    },
    {
      title: "Отзывы о шагах",
      value: data.feedback.total_step_feedback_count,
      icon: FiMessageSquare,
      color: "blue.400",
      helpText: "Комментарии к шагам онбординга",
    },
    {
      title: "Тесты",
      value: `${data.tests.success_rate_percentage}%`,
      icon: FiAward,
      color: "orange.500",
      helpText: `Успешных: ${data.tests.passed} из ${data.tests.total_taken}`,
    },
  ];

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
      {metrics.map((metric, index) => (
        <Card key={index} shadow="md" borderRadius="lg">
          <CardHeader pb={0}>
            <Heading size="sm" fontWeight="medium" color="gray.500">
              {metric.title}
            </Heading>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatNumber fontSize="2xl" color={metric.color}>
                {metric.value}
              </StatNumber>
              <StatHelpText fontSize="sm">{metric.helpText}</StatHelpText>
            </Stat>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
};

// Вспомогательные функции для интерпретации настроения
function moodToText(value: number): string {
  if (value >= 4.5) return "Отлично";
  if (value >= 3.5) return "Хорошо";
  if (value >= 2.5) return "Нейтрально";
  if (value >= 1.5) return "Плохо";
  return "Ужасно";
}

function getMoodColor(value: number): string {
  if (value >= 4.5) return "green.500";
  if (value >= 3.5) return "green.400";
  if (value >= 2.5) return "yellow.400";
  if (value >= 1.5) return "orange.400";
  return "red.500";
}

export default AnalyticsSummaryCards;
