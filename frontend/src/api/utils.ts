// utils.ts - вспомогательные функции для работы с API
import { AxiosError } from "axios";

/**
 * Форматирование ошибок API для отображения пользователю
 */
export const formatApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const { response } = error;
    if (response?.data?.detail) {
      return response.data.detail;
    }
    if (response?.data?.message) {
      return response.data.message;
    }
    if (response?.status === 401) {
      return "Требуется авторизация";
    }
    if (response?.status === 403) {
      return "Доступ запрещен";
    }
    if (response?.status === 404) {
      return "Не найдено";
    }
    if (response?.status === 500) {
      return "Ошибка сервера";
    }
  }

  return "Произошла неизвестная ошибка";
};

/**
 * Обработка параметров запроса для API
 */
export const processQueryParams = (params: Record<string, any>): string => {
  const validParams = Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");

  return validParams ? `?${validParams}` : "";
};

/**
 * Парсинг даты из API
 */
export const parseApiDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Форматирование даты для отображения
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
