import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "../../config/api";
import {
  ExclamationCircleIcon,
  DocumentDuplicateIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { Button, FormField, SelectField } from "../../config/theme";

const priorityOptions = [
  { value: "low", label: "Низкий", color: "text-green-600" },
  { value: "medium", label: "Средний", color: "text-yellow-600" },
  { value: "high", label: "Высокий", color: "text-red-600" },
];

const roleOptions = [
  { value: "employee", label: "Сотрудник" },
  { value: "manager", label: "Менеджер" },
  { value: "hr", label: "HR" },
];

const TaskTemplateForm = ({
  onTemplateCreated,
  editTemplate = null,
  onCancel,
}) => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    duration_days: 1,
    role: "employee",
    department: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiUrl = getApiBaseUrl();

  // Получение списка отделов из данных пользователей
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${apiUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.filter((user) => !user.disabled);
      } catch (error) {
        console.error("Ошибка при загрузке пользователей:", error);
        toast.error("Не удалось загрузить список пользователей");
        return [];
      }
    },
  });

  // Получение уникальных отделов из данных пользователей
  const departments = React.useMemo(() => {
    if (!users || users.length === 0) return [];
    return [
      ...new Set(users.map((user) => user.department).filter(Boolean)),
    ].sort();
  }, [users]);

  // Предзаполнение данных при редактировании существующего шаблона
  useEffect(() => {
    if (editTemplate) {
      setFormData({
        title: editTemplate.title || "",
        description: editTemplate.description || "",
        priority: editTemplate.priority || "medium",
        duration_days: editTemplate.duration_days || 1,
        role: editTemplate.role || "employee",
        department: editTemplate.department || "",
      });
    }
  }, [editTemplate]);

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Специальная обработка для числовых полей
    if (name === "duration_days") {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 1) {
        setFormData({
          ...formData,
          [name]: value,
        });
        setErrors({
          ...errors,
          [name]: "Длительность должна быть числом большим или равным 1",
        });
        return;
      }
      setFormData({
        ...formData,
        [name]: numValue,
      });
      // Очистка ошибки, если она была
      if (errors[name]) {
        const newErrors = { ...errors };
        delete newErrors[name];
        setErrors(newErrors);
      }
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Название шаблона обязательно";
    }

    if (formData.duration_days < 1) {
      newErrors.duration_days = "Длительность должна быть больше 0 дней";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      let response;

      if (editTemplate) {
        // Обновление существующего шаблона
        response = await axios.put(
          `${apiUrl}/api/task_templates/${editTemplate.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success(`Шаблон "${formData.title}" успешно обновлен`);
      } else {
        // Создание нового шаблона
        response = await axios.post(`${apiUrl}/api/task_templates`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success(`Шаблон "${formData.title}" успешно создан`);
      }

      // Инвалидация кэша шаблонов для обновления данных
      queryClient.invalidateQueries(["taskTemplates"]);

      // Вызов колбэка с данными созданного/обновленного шаблона
      if (onTemplateCreated) {
        onTemplateCreated(response.data);
      }

      // Очистка формы после успешного создания
      if (!editTemplate) {
        setFormData({
          title: "",
          description: "",
          priority: "medium",
          duration_days: 1,
          role: "employee",
          department: "",
        });
      }
    } catch (error) {
      console.error("Ошибка при сохранении шаблона:", error);
      const errorMessage =
        error.response?.data?.detail || "Ошибка при сохранении шаблона";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Индикатор приоритета
  const PriorityIndicator = ({ priority }) => {
    const colors = {
      high: "bg-red-600",
      medium: "bg-yellow-600",
      low: "bg-green-600",
    };

    return (
      <span
        className={`inline-block w-3 h-3 rounded-full ${
          colors[priority] || colors.medium
        }`}
      ></span>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pb-4 border-b border-blue-100">
        <div className="flex items-center">
          <DocumentDuplicateIcon className="h-5 w-5 text-blue-500 mr-2" />
          <h3 className="text-lg font-medium text-blue-900">
            {editTemplate
              ? "Редактирование шаблона задачи"
              : "Новый шаблон задачи"}
          </h3>
        </div>
        {editTemplate && (
          <div className="flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-full text-xs text-blue-700">
            <span>ID шаблона: {editTemplate.id}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Название шаблона */}
        <FormField
          label="Название шаблона*"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Введите название шаблона задачи"
          error={errors.title}
          required
        />

        {/* Описание */}
        <FormField
          label="Описание"
          id="description"
          name="description"
          type="textarea"
          rows={3}
          value={formData.description || ""}
          onChange={handleChange}
          placeholder="Введите описание задачи"
          helpText="Подробное описание поможет сотрудникам лучше понять задачу"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Приоритет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FlagIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Приоритет
            </label>
            <div className="relative">
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="block w-full pl-8 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {priorityOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                    className={option.color}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <PriorityIndicator priority={formData.priority} />
              </div>
            </div>
          </div>

          {/* Длительность */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Длительность (дней)*
            </label>
            <input
              id="duration_days"
              name="duration_days"
              type="number"
              min="1"
              value={formData.duration_days}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
            {errors.duration_days && (
              <p className="mt-1 text-sm text-red-600">
                {errors.duration_days}
              </p>
            )}
          </div>

          {/* Целевая роль */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <UserIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Целевая роль
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Отдел */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <BuildingOfficeIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Отдел (опционально)
            </label>
            {isLoadingUsers ? (
              <div className="flex items-center space-x-2 text-sm text-gray-500 py-2">
                <svg
                  className="animate-spin h-4 w-4"
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
                <span>Загрузка отделов...</span>
              </div>
            ) : (
              <div>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Все отделы</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Если отдел не указан, шаблон будет доступен для всех отделов
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-blue-100">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              disabled={isSubmitting}
            >
              Отмена
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Сохранение...
              </>
            ) : editTemplate ? (
              "Обновить шаблон"
            ) : (
              "Создать шаблон"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskTemplateForm;
