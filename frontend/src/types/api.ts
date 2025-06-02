// Типы для работы с API

// Объект пагинации, используемый в многостраничных API ответах
export interface Pagination {
  count: number;
  next: string | null;
  previous: string | null;
}

// Обобщенный тип для ответа с пагинацией
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Обобщенный ответ от API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: string;
}

// Объект ошибки API
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
