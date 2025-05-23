// Общие типы для использования в API
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

// Тип для шага онбординга
export interface OnboardingStep {
  id: number;
  name: string;
  description: string;
  step_type: string;
  order: number;
  program: number;
  is_required: boolean;
  is_virtual_meeting: boolean;
  deadline_days: number | null;
}
