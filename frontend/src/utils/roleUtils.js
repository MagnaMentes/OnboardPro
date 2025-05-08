/**
 * Набор утилит для работы с ролями пользователей
 * Обеспечивает единообразную обработку ролей независимо от регистра
 */

/**
 * Проверяет, имеет ли пользователь указанную роль
 * @param {Object|string} user - объект пользователя или строка с ролью
 * @param {string|Array<string>} role - проверяемая роль или массив ролей
 * @returns {boolean} результат проверки
 */
export const hasRole = (user, role) => {
  if (!user) return false;

  // Если role - это массив, делегируем обработку функции hasAnyRole
  if (Array.isArray(role)) {
    return hasAnyRole(user, role);
  }

  // Проверяем, что role является строкой
  if (typeof role !== "string") {
    console.warn("hasRole: role должна быть строкой или массивом строк");
    return false;
  }

  // Если передан объект пользователя
  if (typeof user === "object") {
    return user?.role?.toLowerCase() === role.toLowerCase();
  }

  // Если передана строка с ролью
  if (typeof user === "string") {
    return user.toLowerCase() === role.toLowerCase();
  }

  return false;
};

/**
 * Проверяет, имеет ли пользователь одну из указанных ролей
 * @param {Object|string} user - объект пользователя или строка с ролью
 * @param {Array<string>} roles - массив проверяемых ролей
 * @returns {boolean} результат проверки
 */
export const hasAnyRole = (user, roles) => {
  if (!user || !roles || !Array.isArray(roles) || roles.length === 0) {
    return false;
  }

  // Если передан объект пользователя
  if (typeof user === "object") {
    if (!user?.role) return false;
    return roles.some(
      (role) =>
        typeof role === "string" &&
        user.role.toLowerCase() === role.toLowerCase()
    );
  }

  // Если передана строка с ролью
  if (typeof user === "string") {
    return roles.some(
      (role) =>
        typeof role === "string" && user.toLowerCase() === role.toLowerCase()
    );
  }

  return false;
};

/**
 * Нормализует роль к нижнему регистру
 * @param {string} role - роль для нормализации
 * @returns {string} нормализованная роль
 */
export const normalizeRole = (role) => {
  if (!role) return "";
  return typeof role === "string" ? role.toLowerCase() : "";
};
