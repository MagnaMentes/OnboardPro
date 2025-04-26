/**
 * Конфигурация API для приложения OnboardPro
 * Все URL-адреса API централизованы в этом файле
 * для обеспечения единого управления API-запросами
 */

// Базовый URL для API
export const API_BASE_URL = "http://localhost:8000";

// Структура эндпоинтов API
export const API = {
  // Эндпоинты для работы с пользователями
  users: {
    me: `${API_BASE_URL}/users/me`,
    login: `${API_BASE_URL}/login`,
    list: `${API_BASE_URL}/users`,
    create: `${API_BASE_URL}/users`,
    update: (id) => `${API_BASE_URL}/users/${id}`,
    delete: (id) => `${API_BASE_URL}/users/${id}`,
    toggleStatus: (id) => `${API_BASE_URL}/users/${id}/toggle-status`,
    resetPassword: (id) => `${API_BASE_URL}/users/${id}/reset-password`,
  },

  // Эндпоинты для работы с задачами
  tasks: {
    list: `${API_BASE_URL}/tasks`,
    create: `${API_BASE_URL}/tasks`,
    update: (id) => `${API_BASE_URL}/tasks/${id}`,
    delete: (id) => `${API_BASE_URL}/tasks/${id}`,
    updateStatus: (id) => `${API_BASE_URL}/tasks/${id}/status`,
  },

  // Эндпоинты для работы с планами онбординга
  plans: {
    list: `${API_BASE_URL}/plans`,
    create: `${API_BASE_URL}/plans`,
    update: (id) => `${API_BASE_URL}/plans/${id}`,
    delete: (id) => `${API_BASE_URL}/plans/${id}`,
  },

  // Эндпоинты для работы с обратной связью
  feedback: {
    list: `${API_BASE_URL}/feedback`,
    create: `${API_BASE_URL}/feedback`,
    update: (id) => `${API_BASE_URL}/feedback/${id}`,
    delete: (id) => `${API_BASE_URL}/feedback/${id}`,
  },
};

// Вспомогательные функции для работы с API
export const apiHelpers = {
  // Функция для получения стандартных заголовков авторизации
  authHeaders: () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  },

  // Функция для получения заголовков формы
  formHeaders: () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    };
  },
};

export default API;
