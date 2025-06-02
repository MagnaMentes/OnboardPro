import axios from "axios";
import apiClient from "./apiClient";
import {
  FeedbackTrendSnapshot,
  FeedbackTrendRule,
  FeedbackTrendAlert,
  DashboardData,
  RuleFormData,
  AlertResolveData,
} from "../types/dashboard";

// Trend Snapshots
export const getTrendSnapshots = async (params: Record<string, any>) => {
  const response = await apiClient.get("feedback/dashboard/trend-snapshots/", {
    params,
  });
  return response.data;
};

export const getDashboardData = async (
  params: Record<string, any>
): Promise<DashboardData> => {
  try {
    const response = await apiClient.get(
      "feedback/dashboard/trend-snapshots/dashboard-data/",
      { params }
    );

    // Проверка структуры данных и применение fallback при необходимости
    if (!response.data || !response.data.current_period) {
      console.error("Invalid dashboard data format:", response);
      // Возвращаем fallback данные, если структура неправильная
      return {
        trends: {
          sentiment_scores: [],
          satisfaction_indices: [],
          response_counts: [],
        },
        current_period: {
          average_sentiment: 0,
          average_satisfaction: 0,
          total_responses: 0,
          response_rate: 0,
        },
        previous_period: {
          average_sentiment: 0,
          average_satisfaction: 0,
          total_responses: 0,
          response_rate: 0,
        },
        topics: [],
        issues: [],
      };
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    // В случае ошибки тоже возвращаем заглушку
    return {
      trends: {
        sentiment_scores: [],
        satisfaction_indices: [],
        response_counts: [],
      },
      current_period: {
        average_sentiment: 0,
        average_satisfaction: 0,
        total_responses: 0,
        response_rate: 0,
      },
      previous_period: {
        average_sentiment: 0,
        average_satisfaction: 0,
        total_responses: 0,
        response_rate: 0,
      },
      topics: [],
      issues: [],
    };
  }
};

export const generateTrendSnapshots = async () => {
  const response = await apiClient.post(
    "feedback/dashboard/trend-snapshots/generate/"
  );
  return response.data;
};

// Trend Rules
export const getTrendRules = async (): Promise<FeedbackTrendRule[]> => {
  const response = await apiClient.get("feedback/dashboard/trend-rules/");
  return response.data;
};

export const getTrendRule = async (id: number): Promise<FeedbackTrendRule> => {
  const response = await apiClient.get(`feedback/dashboard/trend-rules/${id}/`);
  return response.data;
};

export const createTrendRule = async (ruleData: RuleFormData) => {
  const response = await apiClient.post(
    "feedback/dashboard/trend-rules/",
    ruleData
  );
  return response.data;
};

export const updateTrendRule = async (
  ruleId: number,
  ruleData: RuleFormData
) => {
  const response = await apiClient.put(
    `feedback/dashboard/trend-rules/${ruleId}/`,
    ruleData
  );
  return response.data;
};

export const deleteTrendRule = async (ruleId: number) => {
  const response = await apiClient.delete(
    `feedback/dashboard/trend-rules/${ruleId}/`
  );
  return response.data;
};

export const checkTrendRule = async (ruleId: number) => {
  const response = await apiClient.post(
    `feedback/dashboard/trend-rules/${ruleId}/check/`
  );
  return response.data;
};

export const checkAllTrendRules = async () => {
  const response = await apiClient.post(
    "feedback/dashboard/trend-rules/check-all/"
  );
  return response.data;
};

// Trend Alerts
export const getTrendAlerts = async (): Promise<FeedbackTrendAlert[]> => {
  const response = await apiClient.get("feedback/dashboard/trend-alerts/");
  return response.data;
};

export const getTrendAlert = async (
  id: number
): Promise<FeedbackTrendAlert> => {
  const response = await apiClient.get(
    `feedback/dashboard/trend-alerts/${id}/`
  );
  return response.data;
};

export const resolveTrendAlert = async (
  alertId: number,
  data?: AlertResolveData
) => {
  const response = await apiClient.post(
    `feedback/dashboard/trend-alerts/${alertId}/resolve/`,
    data
  );
  return response.data;
};

// Объединяем все методы в один объект для экспорта
const dashboardApi = {
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
};

export default dashboardApi;
