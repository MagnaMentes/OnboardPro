import React from "react";
import { ClockIcon } from "@heroicons/react/24/outline";

/**
 * Компонент для отображения задач, находящихся в процессе выполнения
 *
 * @param {Array} inProgressTasks - Массив задач в процессе выполнения
 */
const InProgressTasksList = ({ inProgressTasks = [] }) => {
  // Проверка на пустой массив или некорректные данные
  if (!Array.isArray(inProgressTasks) || inProgressTasks.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h3 className="text-base sm:text-lg font-medium text-gray-800 flex items-center mb-2">
          <ClockIcon className="h-5 w-5 mr-2 text-yellow-500" />
          Задачи в процессе
        </h3>
        <div className="p-4 text-center text-gray-500">
          В настоящее время нет задач в процессе выполнения
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-base sm:text-lg font-medium text-gray-800 flex items-center mb-2">
        <ClockIcon className="h-5 w-5 mr-2 text-yellow-500" />
        Задачи в процессе ({inProgressTasks.length})
      </h3>
      <div className="divide-y divide-gray-200">
        {inProgressTasks.map((task) => (
          <div key={task.id} className="py-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {task.title}
                </h4>
                <div className="mt-1 flex items-center text-xs text-gray-500">
                  <span>
                    {task.assignee_name || task.assignee_email || "Не назначен"}
                  </span>
                  <span className="mx-1">•</span>
                  <span>
                    {task.priority === "high"
                      ? "Высокий"
                      : task.priority === "medium"
                      ? "Средний"
                      : "Низкий"}{" "}
                    приоритет
                  </span>
                </div>
              </div>
              <div className="ml-2">
                {task.deadline && (
                  <span className="text-xs text-gray-500">
                    До {new Date(task.deadline).toLocaleDateString("ru-RU")}
                  </span>
                )}
              </div>
            </div>
            {task.description && (
              <p className="mt-1 text-xs text-gray-500 truncate">
                {task.description.length > 100
                  ? `${task.description.substring(0, 100)}...`
                  : task.description}
              </p>
            )}
            <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-yellow-500 h-1.5 rounded-full"
                style={{ width: `${task.progress || 0}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InProgressTasksList;
