import { User } from "../store/authStore";
import { Department } from "./types";

/**
 * Типы для Intelligence Dashboard
 */

// Снимок прогресса онбординга
export interface OnboardingProgressSnapshot {
  id: number;
  user: number;
  user_full_name: string;
  user_email: string;
  assignment: number;
  department: number | null;
  department_name: string | null;
  program_name: string;
  completion_percentage: number;
  steps_total: number;
  steps_completed: number;
  steps_in_progress: number;
  steps_not_started: number;
  steps_overdue: number;
  avg_step_completion_time: string | null;
  last_activity_time: string | null;
  snapshot_date: string;
}

// Прогноз риска онбординга
export interface OnboardingRiskPrediction {
  id: number;
  user: number;
  user_full_name: string;
  user_email: string;
  assignment: number;
  department: number | null;
  department_name: string | null;
  program_name: string;
  risk_type: "completion" | "delay" | "engagement" | "knowledge";
  risk_type_display: string;
  severity: "low" | "medium" | "high";
  severity_display: string;
  probability: number;
  factors: Record<string, number>;
  estimated_impact: string;
  recommendation: string;
  created_at: string;
}

// Аномалия в онбординге
export interface OnboardingAnomaly {
  id: number;
  user: number;
  user_full_name: string;
  user_email: string;
  assignment: number;
  department: number | null;
  department_name: string | null;
  program_name: string;
  anomaly_type: string;
  anomaly_type_display: string;
  step: number | null;
  step_name: string | null;
  description: string;
  details: Record<string, any>;
  detected_at: string;
  resolved: boolean;
  resolved_at: string | null;
  resolution_notes: string | null;
}

// Сводка по департаменту
export interface OnboardingDepartmentSummary {
  id: number;
  department: number;
  department_name: string;
  active_onboardings: number;
  completed_onboardings: number;
  avg_completion_time: string | null;
  avg_completion_percentage: number;
  risk_factor: number;
  most_common_bottlenecks: {
    overdue_steps: Array<{ step_name: string; count: number }>;
    slow_steps: Array<{ step_name: string }>;
    common_anomalies: Array<{ type: string; count: number }>;
  };
  summary_date: string;
}

// Общий обзор дашборда
export interface IntelligenceDashboardOverview {
  summary: {
    total_users: number;
    active_onboardings: number;
    avg_progress: number;
    high_risks: number;
    active_anomalies: number;
  };
  departments_at_risk: OnboardingDepartmentSummary[];
  recent_anomalies: OnboardingAnomaly[];
  department_progress: Array<{
    department__name: string;
    completion_percentage: number;
  }>;
  risk_distribution: Array<{ risk_type: string; count: number }>;
  anomaly_distribution: Array<{ anomaly_type: string; count: number }>;
}

// Детальная информация по пользователю
export interface UserIntelligenceDashboard {
  user_info: {
    id: number;
    email: string;
    full_name: string;
    department: string | null;
  };
  current_snapshot: OnboardingProgressSnapshot;
  risks: OnboardingRiskPrediction[];
  anomalies: OnboardingAnomaly[];
  progress_history: Array<{
    snapshot_date: string;
    completion_percentage: number;
  }>;
}

// Детальная информация по департаменту
export interface DepartmentIntelligenceDashboard {
  department_info: {
    id: number;
    name: string;
    manager: string | null;
  };
  current_summary: OnboardingDepartmentSummary;
  risks: OnboardingRiskPrediction[];
  anomalies: OnboardingAnomaly[];
  users_with_low_progress: OnboardingProgressSnapshot[];
  progress_history: Array<{ snapshot_date: string; avg_percentage: number }>;
}

// Информация о предупреждениях
export interface IntelligenceAlerts {
  summary: {
    total_high_risks: number;
    total_anomalies: number;
    users_with_alerts: number;
    departments_with_alerts: number;
  };
  high_risks: OnboardingRiskPrediction[];
  active_anomalies: OnboardingAnomaly[];
  users_with_alerts: Array<{
    user_id: number;
    user_full_name: string;
    user_email: string;
    department_id: number | null;
    department_name: string | null;
    risks_count: number;
    anomalies_count: number;
  }>;
  departments_with_alerts: Array<{
    department_id: number;
    department_name: string;
    users_count: number;
    risks_count: number;
    anomalies_count: number;
  }>;
}

// Запрос на разрешение аномалии
export interface ResolveAnomalyRequest {
  resolution_notes?: string;
}
