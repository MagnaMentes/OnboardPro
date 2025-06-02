import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  SmartInsightsService,
  AIRecommendationsService,
} from "../../services/aiInsights";
import SmartInsightsHub from "../../pages/admin/SmartInsightsHub";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// Мокаем сервисы
jest.mock("../../services/aiInsights", () => ({
  SmartInsightsService: {
    getInsightStats: jest.fn(),
    getInsights: jest.fn(),
    aggregateInsights: jest.fn(),
  },
  AIRecommendationsService: {
    getRecommendationStats: jest.fn(),
    getRecommendations: jest.fn(),
    generateAllRecommendations: jest.fn(),
  },
}));

describe("SmartInsightsHub Component", () => {
  beforeEach(() => {
    // Настраиваем моки перед каждым тестом
    (SmartInsightsService.getInsightStats as jest.Mock).mockResolvedValue({
      total: 10,
      by_level: { critical: 2, high: 3, medium: 4, low: 1, informational: 0 },
      by_type: {
        training: 3,
        feedback: 4,
        schedule: 2,
        analytics: 1,
        recommendation: 0,
      },
      by_status: {
        new: 5,
        acknowledged: 2,
        in_progress: 1,
        resolved: 1,
        dismissed: 1,
      },
    });

    (
      AIRecommendationsService.getRecommendationStats as jest.Mock
    ).mockResolvedValue({
      total: 8,
      by_priority: { high: 2, medium: 4, low: 2 },
      by_type: { training: 3, feedback: 3, progress: 1, general: 1 },
      by_status: { active: 5, accepted: 2, rejected: 1, expired: 0 },
    });

    (
      AIRecommendationsService.getRecommendations as jest.Mock
    ).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });

    (SmartInsightsService.getInsights as jest.Mock).mockResolvedValue({
      results: [],
      count: 0,
      next: null,
      previous: null,
    });
  });

  test("отображает заголовок и статистику", async () => {
    render(
      <BrowserRouter>
        <SmartInsightsHub />
      </BrowserRouter>
    );

    // Проверяем заголовок
    expect(screen.getByText("Smart Insights Hub")).toBeInTheDocument();

    // Ожидаем загрузку статистики
    await waitFor(() => {
      expect(screen.getByText("Всего инсайтов")).toBeInTheDocument();
      expect(screen.getByText("10")).toBeInTheDocument(); // Общее количество инсайтов
      expect(screen.getByText("Критические инсайты")).toBeInTheDocument();
      expect(screen.getByText("2")).toBeInTheDocument(); // Количество критических инсайтов
      expect(screen.getByText("Всего рекомендаций")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument(); // Общее количество рекомендаций
    });
  });

  test("запускает генерацию рекомендаций при клике на кнопку", async () => {
    (
      AIRecommendationsService.generateAllRecommendations as jest.Mock
    ).mockResolvedValue({
      message: "Генерация рекомендаций запущена успешно",
    });

    render(
      <BrowserRouter>
        <SmartInsightsHub />
      </BrowserRouter>
    );

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(
        screen.getByText("Сгенерировать рекомендации")
      ).toBeInTheDocument();
    });

    // Нажимаем на кнопку генерации рекомендаций
    fireEvent.click(screen.getByText("Сгенерировать рекомендации"));

    // Проверяем, что метод был вызван
    await waitFor(() => {
      expect(
        AIRecommendationsService.generateAllRecommendations
      ).toHaveBeenCalled();
    });

    // Проверяем сообщение об успехе
    await waitFor(() => {
      expect(
        screen.getByText("Генерация рекомендаций запущена успешно")
      ).toBeInTheDocument();
    });
  });

  test("запускает агрегацию инсайтов при клике на кнопку", async () => {
    (SmartInsightsService.aggregateInsights as jest.Mock).mockResolvedValue({
      message: "Агрегация инсайтов запущена успешно",
    });

    render(
      <BrowserRouter>
        <SmartInsightsHub />
      </BrowserRouter>
    );

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("Агрегировать инсайты")).toBeInTheDocument();
    });

    // Нажимаем на кнопку агрегации инсайтов
    fireEvent.click(screen.getByText("Агрегировать инсайты"));

    // Проверяем, что метод был вызван
    await waitFor(() => {
      expect(SmartInsightsService.aggregateInsights).toHaveBeenCalled();
    });

    // Проверяем сообщение об успехе
    await waitFor(() => {
      expect(
        screen.getByText("Агрегация инсайтов запущена успешно")
      ).toBeInTheDocument();
    });
  });

  test("переключает вкладки между инсайтами и рекомендациями", async () => {
    render(
      <BrowserRouter>
        <SmartInsightsHub />
      </BrowserRouter>
    );

    // Ждем загрузки компонента
    await waitFor(() => {
      expect(screen.getByText("Инсайты")).toBeInTheDocument();
      expect(screen.getByText("Рекомендации")).toBeInTheDocument();
    });

    // По умолчанию активна вкладка Инсайты
    expect(screen.getByRole("tab", { name: "Инсайты" })).toHaveAttribute(
      "aria-selected",
      "true"
    );

    // Нажимаем на вкладку Рекомендации
    fireEvent.click(screen.getByText("Рекомендации"));

    // Проверяем, что вкладка Рекомендации теперь активна
    await waitFor(() => {
      expect(screen.getByRole("tab", { name: "Рекомендации" })).toHaveAttribute(
        "aria-selected",
        "true"
      );
    });
  });
});
