import React from "react";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { TASK_STATUS_CLASSES } from "../config/theme";

/**
 * Компонент для переключения статуса задачи с улучшенным UX.
 * Визуальный способ изменения статуса с мгновенной обратной связью.
 */
const TaskStatusToggle = ({ status, onChange, disabled = false }) => {
  const statusOptions = [
    {
      value: "not_started",
      label: "Не начато",
      icon: ExclamationCircleIcon,
      bgColor: "bg-gray-100 hover:bg-gray-200",
      activeColor: "bg-gray-200 ring-2 ring-gray-400",
      textColor: "text-gray-700",
    },
    {
      value: "in_progress",
      label: "В процессе",
      icon: ClockIcon,
      bgColor: "bg-blue-100 hover:bg-blue-200",
      activeColor: "bg-blue-200 ring-2 ring-blue-400",
      textColor: "text-blue-700",
    },
    {
      value: "completed",
      label: "Завершено",
      icon: CheckCircleIcon,
      bgColor: "bg-green-100 hover:bg-green-200",
      activeColor: "bg-green-200 ring-2 ring-green-400",
      textColor: "text-green-700",
    },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {statusOptions.map((option) => {
        const isActive = status === option.value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => !isActive && onChange(option.value)}
            className={`
              flex items-center px-2.5 py-1.5 rounded-md text-xs font-medium
              transition-all duration-200 ease-in-out
              ${isActive ? option.activeColor : option.bgColor}
              ${option.textColor}
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              ${isActive ? "transform scale-105 shadow-sm" : "hover:shadow-sm"}
            `}
            title={option.label}
          >
            <Icon className="w-3.5 h-3.5 mr-1.5" />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TaskStatusToggle;
