// Типы данных для Smart Feedback Dashboard
import { Department } from "./department";
import { FeedbackTemplate } from "./feedback";

// Типы для снимков трендов
export interface FeedbackTrendSnapshot {
  id: number;
  template?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
  date: string;
  sentiment_score: number;
  response_count: number;
  main_topics: Record<string, number>;
  common_issues: Record<string, number>;
  satisfaction_index: number;
  created_at: string;
}

// Типы для правил трендов
export enum RuleType {
  SENTIMENT_DROP = "sentiment_drop",
  SATISFACTION_DROP = "satisfaction_drop",
  RESPONSE_RATE_DROP = "response_rate_drop",
  ISSUE_FREQUENCY_RISE = "issue_frequency_rise",
  TOPIC_SHIFT = "topic_shift",
}

export interface FeedbackTrendRule {
  id: number;
  name: string;
  description: string;
  rule_type: RuleType;
  threshold: number;
  measurement_period_days: number;
  is_active: boolean;
  templates?: {
    id: number;
    name: string;
  }[];
  departments?: {
    id: number;
    name: string;
  }[];
  created_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  updated_at: string;
}

// Типы для алертов трендов
export enum AlertSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface FeedbackTrendAlert {
  id: number;
  rule: {
    id: number;
    name: string;
    rule_type: RuleType;
  };
  template?: {
    id: number;
    name: string;
  };
  department?: {
    id: number;
    name: string;
  };
  title: string;
  description: string;
  severity: AlertSeverity;
  previous_value: number | null;
  current_value: number | null;
  percentage_change: number | null;
  is_resolved: boolean;
  resolved_by?: {
    id: number;
    first_name: string;
    last_name: string;
  };
  resolved_at?: string;
  resolution_comment?: string;
  created_at: string;
}

// Интерфейс для данных дашборда
export interface DashboardData {
  trends: {
    sentiment_scores: { date: string; value: number }[];
    satisfaction_indices: { date: string; value: number }[];
    response_counts: { date: string; value: number }[];
  };
  current_period: {
    average_sentiment: number;
    average_satisfaction: number;
    total_responses: number;
    response_rate: number;
  };
  previous_period: {
    average_sentiment: number;
    average_satisfaction: number;
    total_responses: number;
    response_rate: number;
  };
  topics: {
    name: string;
    count: number;
    percentage: number;
  }[];
  issues: {
    name: string;
    count: number;
    percentage: number;
  }[];
}

// Типы для форм
export interface RuleFormData {
  id?: number;
  name: string;
  description: string;
  rule_type: string;
  threshold: number;
  measurement_period_days: number;
  is_active: boolean;
  templates: number[];
  departments: number[];
}

export interface AlertResolveData {
  resolution_comment: string;
}
