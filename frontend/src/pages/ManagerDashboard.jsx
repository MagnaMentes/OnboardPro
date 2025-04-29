import { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  PencilIcon,
  AdjustmentsVerticalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { getApiBaseUrl } from "../config/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import usePageTitle from "../utils/usePageTitle";

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
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  // Обработчики планов
  const handlePlanInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlan((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditPlanInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPlan((prev) => ({ ...prev, [name]: value }));
  };

  // Обработчик для редактирования задачи
  const handleEditTask = (task) => {
    // Преобразуем дату из ISO формата в формат YYYY-MM-DD для input type="date"
    const deadline = new Date(task.deadline).toISOString().split("T")[0];
    setEditingTask({ ...task, deadline });
    setIsEditTaskModalOpen(true);
  };

  // Обработчик изменения полей редактируемой задачи
  const handleEditTaskInputChange = (e) => {
    const { name, value } = e.target;
    setEditingTask((prev) => ({ ...prev, [name]: value }));
  };

  // Обработчик обновления задачи
  const handleUpdateTask = async (e) => {
    e.preventDefault();
    setIsUpdatingTask(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const taskData = {
        ...editingTask,
        plan_id: parseInt(editingTask.plan_id),
        user_id: parseInt(editingTask.user_id),
        deadline: new Date(editingTask.deadline).toISOString(),
      };

      const response = await fetch(`${apiBaseUrl}/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка при обновлении задачи");
      }

      const updatedTask = await response.json();

      // Обновление локального состояния
      setTasks((prev) =>
        prev.map((task) => (task.id === updatedTask.id ? updatedTask : task))
      );

      // Проверка, что данные действительно обновились
      console.log("Задача успешно обновлена в базе данных:", updatedTask);
      toast.success(`Задача "${updatedTask.title}" успешно обновлена`);

      setError(null);
      setIsEditTaskModalOpen(false);
    } catch (err) {
      console.error("Ошибка при обновлении задачи:", err);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setIsUpdatingTask(false);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const taskData = {
        ...newTask,
        plan_id: parseInt(newTask.plan_id),
        user_id: parseInt(newTask.user_id),
        deadline: new Date(newTask.deadline).toISOString(),
      };

      const response = await fetch(`${apiBaseUrl}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Ошибка при создании задачи");
      }

      const createdTask = await response.json();
      setTasks((prev) => [...prev, createdTask]);
      setNewTask({
        plan_id: "",
        user_id: "",
        title: "",
        description: "",
        priority: "medium",
        deadline: new Date().toISOString().split("T")[0],
      });
      setIsTaskModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
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
    return user ? user.email : `Пользователь #${userId}`;
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

  // Модальное окно для создания задачи
  const TaskModal = () => {
    if (!isTaskModalOpen) return null;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setIsTaskModalOpen(false)}
          ></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-3xl max-h-[90vh] overflow-y-auto z-10">
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-blue-900">
                Создать новую задачу
              </h3>
            </div>

            <div className="p-5">
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="user_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Сотрудник
                    </label>
                    <select
                      id="user_id"
                      name="user_id"
                      value={newTask.user_id}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Выберите сотрудника</option>
                      {users
                        .filter((user) => user.role === "employee")
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.email} ({user.department || "Без отдела"})
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
                      value={newTask.plan_id}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Название задачи
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newTask.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

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
                      value={newTask.priority}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>

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
                      value={newTask.deadline}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
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
                    value={newTask.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[100px]"
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Создать задачу
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Модальное окно для создания плана
  const PlanModal = () => {
    if (!isPlanModalOpen) return null;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setIsPlanModalOpen(false)}
          ></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-blue-900">
                Создать новый план адаптации
              </h3>
            </div>

            <div className="p-5">
              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="plan_title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Название плана
                    </label>
                    <input
                      id="plan_title"
                      name="title"
                      type="text"
                      value={newPlan.title}
                      onChange={handlePlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="plan_role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Роль
                    </label>
                    <select
                      id="plan_role"
                      name="role"
                      value={newPlan.role}
                      onChange={handlePlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Менеджер</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="plan_description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Описание
                    </label>
                    <textarea
                      id="plan_description"
                      name="description"
                      value={newPlan.description}
                      onChange={handlePlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[80px]"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isCreatingPlan}
                  >
                    {isCreatingPlan ? "Создание..." : "Создать план"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Модальное окно для редактирования плана
  const EditPlanModal = () => {
    if (!isEditPlanModalOpen || !editingPlan) return null;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setIsEditPlanModalOpen(false)}
          ></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-blue-900">
                Редактировать план адаптации
              </h3>
            </div>

            <div className="p-5">
              <form onSubmit={handleUpdatePlan} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit_plan_title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Название плана
                    </label>
                    <input
                      id="edit_plan_title"
                      name="title"
                      type="text"
                      value={editingPlan.title}
                      onChange={handleEditPlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit_plan_role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Роль
                    </label>
                    <select
                      id="edit_plan_role"
                      name="role"
                      value={editingPlan.role}
                      onChange={handleEditPlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Менеджер</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="edit_plan_description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Описание
                    </label>
                    <textarea
                      id="edit_plan_description"
                      name="description"
                      value={editingPlan.description}
                      onChange={handleEditPlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[80px]"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditPlanModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isEditingPlan}
                  >
                    {isEditingPlan ? "Сохранение..." : "Сохранить план"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Модальное окно подтверждения удаления плана
  const DeletePlanModal = () => {
    if (!isDeletePlanModalOpen || !planToDelete) return null;

    const relatedTasks = tasks.filter(
      (task) => task.plan_id === planToDelete.id
    );
    const hasTasks = relatedTasks.length > 0;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setIsDeletePlanModalOpen(false)}
          ></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="bg-red-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-red-900">
                Удаление плана адаптации
              </h3>
            </div>

            <div className="p-5">
              {hasTasks ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Невозможно удалить план "{planToDelete.title}", так как с
                    ним связано {relatedTasks.length} задач.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Сначала удалите все связанные задачи, затем повторите
                    попытку.
                  </p>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsDeletePlanModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    Вы действительно хотите удалить план "{planToDelete.title}"?
                  </p>
                  <p className="text-red-600 text-sm mb-4">
                    Это действие нельзя отменить.
                  </p>
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsDeletePlanModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      onClick={handleDeletePlan}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Удалить план
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Модальное окно для редактирования задачи
  const EditTaskModal = () => {
    if (!isEditTaskModalOpen || !editingTask) return null;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setIsEditTaskModalOpen(false)}
          ></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-3xl max-h-[90vh] overflow-y-auto z-10">
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-blue-900">
                Редактировать задачу
              </h3>
            </div>

            <div className="p-5">
              <form onSubmit={handleUpdateTask} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit_user_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Сотрудник
                    </label>
                    <select
                      id="edit_user_id"
                      name="user_id"
                      value={editingTask.user_id}
                      onChange={handleEditTaskInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Выберите сотрудника</option>
                      {users
                        .filter((user) => user.role === "employee")
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.email} ({user.department || "Без отдела"})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit_plan_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      План адаптации
                    </label>
                    <select
                      id="edit_plan_id"
                      name="plan_id"
                      value={editingTask.plan_id}
                      onChange={handleEditTaskInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

                  <div>
                    <label
                      htmlFor="edit_title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Название задачи
                    </label>
                    <input
                      type="text"
                      id="edit_title"
                      name="title"
                      value={editingTask.title}
                      onChange={handleEditTaskInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit_priority"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Приоритет
                    </label>
                    <select
                      id="edit_priority"
                      name="priority"
                      value={editingTask.priority}
                      onChange={handleEditTaskInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit_deadline"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Срок выполнения
                    </label>
                    <input
                      type="date"
                      id="edit_deadline"
                      name="deadline"
                      value={editingTask.deadline}
                      onChange={handleEditTaskInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit_status"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Статус
                    </label>
                    <select
                      id="edit_status"
                      name="status"
                      value={editingTask.status}
                      onChange={handleEditTaskInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="pending">В очереди</option>
                      <option value="in_progress">В процессе</option>
                      <option value="completed">Завершено</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="edit_description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Описание
                  </label>
                  <textarea
                    id="edit_description"
                    name="description"
                    value={editingTask.description || ""}
                    onChange={handleEditTaskInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[100px]"
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditTaskModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isUpdatingTask}
                  >
                    {isUpdatingTask ? "Сохранение..." : "Сохранить задачу"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-blue-600">Панель менеджера</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Ошибка!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Модальные окна */}
      <TaskModal />
      <PlanModal />
      <EditPlanModal />
      <DeletePlanModal />
      <EditTaskModal />

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
                className="bg-gray-100 px-3 py-2 border-t border-r border-b border-gray-300"
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortDirection("title")}
                  >
                    <div className="flex items-center">
                      Задача {renderSortIcon("title")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center">Сотрудник</div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center">План</div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortDirection("priority")}
                  >
                    <div className="flex items-center">
                      Приоритет {renderSortIcon("priority")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortDirection("deadline")}
                  >
                    <div className="flex items-center">
                      Срок {renderSortIcon("deadline")}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortDirection("status")}
                  >
                    <div className="flex items-center">
                      Статус {renderSortIcon("status")}
                    </div>
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
                {filteredAndSortedTasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {task.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getUserEmailById(task.user_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getPlanTitleById(task.plan_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority === "high"
                          ? "Высокий"
                          : task.priority === "medium"
                          ? "Средний"
                          : "Низкий"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(task.deadline)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status === "completed"
                          ? "Завершено"
                          : task.status === "in-progress"
                          ? "В процессе"
                          : "В очереди"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {userRole === "hr" && (
                          <>
                            <button
                              onClick={() => handleEditTask(task)}
                              className="text-blue-600 hover:text-blue-900 focus:outline-none mr-2"
                              title="Редактировать задачу"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-900 focus:outline-none"
                          title="Удалить задачу"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
