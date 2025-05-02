import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExclamationCircleIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";

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

  // Получение списка отделов из данных пользователей
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/users", {
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
          `/api/task_templates/${editTemplate.id}`,
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        toast.success(`Шаблон "${formData.title}" успешно обновлен`);
      } else {
        // Создание нового шаблона
        response = await axios.post("/api/task_templates", formData, {
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {editTemplate
            ? "Редактирование шаблона задачи"
            : "Новый шаблон задачи"}
        </h3>
        <DocumentDuplicateIcon className="h-5 w-5 text-blue-500" />
      </div>

      {/* Название шаблона */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Название шаблона*
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
              errors.title ? "border-red-300" : ""
            }`}
            placeholder="Введите название шаблона задачи"
          />
          {errors.title && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ExclamationCircleIcon
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Описание */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Описание
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            rows={3}
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md"
            placeholder="Введите описание задачи"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Приоритет */}
        <div>
          <label
            htmlFor="priority"
            className="block text-sm font-medium text-gray-700"
          >
            Приоритет
          </label>
          <div className="mt-1">
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
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
          </div>
        </div>

        {/* Длительность */}
        <div>
          <label
            htmlFor="duration_days"
            className="block text-sm font-medium text-gray-700"
          >
            Длительность (дней)*
          </label>
          <div className="mt-1 relative">
            <input
              type="number"
              id="duration_days"
              name="duration_days"
              value={formData.duration_days}
              onChange={handleChange}
              min="1"
              className={`shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                errors.duration_days ? "border-red-300" : ""
              }`}
            />
            {errors.duration_days && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ExclamationCircleIcon
                  className="h-5 w-5 text-red-500"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
          {errors.duration_days && (
            <p className="mt-1 text-sm text-red-600">{errors.duration_days}</p>
          )}
        </div>

        {/* Целевая роль */}
        <div>
          <label
            htmlFor="role"
            className="block text-sm font-medium text-gray-700"
          >
            Целевая роль
          </label>
          <div className="mt-1">
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Отдел */}
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-gray-700"
          >
            Отдел (опционально)
          </label>
          <div className="mt-1">
            {isLoadingUsers ? (
              <div className="shadow-sm block w-full sm:text-sm border-gray-300 rounded-md p-2 bg-gray-50">
                Загрузка отделов...
              </div>
            ) : (
              <select
                id="department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
              >
                <option value="">Все отделы</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Если отдел не указан, шаблон будет доступен для всех отделов
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                зойти
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
        </button>
      </div>
    </form>
  );
};

export default TaskTemplateForm;
