/**
 * Константы позиционирования для системы дизайна OnboardPro.
 * Этот файл содержит все значения отступов, размеров и позиционирования,
 * которые должны использоваться во всем приложении для обеспечения согласованности.
 */

// Отступы (padding)
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  xxl: "3rem", // 48px
  "3xl": "4rem", // 64px
};

// Размеры (margins)
export const margins = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  xxl: "3rem", // 48px
  "3xl": "4rem", // 64px
};

// Значения для сетки (grid)
export const grid = {
  containerMaxWidth: "1400px",
  gutterWidth: "2rem",
  columnCount: 12,
};

// Z-индексы для контроля слоев
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

// Размеры компонентов
export const componentSizes = {
  button: {
    sm: {
      height: "32px",
      fontSize: "0.875rem",
      padding: "0 0.75rem",
    },
    md: {
      height: "40px",
      fontSize: "1rem",
      padding: "0 1.5rem", // Изменено с 0 1rem
    },
    lg: {
      height: "48px",
      fontSize: "1.125rem",
      padding: "0 1.5rem",
    },
  },
  input: {
    sm: {
      height: "32px",
      fontSize: "0.875rem",
      padding: "0 0.75rem",
    },
    md: {
      height: "40px",
      fontSize: "1rem",
      padding: "0 1rem",
    },
    lg: {
      height: "48px",
      fontSize: "1.125rem",
      padding: "0 1.5rem",
    },
  },
  card: {
    padding: spacing.lg,
    borderRadius: "0.5rem",
  },
  modal: {
    padding: spacing.lg,
  },
};

// Анимация и переходы
export const animation = {
  transition: {
    fast: "0.1s ease",
    normal: "0.2s ease",
    slow: "0.3s ease",
  },
};

// Позиционирование ключевых UI-элементов
export const layout = {
  header: {
    height: "64px",
  },
  sidebar: {
    width: "280px",
    collapsedWidth: "80px",
  },
  footer: {
    height: "60px",
  },
};

// Размещение для сетки
export const positioning = {
  center: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  centerHorizontal: {
    display: "flex",
    justifyContent: "center",
  },
  centerVertical: {
    display: "flex",
    alignItems: "center",
  },
  spaceBetween: {
    display: "flex",
    justifyContent: "space-between",
  },
  spaceAround: {
    display: "flex",
    justifyContent: "space-around",
  },
  flexStart: {
    display: "flex",
    justifyContent: "flex-start",
  },
  flexEnd: {
    display: "flex",
    justifyContent: "flex-end",
  },
};

// Экспортируем все константы как единый объект для удобства импорта
const designTokens = {
  spacing,
  margins,
  grid,
  zIndex,
  componentSizes,
  animation,
  layout,
  positioning,
};

export default designTokens;
