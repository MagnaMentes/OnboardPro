import { render, screen } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import HRDashboardWidgets from "../HRDashboardWidgets";
import { HRMetrics } from "../../../../types/hr-dashboard";

const mockMetrics: HRMetrics = {
  active_onboarding_count: 15,
  avg_completion_rate: 75.5,
  overdue_steps_count: 3,
  negative_feedback_rate: 12.3,
  avg_sentiment_score: 4.2,
  open_alerts_count: 5,
  high_severity_alerts_count: 2,
};

const renderWithChakra = (component: React.ReactNode) => {
  return render(<ChakraProvider>{component}</ChakraProvider>);
};

describe("HRDashboardWidgets", () => {
  it("отображает все виджеты с правильными значениями", () => {
    renderWithChakra(<HRDashboardWidgets metrics={mockMetrics} />);

    // Проверяем отображение активных онбордингов
    expect(screen.getByText("Активных онбордингов")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();

    // Проверяем отображение среднего прогресса
    expect(screen.getByText("Средний прогресс")).toBeInTheDocument();
    expect(screen.getByText("75.5%")).toBeInTheDocument();

    // Проверяем отображение просроченных шагов
    expect(screen.getByText("Просроченные шаги")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    // Проверяем отображение негативных отзывов
    expect(screen.getByText("Негативные отзывы")).toBeInTheDocument();
    expect(screen.getByText("12.3%")).toBeInTheDocument();

    // Проверяем отображение средней оценки
    expect(screen.getByText("Средняя оценка")).toBeInTheDocument();
    expect(screen.getByText("4.2")).toBeInTheDocument();

    // Проверяем отображение открытых алертов
    expect(screen.getByText("Открытые алерты")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("2 критических")).toBeInTheDocument();
  });

  it("отображает индикаторы тренда для метрик", () => {
    renderWithChakra(<HRDashboardWidgets metrics={mockMetrics} />);

    // Все StatArrow должны быть отображены
    const arrowElements = screen.getAllByTestId(/stat-arrow/i);
    expect(arrowElements.length).toBeGreaterThan(0);
  });
});
