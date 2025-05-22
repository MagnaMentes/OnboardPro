import api from "./client";

// Тип для отзыва о шаге
export interface StepFeedback {
  id: number;
  user_email: string;
  step_name: string;
  comment: string;
  auto_tag: string;
  auto_tag_display: string;
  sentiment_score: number;
  created_at: string;
}

// Тип для настроения по назначению
export interface FeedbackMood {
  id: number;
  user_email: string;
  value: string;
  value_display: string;
  comment: string;
  created_at: string;
}

// Тип для всей обратной связи по назначению
export interface AssignmentFeedback {
  assignment_id: number;
  program_name: string;
  user_email: string;
  moods: FeedbackMood[];
  step_feedbacks: StepFeedback[];
}

// API запросы
const feedbackApi = {
  // Получение всех отзывов по конкретному назначению
  getAssignmentFeedback: async (
    assignmentId: number
  ): Promise<AssignmentFeedback> => {
    const response = await api.get(`/api/feedback/assignment/${assignmentId}/`);
    return response.data;
  },
};

export default feedbackApi;
