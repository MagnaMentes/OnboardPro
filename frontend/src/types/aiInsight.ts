// Интерфейс для AI-инсайтов
export interface AIInsight {
  id: number;
  user: {
    first_name: string;
    last_name: string;
  };
  risk_level: string;
  category: string;
  description: string;
  recommendation: string;
  created_at: string;
  employee_id?: number;
  employee_name?: string;
  source_data?: string[];
  recommendations?: string[];
}

// Уровни риска
export enum RiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}
