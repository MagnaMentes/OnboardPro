/**
 * Утилиты для управления заголовками страниц
 * @version 1.0.0
 * @date 29.04.2025
 */

/**
 * Устанавливает заголовок страницы в формате "OnboardPro - название страницы"
 * @param {string} pageTitle - Название страницы
 */
export const setPageTitle = (pageTitle) => {
  if (pageTitle && pageTitle.trim() !== '') {
    document.title = `OnboardPro - ${pageTitle}`;
  } else {
    document.title = 'OnboardPro';
  }
};

/**
 * Сбрасывает заголовок страницы к дефолтному "OnboardPro"
 */
export const resetPageTitle = () => {
  document.title = 'OnboardPro';
};