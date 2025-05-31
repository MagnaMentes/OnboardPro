import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import FeedbackDashboardPage from "../../../../pages/admin/FeedbackDashboardPage";
import dashboardApi from "../../../../api/dashboardApi";

// Mock the API
jest.mock("../../../../api/dashboardApi", () => ({
  getDashboardData: jest.fn(),
  getRules: jest.fn(),
  getAlerts: jest.fn(),
  getTemplatesAndDepartments: jest.fn(),
  generateTrendSnapshots: jest.fn(),
  checkAllRules: jest.fn(),
  createRule: jest.fn(),
  updateRule: jest.fn(),
  deleteRule: jest.fn(),
  toggleRuleActive: jest.fn(),
  resolveAlert: jest.fn(),
}));

// Mock the store
jest.mock("../../../../store/authStore", () => ({
  useAuthStore: jest.fn(() => ({
    user: {
      id: 1,
      role: "admin",
      first_name: "Тест",
      last_name: "Пользователь",
    },
  })),
}));

describe("FeedbackDashboardPage Component", () => {
  const mockDashboardData = {
    current_period: {
      average_sentiment: 0.75,
      average_satisfaction: 85,
      total_responses: 150,
      response_rate: 75,
    },
    previous_period: {
      average_sentiment: 0.65,
      average_satisfaction: 80,
      total_responses: 120,
      response_rate: 70,
    },
    trends: {
      sentiment_scores: [
        { date: "2023-05-01", value: 0.7 },
        { date: "2023-05-02", value: 0.75 },
        { date: "2023-05-03", value: 0.8 },
      ],
      satisfaction_indices: [
        { date: "2023-05-01", value: 80 },
        { date: "2023-05-02", value: 82 },
        { date: "2023-05-03", value: 85 },
      ],
    },
    topics: [
      { name: "Рабочая среда", count: 45, percentage: 30 },
      { name: "Коммуникация", count: 30, percentage: 20 },
      { name: "Процессы", count: 25, percentage: 16.67 },
    ],
    issues: [
      { name: "Задержки", count: 15, percentage: 10 },
      { name: "Недостаток обратной связи", count: 12, percentage: 8 },
      { name: "Технические проблемы", count: 10, percentage: 6.67 },
    ],
  };

  const mockRules = [
    {
      id: 1,
      name: "Падение настроения",
      description: "Мониторинг резкого снижения настроения сотрудников",
      rule_type: "sentiment_drop",
      threshold: 10,
      template_id: null,
      department_id: null,
      is_active: true,
      created_at: "2023-05-01T10:00:00Z",
      created_by: {
        id: 1,
        first_name: "Тест",
        last_name: "Пользователь",
      },
    },
  ];

  const mockAlerts = [
    {
      id: 1,
      rule: {
        id: 1,
        name: "Падение настроения",
        rule_type: "sentiment_drop",
      },
      title: "Падение настроения сотрудников",
      description: "Обнаружено снижение среднего настроения на 15%",
      severity: "high",
      previous_value: 0.75,
      current_value: 0.64,
      percentage_change: -15,
      is_resolved: false,
      created_at: "2023-05-15T10:30:00Z",
    },
  ];

  const mockTemplatesAndDepartments = {
    templates: [
      { id: 1, name: "Основной опрос" },
      { id: 2, name: "Опрос новых сотрудников" },
    ],
    departments: [
      { id: 1, name: "Инженерный отдел" },
      { id: 2, name: "Маркетинг" },
    ],
  };

  beforeEach(() => {
    // Setup API mock responses
    (dashboardApi.getDashboardData as jest.Mock).mockResolvedValue(
      mockDashboardData
    );
    (dashboardApi.getRules as jest.Mock).mockResolvedValue(mockRules);
    (dashboardApi.getAlerts as jest.Mock).mockResolvedValue(mockAlerts);
    (dashboardApi.getTemplatesAndDepartments as jest.Mock).mockResolvedValue(
      mockTemplatesAndDepartments
    );
    (dashboardApi.generateTrendSnapshots as jest.Mock).mockResolvedValue({
      success: true,
      message: "Снимки созданы",
    });
    (dashboardApi.checkAllRules as jest.Mock).mockResolvedValue({
      checked: 5,
      alerts_generated: 2,
    });
  });

  test("renders the dashboard with metrics and charts", async () => {
    render(<FeedbackDashboardPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText("Smart Feedback Dashboard")).toBeInTheDocument();
    });

    // Check that API calls were made
    expect(dashboardApi.getDashboardData).toHaveBeenCalled();
    expect(dashboardApi.getRules).toHaveBeenCalled();
    expect(dashboardApi.getAlerts).toHaveBeenCalled();
    expect(dashboardApi.getTemplatesAndDepartments).toHaveBeenCalled();
  });

  test("allows switching between tabs", async () => {
    render(<FeedbackDashboardPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText("Тренды")).toBeInTheDocument();
    });

    // Click on the Alerts tab
    fireEvent.click(screen.getByRole("tab", { name: /алерты/i }));

    // Should see the alerts list
    await waitFor(() => {
      expect(
        screen.getByText("Падение настроения сотрудников")
      ).toBeInTheDocument();
    });

    // Click on the Rules tab
    fireEvent.click(screen.getByRole("tab", { name: /правила/i }));

    // Should see the rules list
    await waitFor(() => {
      expect(screen.getByText("Падение настроения")).toBeInTheDocument();
    });
  });

  test("can generate trend snapshots", async () => {
    render(<FeedbackDashboardPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText("Создать снимок трендов")).toBeInTheDocument();
    });

    // Click on the generate snapshots button
    fireEvent.click(screen.getByText("Создать снимок трендов"));

    // Should call the API
    expect(dashboardApi.generateTrendSnapshots).toHaveBeenCalled();
  });

  test("can filter dashboard data by period", async () => {
    render(<FeedbackDashboardPage />);

    // Wait for the data to load
    await waitFor(() => {
      expect(screen.getByText("Период:")).toBeInTheDocument();
    });

    // Find the period selector and change it
    const periodSelector = screen.getByLabelText("Период:");
    fireEvent.change(periodSelector, { target: { value: "90" } });

    // The API should be called with the new period
    expect(dashboardApi.getDashboardData).toHaveBeenCalledWith(
      expect.objectContaining({
        period: "90",
      })
    );
  });
});
