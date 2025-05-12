import React, { useState, useEffect } from "react";
import Modal from "./common/Modal";
import { getApiBaseUrl } from "../config/api";
import { formatUserDisplayName } from "../utils/userUtils";
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

// Импорт стилей и компонентов из нашей системы темы
import {
  FORM_STYLES,
  BUTTON_STYLES,
  TaskPriority,
  TaskStatus,
  FormField,
  SelectField,
  PriorityField,
  StatusField,
} from "../config/theme";

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

  // Кастомный компонент для заголовка поля с иконкой
  const FieldLabel = ({ icon, text, required = false }) => (
    <div className="flex items-center whitespace-nowrap mb-1">
      {icon && <span className="mr-1.5 flex-shrink-0">{icon}</span>}
      <span className="text-sm font-medium text-gray-700">{text}</span>
      {required && <span className="text-red-500 ml-1">*</span>}
    </div>
  );

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
        <div className={FORM_STYLES.formGroup}>
          <FieldLabel
            icon={<PencilIcon className="h-4 w-4 text-gray-500" />}
            text="Заголовок задачи"
            required={true}
          />
          <input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Введите заголовок задачи"
            className={FORM_STYLES.input}
            required
            disabled={mode === "view" || isSaving}
          />
        </div>

        {/* Описание задачи */}
        <div className={FORM_STYLES.formGroup}>
          <FieldLabel
            icon={<DocumentTextIcon className="h-4 w-4 text-gray-500" />}
            text="Описание задачи"
          />
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Опишите задачу подробнее"
            className={FORM_STYLES.input}
            rows="3"
            disabled={mode === "view" || isSaving}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* План */}
          <div className={FORM_STYLES.formGroup}>
            <FieldLabel
              icon={
                <ClipboardDocumentCheckIcon className="h-4 w-4 text-gray-500" />
              }
              text="План онбординга"
              required={true}
            />
            <select
              id="plan_id"
              name="plan_id"
              value={formData.plan_id}
              onChange={handleInputChange}
              className={FORM_STYLES.select}
              required
              disabled={mode === "view" || isSaving}
            >
              <option value="">Выберите план</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title}
                </option>
              ))}
            </select>
          </div>

          {/* Сотрудник */}
          <div className={FORM_STYLES.formGroup}>
            <FieldLabel
              icon={<UserIcon className="h-4 w-4 text-gray-500" />}
              text="Назначить сотруднику"
              required={true}
            />
            <select
              id="user_id"
              name="user_id"
              value={formData.user_id}
              onChange={handleInputChange}
              className={FORM_STYLES.select}
              required
              disabled={mode === "view" || isSaving}
            >
              <option value="">Выберите сотрудника</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {formatUserDisplayName(user)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Приоритет */}
          <div className={FORM_STYLES.formGroup}>
            <FieldLabel
              icon={<ChartBarIcon className="h-4 w-4 text-gray-500" />}
              text="Приоритет"
            />
            <div className="relative">
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className={`${FORM_STYLES.select} pl-9`}
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
          <div className={FORM_STYLES.formGroup}>
            <FieldLabel
              icon={<CalendarIcon className="h-4 w-4 text-gray-500" />}
              text="Срок выполнения"
              required={true}
            />
            <input
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              type="date"
              className={FORM_STYLES.input}
              required
              min={new Date().toISOString().split("T")[0]}
              disabled={mode === "view" || isSaving}
            />
          </div>
        </div>

        {/* Статус задачи (только для режима редактирования/просмотра) */}
        {(mode === "edit" || mode === "view") && (
          <div className={FORM_STYLES.formGroup}>
            <FieldLabel
              icon={<ClockIcon className="h-4 w-4 text-gray-500" />}
              text="Статус задачи"
            />
            <div className="relative">
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className={`${FORM_STYLES.select} pl-9`}
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
                  {(() => {
                    const user = users.find(
                      (u) => u.id === parseInt(formData.user_id)
                    );
                    if (!user) return "Не назначено";
                    return formatUserDisplayName(user);
                  })()}
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
                  <span className="ml-1.5">
                    <TaskStatus status={formData.status} size="sm" />
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
