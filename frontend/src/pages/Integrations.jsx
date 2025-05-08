import { useState, useEffect } from "react";
import { getApiBaseUrl } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import {
  BoltIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function Integrations() {
  // Устанавливаем заголовок страницы
  usePageTitle("Интеграции");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [telegramId, setTelegramId] = useState("");
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        const response = await fetch("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Ошибка при получении данных пользователя");
        }

        const userData = await response.json();
        setUserRole(userData.role);

        // Проверка прав доступа с учетом регистра
        if (userData.role.toLowerCase() !== "hr") {
          setError(
            "Недостаточно прав для просмотра этой страницы. Требуется роль HR."
          );
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleTelegramConnect = async (e) => {
    e.preventDefault();
    if (!telegramId) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(
        "http://localhost:8000/integrations/telegram",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ telegram_id: telegramId }),
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при подключении Telegram");
      }

      setSuccessMessage("Telegram успешно подключен!");
      setTelegramId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkableImport = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(
        "http://localhost:8000/integrations/workable",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при импорте из Workable");
      }

      setSuccessMessage("Сотрудники успешно импортированы из Workable!");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const IntegrationCard = ({ title, description, icon: Icon, children }) => {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gray-50 p-4 flex items-center border-b border-gray-200">
          <div className="bg-blue-100 p-3 rounded-full mr-4">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <div className="p-4">
          <p className="text-gray-600 mb-4">{description}</p>
          {children}
        </div>
      </div>
    );
  };

  if (userRole && userRole.toLowerCase() !== "hr") {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Доступ запрещен!</strong>
          <span className="block sm:inline">
            {" "}
            Требуется роль HR для доступа к интеграциям.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-blue-600">Интеграции</h2>
        <p className="mt-1 text-gray-500">
          Настройка и управление внешними сервисами для расширения
          функциональности системы
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Ошибка!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <strong className="font-bold">Успешно!</strong>
          <span className="block sm:inline"> {successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <IntegrationCard
          title="Telegram Bot"
          description="Подключите Telegram бота для отправки уведомлений о задачах и обратной связи."
          icon={ChatBubbleLeftRightIcon}
        >
          <form onSubmit={handleTelegramConnect} className="space-y-4">
            <div>
              <label
                htmlFor="telegram_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Telegram ID
              </label>
              <input
                type="text"
                id="telegram_id"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="Введите ваш Telegram ID"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? "Подключение..." : "Подключить"}
            </button>
          </form>
        </IntegrationCard>

        <IntegrationCard
          title="Google Calendar"
          description="Синхронизируйте задачи с Google Calendar для отслеживания сроков."
          icon={CalendarIcon}
        >
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Подключить Google Calendar
          </button>
        </IntegrationCard>

        <IntegrationCard
          title="Workable"
          description="Импортируйте сотрудников из Workable для упрощения процесса адаптации."
          icon={UserGroupIcon}
        >
          <button
            onClick={handleWorkableImport}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? "Импорт..." : "Импортировать сотрудников"}
          </button>
        </IntegrationCard>

        <IntegrationCard
          title="API-интеграции"
          description="Настройте дополнительные API-интеграции для расширения функциональности."
          icon={BoltIcon}
        >
          <div className="p-4 bg-yellow-50 border border-yellow-100 rounded">
            <p className="text-sm text-yellow-600">
              API-интеграции в настоящее время находятся в разработке. Ожидайте
              обновлений.
            </p>
          </div>
        </IntegrationCard>
      </div>
    </div>
  );
}
