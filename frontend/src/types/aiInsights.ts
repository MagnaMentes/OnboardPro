// Типы для SmartInsights Hub и AI Recommendations v2

// Типы инсайтов
export enum SmartInsightType {
  TRAINING = "training",
  FEEDBACK = "feedback",
  SCHEDULE = "schedule",
  ANALYTICS = "analytics",
  RECOMMENDATION = "recommendation",
}

// Уровни инсайтов
export enum InsightLevel {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INFORMATIONAL = "informational",
}

// Статусы инсайтов
export enum InsightStatus {
  NEW = "new",
  ACKNOWLEDGED = "acknowledged",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

// Типы рекомендаций
export enum RecommendationType {
  TRAINING = "training",
  FEEDBACK = "feedback",
  PROGRESS = "progress",
  GENERAL = "general",
}

// Приоритеты рекомендаций
export enum RecommendationPriority {
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

// Статусы рекомендаций
export enum RecommendationStatus {
  ACTIVE = "active",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

// Интерфейс для тега инсайта
export interface InsightTag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  category?: string;
}

// Интерфейс для пользователя в кратком виде
export interface UserMinimal {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

// Базовый интерфейс для AI-инсайта
export interface SmartInsight {
  id: number;
  title: string;
  description: string;
  insight_type: SmartInsightType;
  insight_type_display: string;
  level: InsightLevel;
  level_display: string;
  status: InsightStatus;
  status_display: string;
  source: string;
  source_id?: string;
  metadata: Record<string, any>;
  tags: InsightTag[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  user?: UserMinimal;
  department?: number;
  step?: number;
  assignment?: number;
}

// Расширенный интерфейс для детального просмотра AI-инсайта
export interface SmartInsightDetail extends SmartInsight {
  user_full_name?: string;
  program_name?: string;
  step_name?: string;
  department_name?: string;
  tag_names: string[];
  related_recommendations: RecommendationMinimal[];
}

// Краткий интерфейс для рекомендации
export interface RecommendationMinimal {
  id: number;
  title: string;
  status: RecommendationStatus;
  priority: RecommendationPriority;
  recommendation_type: RecommendationType;
}

// Базовый интерфейс для AI-рекомендации
export interface AIRecommendation {
  id: number;
  title: string;
  recommendation_text: string;
  recommendation_type: RecommendationType;
  recommendation_type_display: string;
  priority: RecommendationPriority;
  priority_display: string;
  status: RecommendationStatus;
  status_display: string;
  reason?: string;
  impact_description?: string;
  tags: InsightTag[];
  generated_at: string;
  expires_at?: string;
  resolved_at?: string;
  user?: UserMinimal;
  assignment?: number;
  step?: number;
  insight?: number;
  accepted_reason?: string;
  rejected_reason?: string;
  processed_by?: number;
}

// Расширенный интерфейс для детального просмотра AI-рекомендации
export interface AIRecommendationDetail extends AIRecommendation {
  user_full_name?: string;
  program_name?: string;
  step_name?: string;
  tag_names: string[];
  processed_by_name?: string;
  insight_detail?: SmartInsightMinimal;
}

// Минимальный интерфейс для AI-инсайта
export interface SmartInsightMinimal {
  id: number;
  title: string;
  level: InsightLevel;
  level_display: string;
  source: string;
}

// Интерфейс для фильтров AI-инсайтов
export interface InsightFilters {
  insight_type?: SmartInsightType[];
  level?: InsightLevel[];
  status?: InsightStatus[];
  source?: string[];
  user?: number[];
  department?: number[];
  tag_id?: number[];
  tag_slug?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Интерфейс для фильтров AI-рекомендаций
export interface RecommendationFilters {
  recommendation_type?: RecommendationType[];
  priority?: RecommendationPriority[];
  status?: RecommendationStatus[];
  user?: number[];
  assignment?: number[];
  step?: number[];
  tag_id?: number[];
  tag_slug?: string[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  show_all?: boolean;
}

// Интерфейс для статистики инсайтов
export interface InsightStats {
  total: number;
  by_level: Record<InsightLevel, number>;
  by_type: Record<SmartInsightType, number>;
  by_status: Record<InsightStatus, number>;
}

// Интерфейс для статистики рекомендаций
export interface RecommendationStats {
  total: number;
  by_priority: Record<RecommendationPriority, number>;
  by_type: Record<RecommendationType, number>;
  by_status: Record<RecommendationStatus, number>;
}

// Интерфейс для ответа принятия/отклонения рекомендации
export interface RecommendationActionRequest {
  reason?: string;
}

// Интерфейс для запроса на генерацию рекомендаций
export interface GenerateRecommendationsRequest {
  user_id?: number;
}
