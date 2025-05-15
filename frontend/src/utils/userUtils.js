/**
 * Утилиты для работы с данными пользователей
 */

/**
 * Форматирует имя пользователя для отображения.
 * Возвращает имя и фамилию пользователя, если они доступны,
 * иначе возвращает email.
 *
 * @param {Object} user - Объект с данными пользователя
 * @param {string} user.first_name - Имя пользователя (опционально)
 * @param {string} user.last_name - Фамилия пользователя (опционально)
 * @param {string} user.email - Email пользователя
 * @returns {string} Отформатированное имя для отображения
 */
export const formatUserDisplayName = (user) => {
  if (!user) return "";

  // Возвращаем только имя, если оно доступно
  if (user.first_name) {
    return user.first_name;
  }

  return user.email || "";
};

/**
 * Форматирует имя пользователя для отображения по его ID.
 * Используется в компонентах, где у вас есть ID пользователя и массив пользователей.
 *
 * @param {number|string} userId - ID пользователя
 * @param {Array<Object>} users - Массив объектов пользователей
 * @returns {string} Отформатированное имя для отображения
 */
export const getUserDisplayNameById = (userId, users) => {
  if (!userId || !users || !users.length) return "";

  const user = users.find((u) => u.id === userId || u.id === Number(userId));
  if (!user) return "";

  return formatUserDisplayName(user);
};

/**
 * Возвращает инициалы пользователя на основе имени и фамилии.
 * Используется для аватаров и других элементов UI.
 *
 * @param {Object} user - Объект с данными пользователя
 * @returns {string} Инициалы пользователя (например, "ИФ")
 */
export const getUserInitials = (user) => {
  if (!user) return "";

  if (user.first_name && user.last_name) {
    return `${user.first_name.charAt(0)}${user.last_name.charAt(
      0
    )}`.toUpperCase();
  }

  if (user.email) {
    return user.email.charAt(0).toUpperCase();
  }

  return "";
};

/**
 * Проверяет, заполнены ли имя и фамилия у пользователя.
 *
 * @param {Object} user - Объект с данными пользователя
 * @returns {boolean} true, если имя и фамилия заполнены
 */
export const hasFullName = (user) => {
  if (!user) return false;
  return Boolean(user.first_name && user.last_name);
};
