// Интерфейс для задания в рамках онбординга
export interface Assignment {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  program: {
    title: string;
  };
  progress: number;
  status: string;
  start_date: string;
  end_date?: string;
  title?: string;
  description?: string;
  step?: number;
  step_name?: string;
  assigned_to?: number;
  assigned_to_name?: string;
  assigned_by?: number;
  assigned_by_name?: string;
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  completion_date?: string;
  priority?: AssignmentPriority;
}

// Статусы заданий
export enum AssignmentStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  OVERDUE = "overdue",
}

// Приоритеты заданий
export enum AssignmentPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}
