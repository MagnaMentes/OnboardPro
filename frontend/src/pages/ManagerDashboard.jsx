import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getApiBaseUrl } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import {
  UserPlusIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  FolderPlusIcon,
  CalendarIcon,
  UsersIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  XMarkIcon,
  AdjustmentsVerticalIcon,
  QueueListIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../components/common/Modal"; // Импорт универсального компонента модального окна
import TaskModal from "../components/TaskModal"; // Импорт компонента TaskModal

export default function ManagerDashboard() {
  // Устанавливаем заголовок страницы
  usePageTitle("Панель менеджера");

  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState(null); // Состояние для хранения роли текущего пользователя
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTask, setNewTask] = useState({
    plan_id: "",
    user_id: "",
    title: "",
    description: "",
    priority: "medium",
    deadline: new Date().toISOString().split("T")[0],
  });
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    role: "employee",
  });
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  // Новые состояния для редактирования задачи
  const [editingTask, setEditingTask] = useState(null);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);

  // Новые состояния для фильтрации и сортировки задач
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");
  const [taskUserFilter, setTaskUserFilter] = useState("all");
  const [taskPlanFilter, setTaskPlanFilter] = useState("all");
  const [taskSortField, setTaskSortField] = useState("deadline");
  const [taskSortDirection, setTaskSortDirection] = useState("asc");
  const [isTaskFiltersVisible, setIsTaskFiltersVisible] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        // Получаем данные о текущем пользователе
        const currentUserResponse = await fetch(`${apiBaseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!currentUserResponse.ok) {
          throw new Error("Ошибка при получении данных пользователя");
        }
        const userData = await currentUserResponse.json();
        setUserRole(userData.role);

        // Получаем список всех пользователей
        const usersResponse = await fetch(`${apiBaseUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!usersResponse.ok) {
          throw new Error("Ошибка при получении списка пользователей");
        }
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Получаем список всех планов
        const plansResponse = await fetch(`${apiBaseUrl}/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!plansResponse.ok) {
          throw new Error("Ошибка при получении списка планов");
        }
        const plansData = await plansResponse.json();
        setPlans(plansData);

        // Получаем список всех задач
        const tasksResponse = await fetch(`${apiBaseUrl}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!tasksResponse.ok) {
          throw new Error("Ошибка при получении списка задач");
        }
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl]);

  // Функция для обновления списка задач из базы данных
  const refreshTasksFromDatabase = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const tasksResponse = await fetch(`${apiBaseUrl}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!tasksResponse.ok) {
        throw new Error("Ошибка при получении списка задач");
      }

      const tasksData = await tasksResponse.json();
      setTasks(tasksData);
      toast.success("Список задач успешно обновлен");
      console.log("Список задач обновлен из базы данных:", tasksData);
    } catch (err) {
      console.error("Ошибка при обновлении списка задач:", err);
      toast.error(err.message);
    }
  };

  // Функция переключения направления сортировки
  const toggleSortDirection = (field) => {
    if (taskSortField === field) {
      setTaskSortDirection(taskSortDirection === "asc" ? "desc" : "asc");
    } else {
      setTaskSortField(field);
      setTaskSortDirection("asc");
    }
  };

  // Функция сброса всех фильтров
  const resetTaskFilters = () => {
    setTaskStatusFilter("all");
    setTaskPriorityFilter("all");
    setTaskUserFilter("all");
    setTaskPlanFilter("all");
    setTaskSearchQuery("");
  };

  // Фильтрация и сортировка задач на основе выбранных параметров
  const filteredAndSortedTasks = useMemo(() => {
    // Сначала применяем фильтры
    let result = [...tasks];

    // Фильтр по поисковому запросу (ищет в названии и описании)
    if (taskSearchQuery.trim()) {
      const query = taskSearchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Фильтр по статусу
    if (taskStatusFilter !== "all") {
      result = result.filter((task) => task.status === taskStatusFilter);
    }

    // Фильтр по приоритету
    if (taskPriorityFilter !== "all") {
      result = result.filter((task) => task.priority === taskPriorityFilter);
    }

    // Фильтр по сотруднику
    if (taskUserFilter !== "all") {
      result = result.filter(
        (task) => task.user_id === parseInt(taskUserFilter)
      );
    }

    // Фильтр по плану
    if (taskPlanFilter !== "all") {
      result = result.filter(
        (task) => task.plan_id === parseInt(taskPlanFilter)
      );
    }

    // Затем применяем сортировку
    result.sort((a, b) => {
      let compareResult = 0;

      switch (taskSortField) {
        case "deadline":
          compareResult = new Date(a.deadline) - new Date(b.deadline);
          break;
        case "priority":
          const priorityValues = { low: 1, medium: 2, high: 3 };
          compareResult =
            priorityValues[a.priority] - priorityValues[b.priority];
          break;
        case "title":
          compareResult = a.title.localeCompare(b.title);
          break;
        case "status":
          compareResult = a.status.localeCompare(b.status);
          break;
        default:
          compareResult = 0;
      }

      // Если направление сортировки desc, инвертируем результат сравнения
      return taskSortDirection === "asc" ? compareResult : -compareResult;
    });

    return result;
  }, [
    tasks,
    taskSearchQuery,
    taskStatusFilter,
    taskPriorityFilter,
    taskUserFilter,
    taskPlanFilter,
    taskSortField,
    taskSortDirection,
  ]);

  // Отображение иконки сортировки возле заголовка столбца
  const renderSortIcon = (field) => {
    if (taskSortField !== field) {
      return null;
    }

    return taskSortDirection === "asc" ? (
      <ArrowUpIcon className="h-3 w-3 inline ml-1" />
    ) : (
      <ArrowDownIcon className="h-3 w-3 inline ml-1" />
    );
  };

  // Обработчики задач
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => {
      const updatedTask = { ...prev };
      updatedTask[name] = value;
      return updatedTask;
    });
  };

  // Обработчики планов
  const handlePlanInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlan((prev) => {
      const updatedPlan = { ...prev };
      updatedPlan[name] = value;
      return updatedPlan;
    });
  };

  const handleEditPlanInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPlan((prev) => {
      const updatedPlan = { ...prev };
      updatedPlan[name] = value;
      return updatedPlan;
    });
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingPlan(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(`${apiBaseUrl}/plans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPlan),
      });

      if (!response.ok) {
        throw new Error("Ошибка при создании плана");
      }

      const createdPlan = await response.json();
      setPlans((prev) => [...prev, createdPlan]);
      setNewPlan({
        title: "",
        description: "",
        role: "employee",
      });
      setError(null);
      setIsPlanModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan({ ...plan });
    setIsEditPlanModalOpen(true);
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    setIsEditingPlan(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(`${apiBaseUrl}/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editingPlan.title,
          description: editingPlan.description,
          role: editingPlan.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка при обновлении плана");
      }

      const updatedPlan = await response.json();

      // Обновление локального состояния
      setPlans((prev) =>
        prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
      );

      // Проверка, что данные действительно обновились
      console.log("План успешно обновлен в базе данных:", updatedPlan);
      toast.success(`План "${updatedPlan.title}" успешно обновлен`);

      setError(null);
      setIsEditPlanModalOpen(false);
    } catch (err) {
      console.error("Ошибка при обновлении плана:", err);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setIsEditingPlan(false);
    }
  };

  const openDeletePlanModal = (plan) => {
    setPlanToDelete(plan);
    setIsDeletePlanModalOpen(true);
  };

  const handleDeletePlan = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      // Проверка на связанные задачи
      const relatedTasks = tasks.filter(
        (task) => task.plan_id === planToDelete.id
      );
      if (relatedTasks.length > 0) {
        throw new Error("Невозможно удалить план с активными задачами");
      }

      const response = await fetch(`${apiBaseUrl}/plans/${planToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка при удалении плана");
      }

      // Удаление из локального состояния
      setPlans((prev) => prev.filter((plan) => plan.id !== planToDelete.id));

      // Проверка, что план действительно удалился из базы
      console.log(`План с ID ${planToDelete.id} успешно удален из базы данных`);
      toast.success(`План "${planToDelete.title}" успешно удален`);

      setIsDeletePlanModalOpen(false);
      setPlanToDelete(null);
    } catch (err) {
      console.error("Ошибка при удалении плана:", err);
      toast.error(err.message);
      setError(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении задачи");
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const getUserEmailById = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return `Пользователь #${userId}`;

    // Используем имя и фамилию если они доступны, иначе email
    if (user.first_name || user.last_name) {
      const fullName = [user.last_name, user.first_name]
        .filter(Boolean)
        .join(" ");
      return fullName || user.email;
    }
    return user.email;
  };

  const getPlanTitleById = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    return plan ? plan.title : `План #${planId}`;
  };

  const refreshPlansFromDatabase = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const plansResponse = await fetch(`${apiBaseUrl}/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!plansResponse.ok) return;

      const plansData = await plansResponse.json();
      setPlans(plansData);
      console.log("Список планов обновлен из базы данных:", plansData);
    } catch (err) {
      console.error("Ошибка при обновлении списка планов:", err);
    }
  };

  // Добавляем функцию для редактирования задачи
  const handleEditTask = (task) => {
    // Форматируем дату для редактирования в поле ввода типа date
    const formattedDeadline = new Date(task.deadline)
      .toISOString()
      .split("T")[0];

    // Создаем копию задачи с отформатированной датой
    const taskWithFormattedDate = {
      ...task,
      deadline: formattedDeadline,
    };

    // Устанавливаем задачу для редактирования и открываем модальное окно
    setEditingTask(taskWithFormattedDate);
    setIsEditTaskModalOpen(true);
  };

  // Компонент PlanModal с использованием нового компонента Modal
  function PlanModal({ isOpen, onClose, onSave }) {
    const [planData, setPlanData] = useState({
      title: "",
      description: "",
      role: "employee",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setPlanData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleSubmit = async () => {
      if (!planData.title) {
        setError("Название плана обязательно");
        return;
      }

      setIsLoading(true);
      try {
        await onSave(planData);
        onClose();
      } catch (error) {
        setError(error.message || "Не удалось сохранить план");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Создать новый план адаптации"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? (
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              Создать план
            </button>
          </>
        }
      >
        <form className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Название плана
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={planData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={planData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Роль сотрудника
            </label>
            <select
              id="role"
              name="role"
              value={planData.role}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="employee">Сотрудник</option>
              <option value="manager">Менеджер</option>
              <option value="admin">Администратор</option>
              <option value="hr">HR</option>
            </select>
          </div>
        </form>
      </Modal>
    );
  }

  // Компонент EditPlanModal с использованием нового компонента Modal
  function EditPlanModal({ isOpen, onClose, onSave, plan }) {
    const [planData, setPlanData] = useState({
      title: plan?.title || "",
      description: plan?.description || "",
      role: plan?.role || "employee",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (plan) {
        setPlanData({
          title: plan.title || "",
          description: plan.description || "",
          role: plan.role || "employee",
        });
      }
    }, [plan]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setPlanData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleSubmit = async () => {
      if (!planData.title) {
        setError("Название плана обязательно");
        return;
      }

      setIsLoading(true);
      try {
        await onSave(planData);
        onClose();
      } catch (error) {
        setError(error.message || "Не удалось сохранить план");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Редактировать план адаптации"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? (
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              Сохранить изменения
            </button>
          </>
        }
      >
        <form className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Название плана
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={planData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={planData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700"
            >
              Роль сотрудника
            </label>
            <select
              id="role"
              name="role"
              value={planData.role}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="employee">Сотрудник</option>
              <option value="manager">Менеджер</option>
              <option value="admin">Администратор</option>
              <option value="hr">HR</option>
            </select>
          </div>
        </form>
      </Modal>
    );
  }

  // Компонент DeletePlanModal с использованием нового компонента Modal
  function DeletePlanModal({ isOpen, onClose, onDelete, plan }) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDelete = async () => {
      setIsLoading(true);
      try {
        await onDelete();
        onClose();
      } catch (error) {
        setError(error.message || "Не удалось удалить план");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Удаление плана адаптации"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              disabled={isLoading}
            >
              {isLoading ? (
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              Удалить
            </button>
          </>
        }
      >
        <div className="mt-2">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Вы действительно хотите удалить план "{plan?.title}"? Это действие
            нельзя отменить, и все задачи, связанные с этим планом, также будут
            удалены.
          </p>
        </div>
      </Modal>
    );
  }

  // Компонент EditTaskModal с использованием нового компонента Modal
  function EditTaskModal({ isOpen, onClose, onSave, task, employees }) {
    const [taskData, setTaskData] = useState({
      title: task?.title || "",
      description: task?.description || "",
      due_date: task?.due_date || new Date().toISOString().split("T")[0],
      priority: task?.priority || "medium",
      assignee_id: task?.assignee_id || "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (task) {
        setTaskData({
          title: task.title || "",
          description: task.description || "",
          due_date: task.due_date || new Date().toISOString().split("T")[0],
          priority: task.priority || "medium",
          assignee_id: task.assignee_id || "",
        });
      }
    }, [task]);

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setTaskData((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleSubmit = async () => {
      if (!taskData.title || !taskData.due_date || !taskData.assignee_id) {
        setError("Заполните все обязательные поля");
        return;
      }

      setIsLoading(true);
      try {
        await onSave(taskData);
        onClose();
      } catch (error) {
        setError(error.message || "Не удалось обновить задачу");
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Редактировать задачу"
        footer={
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {isLoading ? (
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : null}
              Сохранить изменения
            </button>
          </>
        }
      >
        <form className="space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700"
            >
              Название задачи
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={taskData.title}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={taskData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="due_date"
                className="block text-sm font-medium text-gray-700"
              >
                Срок выполнения
              </label>
              <input
                type="date"
                name="due_date"
                id="due_date"
                value={taskData.due_date}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700"
              >
                Приоритет
              </label>
              <select
                id="priority"
                name="priority"
                value={taskData.priority}
                onChange={handleInputChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="assignee_id"
              className="block text-sm font-medium text-gray-700"
            >
              Назначить сотруднику
            </label>
            <select
              id="assignee_id"
              name="assignee_id"
              value={taskData.assignee_id || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Выберите сотрудника</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name || employee.email}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-blue-600">Панель менеджера</h2>
        <p className="mt-1 text-gray-500">
          Управление планами адаптации и назначение задач сотрудникам
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Ошибка!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Модальные окна */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={(taskData) => {
          console.log("Task saved:", taskData);
        }}
        employees={users}
        selectedTask={null}
      />
      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSave={(planData) => {
          console.log("Plan saved:", planData);
        }}
      />
      <EditPlanModal
        isOpen={isEditPlanModalOpen}
        onClose={() => setIsEditPlanModalOpen(false)}
        onSave={(planData) => {
          console.log("Plan updated:", planData);
        }}
        plan={editingPlan}
      />
      <DeletePlanModal
        isOpen={isDeletePlanModalOpen}
        onClose={() => setIsDeletePlanModalOpen(false)}
        onDelete={() => {
          console.log("Plan deleted");
        }}
        plan={planToDelete}
      />
      <EditTaskModal
        isOpen={isEditTaskModalOpen}
        onClose={() => setIsEditTaskModalOpen(false)}
        onSave={(taskData) => {
          console.log("Task updated:", taskData);
        }}
        task={editingTask}
        employees={users}
      />

      {/* Раздел управления задачами */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-700">
            Управление задачами
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={refreshTasksFromDatabase}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              title="Обновить список задач из базы данных"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Обновить
            </button>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Создать новую задачу
            </button>
          </div>
        </div>

        {/* Строка поиска и переключатель панели фильтров */}
        <div className="flex flex-col md:flex-row md:justify-between mb-4 space-y-2 md:space-y-0">
          <div className="flex items-center w-full md:w-auto">
            <input
              type="text"
              placeholder="Поиск по названию или описанию..."
              className="border border-gray-300 rounded-l px-4 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={taskSearchQuery}
              onChange={(e) => setTaskSearchQuery(e.target.value)}
            />
            {taskSearchQuery && (
              <button
                onClick={() => setTaskSearchQuery("")}
                className="bg-gray-100 px-3 py-2 border-т border-r border-b border-gray-300"
                title="Очистить поиск"
              >
                <XMarkIcon className="h-5 w-5 text-gray-500" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsTaskFiltersVisible(!isTaskFiltersVisible)}
            className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <AdjustmentsVerticalIcon className="h-5 w-5 mr-2" />
            Фильтры
            {(taskStatusFilter !== "all" ||
              taskPriorityFilter !== "all" ||
              taskUserFilter !== "all" ||
              taskPlanFilter !== "all") && (
              <span className="inline-flex items-center justify-center ml-2 w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                {
                  [
                    taskStatusFilter !== "all",
                    taskPriorityFilter !== "all",
                    taskUserFilter !== "all",
                    taskPlanFilter !== "all",
                  ].filter(Boolean).length
                }
              </span>
            )}
          </button>
        </div>

        {/* Панель фильтров */}
        {isTaskFiltersVisible && (
          <div className="bg-gray-50 p-4 mb-4 rounded border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label
                  htmlFor="statusFilter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Статус
                </label>
                <select
                  id="statusFilter"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={taskStatusFilter}
                  onChange={(e) => setTaskStatusFilter(e.target.value)}
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">В очереди</option>
                  <option value="in-progress">В процессе</option>
                  <option value="completed">Завершено</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="priorityFilter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Приоритет
                </label>
                <select
                  id="priorityFilter"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={taskPriorityFilter}
                  onChange={(e) => setTaskPriorityFilter(e.target.value)}
                >
                  <option value="all">Все приоритеты</option>
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="userFilter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Сотрудник
                </label>
                <select
                  id="userFilter"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={taskUserFilter}
                  onChange={(e) => setTaskUserFilter(e.target.value)}
                >
                  <option value="all">Все сотрудники</option>
                  {users
                    .filter((user) => user.role === "employee")
                    .map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="planFilter"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  План адаптации
                </label>
                <select
                  id="planFilter"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={taskPlanFilter}
                  onChange={(e) => setTaskPlanFilter(e.target.value)}
                >
                  <option value="all">Все планы</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={resetTaskFilters}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Сбросить фильтры
              </button>
            </div>
          </div>
        )}

        {/* Информация о результатах после применения фильтров */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-gray-600">
            Отображено {filteredAndSortedTasks.length} из {tasks.length} задач
            {(taskStatusFilter !== "all" ||
              taskPriorityFilter !== "all" ||
              taskUserFilter !== "all" ||
              taskPlanFilter !== "all" ||
              taskSearchQuery) &&
              " (применены фильтры)"}
          </div>
          <div className="text-sm text-gray-600">
            Сортировка:{" "}
            {taskSortField === "title"
              ? "название"
              : taskSortField === "deadline"
              ? "срок"
              : taskSortField === "priority"
              ? "приоритет"
              : taskSortField === "status"
              ? "статус"
              : ""}
            {taskSortDirection === "asc"
              ? " (по возрастанию)"
              : " (по убыванию)"}
          </div>
        </div>

        {filteredAndSortedTasks.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-500">
              {tasks.length === 0
                ? "Нет активных задач"
                : "Нет задач, соответствующих выбранным фильтрам"}
            </p>
          </div>
        ) : (
          <>
            {/* Таблица для средних и больших экранов */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSortDirection("title")}
                    >
                      <div className="flex items-center">
                        Задача {renderSortIcon("title")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">Сотрудник</div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="flex items-center">План</div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                      onClick={() => toggleSortDirection("status")}
                    >
                      <div className="flex items-center justify-center">
                        <span>Статус</span> {renderSortIcon("status")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer whitespace-nowrap"
                      onClick={() => toggleSortDirection("deadline")}
                    >
                      <div className="flex items-center justify-center">
                        <span>Срок</span> {renderSortIcon("deadline")}
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <div className="flex items-center">
                          <span
                            className={`mr-2 inline-block w-2 h-2 rounded-full flex-shrink-0
                            ${
                              task.priority === "high"
                                ? "bg-red-500"
                                : task.priority === "medium"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            title={
                              task.priority === "high"
                                ? "Высокий приоритет"
                                : task.priority === "medium"
                                ? "Средний приоритет"
                                : "Низкий приоритет"
                            }
                          ></span>
                          <div className="text-sm font-medium text-gray-900 max-w-xs break-words">
                            {task.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div
                          className="text-sm text-gray-900 whitespace-nowrap"
                          title={getUserEmailById(task.user_id)}
                        >
                          {getUserEmailById(task.user_id)}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div
                          className="text-sm text-gray-900 max-w-[150px] truncate"
                          title={getPlanTitleById(task.plan_id)}
                        >
                          {getPlanTitleById(task.plan_id)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {/* Для десктопа отображаем текст, а для планшетов (< 971px) отображаем иконки */}
                        <div className="hidden lg:inline-block">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${
                              task.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : task.status === "in_progress"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {task.status === "completed"
                              ? "Завершено"
                              : task.status === "in_progress"
                              ? "В процессе"
                              : "В очереди"}
                          </span>
                        </div>

                        <div className="lg:hidden flex justify-center">
                          {task.status === "completed" ? (
                            <CheckCircleIcon
                              className="h-5 w-5 text-green-600"
                              title="Завершено"
                            />
                          ) : task.status === "in_progress" ? (
                            <ClockIcon
                              className="h-5 w-5 text-blue-600"
                              title="В процессе"
                            />
                          ) : (
                            <QueueListIcon
                              className="h-5 w-5 text-gray-500"
                              title="В очереди"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="text-sm text-gray-900 whitespace-nowrap">
                          {formatDate(task.deadline)}
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-1">
                          {userRole === "hr" && (
                            <button
                              onClick={() => handleEditTask(task)}
                              className="text-blue-600 hover:text-blue-900 focus:outline-none p-1 hover:bg-blue-50 rounded-full"
                              title="Редактировать задачу"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="text-red-600 hover:text-red-900 focus:outline-none p-1 hover:bg-red-50 rounded-full"
                            title="Удалить задачу"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Карточки для мобильных устройств */}
            <div className="md:hidden mt-4">
              <div className="grid grid-cols-1 gap-4">
                {filteredAndSortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white shadow-sm border border-gray-200 rounded-lg relative hover:shadow-md transition duration-150"
                  >
                    {/* Заголовок с приоритетом */}
                    <div className="flex justify-between items-center border-b px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-block w-3 h-3 rounded-full
                  ${
                    task.priority === "high"
                      ? "bg-red-500"
                      : task.priority === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                          title={
                            task.priority === "high"
                              ? "Высокий приоритет"
                              : task.priority === "medium"
                              ? "Средний приоритет"
                              : "Низкий приоритет"
                          }
                        ></span>
                        <h3
                          className="text-base font-medium text-gray-800 truncate"
                          title={task.title}
                        >
                          {task.title}
                        </h3>
                      </div>
                      {/* Кнопки действий прямо в заголовке карточки */}
                      <div className="flex space-x-1">
                        {userRole === "hr" && (
                          <button
                            onClick={() => handleEditTask(task)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50"
                            title="Редактировать задачу"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50"
                          title="Удалить задачу"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Основное содержимое карточки */}
                    <div className="p-4">
                      {/* Информация о сотруднике и плане */}
                      <div className="mb-3">
                        <div className="flex items-start mb-1">
                          <span className="text-xs text-gray-500 font-medium w-20">
                            Сотрудник:
                          </span>
                          <span className="text-xs text-gray-700 break-all">
                            {getUserEmailById(task.user_id)}
                          </span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-xs text-gray-500 font-medium w-20">
                            План:
                          </span>
                          <span className="text-xs text-gray-700 break-all">
                            {getPlanTitleById(task.plan_id)}
                          </span>
                        </div>
                      </div>

                      {/* Описание задачи - если есть */}
                      {task.description && (
                        <div className="mb-3 border-т pt-2">
                          <p
                            className="text-sm text-gray-600 line-clamp-2"
                            title={task.description}
                          >
                            {task.description}
                          </p>
                        </div>
                      )}

                      {/* Статус и срок выполнения */}
                      <div className="flex justify-between items-center mt-3 text-xs">
                        <div className="flex items-center">
                          {task.status === "completed" ? (
                            <span className="flex items-center text-green-700">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Завершено
                            </span>
                          ) : task.status === "in_progress" ? (
                            <span className="flex items-center text-blue-700">
                              <ClockIcon className="h-4 w-4 mr-1" />В процессе
                            </span>
                          ) : (
                            <span className="flex items-center text-gray-700">
                              <QueueListIcon className="h-4 w-4 mr-1" />В
                              очереди
                            </span>
                          )}
                        </div>

                        <span className="text-gray-500">
                          Срок: {formatDate(task.deadline)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Раздел управления планами */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-700">
            Управление планами адаптации
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={refreshPlansFromDatabase}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              title="Обновить список планов из базы данных"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Обновить
            </button>
            {userRole === "hr" && (
              <button
                onClick={() => setIsPlanModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Создать план адаптации
              </button>
            )}
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-500">Нет активных планов адаптации</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Название
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Описание
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Роль
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Количество задач
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {plan.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {plan.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          plan.role === "manager"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {plan.role === "manager" ? "Менеджер" : "Сотрудник"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {
                          tasks.filter((task) => task.plan_id === plan.id)
                            .length
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {userRole === "hr" && (
                          <>
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="text-blue-600 hover:text-blue-900 focus:outline-none"
                              title="Редактировать план"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openDeletePlanModal(plan)}
                              className="text-red-600 hover:text-red-900 focus:outline-none"
                              title="Удалить план"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Добавление контейнера для уведомлений */}
      <ToastContainer position="bottom-right" />
    </div>
  );
}
