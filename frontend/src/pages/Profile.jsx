import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  CameraIcon,
  KeyIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import usePageTitle from "../utils/usePageTitle";
import {
  Button,
  Card,
  FormField,
  SelectField,
  FORM_STYLES,
  CARD_STYLES,
} from "../config/theme";

export default function Profile() {
  // Состояния для информации профиля
  const [user, setUser] = useState({
    id: 1,
    firstName: "Александр",
    lastName: "Иванов",
    email: "employee@onboardpro.com",
    phone: "+7 (999) 123-45-67",
    position: "Frontend разработчик",
    department: "Разработка",
    hireDate: "2024-09-01",
    avatar: null,
    bio: "Опытный frontend разработчик с фокусом на React и современные JavaScript фреймворки.",
    skills: ["React", "JavaScript", "TypeScript", "CSS", "HTML5", "Git"],
    address: "г. Москва, ул. Примерная, д. 123",
  });

  // Состояния для UI
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("info");

  // Activity data
  const [activityData, setActivityData] = useState({
    completedTasks: 18,
    inProgressTasks: 5,
    tasksHistory: [
      { date: "2024-09-15", completed: 3 },
      { date: "2024-09-14", completed: 2 },
      { date: "2024-09-13", completed: 4 },
      { date: "2024-09-12", completed: 1 },
      { date: "2024-09-11", completed: 3 },
      { date: "2024-09-10", completed: 5 },
    ],
    nextDeadlines: [
      { id: 1, title: "Завершить обучение React", deadline: "2024-09-30" },
      { id: 2, title: "Пройти курс по TypeScript", deadline: "2024-10-05" },
      { id: 3, title: "Заполнить документы HR", deadline: "2024-09-25" },
    ],
  });

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Устанавливаем заголовок страницы
  usePageTitle("Профиль - OnboardPro");

  // Отслеживаем состояние темной темы
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Загрузка данных профиля
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        // В реальном приложении здесь был бы запрос к API
        // const response = await fetch("/api/profile", {
        //   headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        // });

        // Имитируем задержку загрузки
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // const data = await response.json();
        // setUser(data);
        setEditForm({ ...user }); // Копируем данные пользователя в форму редактирования
      } catch (err) {
        setError("Ошибка при загрузке профиля. Пожалуйста, попробуйте позже.");
        console.error("Error fetching profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Начало редактирования
  const handleStartEdit = () => {
    setEditForm({ ...user });
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  // Отмена редактирования
  const handleCancelEdit = () => {
    setIsEditing(false);
    setError(null);
  };

  // Обработка изменения полей формы
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  // Обработка изменения навыков
  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(",").map((skill) => skill.trim());
    setEditForm((prev) => ({ ...prev, skills }));
  };

  // Сохранение изменений
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);

      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch("/api/profile", {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${localStorage.getItem("token")}`
      //   },
      //   body: JSON.stringify(editForm),
      // });

      // Имитируем задержку сохранения
      await new Promise((resolve) => setTimeout(resolve, 800));

      // if (!response.ok) throw new Error("Ошибка при сохранении профиля");

      setUser(editForm);
      setIsEditing(false);
      setSuccess("Профиль успешно обновлен!");

      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError("Ошибка при сохранении данных профиля.");
      console.error("Error saving profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Открытие диалога выбора файла
  const handleAvatarUploadClick = () => {
    fileInputRef.current.click();
  };

  // Обработка загрузки аватара
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Проверка размера и типа файла
    if (file.size > 5 * 1024 * 1024) {
      setError("Размер файла не должен превышать 5MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Пожалуйста, выберите изображение.");
      return;
    }

    try {
      setIsLoading(true);

      // Создаем dataURL для предпросмотра
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm((prev) => ({ ...prev, avatar: reader.result }));
        // В реальном приложении здесь был бы запрос для загрузки аватара на сервер
      };
      reader.readAsDataURL(file);

      // Имитируем задержку загрузки
      await new Promise((resolve) => setTimeout(resolve, 600));
    } catch (err) {
      setError("Ошибка при загрузке изображения.");
      console.error("Error uploading avatar:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка формы смены пароля
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Простая валидация паролей
    if (passwordForm.newPassword.length < 8) {
      setError("Новый пароль должен содержать не менее 8 символов.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("Пароли не совпадают.");
      return;
    }

    try {
      setIsLoading(true);

      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch("/api/change-password", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: `Bearer ${localStorage.getItem("token")}`
      //   },
      //   body: JSON.stringify({
      //     currentPassword: passwordForm.currentPassword,
      //     newPassword: passwordForm.newPassword,
      //   }),
      // });

      // Имитируем задержку запроса
      await new Promise((resolve) => setTimeout(resolve, 800));

      // if (!response.ok) throw new Error("Неверный текущий пароль");

      // Сбрасываем форму и показываем сообщение об успехе
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
      setSuccess("Пароль успешно изменен!");

      // Скрываем сообщение об успехе через 3 секунды
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(
        "Ошибка при смене пароля. Проверьте, что текущий пароль введен верно."
      );
      console.error("Error changing password:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка формы изменения пароля
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch (err) {
      return dateString;
    }
  };

  if (isLoading && !user.id) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Заголовок страницы */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Профиль пользователя
        </h1>
        {!isEditing ? (
          <button
            onClick={handleStartEdit}
            className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800"
          >
            <PencilSquareIcon className="w-5 h-5 mr-2" />
            Редактировать
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleCancelEdit}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              <XMarkIcon className="w-5 h-5 mr-2" />
              Отмена
            </button>
            <button
              onClick={handleSaveProfile}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <CheckIcon className="w-5 h-5 mr-2" />
              Сохранить
            </button>
          </div>
        )}
      </div>

      {/* Уведомления */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 dark:bg-red-900 dark:border-red-700 dark:text-red-100">
          <div className="flex">
            <XMarkIcon className="w-5 h-5 text-red-500 mr-2" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4 dark:bg-green-900 dark:border-green-700 dark:text-green-100">
          <div className="flex">
            <CheckIcon className="w-5 h-5 text-green-500 mr-2" />
            <p className="font-medium">{success}</p>
          </div>
        </div>
      )}

      {/* Вкладки */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab("info")}
            className={`${
              activeTab === "info"
                ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium`}
          >
            Информация
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`${
              activeTab === "activity"
                ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium`}
          >
            Активность
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`${
              activeTab === "security"
                ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
            } whitespace-nowrap py-3 px-1 border-b-2 font-medium`}
          >
            Безопасность
          </button>
        </nav>
      </div>

      {/* Содержимое вкладки "Информация" */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Левая колонка (аватар и основная информация) */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 flex flex-col items-center">
              {/* Аватар */}
              <div className="relative">
                {isEditing || !user.avatar ? (
                  <div
                    className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center"
                    onClick={isEditing ? handleAvatarUploadClick : undefined}
                    style={
                      editForm.avatar
                        ? {
                            backgroundImage: `url(${editForm.avatar})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }
                        : {}
                    }
                  >
                    {!editForm.avatar && (
                      <UserCircleIcon className="w-24 h-24 text-gray-400 dark:text-gray-500" />
                    )}
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                        <CameraIcon className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="w-32 h-32 rounded-full overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: `url(${user.avatar})` }}
                  />
                )}

                {isEditing && (
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                )}
              </div>

              {/* Имя пользователя */}
              <div className="mt-4 text-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {user.position}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Отдел: {user.department}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  В компании с {formatDate(user.hireDate)}
                </p>
              </div>

              {/* Контактная информация */}
              <div className="mt-6 w-full space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {user.email}
                  </span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {user.phone}
                  </span>
                </div>
                <div className="flex items-start">
                  <MapPinIcon className="w-5 h-5 text-gray-500 mr-2 mt-0.5" />
                  <span className="text-gray-600 dark:text-gray-300">
                    {user.address}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка (форма редактирования или детальная информация) */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              {isEditing ? (
                /* Форма редактирования профиля */
                <div className="space-y-5">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Редактирование профиля
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                      label="Имя"
                      id="firstName"
                      name="firstName"
                      value={editForm.firstName || ""}
                      onChange={handleInputChange}
                      placeholder="Введите имя"
                    />

                    <FormField
                      label="Фамилия"
                      id="lastName"
                      name="lastName"
                      value={editForm.lastName || ""}
                      onChange={handleInputChange}
                      placeholder="Введите фамилию"
                    />

                    <FormField
                      label="Телефон"
                      id="phone"
                      name="phone"
                      type="tel"
                      value={editForm.phone || ""}
                      onChange={handleInputChange}
                      placeholder="Введите номер телефона"
                    />

                    <FormField
                      label="Должность"
                      id="position"
                      name="position"
                      value={editForm.position || ""}
                      onChange={handleInputChange}
                      placeholder="Введите должность"
                    />

                    <FormField
                      label="Отдел"
                      id="department"
                      name="department"
                      value={editForm.department || ""}
                      onChange={handleInputChange}
                      placeholder="Введите название отдела"
                    />

                    <FormField
                      label="Дата начала работы"
                      id="hireDate"
                      name="hireDate"
                      type="date"
                      value={editForm.hireDate || ""}
                      onChange={handleInputChange}
                    />
                  </div>

                  <FormField
                    label="Адрес"
                    id="address"
                    name="address"
                    value={editForm.address || ""}
                    onChange={handleInputChange}
                    placeholder="Введите адрес"
                  />

                  <FormField
                    label="О себе"
                    id="bio"
                    name="bio"
                    type="textarea"
                    rows={3}
                    value={editForm.bio || ""}
                    onChange={handleInputChange}
                    placeholder="Расскажите о себе"
                  />

                  <FormField
                    label="Навыки (через запятую)"
                    id="skills"
                    name="skills"
                    value={editForm.skills ? editForm.skills.join(", ") : ""}
                    onChange={handleSkillsChange}
                    placeholder="Например: React, JavaScript, TypeScript"
                  />
                </div>
              ) : (
                /* Просмотр детальной информации профиля */
                <div className="space-y-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    Информация о пользователе
                  </h2>

                  {/* О себе */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      О себе
                    </h3>
                    <p className="mt-1 text-gray-800 dark:text-gray-200">
                      {user.bio || "Информация не указана"}
                    </p>
                  </div>

                  {/* Навыки */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Навыки
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.skills &&
                        user.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full dark:bg-blue-900 dark:text-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      {(!user.skills || user.skills.length === 0) && (
                        <span className="text-gray-500 dark:text-gray-400">
                          Навыки не указаны
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Рабочая информация */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Рабочая информация
                    </h3>
                    <div className="mt-2 space-y-3">
                      <div className="flex">
                        <BriefcaseIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            Должность
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.position}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        <MapPinIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            Отдел
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {user.department}
                          </p>
                        </div>
                      </div>
                      <div className="flex">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            Работает с
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(user.hireDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Содержимое вкладки "Активность" */}
      {activeTab === "activity" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Статистика выполненных задач */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Статистика задач
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg dark:bg-green-900">
                <div className="flex items-center">
                  <CheckIcon className="w-8 h-8 text-green-500 dark:text-green-400 mr-3" />
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Выполнено задач
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-200">
                      {activityData.completedTasks}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg dark:bg-blue-900">
                <div className="flex items-center">
                  <ClockIcon className="w-8 h-8 text-blue-500 dark:text-blue-400 mr-3" />
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-300">
                      В процессе
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-200">
                      {activityData.inProgressTasks}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              История выполнения задач
            </h3>
            <div className="h-64 flex items-end space-x-2">
              {activityData.tasksHistory.map((day, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm"
                    style={{
                      height: `${(day.completed / 5) * 100}%`,
                      maxHeight: "90%",
                      minHeight: "10%",
                    }}
                  ></div>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(day.date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Ближайшие дедлайны */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Ближайшие дедлайны
            </h2>

            {activityData.nextDeadlines.length > 0 ? (
              <div className="space-y-4">
                {activityData.nextDeadlines.map((task) => (
                  <div
                    key={task.id}
                    className="border-l-2 border-blue-500 pl-4 py-2"
                  >
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                      {task.title}
                    </h3>
                    <div className="flex items-center mt-1">
                      <CalendarIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-1" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(task.deadline)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto" />
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                  Нет предстоящих дедлайнов
                </p>
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-2 px-4 border border-blue-600 rounded-md text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/50 transition-colors"
              >
                Перейти к задачам
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Содержимое вкладки "Безопасность" */}
      {activeTab === "security" && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Безопасность аккаунта
          </h2>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Пароль
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Изменение пароля от аккаунта
                </p>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                <KeyIcon className="w-5 h-5 mr-2" />
                {showPasswordForm ? "Отмена" : "Изменить пароль"}
              </button>
            </div>

            {showPasswordForm && (
              <form
                onSubmit={handlePasswordChange}
                className="bg-gray-50 p-4 rounded-lg dark:bg-gray-700"
              >
                <div className="space-y-4">
                  <FormField
                    label="Текущий пароль"
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordFormChange}
                    required
                  />

                  <FormField
                    label="Новый пароль"
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordFormChange}
                    required
                    minLength={8}
                    helpText="Пароль должен содержать не менее 8 символов."
                  />

                  <FormField
                    label="Подтверждение пароля"
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordFormChange}
                    required
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                          Сохранение...
                        </span>
                      ) : (
                        "Сохранить пароль"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">
              Сеансы входа в систему
            </h3>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-700 dark:text-blue-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Текущий сеанс
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {navigator.userAgent}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Активен сейчас
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                onClick={() => {
                  // Полноценный выход из системы
                  localStorage.removeItem("token");
                  setUser(null); // Сброс состояния пользователя
                  navigate("/login", { replace: true });
                  // Перезагрузка страницы для полного сброса состояния приложения
                  window.location.reload();
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-2 0V4H5v12h10v-1a1 1 0 112 0v2a1 1 0 01-1 1H4a1 1 0 01-1-1V3z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M13.707 9.293a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L10.586 11H7a1 1 0 110-2h3.586l-1.293-1.293a1 1 0 111.414-1.414l3 3z"
                    clipRule="evenodd"
                  />
                </svg>
                Выйти из всех сеансов
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
