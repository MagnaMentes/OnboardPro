// Типы данных для метрик и алертов
export interface HRMetrics {
  active_onboarding_count: number;
  avg_completion_rate: number;
  overdue_steps_count: number;
  negative_feedback_rate: number;
  avg_sentiment_score: number;
  avg_department_completion_rate: number;
  open_alerts_count: number;
  high_severity_alerts_count: number;
}

export interface DepartmentMetrics {
  department_id: number;
  department_name: string;
  active_employees: number;
  completed_employees: number;
  completion_rate: number;
  avg_sentiment: number;
  open_alerts: number;
}

export interface HRAlert {
  id: number;
  title: string;
  message: string;
  rule_name: string;
  severity: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "dismissed";
  department_name?: string;
  created_at: string;
  updated_at: string;
  resolved_by_name?: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface HRAlertRule {
  id: number;
  name: string;
  description: string;
  severity: "low" | "medium" | "high";
  is_active: boolean;
  metric_key: string;
  threshold_value: number;
  comparison: "gt" | "lt" | "eq";
  notify_hr: boolean;
  notify_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface HRMetricSnapshot {
  id: number;
  timestamp: string;
  metric_key: string;
  metric_value: number;
  department?: number;
}
