import React, { useState, useEffect, useMemo } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { getApiBaseUrl } from "../config/api";
import usePageTitle from "../utils/usePageTitle";

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
      case "pending":
        return <ClockIcon className="w-6 h-6 text-yellow-500" />;
      default:
        return <ExclamationCircleIcon className="w-6 h-6 text-red-500" />;
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority.toLowerCase()) {
      case "high":
        return {
          badge: "bg-red-100 text-red-800",
          header: "bg-red-50 border-red-200",
          text: "text-red-900",
        };
      case "medium":
        return {
          badge: "bg-yellow-100 text-yellow-800",
          header: "bg-yellow-50 border-yellow-200",
          text: "text-yellow-900",
        };
      case "low":
        return {
          badge: "bg-green-100 text-green-800",
          header: "bg-green-50 border-green-200",
          text: "text-green-900",
        };
      default:
        return {
          badge: "bg-gray-100 text-gray-800",
          header: "bg-gray-50 border-gray-200",
          text: "text-gray-900",
        };
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

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/tasks/${taskId}/status`,
        {
          method: "PUT", // Исправлено с PATCH на PUT согласно API бэкенда
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-blue-600">Панель управления</h2>
        <p className="mt-1 text-gray-500">
          Управление задачами и отслеживание прогресса адаптации
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => {
          const priorityClasses = getPriorityClass(task.priority);

          return (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Заголовочная часть с цветом в соответствии с приоритетом */}
              <div className={`px-6 py-4 border-b ${priorityClasses.header}`}>
                <div className="flex items-start justify-between">
                  <h3
                    className={`text-lg font-semibold ${priorityClasses.text}`}
                  >
                    {task.title}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${priorityClasses.badge}`}
                  >
                    {task.priority}
                  </span>
                </div>
              </div>

              {/* Содержимое карточки */}
              <div className="p-6">
                <p className="text-gray-600 mb-4">{task.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-gray-500">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    <span>Срок: {formatDate(task.deadline)}</span>
                  </div>
                  {getStatusIcon(task.status)}
                </div>
                <div className="flex items-center justify-between">
                  <select
                    value={task.status}
                    onChange={(e) =>
                      handleStatusChange(task.id, e.target.value)
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="not_started">Не начато</option>
                    <option value="in_progress">В процессе</option>
                    <option value="completed">Завершено</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
