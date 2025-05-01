import React, { useState, useEffect } from "react";
import Modal from "./common/Modal";
import { getApiBaseUrl } from "../config/api";
import { PaperClipIcon, XMarkIcon } from "@heroicons/react/24/outline";

/**
 * Компонент модального окна для работы с задачами
 * Поддерживает создание, редактирование и просмотр задач
 *
 * @param {boolean} isOpen - Флаг открытия модального окна
 * @param {Function} onClose - Функция закрытия модального окна
 * @param {Object} task - Объект задачи для редактирования (необязательно)
 * @param {Array} users - Список пользователей для назначения задачи
 * @param {Array} plans - Список планов для привязки задачи
 * @param {Function} onSave - Функция сохранения/обновления задачи
 * @param {string} mode - Режим работы модального окна ('create', 'edit', 'view')
 */
export default function TaskModal({
  isOpen,
  onClose,
  task = null,
  users = [],
  plans = [],
  onSave,
  mode = "create",
}) {
  const [formData, setFormData] = useState({
    plan_id: "",
    user_id: "",
    title: "",
    description: "",
    priority: "medium",
    deadline: new Date().toISOString().split("T")[0],
    status: "pending",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Инициализация формы при открытии модального окна
  useEffect(() => {
    if (task && (mode === "edit" || mode === "view")) {
      setFormData({
        plan_id: task.plan_id || "",
        user_id: task.user_id || "",
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "medium",
        deadline:
          task.deadline?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        status: task.status || "pending",
      });
    } else {
      // Сброс формы для режима создания новой задачи
      setFormData({
        plan_id: plans.length > 0 ? plans[0].id : "",
        user_id: "",
        title: "",
        description: "",
        priority: "medium",
        deadline: new Date().toISOString().split("T")[0],
        status: "pending",
      });
    }
  }, [task, isOpen, mode, plans]);

  // Обработчик изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);
    setError(null);

    try {
      await onSave(formData, mode);
      onClose(); // Закрываем модальное окно после успешного сохранения
    } catch (err) {
      setError(err.message || "Произошла ошибка при сохранении задачи");
    } finally {
      setIsSaving(false);
    }
  };

  // Получаем заголовок модального окна в зависимости от режима
  const getModalTitle = () => {
    switch (mode) {
      case "create":
        return "Создание новой задачи";
      case "edit":
        return "Редактирование задачи";
      case "view":
        return "Просмотр задачи";
      default:
        return "Задача";
    }
  };

  // Получаем вариант стиля модального окна в зависимости от режима
  const getModalVariant = () => {
    switch (mode) {
      case "create":
        return "default";
      case "edit":
        return "info";
      case "view":
        return "default";
      default:
        return "default";
    }
  };

  // Форматирование приоритета для отображения
  const priorityDisplay = {
    low: "Низкий",
    medium: "Средний",
    high: "Высокий",
  };

  // Форматирование статуса для отображения
  const statusDisplay = {
    pending: "Ожидает выполнения",
    in_progress: "В процессе",
    completed: "Завершено",
    cancelled: "Отменено",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      variant={getModalVariant()}
      size="md"
      primaryAction={
        mode !== "view"
          ? {
              label: isSaving ? "Сохранение..." : "Сохранить",
              onClick: handleSubmit,
            }
          : null
      }
      secondaryAction={{ label: "Закрыть", onClick: onClose }}
      closeOnClickOutside={!isSaving}
      closeOnEsc={!isSaving}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Заголовок задачи */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Заголовок задачи
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Введите заголовок задачи"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            disabled={mode === "view" || isSaving}
          />
        </div>

        {/* Описание задачи */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Описание задачи
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            placeholder="Опишите задачу подробнее"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={mode === "view" || isSaving}
          />
        </div>

        {/* План */}
        <div>
          <label
            htmlFor="plan_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            План онбординга
          </label>
          <select
            id="plan_id"
            name="plan_id"
            value={formData.plan_id}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            disabled={mode === "view" || isSaving}
          >
            <option value="">Выберите план онбординга</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
          </select>
        </div>

        {/* Сотрудник */}
        <div>
          <label
            htmlFor="user_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Назначить сотруднику
          </label>
          <select
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            disabled={mode === "view" || isSaving}
          >
            <option value="">Выберите сотрудника</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
        </div>

        {/* Приоритет */}
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Приоритет
          </label>
          <select
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={mode === "view" || isSaving}
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>

        {/* Дедлайн */}
        <div>
          <label
            htmlFor="deadline"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Срок выполнения
          </label>
          <input
            type="date"
            id="deadline"
            name="deadline"
            value={formData.deadline}
            onChange={handleInputChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
            disabled={mode === "view" || isSaving}
          />
        </div>

        {/* Статус задачи (только для режима редактирования/просмотра) */}
        {(mode === "edit" || mode === "view") && (
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Статус задачи
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={mode === "view" || isSaving}
            >
              <option value="pending">Ожидает выполнения</option>
              <option value="in_progress">В процессе</option>
              <option value="completed">Завершено</option>
              <option value="cancelled">Отменено</option>
            </select>
          </div>
        )}
      </form>
    </Modal>
  );
}
