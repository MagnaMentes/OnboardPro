import React, { useState, useEffect, useMemo } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  FlagIcon,
  CalendarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { getApiBaseUrl } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
// Импортируем компоненты и стили из системы темы
import {
  Card,
  Button,
  TaskStatus,
  TaskPriority,
  TASK_STATUS_CLASSES,
  TASK_PRIORITY_CLASSES,
  FORM_STYLES,
  CARD_STYLES,
  getButtonClassName,
} from "../config/theme";

// Функция для получения пользователя из кэша
const getUserFromCache = () => {
  try {
    const cachedUserData = localStorage.getItem("userData");
    if (cachedUserData) {
      const { user, timestamp } = JSON.parse(cachedUserData);
      // Проверяем возраст кэша (30 минут)
      if (Date.now() - timestamp < 30 * 60 * 1000) {
        return user;
      }
    }
  } catch (error) {
    console.error("Ошибка при чтении данных пользователя из кэша:", error);
  }
  return null;
};

// Функция для сохранения пользователя в кэш
const cacheUser = (user) => {
  try {
    localStorage.setItem(
      "userData",
      JSON.stringify({
        user,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error("Ошибка при сохранении данных пользователя в кэш:", error);
  }
};

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(() => getUserFromCache());

  // Устанавливаем заголовок страницы
  usePageTitle("Дашборд сотрудника");

  // Получение данных пользователя с минимизацией запросов
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Если данные пользователя уже есть в кэше, не делаем запрос
        if (user) return;

        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        const response = await fetch(`${getApiBaseUrl()}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Ошибка при загрузке данных пользователя");
        }

        const userData = await response.json();
        setUser(userData);
        cacheUser(userData); // Сохраняем в кэш
      } catch (err) {
        console.error("Ошибка при получении данных пользователя:", err.message);
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        const response = await fetch(`${getApiBaseUrl()}/tasks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Ошибка при загрузке задач");
        }

        const data = await response.json();
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Группировка задач по приоритету
  const tasksByPriority = useMemo(() => {
    const grouped = {
      high: [],
      medium: [],
      low: [],
      null: [],
    };

    // Сортировка задач по дате дедлайна внутри каждого приоритета
    const sortByDeadline = (a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    };

    tasks.forEach((task) => {
      const priority = task.priority ? task.priority.toLowerCase() : "null";
      if (grouped[priority]) {
        grouped[priority].push(task);
      } else {
        grouped.null.push(task);
      }
    });

    // Сортировка каждой группы по дедлайну
    Object.keys(grouped).forEach((priority) => {
      grouped[priority].sort(sortByDeadline);
    });

    return grouped;
  }, [tasks]);

  // Улучшенная функция для получения иконки статуса с единым стилем
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return (
          <div className="bg-green-100 p-1 rounded-full" title="Выполнено">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          </div>
        );
      case "in_progress":
        return (
          <div className="bg-blue-100 p-1 rounded-full" title="В работе">
            <ClockIcon className="w-5 h-5 text-blue-600" />
          </div>
        );
      case "not_started":
      default:
        return (
          <div className="bg-gray-100 p-1 rounded-full" title="Не начато">
            <ExclamationCircleIcon className="w-5 h-5 text-gray-600" />
          </div>
        );
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Не указан";

    try {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return "Неверный формат даты";
      }

      return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(date);
    } catch (error) {
      return "Ошибка формата даты";
    }
  };

  // Функция для проверки просрочен ли дедлайн
  const isOverdue = (deadline) => {
    if (!deadline) return false;

    try {
      const deadlineDate = new Date(deadline);
      return deadlineDate < new Date();
    } catch (error) {
      return false;
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      // Исправляем запрос - отправляем статус как параметр запроса, а не в теле
      const response = await fetch(
        `${getApiBaseUrl()}/tasks/${taskId}/status?status=${newStatus}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          // Убираем тело запроса, так как статус передается как параметр
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при обновлении статуса задачи");
      }

      // Получаем обновленную задачу из ответа
      const updatedTask = await response.json();

      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (error) {
      setError("Ошибка при обновлении статуса задачи");
    }
  };

  // Стандартизированная функция для получения классов и иконок приоритетов
  const getPriorityClass = (priority) => {
    const priorityKey = priority?.toLowerCase() || "null";

    const priorityMap = {
      high: {
        sectionBg: "bg-red-50",
        sectionBorder: "border-red-200",
        text: "text-red-700",
        icon: <FlagIcon className="w-5 h-5 text-red-500" />,
        title: "Высокий приоритет",
      },
      medium: {
        sectionBg: "bg-yellow-50",
        sectionBorder: "border-yellow-200",
        text: "text-yellow-700",
        icon: <FlagIcon className="w-5 h-5 text-yellow-500" />,
        title: "Средний приоритет",
      },
      low: {
        sectionBg: "bg-green-50",
        sectionBorder: "border-green-200",
        text: "text-green-700",
        icon: <FlagIcon className="w-5 h-5 text-green-500" />,
        title: "Низкий приоритет",
      },
      null: {
        sectionBg: "bg-gray-50",
        sectionBorder: "border-gray-200",
        text: "text-gray-700",
        icon: <FlagIcon className="w-5 h-5 text-gray-500" />,
        title: "Без приоритета",
      },
    };

    return priorityMap[priorityKey] || priorityMap["null"];
  };

  // Функция для отображения отдельного блока задач
  const renderTaskSection = (priority, taskList) => {
    if (!taskList || taskList.length === 0) return null;

    const priorityInfo = getPriorityClass(priority);

    return (
      <div className={`mb-8 rounded-lg border ${priorityInfo.sectionBorder}`}>
        <div
          className={`flex items-center px-6 py-3 ${priorityInfo.sectionBg} rounded-t-lg`}
        >
          {priorityInfo.icon}
          <h3 className={`text-lg font-semibold ml-2 ${priorityInfo.text}`}>
            {priorityInfo.title}
          </h3>
          <span className="text-sm text-gray-600 ml-2">
            ({taskList.length})
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white rounded-b-lg">
          {taskList.map((task) => (
            <React.Fragment key={task.id}>
              {renderTaskCard(task)}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Функция для отображения карточки задачи
  const renderTaskCard = (task) => {
    const overdueClass =
      isOverdue(task.deadline) && task.status !== "completed"
        ? "border-red-300 bg-red-50"
        : "";

    return (
      <div
        key={task.id}
        className={`${CARD_STYLES.base} hover:shadow-lg transition-shadow duration-200 ${overdueClass}`}
      >
        {/* Стандартизированный заголовок */}
        <div className={CARD_STYLES.header}>
          <div className="flex items-start justify-between">
            <h4 className={CARD_STYLES.title}>{task.title}</h4>
            {/* Используем стандартизированный компонент TaskStatus c иконкой */}
            <TaskStatus status={task.status} size="lg" />
          </div>
        </div>

        {/* Содержимое карточки */}
        <div className={CARD_STYLES.body}>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {task.description || "Описание отсутствует"}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center text-sm text-gray-500">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span
                className={
                  isOverdue(task.deadline) && task.status !== "completed"
                    ? "text-red-600 font-medium"
                    : ""
                }
              >
                {formatDate(task.deadline)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(task.id, e.target.value)}
              className={FORM_STYLES.select}
            >
              <option value="not_started">Не начато</option>
              <option value="in_progress">В процессе</option>
              <option value="completed">Завершено</option>
            </select>
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

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong className="font-bold">Ошибка!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">
            Панель управления
          </h2>
          <p className="mt-1 text-gray-500">
            Управление задачами и отслеживание прогресса адаптации
          </p>
        </div>

        <Button
          onClick={() => window.location.reload()}
          variant="light"
          className="flex items-center"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      <div className="space-y-6 mt-6">
        {/* Отображаем блоки по приоритету от высокого к низкому */}
        {renderTaskSection("high", tasksByPriority.high)}
        {renderTaskSection("medium", tasksByPriority.medium)}
        {renderTaskSection("low", tasksByPriority.low)}
        {tasksByPriority.null.length > 0 &&
          renderTaskSection(null, tasksByPriority.null)}

        {/* Если нет задач вообще */}
        {tasks.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <ClockIcon className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-700">
              У вас пока нет задач
            </h3>
            <p className="mt-2 text-gray-500">
              Задачи будут появляться здесь по мере их назначения
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
