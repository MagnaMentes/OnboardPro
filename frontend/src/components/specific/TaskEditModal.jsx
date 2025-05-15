import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getApiBaseUrl } from "../../config/api";
import Modal from "../common/Modal";
import {
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { TaskStatus, TaskPriority } from "../../config/theme";

/**
 * Компонент модального окна для редактирования задачи
 *
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.isOpen - Флаг открытия модального окна
 * @param {Function} props.onClose - Функция закрытия модального окна
 * @param {Object} props.task - Объект задачи для редактирования
 * @param {Function} props.onSave - Функция, вызываемая после сохранения изменений
 * @param {Array} props.users - Список пользователей для назначения задачи
 * @param {Array} props.plans - Список планов для привязки задачи
 */
const TaskEditModal = ({
  isOpen,
  onClose,
  task,
  onSave,
  users = [],
  plans = [],
}) => {
  const apiBaseUrl = getApiBaseUrl();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "pending",
    deadline: new Date().toISOString().split("T")[0],
    user_id: "",
    plan_id: "",
  });

  // Инициализация формы при открытии модального окна
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        status: task.status || "pending",
        deadline:
          task.deadline?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        user_id: task.user_id || "",
        plan_id: task.plan_id || "",
      });
    }
  }, [task, isOpen]);

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${apiBaseUrl}/tasks/${task.id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Задача успешно обновлена");
      if (onSave) onSave(response.data);
      onClose();
    } catch (error) {
      console.error("Error updating task:", error);
      toast.error(
        error.response?.data?.detail || "Ошибка при обновлении задачи"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Рендер футера модального окна
  const renderFooter = () => {
    return (
      <>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onClose}
          disabled={isLoading}
        >
          Отмена
        </button>
        <button
          type="submit"
          form="edit-task-form"
          className="inline-flex justify-center px-4 py-2 ml-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? "Сохранение..." : "Сохранить"}
        </button>
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Редактирование задачи"
      footer={renderFooter()}
    >
      <form id="edit-task-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-1" />
              Название задачи
            </div>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Введите название задачи"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Описание
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Введите описание задачи"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-1" />
                Приоритет
              </div>
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <div className="flex items-center">
                <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
                Статус
              </div>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="pending">В очереди</option>
              <option value="in_progress">В процессе</option>
              <option value="completed">Завершено</option>
              <option value="blocked">Заблокировано</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="deadline"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Срок выполнения
            </div>
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="user_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              Исполнитель
            </div>
          </label>
          <select
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Не назначен</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="plan_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            План адаптации
          </label>
          <select
            id="plan_id"
            name="plan_id"
            value={formData.plan_id}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Не привязан к плану</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4 mt-4">
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-1">
              Текущий приоритет:
            </span>
            <TaskPriority priority={formData.priority} />
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-1">
              Текущий статус:
            </span>
            <TaskStatus status={formData.status} />
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TaskEditModal;
