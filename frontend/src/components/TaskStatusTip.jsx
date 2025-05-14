import React, { useState } from "react";

/**
 * Компонент для отображения всплывающей подсказки при наведении на статус задачи
 * с дополнительной визуализацией порядка циклического переключения
 *
 * @param {React.ReactNode} children - Дочерний элемент, к которому привязывается подсказка
 * @param {React.ReactNode} content - Содержимое подсказки
 * @param {string} position - Позиция подсказки (top, bottom, left, right)
 * @param {boolean} showStatusCycle - Показывать ли индикатор циклического переключения статусов
 * @param {string} currentStatus - Текущий статус задачи (для индикатора циклического переключения)
 */
const TaskStatusTip = ({
  children,
  content,
  position = "bottom",
  showStatusCycle = false,
  currentStatus = null,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Определяем стили в зависимости от позиции
  const getPositionStyles = () => {
    switch (position) {
      case "top":
        return "bottom-full mb-2";
      case "bottom":
        return "top-full mt-2";
      case "left":
        return "right-full mr-2";
      case "right":
        return "left-full ml-2";
      default:
        return "top-full mt-2";
    }
  };

  // Компонент для отображения индикатора циклического переключения статусов
  const StatusCycleIndicator = () => {
    // Порядок статусов для циклического переключения
    const statusCycle = ["not_started", "in_progress", "completed"];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statusCycle.length;

    if (!showStatusCycle || !currentStatus) return null;

    return (
      <div className="mt-1 pt-1 border-t border-gray-600 flex items-center justify-center">
        <span className="text-[10px] opacity-75">Следующий статус: </span>
        <span className="ml-1 font-medium">
          {statusCycle[nextIndex] === "completed"
            ? "Завершено"
            : statusCycle[nextIndex] === "in_progress"
            ? "В процессе"
            : "Не начато"}
        </span>
        <svg
          className="w-3 h-3 ml-1"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M17 8L21 12M21 12L17 16M21 12H3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={(e) => e.stopPropagation()} // Предотвращаем всплытие клика
    >
      {children}

      {isVisible && (
        <div
          className={`absolute z-10 ${getPositionStyles()} min-w-max bg-gray-800 text-white text-xs rounded py-1 px-2 pointer-events-none animate-fade-in`}
        >
          {content}
          {showStatusCycle && currentStatus && <StatusCycleIndicator />}
          <div
            className={`absolute ${
              position === "top"
                ? "bottom-[-4px]"
                : position === "bottom"
                ? "top-[-4px]"
                : position === "left"
                ? "right-[-4px]"
                : "left-[-4px]"
            } ${
              position === "top" || position === "bottom"
                ? "left-1/2 transform -translate-x-1/2"
                : "top-1/2 transform -translate-y-1/2"
            } h-2 w-2 rotate-45 bg-gray-800`}
          ></div>
        </div>
      )}
    </div>
  );
};

export default TaskStatusTip;
