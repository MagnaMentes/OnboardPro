import { User } from "./user";
import { Department } from "./department";

// Интерфейс для статуса онбординга
export interface OnboardingProgress {
  id: number;
  user: number;
  onboarding_plan: number;
  progress: number;
  is_completed: boolean;
  start_date: string;
  estimated_end_date: string | null;
  completed_date: string | null;
  risk_score: number;
  last_updated: string;
}

// Интерфейс для результатов тестов
export interface TestResult {
  id: number;
  user: number;
  test: number;
  test_name: string;
  score: number;
  passed: boolean;
  completion_date: string;
  attempt: number;
}

// Интерфейс для наград пользователя
export interface UserBadge {
  id: number;
  user: number;
  badge: number;
  badge_name: string;
  badge_icon: string;
  acquired_date: string;
}

// Интерфейс для достижений пользователя
export interface UserAchievement {
  id: number;
  user: number;
  achievement: number;
  achievement_name: string;
  achievement_description: string;
  acquired_date: string;
}

// Интерфейс для AI-инсайтов
export interface AIInsight {
  id: number;
  user: number;
  type: string;
  content: string;
  importance: number;
  generated_at: string;
  is_read: boolean;
}

// Интерфейс для фидбеков
export interface Feedback {
  id: number;
  sender: number;
  receiver: number;
  content: string;
  rating: number;
  sentiment: string;
  created_at: string;
}

// Интерфейс для аналитических данных пользователя
export interface UserAnalytics extends User {
  department: Department;
  onboarding_progress: OnboardingProgress;
  test_results: TestResult[];
  badges: UserBadge[];
  achievements: UserAchievement[];
  ai_insights: AIInsight[];
  completed_steps_count: number;
  total_steps_count: number;
  avg_test_score: number;
  feedback_count: number;
  last_activity: string | null;
  risk_score: number;
  engagement_score: number;
}
