// Интерфейс департамента
export interface Department {
  id: number;
  name: string;
  description: string;
  manager: number | null;
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
  employee_count: number;
}

// Расширенный интерфейс департамента с аналитикой
export interface DepartmentWithAnalytics extends Department {
  avg_progress: number;
  risk_level: number;
  completion_rate: number;
}
