import React, { useState, useEffect } from "react";
import {
  UserIcon,
  UsersIcon,
  PencilSquareIcon,
  TrashIcon,
  LockOpenIcon,
  LockClosedIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Profiles = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояния для управления модальными окнами
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "employee",
    department: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await axios.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(response.data.role);

        // Изменяем проверку - разрешаем доступ и HR, и менеджерам
        if (response.data.role !== "hr" && response.data.role !== "manager") {
          toast.error("У вас нет доступа к этой странице");
          navigate("/dashboard");
        }
      } catch (err) {
        navigate("/login");
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await axios.get("/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch users");
        setLoading(false);
      }
    };

    fetchUserRole();
    fetchUsers();
  }, [navigate]);

  // Функция для группировки пользователей по ролям
  const getUsersByRole = (role) => {
    return users.filter((user) => user.role === role);
  };

  // Функция для получения цветов для разных ролей
  const getColorClasses = (role) => {
    switch (role) {
      case "hr":
        return {
          heading: "text-purple-700",
          badge: "bg-purple-100 text-purple-800",
          cardHeader: "bg-purple-50",
          iconContainer: "bg-purple-100",
          icon: "text-purple-600",
        };
      case "manager":
        return {
          heading: "text-blue-700",
          badge: "bg-blue-100 text-blue-800",
          cardHeader: "bg-blue-50",
          iconContainer: "bg-blue-100",
          icon: "text-blue-600",
        };
      case "employee":
      default:
        return {
          heading: "text-green-700",
          badge: "bg-green-100 text-green-800",
          cardHeader: "bg-green-50",
          iconContainer: "bg-green-100",
          icon: "text-green-600",
        };
    }
  };

  // Получить класс бейджа для роли
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "hr":
        return "bg-purple-100 text-purple-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      case "employee":
      default:
        return "bg-green-100 text-green-800";
    }
  };

  // Функции для работы с пользователями
  const openCreateModal = () => {
    setFormData({
      email: "",
      password: "",
      role: "employee",
      department: "",
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      email: user.email,
      role: user.role,
      department: user.department || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("/users", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Обновляем список пользователей
      const response = await axios.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);

      setIsCreateModalOpen(false);
      toast.success("Пользователь успешно создан");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Ошибка при создании пользователя"
      );
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`/users/${currentUser.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Обновляем список пользователей
      const response = await axios.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);

      setIsEditModalOpen(false);
      toast.success("Данные пользователя обновлены");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Ошибка при обновлении пользователя"
      );
    }
  };

  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/users/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Обновляем список пользователей
      setUsers(users.filter((user) => user.id !== currentUser.id));

      setIsDeleteModalOpen(false);
      toast.success("Пользователь удален");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Ошибка при удалении пользователя"
      );
    }
  };

  const toggleUserStatus = async (user) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/users/${user.id}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Обновляем статус пользователя локально
      setUsers(
        users.map((u) =>
          u.id === user.id ? { ...u, disabled: !u.disabled } : u
        )
      );

      toast.success(
        user.disabled
          ? "Пользователь разблокирован"
          : "Пользователь заблокирован"
      );
    } catch (err) {
      toast.error("Ошибка при изменении статуса пользователя");
    }
  };

  const resetUserPassword = async (user) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `/users/${user.id}/reset-password`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      toast.success("Пароль пользователя сброшен и отправлен на его email");
    } catch (err) {
      toast.error("Ошибка при сбросе пароля");
    }
  };

  // Компонент для отображения группы пользователей
  const UserGroupSection = ({ title, users, role }) => {
    if (users.length === 0) return null;

    const colorClasses = getColorClasses(role);

    return (
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <h3 className={`text-xl font-semibold ${colorClasses.heading}`}>
            {title}
          </h3>
          <span
            className={`ml-3 px-3 py-1 rounded-full ${colorClasses.badge} text-sm font-medium`}
          >
            {users.length}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div
              key={user.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                user.disabled ? "opacity-70" : ""
              }`}
            >
              <div className={`${colorClasses.cardHeader} p-4`}>
                <div className="flex items-center">
                  <div
                    className={`${colorClasses.iconContainer} p-3 rounded-full mr-4`}
                  >
                    <UserIcon className={`h-6 w-6 ${colorClasses.icon}`} />
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 truncate mr-2">
                        {user.email}
                      </h3>
                      {user.disabled && (
                        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                          Заблокирован
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-200">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ID:</span> {user.id}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Отдел:</span>{" "}
                    {user.department || "Не указан"}
                  </p>
                </div>

                {userRole === "hr" && (
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-3 justify-end">
                    {/* Кнопка редактирования */}
                    <button
                      type="button"
                      className="p-2 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      onClick={() => openEditModal(user)}
                      title="Изменить"
                      aria-label="Изменить пользователя"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>

                    {/* Кнопка блокировки/разблокировки */}
                    <button
                      type="button"
                      className={`p-2 rounded-full focus:outline-none focus:ring-2 transition-colors ${
                        user.disabled
                          ? "bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500"
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200 focus:ring-amber-500"
                      }`}
                      onClick={() => toggleUserStatus(user)}
                      title={user.disabled ? "Разблокировать" : "Заблокировать"}
                      aria-label={
                        user.disabled
                          ? "Разблокировать пользователя"
                          : "Заблокировать пользователя"
                      }
                    >
                      {user.disabled ? (
                        <LockOpenIcon className="h-5 w-5" />
                      ) : (
                        <LockClosedIcon className="h-5 w-5" />
                      )}
                    </button>

                    {/* Кнопка сброса пароля */}
                    <button
                      type="button"
                      className="p-2 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                      onClick={() => resetUserPassword(user)}
                      title="Сбросить пароль"
                      aria-label="Сбросить пароль пользователя"
                    >
                      <KeyIcon className="h-5 w-5" />
                    </button>

                    {/* Кнопка удаления */}
                    <button
                      type="button"
                      className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                      onClick={() => openDeleteModal(user)}
                      title="Удалить"
                      aria-label="Удалить пользователя"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Профили пользователей
          </h2>
          <p className="mt-1 text-gray-500">
            Управление профилями и пользователями системы
          </p>
        </div>

        {userRole === "hr" && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <UsersIcon className="h-5 w-5 mr-2" />
            Добавить пользователя
          </button>
        )}
      </div>

      <div>
        <UserGroupSection
          title="HR-менеджеры"
          users={getUsersByRole("hr")}
          role="hr"
        />

        <UserGroupSection
          title="Менеджеры отделов"
          users={getUsersByRole("manager")}
          role="manager"
        />

        <UserGroupSection
          title="Сотрудники"
          users={getUsersByRole("employee")}
          role="employee"
        />
      </div>

      {/* Модальное окно создания пользователя */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
              onClick={() => setIsCreateModalOpen(false)}
            ></div>

            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full z-10">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-blue-900">
                  Добавить нового пользователя
                </h3>
              </div>

              <form onSubmit={handleCreateUser} className="px-4 py-5">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Пароль
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Роль
                    </label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Менеджер</option>
                      <option value="hr">HR</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="department"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Отдел
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования пользователя */}
      {isEditModalOpen && currentUser && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
              onClick={() => setIsEditModalOpen(false)}
            ></div>

            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full z-10">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-blue-900">
                  Редактировать данные пользователя
                </h3>
              </div>

              <form onSubmit={handleUpdateUser} className="px-4 py-5">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="edit-email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="edit-email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-role"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Роль
                    </label>
                    <select
                      id="edit-role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Менеджер</option>
                      <option value="hr">HR</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-department"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Отдел
                    </label>
                    <input
                      type="text"
                      id="edit-department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {isDeleteModalOpen && currentUser && (
        <div className="fixed inset-0 overflow-y-auto z-50">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
              onClick={() => setIsDeleteModalOpen(false)}
            ></div>

            <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full z-10">
              <div className="bg-red-50 px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-red-900">
                  Подтвердите удаление пользователя
                </h3>
              </div>

              <div className="p-6">
                <p className="text-sm text-gray-500">
                  Вы уверены, что хотите удалить пользователя{" "}
                  <strong>{currentUser.email}</strong>? Это действие нельзя
                  отменить.
                </p>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Profiles;
