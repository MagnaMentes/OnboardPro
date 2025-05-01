import React, { useState, useEffect, useRef } from "react";
import {
  UserIcon,
  UsersIcon,
  PencilSquareIcon,
  TrashIcon,
  LockOpenIcon,
  LockClosedIcon,
  KeyIcon,
  FunnelIcon,
  PhotoIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getApiBaseUrl } from "../config/api"; // Импортируем функцию для получения базового API URL
import usePageTitle from "../utils/usePageTitle";
import Modal from "../components/common/Modal"; // Обновленный импорт модального окна

const Profiles = () => {
  // Устанавливаем заголовок страницы
  usePageTitle("Профили сотрудников");

  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all"); // Фильтр для отображения пользователей
  const [searchTerm, setSearchTerm] = useState(""); // Поиск по почте или отделу

  // Получаем базовый URL API для правильного формирования путей к изображениям
  const apiBaseUrl = getApiBaseUrl();
  console.log("Profiles: используемый URL API:", apiBaseUrl);

  // Состояния для управления фотографиями
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Состояния для управления модальными окнами
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [resetPasswordInfo, setResetPasswordInfo] = useState(null); // Для отображения временного пароля
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "employee",
    department: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    phone: "",
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchUserRole = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserRole(response.data.role);

        // Если пользователь не HR или менеджер, перенаправляем
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
        const response = await axios.get(`${apiBaseUrl}/users`, {
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
  }, [navigate, apiBaseUrl]);

  // Функция для обработки выбора файла фотографии
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Функция для удаления выбранной фотографии
  const removePhotoPreview = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Функция для загрузки фотографии на сервер
  const uploadUserPhoto = async (userId) => {
    if (!photoFile) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", photoFile);

    try {
      const response = await axios.post(
        `${apiBaseUrl}/users/${userId}/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error("Ошибка при загрузке фотографии");
      return null;
    }
  };

  // Функция для удаления фотографии пользователя
  const deleteUserPhoto = async (userId) => {
    const token = localStorage.getItem("token");
    try {
      await axios.delete(`${apiBaseUrl}/users/${userId}/photo`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Обновляем список пользователей чтобы отобразить изменения
      const response = await axios.get(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);

      toast.success("Фотография пользователя удалена");
    } catch (error) {
      console.error("Error deleting photo:", error);
      toast.error("Ошибка при удалении фотографии");
    }
  };

  // Функция для группировки пользователей по ролям
  const getUsersByRole = (role) => {
    const filteredUsers =
      activeFilter === "all"
        ? users
        : activeFilter === "active"
        ? users.filter((user) => !user.disabled)
        : users.filter((user) => user.disabled);

    // Применяем поиск, если есть поисковый запрос
    const searchedUsers = searchTerm
      ? filteredUsers.filter(
          (user) =>
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.department &&
              user.department.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      : filteredUsers;

    return searchedUsers.filter((user) => user.role === role);
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
      first_name: "",
      last_name: "",
      middle_name: "",
      phone: "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      email: user.email,
      role: user.role,
      department: user.department || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      middle_name: user.middle_name || "",
      phone: user.phone || "",
    });
    setPhotoPreview(user.photo ? `${apiBaseUrl}${user.photo}` : null);
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
      const response = await axios.post(`${apiBaseUrl}/users`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Загружаем фотографию, если она была выбрана
      if (photoFile) {
        await uploadUserPhoto(response.data.id);
      }

      // Обновляем список пользователей
      const usersResponse = await axios.get(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(usersResponse.data);

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
      await axios.put(`${apiBaseUrl}/users/${currentUser.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Загружаем фотографию, если она была выбрана
      if (photoFile) {
        await uploadUserPhoto(currentUser.id);
      }

      // Обновляем список пользователей
      const response = await axios.get(`${apiBaseUrl}/users`, {
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
      await axios.delete(`${apiBaseUrl}/users/${currentUser.id}`, {
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
        `${apiBaseUrl}/users/${user.id}/toggle-status`,
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
      const response = await axios.post(
        `${apiBaseUrl}/users/${user.id}/reset-password`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Сохраняем информацию о временном пароле для отображения
      if (response.data && response.data.temp_password) {
        setResetPasswordInfo({
          email: user.email,
          password: response.data.temp_password,
        });
      }

      toast.success("Пароль пользователя сброшен");
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
                    className={`h-16 w-16 rounded-full mr-4 overflow-hidden flex-shrink-0 border-2 ${colorClasses.iconContainer}`}
                  >
                    {user.photo ? (
                      <img
                        src={`${apiBaseUrl}${user.photo}`}
                        alt={`${user.first_name || user.email}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `${apiBaseUrl}/static/default_avatar.png`;
                        }}
                      />
                    ) : (
                      <div
                        className={`flex items-center justify-center h-full w-full ${colorClasses.iconContainer}`}
                      >
                        <UserIcon className={`h-8 w-8 ${colorClasses.icon}`} />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900 truncate mr-2">
                        {`${user.last_name || ""} ${user.first_name || ""} ${
                          user.middle_name || ""
                        }`.trim() || user.email}
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
                  {user.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Телефон:</span> {user.phone}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Отдел:</span>{" "}
                    {user.department || "Не указан"}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {user.email}
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

  // Рендер футера для модальных окон с кнопками действий
  const renderCreateFooter = () => (
    <>
      <button
        type="button"
        onClick={() => setIsCreateModalOpen(false)}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Отмена
      </button>
      <button
        type="submit"
        form="create-user-form"
        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Создать
      </button>
    </>
  );

  const renderEditFooter = () => (
    <>
      <button
        type="button"
        onClick={() => setIsEditModalOpen(false)}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Отмена
      </button>
      <button
        type="submit"
        form="edit-user-form"
        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Сохранить
      </button>
    </>
  );

  const renderDeleteFooter = () => (
    <>
      <button
        type="button"
        onClick={() => setIsDeleteModalOpen(false)}
        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        Отмена
      </button>
      <button
        type="button"
        onClick={handleDeleteUser}
        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
      >
        Удалить
      </button>
    </>
  );

  const renderResetPasswordFooter = () => (
    <button
      type="button"
      onClick={() => setResetPasswordInfo(null)}
      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
    >
      Закрыть
    </button>
  );

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
          <h2 className="text-2xl font-bold text-blue-600">
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

      {/* Фильтры и поиск */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Фильтры по статусу */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeFilter === "all"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setActiveFilter("active")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeFilter === "active"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Активные
            </button>
            <button
              onClick={() => setActiveFilter("disabled")}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeFilter === "disabled"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              Заблокированные
            </button>
          </div>

          {/* Поиск по email/отделу */}
          <div className="relative">
            <input
              type="text"
              placeholder="Поиск по email или отделу..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
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
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Добавить нового пользователя"
        footer={renderCreateFooter()}
      >
        <form
          id="create-user-form"
          onSubmit={handleCreateUser}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
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
              className="block text-sm font-medium text-gray-700 mb-1"
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
              className="block text-sm font-medium text-gray-700 mb-1"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="first_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Имя
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="last_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Фамилия
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="middle_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Отчество
              </label>
              <input
                type="text"
                id="middle_name"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Телефон
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+380 XX XXX XX XX"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="department"
              className="block text-sm font-medium text-gray-700 mb-1"
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

          <div>
            <label
              htmlFor="photo"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Фотография
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label
                  htmlFor="photo"
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                >
                  <PhotoIcon className="h-5 w-5 mr-2" />
                  Выбрать фото
                </label>
                <input
                  type="file"
                  id="photo"
                  name="photo"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="sr-only"
                />
              </div>

              {photoPreview && (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-16 w-16 object-cover rounded-md border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removePhotoPreview}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {/* Модальное окно редактирования пользователя */}
      {currentUser && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Редактирование данных пользователя"
          footer={renderEditFooter()}
        >
          <form
            id="edit-user-form"
            onSubmit={handleUpdateUser}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="edit-email"
                className="block text-sm font-medium text-gray-700 mb-1"
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
                className="block text-sm font-medium text-gray-700 mb-1"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="edit-first_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Имя
                </label>
                <input
                  type="text"
                  id="edit-first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-last_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Фамилия
                </label>
                <input
                  type="text"
                  id="edit-last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="edit-middle_name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Отчество
                </label>
                <input
                  type="text"
                  id="edit-middle_name"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="edit-phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Телефон
                </label>
                <input
                  type="text"
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="+380 XX XXX XX XX"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-department"
                className="block text-sm font-medium text-gray-700 mb-1"
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

            <div>
              <label
                htmlFor="edit-photo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Фотография
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label
                    htmlFor="edit-photo"
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <PhotoIcon className="h-5 w-5 mr-2" />
                    {currentUser.photo ? "Изменить фото" : "Добавить фото"}
                  </label>
                  <input
                    type="file"
                    id="edit-photo"
                    name="photo"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="sr-only"
                  />
                </div>

                {photoPreview && (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-16 w-16 object-cover rounded-md border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removePhotoPreview}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <XCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Модальное окно подтверждения удаления */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Подтверждение удаления пользователя"
        variant="danger"
        size="sm"
        footer={renderDeleteFooter()}
      >
        {currentUser && (
          <div className="space-y-4">
            <p className="text-gray-500">
              Вы уверены, что хотите удалить пользователя{" "}
              <strong className="text-gray-900">{currentUser.email}</strong>?
            </p>
            <p className="text-sm text-red-500 font-medium">
              Это действие нельзя отменить!
            </p>
          </div>
        )}
      </Modal>

      {/* Модальное окно с информацией о сброшенном пароле */}
      <Modal
        isOpen={!!resetPasswordInfo}
        onClose={() => setResetPasswordInfo(null)}
        title="Временный пароль"
        variant="success"
        size="md"
        footer={renderResetPasswordFooter()}
      >
        {resetPasswordInfo && (
          <div className="space-y-4">
            <p className="text-gray-500">
              Временный пароль для пользователя{" "}
              <strong className="text-gray-900">
                {resetPasswordInfo.email}
              </strong>{" "}
              успешно сгенерирован:
            </p>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-center">
              <span className="text-lg font-medium text-gray-800">
                {resetPasswordInfo.password}
              </span>
            </div>

            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <p className="text-yellow-700 text-sm">
                <strong>Важно:</strong> Этот пароль отображается только один
                раз. Сохраните его и передайте пользователю безопасным способом.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Обновленное модальное окно профиля */}
      {selectedUser && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Профиль: ${selectedUser.name}`}
          footer={
            <>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                onClick={() => setIsModalOpen(false)}
              >
                Закрыть
              </button>
              {userRole === "admin" && (
                <button
                  className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  onClick={() => {
                    /* редактировать пользователя */
                  }}
                >
                  Редактировать
                </button>
              )}
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
            <div>
              <img
                src={selectedUser.avatar_url || "/placeholder-avatar.jpg"}
                alt={selectedUser.name}
                className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-blue-100"
              />
              <div className="text-center mt-4">
                <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                <p className="text-gray-600">{selectedUser.email}</p>
                <div className="mt-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm ${
                      selectedUser.role === "employee"
                        ? "bg-green-100 text-green-800"
                        : selectedUser.role === "manager"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {selectedUser.role === "employee"
                      ? "Сотрудник"
                      : selectedUser.role === "manager"
                      ? "Менеджер"
                      : "Администратор"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Должность
                  </dt>
                  <dd className="mt-1 text-md">
                    {selectedUser.position || "Не указана"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Телефон</dt>
                  <dd className="mt-1 text-md">
                    {selectedUser.phone || "Не указан"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Отдел</dt>
                  <dd className="mt-1 text-md">
                    {selectedUser.department || "Не указан"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Дата начала работы
                  </dt>
                  <dd className="mt-1 text-md">
                    {selectedUser.start_date
                      ? new Date(selectedUser.start_date).toLocaleDateString()
                      : "Не указана"}
                  </dd>
                </div>
              </dl>
            </div>

            {selectedUser.bio && (
              <div className="col-span-1 md:col-span-2">
                <h4 className="font-medium text-gray-700 mb-2">О сотруднике</h4>
                <p className="text-gray-600">{selectedUser.bio}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Profiles;
