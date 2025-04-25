import { useState, useEffect } from "react";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        const response = await fetch("http://localhost:8000/tasks", {
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
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(
        `http://localhost:8000/tasks/${taskId}/status?status=${newStatus}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при обновлении статуса");
      }

      const updatedTask = await response.json();
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (err) {
      setError(err.message);
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
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-600">Личный кабинет</h2>

      {tasks.length === 0 ? (
        <div className="bg-white p-4 rounded shadow-md">
          <p className="text-gray-500">Нет активных задач</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-700">Мои задачи</h3>

          {tasks.map((task) => (
            <div key={task.id} className="bg-white p-4 rounded shadow-md">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-lg font-medium text-gray-800">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-gray-600 mt-1">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPriorityClass(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                    <span className="text-sm text-gray-500">
                      Срок: {formatDate(task.deadline)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {getStatusIcon(task.status)}
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    className="text-sm border rounded p-1"
                  >
                    <option value="pending">В ожидании</option>
                    <option value="in-progress">В процессе</option>
                    <option value="completed">Завершено</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
