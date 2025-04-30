// Input.jsx - Переиспользуемый компонент для полей ввода с унифицированными стилями
import React from "react";

export default function Input({
  type = "text",
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder = "",
  label,
  error,
  disabled = false,
  required = false,
  className = "",
  fullWidth = true,
  icon = null,
  min,
  max,
  ...props
}) {
  // Базовые классы для полей ввода
  const baseInputClasses =
    "rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500";

  // Классы для состояния с ошибкой
  const errorClasses = error ? "border-red-300" : "border-gray-300";

  // Классы для состояния disabled
  const disabledClasses = disabled
    ? "bg-gray-100 cursor-not-allowed"
    : "bg-white";

  // Классы для полной ширины
  const widthClass = fullWidth ? "w-full" : "";

  // Финальный класс для поля ввода
  const inputClasses = `${baseInputClasses} ${errorClasses} ${disabledClasses} ${widthClass} ${className}`;

  // Класс для контейнера иконки
  const iconContainerClass = icon ? "relative" : "";

  return (
    <div className={fullWidth ? "w-full" : ""}>
      {label && (
        <label
          htmlFor={id}
          className={`block text-sm font-medium ${
            error ? "text-red-600" : "text-gray-700"
          } mb-1`}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className={iconContainerClass}>
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}

        <input
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`${inputClasses} ${icon ? "pl-10" : "pl-3"} p-2 border`}
          min={min}
          max={max}
          {...props}
        />
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
