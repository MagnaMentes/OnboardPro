import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DocumentTextIcon,
  DocumentIcon,
  CalendarIcon,
  FlagIcon,
  UserIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { Button, FormField, SelectField } from "../../config/theme";

const TaskForm = ({
  onTaskCreated,
  editTask = null,
  onCancel,
  initialData = {},
  hideUserSelect = false,
  submitButtonText = "Создать задачу",
}) => {
  const [formData, setFormData] = useState({
    plan_id: initialData.plan_id || "",
    user_id: initialData.user_id || "",
    title: "",
    description: "",
    priority: "medium",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // По умолчанию дедлайн через неделю
    template_id: initialData.template_id || null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [errors, setErrors] = useState({});

  // Загрузка пользователей и планов при инициализации
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // Загружаем пользователей только если они нужны (hideUserSelect === false)
        if (!hideUserSelect) {
          const usersResponse = await axios.get("/api/users", { headers });
          // Фильтруем только активных пользователей
          setUsers(usersResponse.data.filter((user) => !user.disabled));
        }

        // Загружаем планы
        const plansResponse = await axios.get("/api/plans", { headers });
        setPlans(plansResponse.data);

        // Устанавливаем первый план по умолчанию, если не указан
        if (!formData.plan_id && plansResponse.data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            plan_id: plansResponse.data[0].id,
          }));
        }
      } catch (error) {
        console.error("Ошибка при загрузке данных для формы:", error);
        toast.error("Не удалось загрузить данные");
      }
    };

    fetchData();
  }, [hideUserSelect]);

  // Заполнение формы данными, если редактируем существующую задачу
  useEffect(() => {
    if (editTask) {
      setFormData({
        plan_id: editTask.plan_id || "",
        user_id: editTask.user_id || "",
        title: editTask.title || "",
        description: editTask.description || "",
        priority: editTask.priority || "medium",
        deadline: editTask.deadline
          ? new Date(editTask.deadline)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        template_id: editTask.template_id || null,
      });
    }
  }, [editTask]);

  // Применение initialData при необходимости
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Очистка ошибки, если она была
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      deadline: date,
    });

    // Очистка ошибки, если она была
    if (errors.deadline) {
      const newErrors = { ...errors };
      delete newErrors.deadline;
      setErrors(newErrors);
    }
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = "Название задачи обязательно";
    }

    if (!formData.plan_id) {
      newErrors.plan_id = "Выберите план адаптации";
    }

    if (!hideUserSelect && !formData.user_id) {
      newErrors.user_id = "Выберите сотрудника";
    }

    if (!formData.deadline) {
      newErrors.deadline = "Укажите дедлайн";
    } else {
      const now = new Date();
      if (
        formData.deadline < now &&
        now.getDate() !== formData.deadline.getDate()
      ) {
        newErrors.deadline = "Дедлайн не может быть в прошлом";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Пожалуйста, исправьте ошибки в форме");
      return;
    }

    // Если это внутренняя форма для PlanForm, просто передаем данные обратно
    if (onTaskCreated && !editTask && initialData) {
      onTaskCreated(formData);
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      let response;
      if (editTask) {
        response = await axios.put(`/api/tasks/${editTask.id}`, formData, {
          headers,
        });
        toast.success("Задача успешно обновлена");
      } else {
        response = await axios.post("/api/tasks", formData, { headers });
        toast.success("Задача успешно создана");
      }

      // Очищаем форму для новой задачи
      if (!editTask) {
        setFormData({
          plan_id: formData.plan_id,
          user_id: formData.user_id,
          title: "",
          description: "",
          priority: "medium",
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          template_id: null,
        });
      }

      // Вызываем колбэк с созданной/обновленной задачей
      if (onTaskCreated) {
        onTaskCreated(response.data);
      }

      // Если это редактирование, закрываем форму
      if (editTask && onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error("Ошибка при сохранении задачи:", error);
      const errorMessage =
        error.response?.data?.detail ||
        "Произошла ошибка при сохранении задачи";
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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <DocumentIcon className="h-5 w-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">
            {editTask ? "Редактирование задачи" : "Новая задача"}
          </h3>
        </div>
        {editTask && editTask.id && (
          <div className="flex items-center space-x-1 bg-purple-50 px-3 py-1 rounded-full text-xs text-purple-700">
            <span>ID задачи: {editTask.id}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <DocumentTextIcon className="h-4 w-4 mr-1.5 text-gray-500" />
            Название задачи*
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              errors.title ? "border-red-500" : ""
            }`}
            placeholder="Введите название задачи"
            required
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <DocumentIcon className="h-4 w-4 mr-1.5 text-gray-500" />
            Описание задачи
          </label>
          <textarea
            name="description"
            id="description"
            rows={3}
            value={formData.description || ""}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Введите описание задачи"
          />
          <p className="mt-1 text-xs text-gray-500">
            Подробное описание поможет сотруднику лучше выполнить задачу
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <FlagIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Приоритет*
            </label>
            <div className="relative">
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="block w-full pl-8 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                required
              >
                <option value="low" className="text-green-600">
                  Низкий
                </option>
                <option value="medium" className="text-yellow-600">
                  Средний
                </option>
                <option value="high" className="text-red-600">
                  Высокий
                </option>
              </select>
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <PriorityIndicator priority={formData.priority} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Дедлайн*
            </label>
            <div
              className={`${
                errors.deadline ? "border border-red-500 rounded-md" : ""
              }`}
            >
              <DatePicker
                selected={formData.deadline}
                onChange={handleDateChange}
                className="w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                dateFormat="dd.MM.yyyy"
                minDate={new Date()}
                required
              />
            </div>
            {errors.deadline && (
              <p className="mt-1 text-sm text-red-600">{errors.deadline}</p>
            )}
          </div>
        </div>

        {plans.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <ClipboardDocumentListIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              План адаптации*
            </label>
            <select
              id="plan_id"
              name="plan_id"
              value={formData.plan_id}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.plan_id ? "border-red-500" : ""
              }`}
              required
            >
              <option value="">Выберите план</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title} ({plan.role})
                </option>
              ))}
            </select>
            {errors.plan_id && (
              <p className="mt-1 text-sm text-red-600">{errors.plan_id}</p>
            )}
          </div>
        )}

        {!hideUserSelect && users.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <UserIcon className="h-4 w-4 mr-1.5 text-gray-500" />
              Назначить сотруднику*
            </label>
            <select
              id="user_id"
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.user_id ? "border-red-500" : ""
              }`}
              required
            >
              <option value="">Выберите сотрудника</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email}
                  {user.department && ` (${user.department})`}
                </option>
              ))}
            </select>
            {errors.user_id && (
              <p className="mt-1 text-sm text-red-600">{errors.user_id}</p>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
            ) : (
              submitButtonText
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
