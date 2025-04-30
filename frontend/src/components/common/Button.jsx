// Button.jsx - Переиспользуемый компонент кнопки с унифицированными стилями
import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary", // primary, secondary, outline, danger, success, text
  size = "medium", // small, medium, large
  disabled = false,
  fullWidth = false,
  className = "",
  icon = null,
  isLoading = false,
  ...props
}) {
  // Базовые классы для всех кнопок
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md focus:outline-none transition-all duration-150";

  // Классы размеров кнопок
  const sizeClasses = {
    small: "px-2.5 py-1 text-xs",
    medium: "px-4 py-2 text-sm",
    large: "px-5 py-2.5 text-base",
  };

  // Классы вариантов кнопок
  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:ring-offset-1",
    outline:
      "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
    danger:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1",
    success:
      "bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1",
    text: "text-blue-600 hover:text-blue-700 hover:underline focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 bg-transparent",
  };

  // Классы для состояния disabled
  const disabledClasses = "opacity-60 cursor-not-allowed";

  // Классы для полной ширины
  const widthClass = fullWidth ? "w-full" : "";

  // Финальный класс для кнопки
  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size] || sizeClasses.medium}
    ${variantClasses[variant] || variantClasses.primary}
    ${disabled ? disabledClasses : ""}
    ${widthClass}
    ${className}
  `;

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="mr-2">
          <div className="w-4 h-4 border-2 border-r-0 border-b-0 border-t-current border-l-current rounded-full animate-spin"></div>
        </div>
      ) : (
        icon && <span className="mr-2">{icon}</span>
      )}
      {children}
    </button>
  );
}
