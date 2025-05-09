import { useState, useEffect } from "react";
import { getApiBaseUrl } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import { hasAnyRole, normalizeRole } from "../utils/roleUtils";
import { PaperAirplaneIcon, UserIcon } from "@heroicons/react/24/outline";
import Modal from "../components/common/Modal"; // Импортируем универсальный компонент модального окна

export default function Feedback() {
  // Устанавливаем заголовок страницы
  usePageTitle("Обратная связь");

  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    recipient_id: "",
    rating: 0,
    feedback_text: "",
    visibility: "public",
  });
  const [currentFeedback, setCurrentFeedback] = useState(null);

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
        setUserRole(normalizeRole(userData.role));

        // Получаем список всех пользователей (только для HR и менеджеров)
        if (hasAnyRole(userData.role, ["hr", "manager"])) {
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

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFeedbackForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveFeedback = () => {
    // Логика сохранения отзыва
    console.log("Saving feedback:", feedbackForm);
    closeModal();
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
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Обратная связь</h2>
          <p className="mt-1 text-gray-500">
            Отправка и получение отзывов в процессе адаптации
          </p>
        </div>

        {/* Кнопка для открытия модального окна (только для HR и менеджеров) */}
        {hasAnyRole(userRole, ["hr", "manager"]) && (
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Отправить отзыв
          </button>
        )}
      </div>

      {/* Модальное окно с формой отправки отзыва */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={currentFeedback ? "Редактировать отзыв" : "Добавить отзыв"}
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSaveFeedback}
              className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {currentFeedback ? "Сохранить изменения" : "Добавить отзыв"}
            </button>
          </>
        }
      >
        <form className="space-y-6">
          <div>
            <label
              htmlFor="recipient"
              className="block text-sm font-medium text-gray-700"
            >
              Получатель отзыва
            </label>
            <select
              id="recipient"
              name="recipient_id"
              value={feedbackForm.recipient_id || ""}
              onChange={handleFormChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              required
            >
              <option value="">Выберите сотрудника</option>
              {users
                .filter((u) => u.id !== currentFeedback?.id) // Исключаем себя из списка
                .map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="rating"
              className="block text-sm font-medium text-gray-700"
            >
              Оценка
            </label>
            <div className="mt-1 flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setFeedbackForm({ ...feedbackForm, rating: star })
                  }
                  className="focus:outline-none"
                >
                  <svg
                    className={`h-8 w-8 ${
                      star <= feedbackForm.rating
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500">
                {feedbackForm.rating}/5
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="feedback_text"
              className="block text-sm font-medium text-gray-700"
            >
              Текст отзыва
            </label>
            <div className="mt-1">
              <textarea
                id="feedback_text"
                name="feedback_text"
                rows={4}
                value={feedbackForm.feedback_text}
                onChange={handleFormChange}
                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                placeholder="Поделитесь вашим опытом работы с этим сотрудником..."
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="visibility"
              className="block text-sm font-medium text-gray-700"
            >
              Видимость отзыва
            </label>
            <select
              id="visibility"
              name="visibility"
              value={feedbackForm.visibility}
              onChange={handleFormChange}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="public">Публичный (видят все)</option>
              <option value="private">
                Приватный (видит только получатель и HR)
              </option>
              <option value="hr_only">Только для HR</option>
            </select>
          </div>
        </form>
      </Modal>

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
