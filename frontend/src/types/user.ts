// Интерфейс пользователя системы
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  department?: string;
  status?: string;
  position?: string;
  hire_date?: string;
  last_active?: string;
  avatar?: string;
  manager?: number;
  progress?: number;
  risk_score?: number;
  date_joined: string | null;
}

// Роли пользователей
export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
  HR = "hr",
}

// Статусы пользователей
export enum UserStatus {
  ACTIVE = "active",
  PENDING = "pending",
  INACTIVE = "inactive",
  ONBOARDING = "onboarding",
}
