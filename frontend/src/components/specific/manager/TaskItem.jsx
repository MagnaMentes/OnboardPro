import React from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  ExclamationCircleIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

/**
 * Компонент для отображения одной задачи в списке
 *
 * @param {Object} task - Данные задачи
 * @param {Function} handleEditTask - Функция открытия модального окна редактирования
 * @param {Function} handleDeleteTask - Функция открытия модального окна удаления
 * @param {Array} users - Массив пользователей
 * @param {Array} plans - Массив планов
 */
const TaskItem = ({ task, handleEditTask, handleDeleteTask, users, plans }) => {
  const isOverdue =
    task.status !== "completed" &&
    task.deadline &&
    new Date(task.deadline) < new Date();
  const user = users.find((u) => u.id === task.user_id);
  const plan = plans.find((p) => p.id === task.plan_id);

  // Функция для отображения иконки статуса
  const renderStatusIcon = () => {
    switch (task.status) {
      case "completed":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "in_progress":
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case "cancelled":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Функция для отображения класса приоритета
  const getPriorityClass = () => {
    switch (task.priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Функция для текстового отображения приоритета
  const getPriorityText = () => {
    switch (task.priority) {
      case "high":
        return "Высокий";
      case "medium":
        return "Средний";
      case "low":
        return "Низкий";
      default:
        return "Не определен";
    }
  };

  // Функция для текстового отображения статуса
  const getStatusText = () => {
    switch (task.status) {
      case "completed":
        return "Выполнено";
      case "in_progress":
        return "В работе";
      case "cancelled":
        return "Отменено";
      default:
        return "Не начато";
    }
  };

  // Определение классов для визуального отличия шаблонных и кастомных задач
  const getTaskTypeClasses = () => {
    return task.is_template
      ? "border-l-4 border-purple-500 bg-purple-50"
      : "border-l-4 border-blue-500";
  };

  // Отображение индикатора типа задачи
  const renderTaskTypeIndicator = () => {
    if (task.is_template) {
      return (
        <div className="flex items-center text-purple-700 mr-2">
          <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
          <span className="text-xs">Шаблон</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`relative rounded-md shadow-sm mb-2 p-4 ${getTaskTypeClasses()}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div className="flex-grow">
          <div className="flex items-center">
            {renderStatusIcon()}
            <h3 className="ml-2 text-md font-medium">{task.title}</h3>
            {renderTaskTypeIndicator()}
          </div>

          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {task.description}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${getPriorityClass()}`}
            >
              {getPriorityText()}
            </span>

            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
              {getStatusText()}
            </span>

            {task.deadline && (
              <span
                className={`text-xs px-2 py-1 rounded-full flex items-center 
                  ${
                    isOverdue
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
              >
                {isOverdue && (
                  <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                )}
                {new Date(task.deadline).toLocaleDateString()}
              </span>
            )}

            {user && (
              <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                {user.first_name} {user.last_name}
              </span>
            )}

            {plan && (
              <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-800">
                План: {plan.title}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center mt-2 sm:mt-0">
          <button
            onClick={() => handleEditTask(task)}
            className="p-2 text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
            title="Редактировать задачу"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDeleteTask(task)}
            className="p-2 text-red-700 hover:bg-red-100 rounded-full transition-colors ml-1"
            title="Удалить задачу"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
