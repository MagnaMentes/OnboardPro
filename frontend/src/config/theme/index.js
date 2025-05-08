// Индексный файл для всех компонентов и констант темы
import * as themeConstants from "./theme";
import ComponentsLib from "./UIComponents.jsx"; // Явно указываем расширение файла и используем один способ импорта

// Экспортируем константы из файла темы
export const {
  FORM_STYLES,
  BUTTON_STYLES,
  TASK_STATUS_CLASSES,
  TASK_PRIORITY_CLASSES,
  CARD_STYLES,
  getButtonClassName,
  LAYOUT_SPACING,
} = themeConstants;

// Экспортируем все компоненты из UIComponents напрямую
export const {
  Button,
  Card,
  TaskStatus,
  TaskPriority,
  FormField,
  SelectField,
  PriorityField,
  CheckboxField,
  StatusField,
} = ComponentsLib;

// Реэкспортируем константы для обратной совместимости
export * from "./theme";
