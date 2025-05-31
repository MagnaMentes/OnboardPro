import axios from "axios";
import {
  FeedbackTrendSnapshot,
  FeedbackTrendRule,
  FeedbackTrendAlert,
  DashboardData,
  RuleFormData,
  AlertResolveData,
} from "../types/dashboard";

const API_URL = "/api/feedback/";

// API для работы со снимками трендов
const getTrendSnapshots = async (
  params?: Record<string, any>
): Promise<FeedbackTrendSnapshot[]> => {
  const response = await axios.get(`${API_URL}snapshots/`, { params });
  return response.data;
};

const getDashboardData = async (
  params?: Record<string, any>
): Promise<DashboardData> => {
  const response = await axios.get(`${API_URL}snapshots/dashboard_data/`, {
    params,
  });
  return response.data;
};

const generateTrendSnapshots = async (): Promise<{
  success: boolean;
  snapshots_created: number;
  message: string;
}> => {
  const response = await axios.post(`${API_URL}snapshots/generate/`);
  return response.data;
};

// API для работы с правилами трендов
const getTrendRules = async (
  params?: Record<string, any>
): Promise<FeedbackTrendRule[]> => {
  const response = await axios.get(`${API_URL}trend_rules/`, { params });
  return response.data;
};

const getTrendRule = async (id: number): Promise<FeedbackTrendRule> => {
  const response = await axios.get(`${API_URL}trend_rules/${id}/`);
  return response.data;
};

const createTrendRule = async (
  data: RuleFormData
): Promise<FeedbackTrendRule> => {
  const response = await axios.post(`${API_URL}trend_rules/`, data);
  return response.data;
};

const updateTrendRule = async (
  id: number,
  data: RuleFormData
): Promise<FeedbackTrendRule> => {
  const response = await axios.put(`${API_URL}trend_rules/${id}/`, data);
  return response.data;
};

const deleteTrendRule = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}trend_rules/${id}/`);
};

const checkTrendRule = async (
  id: number
): Promise<{ alerts_created: number; message: string }> => {
  const response = await axios.post(`${API_URL}trend_rules/${id}/check/`);
  return response.data;
};

const checkAllTrendRules = async (): Promise<{
  alerts_created: number;
  message: string;
}> => {
  const response = await axios.post(`${API_URL}trend_rules/check_all/`);
  return response.data;
};

// API для работы с алертами трендов
const getTrendAlerts = async (
  params?: Record<string, any>
): Promise<FeedbackTrendAlert[]> => {
  const response = await axios.get(`${API_URL}trend_alerts/`, { params });
  return response.data;
};

const getTrendAlert = async (id: number): Promise<FeedbackTrendAlert> => {
  const response = await axios.get(`${API_URL}trend_alerts/${id}/`);
  return response.data;
};

const resolveTrendAlert = async (
  id: number,
  data: AlertResolveData
): Promise<FeedbackTrendAlert> => {
  const response = await axios.post(
    `${API_URL}trend_alerts/${id}/resolve/`,
    data
  );
  return response.data;
};

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
