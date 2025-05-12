import React from "react";
import { FORM_STYLES, BUTTON_STYLES, CARD_STYLES } from "./theme";

// Компонент кнопки с настраиваемыми стилями и вариантами
export function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  ...props
}) {
  const buttonClassName = `${BUTTON_STYLES.base} ${
    BUTTON_STYLES.variants[variant]
  } ${BUTTON_STYLES.sizes[size]} ${
    disabled ? BUTTON_STYLES.disabled : ""
  } ${className}`;

  return (
    <button className={buttonClassName} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

// Компонент для полей формы (текст, email, password и т.д.)
export function FormField({
  label,
  id,
  type = "text",
  required = false,
  error = null,
  helpText = null,
  className = "",
  rows = 3, // Для textarea
  ...props
}) {
  return (
    <div className={`${FORM_STYLES.formGroup} ${className}`}>
      <label htmlFor={id} className={FORM_STYLES.label}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {type === "textarea" ? (
        <textarea
          id={id}
          className={`${FORM_STYLES.input} ${error ? "border-red-500" : ""}`}
          rows={rows}
          {...props}
        />
      ) : (
        <input
          id={id}
          type={type}
          className={`${FORM_STYLES.input} ${error ? "border-red-500" : ""}`}
          {...props}
        />
      )}

      {helpText && <p className={FORM_STYLES.helpText}>{helpText}</p>}
      {error && <p className={FORM_STYLES.errorText}>{error}</p>}
    </div>
  );
}

// Компонент для выпадающего списка
export function SelectField({
  label,
  id,
  options = [],
  required = false,
  error = null,
  helpText = null,
  className = "",
  ...props
}) {
  return (
    <div className={`${FORM_STYLES.formGroup} ${className}`}>
      <label htmlFor={id} className={FORM_STYLES.label}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <select
        id={id}
        className={`${FORM_STYLES.select} ${error ? "border-red-500" : ""}`}
        {...props}
      >
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
}

// Компонент для чекбоксов
export function CheckboxField({
  label,
  id,
  checked,
  helpText = null,
  error = null,
  className = "",
  ...props
}) {
  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <input
          id={id}
          type="checkbox"
          className={`${FORM_STYLES.checkbox} ${error ? "border-red-500" : ""}`}
          checked={checked}
          {...props}
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={id} className="font-medium text-gray-700">
          {label}
        </label>
        {helpText && <p className={FORM_STYLES.helpText}>{helpText}</p>}
        {error && <p className={FORM_STYLES.errorText}>{error}</p>}
      </div>
    </div>
  );
}

// Компонент карточки для группировки содержимого
export function Card({ children, title, className = "", footer = null }) {
  return (
    <div className={`${CARD_STYLES.base} ${className}`}>
      {title && (
        <div className={CARD_STYLES.header}>
          <h3 className={CARD_STYLES.title}>{title}</h3>
        </div>
      )}
      <div className={CARD_STYLES.body}>{children}</div>
      {footer && <div className={CARD_STYLES.footer}>{footer}</div>}
    </div>
  );
}

export default {
  Button,
  FormField,
  SelectField,
  CheckboxField,
  Card,
};
