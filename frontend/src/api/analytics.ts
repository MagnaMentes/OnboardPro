import api from "./client";

// Типы данных для аналитики
export interface AnalyticsSummary {
  active_onboarding_count: number;
  completed_assignments_count: number;
  total_assignments_count: number;
  average_progress_percentage: number;
  feedback: {
    total_mood_count: number;
    total_step_feedback_count: number;
    average_mood_last_7_days: number;
  };
  tests: {
    total_taken: number;
    passed: number;
    success_rate_percentage: number;
  };
}

export interface AssignmentAnalytics {
  id: number;
  full_name: string;
  position: string;
  program: string;
  status: string;
  progress_percentage: number;
  assigned_at: string;
}

export interface FeedbackSummary {
  days: string[];
  great: number[];
  good: number[];
  neutral: number[];
  bad: number[];
  terrible: number[];
  total: number[];
}

// API запросы
const analyticsApi = {
  // Получение общей сводки
  getSummary: async (): Promise<AnalyticsSummary> => {
    const response = await api.get("analytics/summary/");
    return response.data;
  },

  // Получение таблицы назначений
  getAssignments: async (): Promise<AssignmentAnalytics[]> => {
    const response = await api.get("analytics/assignments/");
    return response.data;
  },

  // Получение данных о настроении для графика
  getFeedbackSummary: async (): Promise<FeedbackSummary> => {
    const response = await api.get("analytics/feedback-summary/");
    return response.data;
  },
};

export default analyticsApi;
