// Константы для компонента календаря
export const DRAG_TYPES = {
  TASK: "task",
};

// Другие константы системы
export const TASK_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

// URL API для компонента календаря
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

// Экспорт по умолчанию для совместимости
const constants = {
  DRAG_TYPES,
  TASK_STATUSES,
  API_BASE_URL,
};

export default constants;
