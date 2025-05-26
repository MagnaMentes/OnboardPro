// Интерфейс для обратной связи
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

// Тональность обратной связи
export enum FeedbackSentiment {
  POSITIVE = "positive",
  NEGATIVE = "negative",
  NEUTRAL = "neutral",
}
