import React, { useState, useEffect } from "react";
import Modal from "./common/Modal";
import { getApiBaseUrl } from "../config/api";
import {
  PaperClipIcon,
  XMarkIcon,
  PencilIcon,
  UserIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

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
  // ИСПРАВЛЕНО: Удалена зависимость от isOpen, чтобы избежать бесконечного цикла
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
  }, [task, mode, plans]);

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
              label: isSaving ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  Сохранение...
                </span>
              ) : (
                "Сохранить"
              ),
              onClick: handleSubmit,
              disabled: isSaving,
            }
          : null
      }
      secondaryAction={{ label: "Закрыть", onClick: onClose }}
      closeOnClickOutside={!isSaving}
      closeOnEsc={!isSaving}
    >
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md flex items-start">
          <ExclamationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 text-red-500 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Заголовок задачи */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-1.5 text-gray-500" />
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
            className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
          >
            <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-500" />
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
          {mode === "edit" && formData.description?.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Добавление описания поможет сотруднику лучше понять задачу
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* План */}
          <div>
            <label
              htmlFor="plan_id"
              className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
            >
              <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1.5 text-gray-500" />
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
              className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
            >
              <UserIcon className="h-4 w-4 mr-1.5 text-gray-500" />
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Приоритет */}
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
            >
              <ChartBarIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Приоритет
            </label>
            <div className="relative">
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-9"
                disabled={mode === "view" || isSaving}
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    formData.priority === "high"
                      ? "bg-red-500"
                      : formData.priority === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Дедлайн */}
          <div>
            <label
              htmlFor="deadline"
              className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
            >
              <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-500" />
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
              min={new Date().toISOString().split("T")[0]}
              disabled={mode === "view" || isSaving}
            />
          </div>
        </div>

        {/* Статус задачи (только для режима редактирования/просмотра) */}
        {(mode === "edit" || mode === "view") && (
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1 flex items-center"
            >
              <ClockIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Статус задачи
            </label>
            <div className="relative">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm pl-9"
                disabled={mode === "view" || isSaving}
              >
                <option value="pending">Ожидает выполнения</option>
                <option value="in_progress">В процессе</option>
                <option value="completed">Завершено</option>
                <option value="cancelled">Отменено</option>
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    formData.status === "completed"
                      ? "bg-green-500"
                      : formData.status === "in_progress"
                      ? "bg-blue-500"
                      : formData.status === "cancelled"
                      ? "bg-gray-500"
                      : "bg-yellow-500"
                  }`}
                />
              </div>
            </div>
          </div>
        )}
      </form>

      {mode === "view" && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Информация о задаче
          </h4>
          <div className="bg-gray-50 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600">
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>
                  Назначено:{" "}
                  {users.find((u) => u.id === parseInt(formData.user_id))
                    ?.full_name || "Не назначено"}
                </span>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span>
                  Срок:{" "}
                  {new Date(formData.deadline).toLocaleDateString("ru-RU")}
                </span>
              </div>
              <div className="flex items-center">
                <ChartBarIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="flex items-center">
                  Приоритет:
                  <span
                    className={`ml-1.5 inline-flex px-2 py-0.5 text-xs rounded-full ${
                      formData.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : formData.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {priorityDisplay[formData.priority]}
                  </span>
                </span>
              </div>
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                <span className="flex items-center">
                  Статус:
                  <span
                    className={`ml-1.5 inline-flex px-2 py-0.5 text-xs rounded-full ${
                      formData.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : formData.status === "in_progress"
                        ? "bg-blue-100 text-blue-800"
                        : formData.status === "cancelled"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {statusDisplay[formData.status]}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
