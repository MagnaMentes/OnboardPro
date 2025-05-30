import React from "react";
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Grid,
  useColorModeValue,
} from "@chakra-ui/react";
import { HRMetrics } from "../../../types/hr-dashboard";

interface HRDashboardWidgetsProps {
  metrics: HRMetrics;
}

const HRDashboardWidgets: React.FC<HRDashboardWidgetsProps> = ({ metrics }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const widgets = [
    {
      label: "Активных онбордингов",
      value: metrics.active_onboarding_count,
      helpText: "Текущие процессы онбординга",
    },
    {
      label: "Средний прогресс",
      value: `${metrics.avg_completion_rate.toFixed(1)}%`,
      helpText: "Общий прогресс онбординга",
      type: metrics.avg_completion_rate > 75 ? "increase" : "decrease",
    },
    {
      label: "Просроченные шаги",
      value: metrics.overdue_steps_count,
      helpText: "Требуют внимания",
      type: metrics.overdue_steps_count > 0 ? "decrease" : "increase",
    },
    {
      label: "Негативные отзывы",
      value: `${metrics.negative_feedback_rate.toFixed(1)}%`,
      helpText: "За последние 30 дней",
      type: metrics.negative_feedback_rate > 20 ? "decrease" : "increase",
    },
    {
      label: "Средняя оценка",
      value: metrics.avg_sentiment_score.toFixed(2),
      helpText: "Настроение сотрудников",
      type: metrics.avg_sentiment_score > 0 ? "increase" : "decrease",
    },
    {
      label: "Открытые алерты",
      value: metrics.open_alerts_count,
      helpText: `${metrics.high_severity_alerts_count} критических`,
      type: metrics.high_severity_alerts_count > 0 ? "decrease" : "increase",
    },
  ];

  return (
    <Grid
      templateColumns={{
        base: "repeat(1, 1fr)",
        md: "repeat(2, 1fr)",
        lg: "repeat(3, 1fr)",
        xl: "repeat(6, 1fr)",
      }}
      gap={4}
      w="100%"
    >
      {widgets.map((widget, index) => (
        <Box
          key={index}
          p={5}
          bg={bgColor}
          borderRadius="lg"
          borderWidth="1px"
          borderColor={borderColor}
          shadow="sm"
        >
          <Stat>
            <StatLabel fontSize="sm" color="gray.500">
              {widget.label}
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold">
              {widget.value}
            </StatNumber>
            <StatHelpText>
              {widget.type && (
                <StatArrow
                  type={widget.type as "increase" | "decrease"}
                  data-testid="stat-arrow"
                />
              )}
              {widget.helpText}
            </StatHelpText>
          </Stat>
        </Box>
      ))}
    </Grid>
  );
};

export default HRDashboardWidgets;
