import { useState, useEffect } from "react";
import {
  UsersIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function HRDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        const response = await fetch(
          "http://localhost:8000/analytics/summary",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Ошибка при загрузке аналитики");
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const StatCard = ({ title, value, icon, color }) => {
    const Icon = icon;
    return (
      <div
        className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${color}-500`}
      >
        <div className="flex items-center">
          <div className={`bg-${color}-100 p-3 rounded-full mr-4`}>
            <Icon className={`h-8 w-8 text-${color}-500`} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
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

  // Если нет данных аналитики, используем заглушки
  const taskStats = analytics?.task_stats || {
    total: 0,
    completed: 0,
    completion_rate: 0,
  };
  const feedbackStats = analytics?.feedback_stats || {
    total: 0,
    avg_per_user: 0,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-blue-600">Панель HR</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Всего задач"
          value={taskStats.total}
          icon={DocumentTextIcon}
          color="blue"
        />
        <StatCard
          title="Выполнено задач"
          value={taskStats.completed}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Отзывов"
          value={feedbackStats.total}
          icon={ChatBubbleLeftRightIcon}
          color="yellow"
        />
        <StatCard
          title="Отзывов на пользователя"
          value={feedbackStats.avg_per_user.toFixed(1)}
          icon={UsersIcon}
          color="purple"
        />
      </div>

      {/* Показатель прогресса завершения задач */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Процент выполнения задач
        </h3>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                Прогресс
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {Math.round(taskStats.completion_rate * 100)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div
              style={{
                width: `${Math.round(taskStats.completion_rate * 100)}%`,
              }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Информационная панель
        </h3>
        <p className="text-gray-600">
          Здесь будут отображаться дополнительные аналитические данные для HR. В
          настоящее время доступны основные показатели выше.
        </p>
        <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 rounded">
          <p className="text-yellow-800 text-sm">
            <strong>Совет:</strong> Используйте страницу "Профили" для
            управления сотрудниками и "Интеграции" для настройки интеграций с
            другими системами.
          </p>
        </div>
      </div>
    </div>
  );
}
