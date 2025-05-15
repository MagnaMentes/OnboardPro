import { useState, useMemo } from "react";

/**
 * Хук для работы с фильтрацией задач
 * @param {Array} tasks - Массив задач
 * @param {Array} users - Массив пользователей
 * @param {Array} plans - Массив планов
 * @returns {Object} - Объект с методами и состояниями для фильтрации задач
 */
export default function useTaskFilters(tasks = [], users = [], plans = []) {
  // Состояния фильтров
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // Новый фильтр для типа задачи
  const [userFilter, setUserFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("deadline");
  const [sortDirection, setSortDirection] = useState("asc");

  // Варианты фильтров для интерфейса
  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Все статусы" },
      { value: "new", label: "Новые" },
      { value: "in_progress", label: "В работе" },
      { value: "completed", label: "Завершенные" },
      { value: "cancelled", label: "Отмененные" },
    ],
    []
  );

  const priorityOptions = useMemo(
    () => [
      { value: "all", label: "Все приоритеты" },
      { value: "high", label: "Высокий" },
      { value: "medium", label: "Средний" },
      { value: "low", label: "Низкий" },
    ],
    []
  );

  // Новые опции для фильтрации по типу задачи
  const typeOptions = useMemo(
    () => [
      { value: "all", label: "Все типы" },
      { value: "template", label: "Шаблонные" },
      { value: "custom", label: "Кастомные" },
    ],
    []
  );

  const userOptions = useMemo(() => {
    const options = [{ value: "all", label: "Все сотрудники" }];

    users.forEach((user) => {
      if (!user.disabled) {
        options.push({
          value: user.id.toString(),
          label: user.full_name || user.email,
        });
      }
    });

    return options;
  }, [users]);

  const planOptions = useMemo(() => {
    const options = [{ value: "all", label: "Все планы" }];

    plans.forEach((plan) => {
      options.push({
        value: plan.id.toString(),
        label: plan.title,
      });
    });

    return options;
  }, [plans]);

  // Функция для сброса всех фильтров
  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setTypeFilter("all");
    setUserFilter("all");
    setPlanFilter("all");
    setSearchQuery("");
  };

  // Функция переключения направления сортировки
  const toggleSortDirection = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Применение всех фильтров и сортировок
  const filteredTasks = useMemo(() => {
    // Сначала применяем фильтры
    let result = [...tasks];

    // Фильтр по поисковому запросу (ищет в названии и описании)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Фильтр по статусу
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    // Фильтр по приоритету
    if (priorityFilter !== "all") {
      result = result.filter((task) => task.priority === priorityFilter);
    }

    // Фильтр по типу задачи (шаблонная/кастомная)
    if (typeFilter !== "all") {
      if (typeFilter === "template") {
        result = result.filter((task) => task.is_template === true);
      } else if (typeFilter === "custom") {
        result = result.filter((task) => task.is_template !== true);
      }
    }

    // Фильтр по пользователю
    if (userFilter !== "all") {
      result = result.filter((task) => task.user_id === parseInt(userFilter));
    }

    // Фильтр по плану
    if (planFilter !== "all") {
      result = result.filter((task) => task.plan_id === parseInt(planFilter));
    }

    // Применяем сортировку
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
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

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [
    tasks,
    searchQuery,
    statusFilter,
    priorityFilter,
    typeFilter,
    userFilter,
    planFilter,
    sortField,
    sortDirection,
    users,
  ]);

  return {
    statusFilter,
    priorityFilter,
    typeFilter,
    userFilter,
    planFilter,
    searchQuery,
    sortField,
    sortDirection,
    statusOptions,
    priorityOptions,
    typeOptions,
    userOptions,
    planOptions,
    setStatusFilter,
    setPriorityFilter,
    setTypeFilter,
    setUserFilter,
    setPlanFilter,
    setSearchQuery,
    setSortField,
    setSortDirection,
    toggleSortDirection,
    resetFilters,
    filteredTasks,
  };
}
