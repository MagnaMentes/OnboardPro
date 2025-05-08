/**
 * OnboardPro UI Theme - единая система стандартизированных стилей
 *
 * Этот файл содержит все константы для обеспечения единообразия дизайна по всему приложению
 */

// Цветовая палитра
export const COLORS = {
  // Основные цвета
  primary: {
    50: "#EBF5FF",
    100: "#E1EFFE",
    200: "#C3DDFD",
    300: "#A4CAFE",
    400: "#76A9FA",
    500: "#3F83F8", // Основной цвет бренда
    600: "#1C64F2",
    700: "#1A56DB",
    800: "#1E429F",
    900: "#233876",
  },
  secondary: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280", // Основной вторичный цвет
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  success: {
    50: "#F0FDF4",
    100: "#DCFCE7",
    200: "#BBF7D0",
    300: "#86EFAC",
    400: "#4ADE80",
    500: "#22C55E", // Основной цвет успеха
    600: "#16A34A",
    700: "#15803D",
    800: "#166534",
    900: "#14532D",
  },
  warning: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F59E0B", // Основной цвет предупреждения
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  danger: {
    50: "#FEF2F2",
    100: "#FEE2E2",
    200: "#FECACA",
    300: "#FCA5A5",
    400: "#F87171",
    500: "#EF4444", // Основной цвет опасности
    600: "#DC2626",
    700: "#B91C1C",
    800: "#991B1B",
    900: "#7F1D1D",
  },
  // Дополнительные цвета
  info: {
    500: "#3B82F6",
  },
  purple: {
    500: "#8B5CF6",
  },
  pink: {
    500: "#EC4899",
  },
};

// Отступы (в пикселях)
export const SPACING = {
  none: "0",
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  xxl: "3rem", // 48px
};

// Отступы между элементами (в пикселях)
export const LAYOUT_SPACING = {
  section: "2.5rem", // 40px отступ между секциями
  component: "1.5rem", // 24px отступ между компонентами
  element: "1rem", // 16px отступ между элементами внутри компонента
  item: "0.5rem", // 8px минимальный отступ между соседними элементами
};

// Размер шрифта
export const FONT_SIZE = {
  xs: "0.75rem", // 12px
  sm: "0.875rem", // 14px
  base: "1rem", // 16px
  lg: "1.125rem", // 18px
  xl: "1.25rem", // 20px
  "2xl": "1.5rem", // 24px
  "3xl": "1.875rem", // 30px
  "4xl": "2.25rem", // 36px
};

// Скругления
export const BORDER_RADIUS = {
  none: "0",
  sm: "0.125rem", // 2px
  DEFAULT: "0.25rem", // 4px
  md: "0.375rem", // 6px
  lg: "0.5rem", // 8px
  xl: "0.75rem", // 12px
  "2xl": "1rem", // 16px
  "3xl": "1.5rem", // 24px
  full: "9999px", // Полное скругление (для круглых элементов)
};

// Тени
export const SHADOWS = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

// Анимации
export const TRANSITIONS = {
  DEFAULT: "all 0.2s ease",
  fast: "all 0.1s ease",
  slow: "all 0.3s ease",
};

// Классы состояний задач
export const TASK_STATUS_CLASSES = {
  not_started: {
    bg: "bg-gray-100",
    text: "text-gray-800",
    icon: "ClipboardIcon",
  },
  in_progress: {
    bg: "bg-blue-100",
    text: "text-blue-800",
    icon: "ClockIcon",
  },
  completed: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: "CheckCircleIcon",
  },
};

// Классы приоритетов задач
export const TASK_PRIORITY_CLASSES = {
  low: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
  },
  medium: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
  },
  high: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
  },
};

// Единый компонентный стиль для кнопок
export const BUTTON_STYLES = {
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  sizes: {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
    xl: "px-6 py-3 text-base",
  },
  variants: {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-700 focus:ring-gray-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    warning:
      "bg-yellow-500 hover:bg-yellow-600 text-white focus:ring-yellow-500",
    info: "bg-blue-100 hover:bg-blue-200 text-blue-700 focus:ring-blue-400",
    outline:
      "bg-transparent border border-gray-300 hover:bg-gray-100 text-gray-700 focus:ring-gray-400",
    link: "bg-transparent underline text-blue-600 hover:text-blue-700 focus:ring-blue-400",
    icon: "bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-700 focus:ring-gray-400",
  },
  disabled: "opacity-50 cursor-not-allowed",
};

// Единый компонентный стиль для форм
export const FORM_STYLES = {
  label: "block text-sm font-medium text-gray-700 mb-1",
  input:
    "shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md",
  select:
    "shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md",
  checkbox: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded",
  radio: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300",
  formGroup: "mb-4",
  helpText: "mt-1 text-xs text-gray-500",
  errorText: "mt-1 text-xs text-red-600",
};

// Единый компонентный стиль для карточек
export const CARD_STYLES = {
  base: "bg-white rounded-lg shadow-md overflow-hidden",
  header: "px-4 py-3 border-b bg-gray-50",
  body: "p-4",
  footer: "px-4 py-3 border-t bg-gray-50",
  title: "font-medium text-gray-800",
};

// Стили для таблиц
export const TABLE_STYLES = {
  table: "min-w-full divide-y divide-gray-200",
  thead: "bg-gray-50",
  th: "px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
  tbody: "bg-white divide-y divide-gray-200",
  td: "px-4 py-3 whitespace-nowrap",
  tdText: "text-sm text-gray-900",
  tdSecondary: "text-sm text-gray-500",
  hoverable: "hover:bg-gray-50",
};

// Функция для получения полного стиля кнопки
export const getButtonClassName = (
  variant = "primary",
  size = "md",
  disabled = false
) => {
  return `${BUTTON_STYLES.base} ${BUTTON_STYLES.variants[variant]} ${
    BUTTON_STYLES.sizes[size]
  } ${disabled ? BUTTON_STYLES.disabled : ""}`;
};

export default {
  COLORS,
  SPACING,
  LAYOUT_SPACING,
  FONT_SIZE,
  BORDER_RADIUS,
  SHADOWS,
  TRANSITIONS,
  TASK_STATUS_CLASSES,
  TASK_PRIORITY_CLASSES,
  BUTTON_STYLES,
  FORM_STYLES,
  CARD_STYLES,
  TABLE_STYLES,
  getButtonClassName,
};
