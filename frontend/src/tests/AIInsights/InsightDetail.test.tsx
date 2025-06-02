import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SmartInsightsService } from "../../services/aiInsights";
import InsightDetailPage from "../../pages/admin/InsightDetailPage";
import { BrowserRouter } from "react-router-dom";
import "@testing-library/jest-dom";

// Мокаем реакт-роутер для useParams
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: () => ({ insightId: "1" }),
  useNavigate: () => jest.fn(),
}));

// Мокаем сервисы
jest.mock("../../services/aiInsights", () => ({
  SmartInsightsService: {
    getInsightById: jest.fn(),
    resolveInsight: jest.fn(),
    dismissInsight: jest.fn(),
    acknowledgeInsight: jest.fn(),
    markInsightInProgress: jest.fn(),
  },
}));

describe("InsightDetailPage Component", () => {
  const mockInsight = {
    id: 1,
    title: "Тестовый инсайт",
    description: "Описание тестового инсайта",
    insight_type: "training",
    insight_type_display: "Обучение",
    level: "critical",
    level_display: "Критический",
    status: "new",
    status_display: "Новый",
    source: "analytics",
    metadata: {},
    tags: [
      { id: 1, name: "Тег 1", slug: "tag-1", color: "blue", description: "" },
    ],
    created_at: "2025-05-01T10:00:00Z",
    updated_at: "2025-05-01T10:00:00Z",
    user_full_name: "Иван Иванов",
    program_name: "Программа адаптации",
    department_name: "Разработка",
    tag_names: ["Тег 1"],
    related_recommendations: [
      {
        id: 1,
        title: "Связанная рекомендация",
        status: "active",
        priority: "high",
        recommendation_type: "training",
      },
    ],
  };

  beforeEach(() => {
    // Настраиваем моки перед каждым тестом
    (SmartInsightsService.getInsightById as jest.Mock).mockResolvedValue(
      mockInsight
    );
    (SmartInsightsService.resolveInsight as jest.Mock).mockResolvedValue({
      ...mockInsight,
      status: "resolved",
    });
    (SmartInsightsService.dismissInsight as jest.Mock).mockResolvedValue({
      ...mockInsight,
      status: "dismissed",
    });
    (SmartInsightsService.acknowledgeInsight as jest.Mock).mockResolvedValue({
      ...mockInsight,
      status: "acknowledged",
    });
    (SmartInsightsService.markInsightInProgress as jest.Mock).mockResolvedValue(
      { ...mockInsight, status: "in_progress" }
    );
  });

  test("отображает детальную информацию об инсайте", async () => {
    render(
      <BrowserRouter>
        <InsightDetailPage />
      </BrowserRouter>
    );

    // Ждем загрузки данных
    await waitFor(() => {
      // Проверяем заголовок и описание
      expect(screen.getByText("Тестовый инсайт")).toBeInTheDocument();
      expect(
        screen.getByText("Описание тестового инсайта")
      ).toBeInTheDocument();

      // Проверяем уровень и статус
      expect(screen.getByText("Критический")).toBeInTheDocument();
      expect(screen.getByText("Новый")).toBeInTheDocument();

      // Проверяем информацию о пользователе и отделе
      expect(screen.getByText("Иван Иванов")).toBeInTheDocument();
      expect(screen.getByText("Разработка")).toBeInTheDocument();

      // Проверяем связанные рекомендации
      expect(screen.getByText("Связанная рекомендация")).toBeInTheDocument();
    });
  });

  test('кнопка "Принять к сведению" вызывает правильный метод', async () => {
    render(
      <BrowserRouter>
        <InsightDetailPage />
      </BrowserRouter>
    );

    // Ждем загрузки компонента и кнопки
    await waitFor(() => {
      expect(screen.getByText("Принять к сведению")).toBeInTheDocument();
    });

    // Нажимаем на кнопку
    fireEvent.click(screen.getByText("Принять к сведению"));

    // Проверяем, что метод был вызван
    await waitFor(() => {
      expect(SmartInsightsService.acknowledgeInsight).toHaveBeenCalledWith(1);
    });
  });

  test('кнопка "Решено" открывает модальное окно', async () => {
    render(
      <BrowserRouter>
        <InsightDetailPage />
      </BrowserRouter>
    );

    // Ждем загрузки компонента и кнопки
    await waitFor(() => {
      expect(screen.getByText("Решено")).toBeInTheDocument();
    });

    // Нажимаем на кнопку
    fireEvent.click(screen.getByText("Решено"));

    // Проверяем, что модальное окно открылось
    await waitFor(() => {
      expect(
        screen.getByText("Подтвердите решение инсайта")
      ).toBeInTheDocument();
    });

    // Нажимаем на кнопку подтверждения в модальном окне
    fireEvent.click(screen.getByText("Подтвердить"));

    // Проверяем, что метод был вызван
    await waitFor(() => {
      expect(SmartInsightsService.resolveInsight).toHaveBeenCalledWith(1);
    });
  });

  test("отображает правильные действия в зависимости от статуса инсайта", async () => {
    // Меняем статус на "разрешено"
    (SmartInsightsService.getInsightById as jest.Mock).mockResolvedValue({
      ...mockInsight,
      status: "resolved",
      status_display: "Разрешено",
    });

    render(
      <BrowserRouter>
        <InsightDetailPage />
      </BrowserRouter>
    );

    // Ждем загрузки данных
    await waitFor(() => {
      // Проверяем, что кнопки действий недоступны для разрешенного инсайта
      expect(screen.getByText("Инсайт уже решен.")).toBeInTheDocument();
      expect(screen.queryByText("Принять к сведению")).not.toBeInTheDocument();
      expect(screen.queryByText("Решено")).not.toBeInTheDocument();
    });
  });
});
