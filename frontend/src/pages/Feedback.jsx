import { useState, useEffect } from "react";
import {
  PaperAirplaneIcon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Feedback() {
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        // Получаем информацию о текущем пользователе
        const userResponse = await fetch("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!userResponse.ok) {
          throw new Error("Ошибка при получении данных пользователя");
        }
        const userData = await userResponse.json();
        setUserRole(userData.role);

        // Получаем список всех пользователей (только для HR и менеджеров)
        if (userData.role === "hr" || userData.role === "manager") {
          const usersResponse = await fetch("http://localhost:8000/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setUsers(usersData);
          }
        }

        // Получаем отзывы
        const feedbackResponse = await fetch("http://localhost:8000/feedback", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!feedbackResponse.ok) {
          throw new Error("Ошибка при загрузке отзывов");
        }
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message || !selectedUser) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch("http://localhost:8000/feedback", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_id: parseInt(selectedUser),
          message,
        }),
      });

      if (!response.ok) {
        throw new Error("Ошибка при отправке отзыва");
      }

      const newFeedback = await response.json();
      setFeedback((prev) => [...prev, newFeedback]);
      setMessage("");
      setSelectedUser("");
      // Закрываем модальное окно после успешной отправки
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
    setError(null); // Сбрасываем ошибки при открытии модального окна
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-blue-600">Обратная связь</h2>

        {/* Кнопка для открытия модального окна (только для HR и менеджеров) */}
        {(userRole === "hr" || userRole === "manager") && (
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Отправить отзыв
          </button>
        )}
      </div>

      {/* Модальное окно с формой отправки отзыва */}
      {isModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
              onClick={closeModal}
            ></div>

            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-md sm:w-full z-10">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Отправить обратную связь
                </h3>
                <button
                  type="button"
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {error && (
                <div className="mt-2 mx-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <strong className="font-bold">Ошибка!</strong>
                  <span className="block sm:inline"> {error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="px-5 py-5 space-y-4">
                <div>
                  <label
                    htmlFor="recipient"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Получатель
                  </label>
                  <select
                    id="recipient"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Выберите получателя</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Сообщение
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                    required
                  />
                </div>

                <div className="flex justify-end mt-6 space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={closeModal}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                    {isSubmitting ? "Отправляется..." : "Отправить"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Список отзывов */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-700">
          Полученные отзывы
        </h3>

        {feedback.length === 0 ? (
          <div className="bg-white p-4 rounded shadow-md">
            <p className="text-gray-500">Нет доступных отзывов</p>
          </div>
        ) : (
          feedback.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded shadow-md">
              <div className="flex items-start">
                <div className="rounded-full bg-blue-100 p-2 mr-3">
                  <UserIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <p className="text-sm font-medium text-gray-800">
                      Отправитель: {item.sender_id}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-600">{item.message}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
