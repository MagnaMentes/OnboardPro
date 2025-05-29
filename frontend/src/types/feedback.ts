// Типы шаблонов обратной связи
export enum TemplateType {
  AUTOMATIC = "automatic",
  MANUAL = "manual",
}

// Типы вопросов обратной связи
export enum QuestionType {
  SCALE = "scale",
  TEXT = "text",
  MULTIPLE_CHOICE = "multiple_choice",
}

// Типы инсайтов обратной связи
export enum InsightType {
  PROBLEM_AREA = "problem_area",
  SUMMARY = "summary",
  RISK = "risk",
  SATISFACTION = "satisfaction",
}

// Тональность обратной связи
export enum FeedbackSentiment {
  POSITIVE = "positive",
  NEGATIVE = "negative",
  NEUTRAL = "neutral",
}

// Интерфейс для шаблона обратной связи
export interface FeedbackTemplate {
  id: number;
  title: string;
  description: string;
  type: TemplateType;
  creator_id?: number;
  creator_name?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  questions?: FeedbackQuestion[];
}

// Интерфейс для вопроса обратной связи
export interface FeedbackQuestion {
  id?: number;
  template_id?: number;
  text: string;
  type: QuestionType;
  order: number;
  required: boolean;
  options?: any; // Для вариантов выбора
}

// Интерфейс для обратной связи пользователя
export interface UserFeedback {
  id: number;
  template: FeedbackTemplate;
  template_id: number;
  user_id: number;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
  submitter_id?: number;
  submitter_name?: string;
  onboarding_step_id?: number;
  onboarding_step_name?: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  answers?: FeedbackAnswer[];
  insights?: FeedbackInsight[];
}

// Интерфейс для ответа на вопрос обратной связи
export interface FeedbackAnswer {
  id: number;
  feedback_id: number;
  question_id: number;
  question_text: string;
  question_type: QuestionType;
  text_answer?: string;
  scale_answer?: number;
  choice_answer?: string[] | any;
}

// Интерфейс для AI-инсайта обратной связи
export interface FeedbackInsight {
  id: number;
  feedback_id?: number;
  template_id?: number;
  type: InsightType;
  content: string;
  confidence_score: number;
  created_at: string;
}

// Интерфейс для старой версии обратной связи (для обратной совместимости)
export interface Feedback {
  id: number;
  comment: string;
  sentiment: string;
  auto_tags?: string[];
  user: {
    first_name: string;
    last_name: string;
  };
  created_at: string;
  content?: string;
  submitted_by?: number;
  submitted_by_name?: string;
  step_id?: number;
  step_name?: string;
  anonymized?: boolean;
}
