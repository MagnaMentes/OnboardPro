import React from "react";
import { render, screen } from "@testing-library/react";
import { ChakraProvider } from "@chakra-ui/react";
import FeedbackAIInsightsPanel from "../FeedbackAIInsightsPanel";
import { FeedbackInsight, InsightType } from "../../../types/feedback";

// Моковые данные для тестирования
const mockInsights: FeedbackInsight[] = [
  {
    id: 1,
    type: InsightType.SUMMARY,
    content:
      "Общая сводка по отзывам: большинство сотрудников положительно оценивают онбординг.",
    confidence_score: 0.9,
    created_at: "2025-05-01T10:00:00Z",
  },
  {
    id: 2,
    type: InsightType.PROBLEM_AREA,
    content:
      "Выявлена проблемная область: настройка рабочего окружения. 30% сотрудников отмечают сложности.",
    confidence_score: 0.75,
    created_at: "2025-05-01T10:01:00Z",
  },
  {
    id: 3,
    type: InsightType.RISK,
    content:
      "Потенциальный риск: задержки в освоении материала могут привести к увеличению времени онбординга.",
    confidence_score: 0.68,
    created_at: "2025-05-01T10:02:00Z",
  },
  {
    id: 4,
    type: InsightType.SATISFACTION,
    content:
      "Индекс удовлетворенности: 8.3/10. 85% сотрудников удовлетворены процессом.",
    confidence_score: 0.95,
    created_at: "2025-05-01T10:03:00Z",
  },
];

describe("FeedbackAIInsightsPanel", () => {
  test("renders all insights correctly", () => {
    render(
      <ChakraProvider>
        <FeedbackAIInsightsPanel insights={mockInsights} />
      </ChakraProvider>
    );

    // Проверяем, что все инсайты отображаются
    expect(screen.getByText(/общая сводка по отзывам/i)).toBeInTheDocument();
    expect(
      screen.getByText(/выявлена проблемная область/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/потенциальный риск/i)).toBeInTheDocument();
    expect(screen.getByText(/индекс удовлетворенности/i)).toBeInTheDocument();
  });

  test("displays loading state", () => {
    render(
      <ChakraProvider>
        <FeedbackAIInsightsPanel insights={[]} isLoading={true} />
      </ChakraProvider>
    );

    // Проверяем, что отображается индикатор загрузки
    expect(screen.getByText(/загрузка аналитики/i)).toBeInTheDocument();
  });

  test("displays empty state when no insights", () => {
    render(
      <ChakraProvider>
        <FeedbackAIInsightsPanel insights={[]} />
      </ChakraProvider>
    );

    // Проверяем, что отображается сообщение об отсутствии данных
    expect(screen.getByText(/нет данных для анализа/i)).toBeInTheDocument();
  });

  test("renders satisfaction index with correct color", () => {
    render(
      <ChakraProvider>
        <FeedbackAIInsightsPanel insights={mockInsights} />
      </ChakraProvider>
    );

    // Ищем индекс удовлетворенности
    const satisfactionText = screen.getByText(/индекс удовлетворенности/i);

    // Проверяем, что он отображается с правильным форматированием
    // и содержит правильное значение
    expect(satisfactionText).toBeInTheDocument();
    expect(screen.getByText(/8.3\/10/i)).toBeInTheDocument();
    expect(screen.getByText(/85% сотрудников/i)).toBeInTheDocument();
  });

  test("renders problem areas with warning style", () => {
    render(
      <ChakraProvider>
        <FeedbackAIInsightsPanel insights={mockInsights} />
      </ChakraProvider>
    );

    // Проверяем, что проблемная область отображается
    const problemArea = screen.getByText(/выявлена проблемная область/i);
    expect(problemArea).toBeInTheDocument();

    // И содержит упоминание о настройке рабочего окружения
    expect(
      screen.getByText(/настройка рабочего окружения/i)
    ).toBeInTheDocument();
  });

  test("displays confidence scores for insights", () => {
    render(
      <ChakraProvider>
        <FeedbackAIInsightsPanel insights={mockInsights} />
      </ChakraProvider>
    );

    // Проверяем отображение показателей достоверности для разных инсайтов
    expect(screen.getByText(/90%/i)).toBeInTheDocument(); // 0.9 -> 90%
    expect(screen.getByText(/75%/i)).toBeInTheDocument(); // 0.75 -> 75%
    expect(screen.getByText(/68%/i)).toBeInTheDocument(); // 0.68 -> 68%
    expect(screen.getByText(/95%/i)).toBeInTheDocument(); // 0.95 -> 95%
  });
});
