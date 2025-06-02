import apiClient from "./apiClient";
import {
  IntelligenceDashboardOverview,
  UserIntelligenceDashboard,
  DepartmentIntelligenceDashboard,
  IntelligenceAlerts,
  OnboardingAnomaly,
  OnboardingRiskPrediction,
  ResolveAnomalyRequest,
} from "../types/intelligence";

const API_BASE_PATH = "/api/intelligence";

// Получение общей панели управления
export const getIntelligenceDashboardOverview =
  async (): Promise<IntelligenceDashboardOverview> => {
    const response = await apiClient.get(
      `${API_BASE_PATH}/dashboard/overview/`
    );
    return response.data;
  };

// Получение данных по пользователю
export const getUserIntelligenceDashboard = async (
  userId: number
): Promise<UserIntelligenceDashboard> => {
  const response = await apiClient.get(
    `${API_BASE_PATH}/dashboard/user/${userId}/`
  );
  return response.data;
};

// Получение данных по департаменту
export const getDepartmentIntelligenceDashboard = async (
  departmentId: number
): Promise<DepartmentIntelligenceDashboard> => {
  const response = await apiClient.get(
    `${API_BASE_PATH}/dashboard/department/${departmentId}/`
  );
  return response.data;
};

// Получение предупреждений о рисках и аномалиях
export const getIntelligenceAlerts = async (): Promise<IntelligenceAlerts> => {
  const response = await apiClient.get(`${API_BASE_PATH}/dashboard/alerts/`);
  return response.data;
};

// Получение списка всех аномалий с фильтрацией
export const getAnomalies = async (filters?: {
  user?: number;
  department?: number;
  anomaly_type?: string;
  resolved?: boolean;
}): Promise<OnboardingAnomaly[]> => {
  const response = await apiClient.get(`${API_BASE_PATH}/anomalies/`, {
    params: filters,
  });
  return response.data;
};

// Получение конкретной аномалии
export const getAnomaly = async (
  anomalyId: number
): Promise<OnboardingAnomaly> => {
  const response = await apiClient.get(
    `${API_BASE_PATH}/anomalies/${anomalyId}/`
  );
  return response.data;
};

// Разрешение аномалии
export const resolveAnomaly = async (
  anomalyId: number,
  data: ResolveAnomalyRequest
): Promise<void> => {
  await apiClient.post(
    `${API_BASE_PATH}/anomalies/${anomalyId}/resolve/`,
    data
  );
};

// Получение списка прогнозов рисков с фильтрацией
export const getRiskPredictions = async (filters?: {
  user?: number;
  department?: number;
  risk_type?: string;
  severity?: string;
}): Promise<OnboardingRiskPrediction[]> => {
  const response = await apiClient.get(`${API_BASE_PATH}/risks/`, {
    params: filters,
  });
  return response.data;
};

// Получение конкретного прогноза риска
export const getRiskPrediction = async (
  riskId: number
): Promise<OnboardingRiskPrediction> => {
  const response = await apiClient.get(`${API_BASE_PATH}/risks/${riskId}/`);
  return response.data;
};
