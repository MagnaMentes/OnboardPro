// Используем предварительно настроенный axios-клиент с базовым URL и интерцепторами аутентификации
import api from "../api/client";
import {
  SmartInsight,
  SmartInsightDetail,
  InsightFilters,
  InsightTag,
  InsightStats,
  AIRecommendation,
  AIRecommendationDetail,
  RecommendationFilters,
  RecommendationStats,
  RecommendationActionRequest,
  GenerateRecommendationsRequest,
} from "../types/aiInsights";
import { PaginatedResponse } from "../types/api";

// Исправляем путь к API для корректной работы с JWT-аутентификацией
const AI_URL = `/v2/ai`;

// Сервис для работы с AI-инсайтами
export const SmartInsightsService = {
  // Получение списка инсайтов с фильтрацией и пагинацией
  async getInsights(
    filters?: InsightFilters,
    page: number = 1
  ): Promise<PaginatedResponse<SmartInsight>> {
    const params = { page, ...filters };
    const response = await api.get(`${AI_URL}/insights/`, { params });
    return response.data;
  },

  // Получение детальной информации об инсайте
  async getInsightById(id: number): Promise<SmartInsightDetail> {
    const response = await api.get(`${AI_URL}/insights/${id}/`);
    return response.data;
  },

  // Разрешение инсайта
  async resolveInsight(id: number): Promise<SmartInsight> {
    const response = await api.post(`${AI_URL}/insights/${id}/resolve/`);
    return response.data;
  },

  // Отклонение инсайта
  async dismissInsight(id: number): Promise<SmartInsight> {
    const response = await api.post(`${AI_URL}/insights/${id}/dismiss/`);
    return response.data;
  },

  // Подтверждение инсайта
  async acknowledgeInsight(id: number): Promise<SmartInsight> {
    const response = await api.post(`${AI_URL}/insights/${id}/acknowledge/`);
    return response.data;
  },

  // Установка статуса "в обработке" для инсайта
  async markInsightInProgress(id: number): Promise<SmartInsight> {
    const response = await api.post(
      `${AI_URL}/insights/${id}/mark_in_progress/`
    );
    return response.data;
  },

  // Получение инсайтов для конкретного пользователя
  async getInsightsByUser(
    userId: number,
    filters?: InsightFilters,
    page: number = 1
  ): Promise<PaginatedResponse<SmartInsight>> {
    const params = { page, ...filters, user_id: userId };
    const response = await api.get(`${AI_URL}/insights/by_user/`, {
      params,
    });
    return response.data;
  },

  // Получение инсайтов для конкретного отдела
  async getInsightsByDepartment(
    departmentId: number,
    filters?: InsightFilters,
    page: number = 1
  ): Promise<PaginatedResponse<SmartInsight>> {
    const params = { page, ...filters, department_id: departmentId };
    const response = await api.get(`${AI_URL}/insights/by_department/`, {
      params,
    });
    return response.data;
  },

  // Запуск агрегации инсайтов
  async aggregateInsights(): Promise<{ message: string }> {
    const response = await api.post(`${AI_URL}/insights/aggregate/`);
    return response.data;
  },

  // Получение тегов инсайтов
  async getTags(category?: string): Promise<InsightTag[]> {
    const params = category ? { category } : {};
    const response = await api.get(`${AI_URL}/tags/`, { params });
    return response.data.results;
  },

  // Получение статистики по инсайтам
  async getInsightStats(): Promise<InsightStats> {
    const response = await api.get(`${AI_URL}/insights/stats/`);
    return response.data;
  },
};

// Сервис для работы с AI-рекомендациями
export const AIRecommendationsService = {
  // Получение списка рекомендаций с фильтрацией и пагинацией
  async getRecommendations(
    filters?: RecommendationFilters,
    page: number = 1
  ): Promise<PaginatedResponse<AIRecommendation>> {
    const params = { page, ...filters };
    const response = await api.get(`${AI_URL}/recommendations/`, { params });
    return response.data;
  },

  // Получение детальной информации о рекомендации
  async getRecommendationById(id: number): Promise<AIRecommendationDetail> {
    const response = await api.get(`${AI_URL}/recommendations/${id}/`);
    return response.data;
  },

  // Принятие рекомендации
  async acceptRecommendation(
    id: number,
    data?: RecommendationActionRequest
  ): Promise<AIRecommendation> {
    const response = await api.post(
      `${AI_URL}/recommendations/${id}/accept/`,
      data || {}
    );
    return response.data;
  },

  // Отклонение рекомендации
  async rejectRecommendation(
    id: number,
    data?: RecommendationActionRequest
  ): Promise<AIRecommendation> {
    const response = await api.post(
      `${AI_URL}/recommendations/${id}/reject/`,
      data || {}
    );
    return response.data;
  },

  // Получение рекомендаций для конкретного пользователя
  async getRecommendationsByUser(
    userId: number,
    filters?: RecommendationFilters,
    page: number = 1
  ): Promise<PaginatedResponse<AIRecommendation>> {
    const params = { page, ...filters, user_id: userId };
    const response = await api.get(`${AI_URL}/recommendations/by_user/`, {
      params,
    });
    return response.data;
  },

  // Генерация рекомендаций для пользователя
  async generateRecommendations(
    data: GenerateRecommendationsRequest
  ): Promise<{ message: string }> {
    const response = await api.post(
      `${AI_URL}/recommendations/generate/`,
      data
    );
    return response.data;
  },

  // Генерация рекомендаций для всех пользователей
  async generateAllRecommendations(): Promise<{ message: string }> {
    const response = await api.post(`${AI_URL}/recommendations/generate_all/`);
    return response.data;
  },

  // Получение статистики по рекомендациям
  async getRecommendationStats(): Promise<RecommendationStats> {
    const response = await api.get(`${AI_URL}/recommendations/stats/`);
    return response.data;
  },
};
