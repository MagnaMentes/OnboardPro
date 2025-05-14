import React, { useState, useEffect } from "react";

/**
 * Компонент для отображения визуальной индикации при изменении статуса задачи
 *
 * @param {boolean} show - Показывать ли индикатор
 * @param {string} status - Новый статус задачи
 * @param {Function} onAnimationComplete - Функция, вызываемая при завершении анимации
 */
const StatusChangeIndicator = ({ show, status, onAnimationComplete }) => {
  // Состояние для отслеживания видимости
  const [isVisible, setIsVisible] = useState(false);

  // Цвета для разных статусов
  const statusColors = {
    completed: "bg-green-400",
    in_progress: "bg-blue-400",
    not_started: "bg-gray-400",
  };

  // Текст для разных статусов
  const statusText = {
    completed: "Задача выполнена",
    in_progress: "Задача в работе",
    not_started: "Задача не начата",
  };

  // Иконки для разных статусов (эмодзи)
  const statusIcons = {
    completed: "✅",
    in_progress: "🔄",
    not_started: "⏳",
  };

  // Эффект для показа и скрытия индикатора
  useEffect(() => {
    if (show) {
      setIsVisible(true);

      // Через 1.5 секунды скрываем индикатор
      const timer = setTimeout(() => {
        setIsVisible(false);

        // Через еще 300мс (время анимации скрытия) уведомляем о завершении
        setTimeout(() => {
          if (onAnimationComplete) onAnimationComplete();
        }, 300);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [show, onAnimationComplete]);

  // Если не нужно показывать, возвращаем null
  if (!show) return null;

  return (
    <div
      className={`
        fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
        flex items-center justify-center px-6 py-4 rounded-lg shadow-lg
        ${statusColors[status] || "bg-gray-400"} text-white
        transition-all duration-300
        ${isVisible ? "opacity-95 scale-100" : "opacity-0 scale-95"}
      `}
    >
      <div className="text-4xl mr-3">{statusIcons[status]}</div>
      <div className="text-xl font-medium">
        {statusText[status] || "Статус изменен"}
      </div>
    </div>
  );
};

export default StatusChangeIndicator;
