import React from "react";
import { ChartBarIcon, ClockIcon } from "@heroicons/react/24/outline";
import {
  BUTTON_STYLES,
  FORM_STYLES,
  TASK_STATUS_CLASSES,
  TASK_PRIORITY_CLASSES,
  CARD_STYLES,
  getButtonClassName,
} from "./theme";

/**
 * Стандартная кнопка с единым стилем
 */
export const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  onClick = () => {},
  type = "button",
  ...props
}) => {
  const buttonClass = getButtonClassName(variant, size, disabled);

  return (
    <button
      className={`${buttonClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Компонент для стандартного отображения статуса задачи через иконку
 */
export const TaskStatus = ({ status, size = "md" }) => {
  const statusStyles =
    TASK_STATUS_CLASSES[status] || TASK_STATUS_CLASSES.not_started;

  // Определение размеров иконки
  const iconSize =
    {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    }[size] || "h-4 w-4";

  // Компонент иконки в зависимости от статуса
  const StatusIcon = () => {
    switch (status) {
      case "completed":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={iconSize}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "in_progress":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={iconSize}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "cancelled":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={iconSize}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default: // not_started
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={iconSize}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
    }
  };

  return (
    <span
      className={`inline-flex items-center justify-center p-1 rounded-full ${statusStyles.bg} ${statusStyles.text}`}
      title={
        status === "completed"
          ? "Выполнена"
          : status === "in_progress"
          ? "В работе"
          : status === "cancelled"
          ? "Отменена"
          : "Не начата"
      }
    >
      <StatusIcon />
    </span>
  );
};

/**
 * Компонент для стандартного отображения приоритета задачи
 */
export const TaskPriority = ({ priority }) => {
  const priorityStyles =
    TASK_PRIORITY_CLASSES[priority] || TASK_PRIORITY_CLASSES.medium;

  // Перевод приоритета для отображения
  const priorityText =
    {
      low: "Низкий",
      medium: "Средний",
      high: "Высокий",
    }[priority] || "Средний";

  return (
    <span
      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${priorityStyles.bg} ${priorityStyles.text}`}
    >
      {priorityText}
    </span>
  );
};

/**
 * Стандартный компонент поля формы с лейблом
 */
export const FormField = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder = "",
  error = "",
  helpText = "",
  required = false,
  className = "",
  icon = null,
  ...props
}) => {
  return (
    <div className={FORM_STYLES.formGroup}>
      <label htmlFor={id} className={FORM_STYLES.label}>
        {icon && <span className="mr-1.5">{icon}</span>}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${FORM_STYLES.input} ${
            error ? "border-red-500" : ""
          } ${className}`}
          required={required}
          rows="3"
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${FORM_STYLES.input} ${
            error ? "border-red-500" : ""
          } ${className}`}
          required={required}
          {...props}
        />
      )}
      {helpText && <p className={FORM_STYLES.helpText}>{helpText}</p>}
      {error && <p className={FORM_STYLES.errorText}>{error}</p>}
    </div>
  );
};

/**
 * Стандартный выпадающий список
 */
export const SelectField = ({
  label,
  id,
  value,
  onChange,
  options = [],
  placeholder = "Выберите...",
  error = "",
  helpText = "",
  required = false,
  className = "",
  ...props
}) => {
  return (
    <div className={FORM_STYLES.formGroup}>
      <label htmlFor={id} className={FORM_STYLES.label}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`${FORM_STYLES.select} ${
          error ? "border-red-500" : ""
        } ${className}`}
        required={required}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helpText && <p className={FORM_STYLES.helpText}>{helpText}</p>}
      {error && <p className={FORM_STYLES.errorText}>{error}</p>}
    </div>
  );
};

/**
 * Стандартная карточка
 */
export const Card = ({
  children,
  title,
  subtitle,
  footer,
  className = "",
  bodyClassName = "",
  ...props
}) => {
  return (
    <div className={`${CARD_STYLES.base} ${className}`} {...props}>
      {(title || subtitle) && (
        <div className={CARD_STYLES.header}>
          {title && <h3 className={CARD_STYLES.title}>{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className={`${CARD_STYLES.body} ${bodyClassName}`}>{children}</div>
      {footer && <div className={CARD_STYLES.footer}>{footer}</div>}
    </div>
  );
};

/**
 * Компонент для поля выбора приоритета задачи
 */
export const PriorityField = ({
  id,
  name,
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <div>
      <label htmlFor={id} className={FORM_STYLES.label}>
        <ChartBarIcon className="h-4 w-4 mr-1.5 inline text-gray-500" />
        Приоритет
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={`${FORM_STYLES.select} pl-9 ${className}`}
          disabled={disabled}
        >
          <option value="low">Низкий</option>
          <option value="medium">Средний</option>
          <option value="high">Высокий</option>
        </select>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              value === "high"
                ? "bg-red-500"
                : value === "medium"
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Компонент для поля выбора статуса задачи
 */
export const StatusField = ({
  id,
  name,
  value,
  onChange,
  disabled = false,
  className = "",
}) => {
  return (
    <div>
      <label htmlFor={id} className={FORM_STYLES.label}>
        <ClockIcon className="h-4 w-4 mr-1.5 inline text-gray-500" />
        Статус задачи
      </label>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          className={`${FORM_STYLES.select} pl-9 ${className}`}
          disabled={disabled}
        >
          <option value="not_started">Не начата</option>
          <option value="in_progress">В процессе</option>
          <option value="completed">Завершено</option>
          <option value="cancelled">Отменено</option>
        </select>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <span
            className={`inline-block h-3 w-3 rounded-full ${
              value === "completed"
                ? "bg-green-500"
                : value === "in_progress"
                ? "bg-blue-500"
                : value === "cancelled"
                ? "bg-gray-500"
                : "bg-yellow-500"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Компонент флажка (checkbox) с единым стилем
 */
export const CheckboxField = ({
  label,
  id,
  checked,
  onChange,
  helpText = "",
  disabled = false,
  className = "",
  ...props
}) => {
  return (
    <div className="relative flex items-start">
      <div className="flex items-center h-5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${className}`}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label
          htmlFor={id}
          className={`font-medium text-gray-700 ${
            disabled ? "opacity-70" : ""
          }`}
        >
          {label}
        </label>
        {helpText && <p className="text-gray-500">{helpText}</p>}
      </div>
    </div>
  );
};

// Экспортируем все компоненты для использования в приложении
export default {
  Button,
  TaskStatus,
  TaskPriority,
  FormField,
  SelectField,
  Card,
  PriorityField,
  StatusField,
  CheckboxField,
};
