import React, { useState, useEffect } from "react";
import { FlagIcon, CalendarIcon } from "@heroicons/react/24/outline";
import { getApiBaseUrl } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import { TaskStatus, CARD_STYLES } from "../config/theme";
import TaskEditModal from "../components/specific/TaskEditModal";
import EditableCard from "../components/specific/EditableCard";
import { formatUserDisplayName } from "../utils/userUtils";

// Функция для получения пользователя из кэша
const getUserFromCache = () => {
  try {
    // Получаем текущий токен
    const currentToken = localStorage.getItem("token");
    if (!currentToken) return null;

    const cachedUserData = localStorage.getItem("userData");
    if (cachedUserData) {
      const { user, timestamp, token } = JSON.parse(cachedUserData);
      // Проверяем возраст кэша (30 минут) и соответствие токена
      if (Date.now() - timestamp < 30 * 60 * 1000 && token === currentToken) {
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
    // Сохраняем текущий токен вместе с данными пользователя
    const token = localStorage.getItem("token");
    localStorage.setItem(
      "userData",
      JSON.stringify({
        user,
        timestamp: Date.now(),
        token: token, // Сохраняем токен для проверки соответствия
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
  const [selectedTask, setSelectedTask] = useState(null); // Для выбранной задачи
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false); // Для открытия модального окна задачи

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
        console.log("API данные пользователя:", userData);

        // Проверяем, что данные пользователя содержат необходимые поля
        if (!userData) {
          throw new Error("Данные пользователя отсутствуют");
        }

        setUser(userData);
        cacheUser(userData); // Сохраняем в кэш
      } catch (err) {
        console.error("Ошибка при получении данных пользователя:", err.message);
        // Устанавливаем сообщение об ошибке для пользователя
        setError(err.message);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Обработчик обновления задачи
  const handleTaskUpdate = (updatedTask) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
    // Обновляем и selectedTask, если это та же задача
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  // Загрузка задач
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-500">Ошибка: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Мои задачи</h1>
      {user && (
        <p className="mb-6 text-lg text-gray-600">
          Добро пожаловать, {formatUserDisplayName(user)}!
        </p>
      )}
      <div>
        {tasks.length === 0 ? (
          <div className="text-center text-gray-500">
            <p className="text-xl mb-2">🎉</p>
            <p className="text-sm text-gray-600">У вас пока нет задач.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <EditableCard
                key={task.id}
                className={`mb-4 shadow-lg ${
                  CARD_STYLES[task.status] || CARD_STYLES.default
                }`}
                onClick={() => handleTaskClick(task)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-semibold text-gray-700 truncate pr-2">
                      {task.title}
                    </h2>
                    <TaskStatus status={task.status} />
                  </div>
                  <p className="text-gray-600 text-sm mb-2 truncate">
                    {task.description || "Нет описания"}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 mb-1">
                    <FlagIcon className="h-4 w-4 mr-1" />
                    Приоритет: {task.priority}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    Срок: {new Date(task.deadline).toLocaleDateString()}
                  </div>
                </div>
              </EditableCard>
            ))}
          </div>
        )}
      </div>

      {isTaskModalOpen && selectedTask && (
        <TaskEditModal
          task={selectedTask}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedTask(null);
          }}
          onTaskUpdate={handleTaskUpdate}
          canEditDetails={false}
          canChangeStatus={true}
        />
      )}
    </div>
  );
}
