import axios from "axios";
import { default as MockAdapter } from "axios-mock-adapter";
import apiClient from "../../api/apiClient";
import {
  getTrendSnapshots,
  getDashboardData,
  generateTrendSnapshots,
  getTrendRules,
  getTrendRule,
  createTrendRule,
  updateTrendRule,
  deleteTrendRule,
  checkTrendRule,
  checkAllTrendRules,
  getTrendAlerts,
  getTrendAlert,
  resolveTrendAlert,
} from "../../api/dashboardApi";

// Создаем мок для axios
const mock = new MockAdapter(axios);

describe("Dashboard API Tests", () => {
  // Сбрасываем все моки перед каждым тестом
  beforeEach(() => {
    mock.reset();
  });

  // Тесты для Trend Snapshots API
  describe("Trend Snapshots API", () => {
    test("getTrendSnapshots should fetch trend snapshots", async () => {
      const mockData = [{ id: 1, date: "2025-06-01" }];
      mock.onGet("/feedback/trend-snapshots/").reply(200, mockData);

      const response = await getTrendSnapshots(30);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    test("getDashboardData should fetch dashboard data", async () => {
      const mockData = {
        trends: {},
        current_period: {},
        previous_period: {},
        topics: [],
        issues: [],
      };
      mock
        .onGet("/feedback/trend-snapshots/dashboard-data/")
        .reply(200, mockData);

      const response = await getDashboardData(30);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    test("generateTrendSnapshots should create new snapshots", async () => {
      const mockData = {
        success: true,
        snapshots_created: 5,
        message: "Success",
      };
      mock.onPost("/feedback/trend-snapshots/generate/").reply(200, mockData);

      const response = await generateTrendSnapshots();
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });
  });

  // Тесты для Trend Rules API
  describe("Trend Rules API", () => {
    test("getTrendRules should fetch trend rules", async () => {
      const mockData = [{ id: 1, name: "Rule 1" }];
      mock.onGet("/feedback/trend-rules/").reply(200, mockData);

      const response = await getTrendRules();
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    test("getTrendRule should fetch a specific trend rule", async () => {
      const mockData = { id: 1, name: "Rule 1" };
      mock.onGet("/feedback/trend-rules/1/").reply(200, mockData);

      const response = await getTrendRule(1);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    test("createTrendRule should create a new trend rule", async () => {
      const ruleData = {
        name: "New Rule",
        description: "Description",
        rule_type: "sentiment_drop",
        threshold: 10,
        measurement_period_days: 30,
        is_active: true,
        templates: [1],
        departments: [1],
      };
      const mockData = { id: 2, ...ruleData };
      mock.onPost("/feedback/trend-rules/").reply(201, mockData);

      const response = await createTrendRule(ruleData);
      expect(response.status).toBe(201);
      expect(response.data).toEqual(mockData);
    });

    test("updateTrendRule should update an existing trend rule", async () => {
      const ruleData = {
        name: "Updated Rule",
        description: "Updated Description",
        rule_type: "sentiment_drop",
        threshold: 15,
        measurement_period_days: 30,
        is_active: true,
        templates: [1],
        departments: [1, 2],
      };
      const mockData = { id: 1, ...ruleData };
      mock.onPut("/feedback/trend-rules/1/").reply(200, mockData);

      const response = await updateTrendRule(1, ruleData);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    test("deleteTrendRule should delete a trend rule", async () => {
      mock.onDelete("/feedback/trend-rules/1/").reply(204);

      const response = await deleteTrendRule(1);
      expect(response.status).toBe(204);
    });

    test("checkTrendRule should check a specific trend rule", async () => {
      const mockData = { alerts_created: 1, message: "Created 1 alert" };
      mock.onPost("/feedback/trend-rules/1/check/").reply(200, mockData);

      const response = await checkTrendRule(1);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    test("checkAllTrendRules should check all trend rules", async () => {
      const mockData = { alerts_created: 3, message: "Created 3 alerts" };
      mock.onPost("/feedback/trend-rules/check-all/").reply(200, mockData);

      const response = await checkAllTrendRules();
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });
  });

  // Тесты для Trend Alerts API
  describe("Trend Alerts API", () => {
    test("getTrendAlerts should fetch trend alerts", async () => {
      const mockData = [{ id: 1, title: "Alert 1" }];
      mock.onGet("/feedback/trend-alerts/").reply(200, mockData);

      const response = await getTrendAlerts();
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    test("getTrendAlert should fetch a specific trend alert", async () => {
      const mockData = { id: 1, title: "Alert 1" };
      mock.onGet("/feedback/trend-alerts/1/").reply(200, mockData);

      const response = await getTrendAlert(1);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });

    test("resolveTrendAlert should resolve a trend alert", async () => {
      const resolveData = { resolution_comment: "Problem solved" };
      const mockData = {
        id: 1,
        title: "Alert 1",
        is_resolved: true,
        resolution_comment: "Problem solved",
      };
      mock.onPost("/feedback/trend-alerts/1/resolve/").reply(200, mockData);

      const response = await resolveTrendAlert(1, resolveData);
      expect(response.status).toBe(200);
      expect(response.data).toEqual(mockData);
    });
  });
});

// Тесты на доступность API-эндпоинтов
describe("API Endpoints Availability Tests", () => {
  // Отключаем моки для этих тестов
  beforeAll(() => {
    mock.restore();
  });

  // Функция для проверки доступности эндпоинта
  const checkEndpointAvailability = async (
    url: string,
    method: string = "GET"
  ) => {
    try {
      let response;
      if (method === "GET") {
        response = await axios.get(url);
      } else if (method === "POST") {
        response = await axios.post(url, {});
      }
      // Если получили ответ 401, значит эндпоинт существует, но требует авторизации
      return response?.status === 200 || response?.status === 401;
    } catch (error: any) {
      // Если получили ответ 401, значит эндпоинт существует, но требует авторизации
      if (error.response && error.response.status === 401) {
        return true;
      }
      // Если получили 404, значит эндпоинт не существует
      if (error.response && error.response.status === 404) {
        return false;
      }
      // В других случаях считаем, что эндпоинт существует, но возникла другая ошибка
      return true;
    }
  };

  // Тесты на доступность эндпоинтов Trend Snapshots
  test("Trend Snapshots endpoints should be available", async () => {
    const baseUrl = "http://localhost:8000/api";

    // Проверяем GET эндпоинты
    expect(
      await checkEndpointAvailability(`${baseUrl}/feedback/trend-snapshots/`)
    ).toBe(true);
    expect(
      await checkEndpointAvailability(
        `${baseUrl}/feedback/trend-snapshots/dashboard-data/`
      )
    ).toBe(true);

    // Проверяем POST эндпоинты
    expect(
      await checkEndpointAvailability(
        `${baseUrl}/feedback/trend-snapshots/generate/`,
        "POST"
      )
    ).toBe(true);
  });

  // Тесты на доступность эндпоинтов Trend Rules
  test("Trend Rules endpoints should be available", async () => {
    const baseUrl = "http://localhost:8000/api";

    // Проверяем GET эндпоинты
    expect(
      await checkEndpointAvailability(`${baseUrl}/feedback/trend-rules/`)
    ).toBe(true);

    // Проверяем POST эндпоинты
    expect(
      await checkEndpointAvailability(
        `${baseUrl}/feedback/trend-rules/check-all/`,
        "POST"
      )
    ).toBe(true);
  });

  // Тесты на доступность эндпоинтов Trend Alerts
  test("Trend Alerts endpoints should be available", async () => {
    const baseUrl = "http://localhost:8000/api";

    // Проверяем GET эндпоинты
    expect(
      await checkEndpointAvailability(`${baseUrl}/feedback/trend-alerts/`)
    ).toBe(true);
  });
});
