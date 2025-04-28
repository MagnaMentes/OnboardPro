/**
 * API клиент для приложения OnboardPro
 * Предоставляет единую точку доступа к бэкенд API
 * с поддержкой работы как в Docker, так и в локальной разработке
 */

// Получаем базовый URL API
export const getApiBaseUrl = () => {
  // Если приложение запущено локально, используем localhost
  // Иначе используем значение из переменной окружения или пустую строку (относительный путь)
  return window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : process.env.REACT_APP_API_URL || "";
};

/**
 * Выполняет API запрос с настройками по умолчанию
 * @param {string} endpoint - Конечная точка API (без базового URL)
 * @param {Object} options - Опции fetch API
 * @returns {Promise<any>} - Результат запроса в формате JSON
 */
export const apiRequest = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  // Добавляем токен авторизации, если он есть
  const token = localStorage.getItem("token");
  if (token && !options.headers?.Authorization) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  console.log(`API запрос: ${url}`);

  try {
    const response = await fetch(url, options);

    // Если ответ не OK (не 2xx), выбрасываем ошибку
    if (!response.ok) {
      // Если ответ 401, значит токен недействителен
      if (response.status === 401) {
        localStorage.removeItem("token"); // Удаляем недействительный токен
      }

      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.detail || `Ошибка запроса: ${response.status}`
      );
    }

    // Для всех остальных ответов пытаемся распарсить JSON
    return await response.json();
  } catch (error) {
    console.error(`Ошибка API запроса к ${url}:`, error);
    throw error;
  }
};

/**
 * API для работы с пользователями
 */
export const usersApi = {
  /**
   * Получить текущего пользователя
   * @returns {Promise<Object>} - Данные пользователя
   */
  getCurrentUser: () => apiRequest("/users/me"),

  /**
   * Получить всех пользователей
   * @returns {Promise<Array>} - Список пользователей
   */
  getAllUsers: () => apiRequest("/users"),

  /**
   * Получить пользователя по ID
   * @param {number} id - ID пользователя
   * @returns {Promise<Object>} - Данные пользователя
   */
  getUserById: (id) => apiRequest(`/users/${id}`),
};

/**
 * API для работы с аутентификацией
 */
export const authApi = {
  /**
   * Вход в систему
   * @param {string} email - Email пользователя
   * @param {string} password - Пароль пользователя
   * @returns {Promise<Object>} - Данные авторизации с токеном
   */
  login: (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    return apiRequest("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });
  },
};

/**
 * API для работы с задачами
 */
export const tasksApi = {
  /**
   * Получить все задачи
   * @returns {Promise<Array>} - Список задач
   */
  getAllTasks: () => apiRequest("/tasks"),

  /**
   * Создать новую задачу
   * @param {Object} taskData - Данные задачи
   * @returns {Promise<Object>} - Созданная задача
   */
  createTask: (taskData) =>
    apiRequest("/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    }),

  /**
   * Обновить статус задачи
   * @param {number} taskId - ID задачи
   * @param {string} status - Новый статус
   * @returns {Promise<Object>} - Обновленная задача
   */
  updateTaskStatus: (taskId, status) =>
    apiRequest(`/tasks/${taskId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    }),
};

export default {
  getApiBaseUrl,
  apiRequest,
  users: usersApi,
  auth: authApi,
  tasks: tasksApi,
};
