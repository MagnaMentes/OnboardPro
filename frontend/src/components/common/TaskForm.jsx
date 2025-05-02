import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
  };

  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      deadline: date,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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

  return (
    <div className="bg-white rounded-lg p-4">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="title">
            Название задачи*
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="description"
          >
            Описание задачи
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="priority"
            >
              Приоритет*
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="low">Низкий</option>
              <option value="medium">Средний</option>
              <option value="high">Высокий</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Дедлайн*
            </label>
            <DatePicker
              selected={formData.deadline}
              onChange={handleDateChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              dateFormat="dd.MM.yyyy"
              minDate={new Date()}
              required
            />
          </div>
        </div>

        {plans.length > 0 && (
          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="plan_id"
            >
              План адаптации*
            </label>
            <select
              id="plan_id"
              name="plan_id"
              value={formData.plan_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Выберите план</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title} ({plan.role})
                </option>
              ))}
            </select>
          </div>
        )}

        {!hideUserSelect && users.length > 0 && (
          <div className="mb-4">
            <label
              className="block text-gray-700 font-bold mb-2"
              htmlFor="user_id"
            >
              Назначить сотруднику*
            </label>
            <select
              id="user_id"
              name="user_id"
              value={formData.user_id}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Выберите сотрудника</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email}{" "}
                  ({user.department || "Без отдела"})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isSubmitting}
            >
              Отмена
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Сохранение..." : submitButtonText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskForm;
