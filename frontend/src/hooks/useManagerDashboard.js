import { useState, useEffect, useMemo, useCallback } from "react";
import { getApiBaseUrl } from "../config/api";
import { hasRole } from "../utils/roleUtils";
import { toast } from "react-toastify";

/**
 * Хук для логики страницы Manager Dashboard
 * @returns {Object} Объект с данными и методами для работы с Dashboard менеджера
 */
export default function useManagerDashboard() {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния фильтрации задач
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState("all"); // Новый фильтр по типу задачи (шаблонная/кастомная)
  const [taskUserFilter, setTaskUserFilter] = useState("all");
  const [taskPlanFilter, setTaskPlanFilter] = useState("all");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");
  const [taskSortField, setTaskSortField] = useState("deadline");
  const [taskSortDirection, setTaskSortDirection] = useState("asc");

  const apiBaseUrl = getApiBaseUrl();

  // Загрузка данных при первоначальном рендере
  useEffect(() => {
    fetchAllData();
  }, []);

  // Функция для получения всех необходимых данных с сервера
  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);

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

      // Получаем список всех шаблонов задач
      if (hasRole(userData.role, ["HR", "hr", "manager", "Manager"])) {
        const templatesResponse = await fetch(
          `${apiBaseUrl}/api/task_templates`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!templatesResponse.ok) {
          throw new Error("Ошибка при получении списка шаблонов задач");
        }
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для обновления списка задач
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
    } catch (err) {
      console.error("Ошибка при обновлении списка задач:", err);
      toast.error(err.message);
    }
  };

  // Функция для обновления списка шаблонов задач
  const refreshTemplatesFromDatabase = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/api/task_templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Ошибка при получении списка шаблонов");
      }

      const templatesData = await response.json();
      setTemplates(templatesData);
      toast.success("Список шаблонов успешно обновлен");
    } catch (err) {
      console.error("Ошибка при обновлении списка шаблонов:", err);
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
    setTaskTypeFilter("all");
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

    // Фильтр по типу задачи (шаблонная/кастомная)
    if (taskTypeFilter !== "all") {
      if (taskTypeFilter === "template") {
        result = result.filter((task) => task.is_template === true);
      } else if (taskTypeFilter === "custom") {
        result = result.filter((task) => task.is_template !== true);
      }
    }

    // Фильтр по пользователю
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

    // Фильтр по типу задачи (шаблонная/кастомная)
    if (taskTypeFilter !== "all") {
      if (taskTypeFilter === "template") {
        result = result.filter((task) => task.is_template === true);
      } else if (taskTypeFilter === "custom") {
        result = result.filter((task) => task.is_template !== true);
      }
    }

    // Применяем сортировку
    result.sort((a, b) => {
      let comparison = 0;

      switch (taskSortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case "status":
          const statusOrder = {
            new: 1,
            in_progress: 2,
            completed: 3,
            cancelled: 4,
          };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case "deadline":
          // Для случая, когда дедлайн отсутствует
          if (!a.deadline && !b.deadline) comparison = 0;
          else if (!a.deadline) comparison = 1;
          else if (!b.deadline) comparison = -1;
          else comparison = new Date(a.deadline) - new Date(b.deadline);
          break;
        case "user":
          const userA = users.find((u) => u.id === a.user_id)?.full_name || "";
          const userB = users.find((u) => u.id === b.user_id)?.full_name || "";
          comparison = userA.localeCompare(userB);
          break;
        default:
          comparison = 0;
      }

      return taskSortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    tasks,
    taskSearchQuery,
    taskStatusFilter,
    taskPriorityFilter,
    taskTypeFilter,
    taskUserFilter,
    taskPlanFilter,
    taskSortField,
    taskSortDirection,
    users,
  ]);

  return {
    users,
    plans,
    tasks,
    templates,
    userRole,
    isLoading,
    error,
    taskStatusFilter,
    taskPriorityFilter,
    taskTypeFilter,
    taskUserFilter,
    taskPlanFilter,
    taskSearchQuery,
    taskSortField,
    taskSortDirection,
    filteredAndSortedTasks,
    setTaskStatusFilter,
    setTaskPriorityFilter,
    setTaskTypeFilter,
    setTaskUserFilter,
    setTaskPlanFilter,
    setTaskSearchQuery,
    toggleSortDirection,
    resetTaskFilters,
    fetchAllData,
    refreshTasksFromDatabase,
    refreshTemplatesFromDatabase,
  };
}
