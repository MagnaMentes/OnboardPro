/**
 * API URL утилиты для унифицированной работы с URL в API
 */

// Получаем переменные окружения
export const API_URL = import.meta.env.VITE_API_URL || "";
export const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";
export const API_TIMEOUT = parseInt(
  import.meta.env.VITE_API_TIMEOUT || "10000"
);

// Формируем базовый URL на основе переменных окружения
export const baseURL = API_URL ? `${API_URL}${API_PREFIX}` : API_PREFIX;

/**
 * Функция для создания полного URL API-эндпоинта
 * @param endpoint - путь эндпоинта без ведущего слеша
 * @returns Полный URL к эндпоинту
 */
export const getApiUrl = (endpoint: string): string => {
  // Убедимся, что endpoint не начинается с "/"
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint.substring(1)
    : endpoint;
  return `${baseURL}/${cleanEndpoint}`;
};

/**
 * Логирование URL для отладочных целей
 * @param method - HTTP метод (GET, POST, etc)
 * @param url - URL запроса
 */
export const logApiCall = (method: string, url: string): void => {
  if (process.env.NODE_ENV === "development") {
    console.log(`API ${method}: ${url}`);
  }
};

/**
 * Функция для форматирования ошибок API
 * @param error - объект ошибки
 * @returns Форматированное сообщение об ошибке
 */
export const formatApiError = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Неизвестная ошибка при выполнении запроса";
};
