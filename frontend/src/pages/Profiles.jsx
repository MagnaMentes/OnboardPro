import React, { useState, useEffect, useRef } from "react";
import {
  UserIcon,
  UsersIcon,
  PencilSquareIcon,
  TrashIcon,
  LockOpenIcon,
  LockClosedIcon,
  KeyIcon,
  // FunnelIcon, // Неиспользуемый компонент
  PhotoIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getApiBaseUrl } from "../config/api"; // Импортируем функцию для получения базового API URL
import usePageTitle from "../utils/usePageTitle";
import Modal from "../components/common/Modal"; // Обновленный импорт модального окна
import DepartmentForm from "../components/DepartmentForm"; // Импорт формы создания отдела
import EditableCard from "../components/specific/EditableCard"; // Импорт компонента редактируемой карточки

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
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [resetPasswordInfo, setResetPasswordInfo] = useState(null); // Для отображения временного пароля
  const [departments, setDepartments] = useState([]); // Список отделов
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "employee",
    department: "",
    department_id: null,
    first_name: "",
    last_name: "",
    middle_name: "",
    phone: "",
  });

  // Удалены неиспользуемые состояния для просмотра профиля

  // Эффект для очистки временных данных при размонтировании компонента
  useEffect(() => {
    // Возвращаем функцию очистки
    return () => {
      // Очищаем все временные фотографии при выходе со страницы
      if (window.tempUserPhotos) {
        console.log("Очистка временных фотографий при выходе со страницы");
        window.tempUserPhotos = {};
      }
    };
  }, []);

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
        const roleLower = response.data.role.toLowerCase();
        if (roleLower !== "hr" && roleLower !== "manager") {
          toast.error("У вас нет доступа к этой странице");
          navigate("/dashboard");
        }
      } catch (err) {
        navigate("/login");
      }
    };

    const fetchUsers = async () => {
      try {
        console.log("Запрос к API: начало загрузки пользователей");
        const response = await axios.get(`${apiBaseUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(
          "Запрос к API: получены данные пользователей",
          response.data
        );

        // Преобразуем department_id к числовому типу, если он существует
        const processedUsers = response.data.map((user) => ({
          ...user,
          department_id:
            user.department_id !== null ? Number(user.department_id) : null,
        }));

        console.log("Обработанные данные пользователей:", processedUsers);

        setUsers(processedUsers);
        setLoading(false);
      } catch (err) {
        console.error("Запрос к API: ошибка при загрузке пользователей", err);
        setError("Failed to fetch users");
        setLoading(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${apiBaseUrl}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Загружены отделы:", response.data);
        setDepartments(response.data);
      } catch (err) {
        console.error("Ошибка при загрузке отделов:", err);
      }
    };

    fetchUserRole();
    fetchUsers();
    fetchDepartments();
  }, [navigate, apiBaseUrl]);

  // Дополнительный эффект для синхронизации данных формы после загрузки отделов
  useEffect(() => {
    // Если модальное окно редактирования открыто и у нас есть текущий пользователь
    if (isEditModalOpen && currentUser && departments.length > 0) {
      console.log("Синхронизация данных формы после загрузки отделов");
      console.log("Текущий пользователь:", currentUser);
      console.log("Список отделов:", departments);

      // Находим отдел пользователя по ID или имени
      const userDepartment = departments.find(
        (dept) =>
          dept.id === currentUser.department_id ||
          dept.name === currentUser.department
      );

      console.log("Найденный отдел пользователя:", userDepartment);

      if (userDepartment) {
        setFormData((prevData) => ({
          ...prevData,
          department_id: userDepartment.id,
          department: userDepartment.name,
        }));
        console.log(
          "Form data обновлена с отделом:",
          userDepartment.name,
          "ID:",
          userDepartment.id
        );
      }
    }
  }, [isEditModalOpen, currentUser, departments]);

  // Функция для обработки выбора файла фотографии
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка типа файла - разрешены только изображения
      if (!file.type.startsWith("image/")) {
        toast.error(
          "Пожалуйста, выберите файл изображения (JPEG, PNG, GIF и т.д.)"
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Проверка размера файла (максимум 5 МБ)
      const maxSize = 5 * 1024 * 1024; // 5 МБ в байтах
      if (file.size > maxSize) {
        toast.error("Размер фотографии не должен превышать 5 МБ");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setPhotoFile(file);

      // Показываем предпросмотр фото
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Если это новый пользователь с временным ID, то сразу сохраняем фото в кэш
      if (isCreateModalOpen && formData && formData.temp_id) {
        console.log(
          "Сохранение временного фото для нового пользователя с ID:",
          formData.temp_id
        );

        try {
          // Инициализация временного хранилища, если его ещё нет
          if (typeof window.tempUserPhotos === "undefined") {
            window.tempUserPhotos = {};
          }

          // Сохраняем файл в кэше
          window.tempUserPhotos[formData.temp_id] = file;

          // Проверяем успешность сохранения
          if (window.tempUserPhotos[formData.temp_id]) {
            console.log("Фото успешно сохранено во временном хранилище");
          } else {
            console.error("Не удалось сохранить фото во временном хранилище");
          }
        } catch (error) {
          console.error(
            "Ошибка при сохранении фото во временном хранилище:",
            error
          );
        }
      }
    }
  }; // Функция для удаления выбранной фотографии
  const removePhotoPreview = async () => {
    // Если редактируется существующий пользователь и у него есть фото на сервере,
    // то удаляем фото с сервера
    if (
      isEditModalOpen &&
      currentUser &&
      currentUser.id &&
      currentUser.photo &&
      !photoFile
    ) {
      console.log(
        "Удаление фото с сервера для пользователя ID:",
        currentUser.id
      );
      try {
        await deleteUserPhoto(currentUser.id);
      } catch (error) {
        console.error("Ошибка при удалении фото:", error);
      }
    } else {
      console.log(
        "Локальное удаление предпросмотра фото (без запроса к серверу)"
      );
    }

    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Функция для загрузки фотографии на сервер
  const uploadUserPhoto = async (userId) => {
    if (!photoFile) {
      console.log("Отсутствует файл фотографии для загрузки");
      return null;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Ошибка авторизации: отсутствует токен");
      toast.error("Необходимо авторизоваться для загрузки фотографий");
      return null;
    }

    // Формируем данные для отправки
    const formData = new FormData();
    formData.append("file", photoFile);

    // Обработка временного ID для новых пользователей
    if (typeof userId === "string" && userId.startsWith("temp_")) {
      console.log(
        `Загрузка фото для нового пользователя с временным ID: ${userId}`
      );
      try {
        // Для новых пользователей создаем временное локальное хранилище
        // Инициализируем хранилище, если его еще нет
        if (typeof window.tempUserPhotos === "undefined") {
          window.tempUserPhotos = {};
        }

        // Сохраняем файл и создаем временный URL
        window.tempUserPhotos[userId] = photoFile;
        const tempUrl = URL.createObjectURL(photoFile);
        setPhotoPreview(tempUrl);

        return {
          success: true,
          tempId: userId,
          tempUrl: tempUrl,
          fileSize: photoFile.size,
          fileType: photoFile.type,
        };
      } catch (error) {
        console.error("Ошибка при работе с временным хранилищем:", error);
        toast.error("Не удалось сохранить фотографию во временное хранилище");
        return null;
      }
    }

    // Проверяем и обрабатываем userId, убедимся что он валидный
    // Явно преобразуем строку в число если необходимо
    let userIdNumeric;

    if (typeof userId === "string") {
      userIdNumeric = parseInt(userId, 10);
    } else if (typeof userId === "number") {
      userIdNumeric = userId;
    } else {
      console.error(
        "Ошибка: недопустимый тип ID пользователя при загрузке фото:",
        typeof userId
      );
      toast.error(
        "Не удалось загрузить фото: некорректный тип ID пользователя"
      );
      return null;
    }

    // Проверка userIdNumeric на валидность
    if (isNaN(userIdNumeric) || userIdNumeric <= 0) {
      console.error(
        "Ошибка: недопустимый ID пользователя при загрузке фото:",
        userIdNumeric
      );
      toast.error("Не удалось загрузить фото: некорректный ID пользователя");
      return null;
    }

    // Устанавливаем проверенное число
    userId = userIdNumeric;

    try {
      console.log(`Отправка фото для пользователя ID:${userId}`);
      console.log(`API URL: ${apiBaseUrl}/users/${userId}/photo`);

      const response = await axios.post(
        `${apiBaseUrl}/users/${userId}/photo`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          // Добавляем увеличенный таймаут для больших файлов
          timeout: 30000,
        }
      );

      console.log("Успешная загрузка фото, ответ сервера:", response.data);

      // Обновляем состояние фотографии в компоненте
      if (response.data && response.data.photo) {
        // Добавляем timestamp к URL для обхода кэширования
        const timestamp = new Date().getTime();
        setPhotoPreview(`${apiBaseUrl}${response.data.photo}?t=${timestamp}`);
      }

      return response.data;
    } catch (error) {
      console.error("Error uploading photo:", error);
      console.error("Error details:", error.response?.data || error.message);
      toast.error(
        "Ошибка при загрузке фотографии: " +
          (error.response?.data?.detail || error.message)
      );
      return null;
    }
  };

  // Функция для удаления фотографии пользователя
  const deleteUserPhoto = async (userId) => {
    if (!userId) {
      console.error("Ошибка: ID пользователя не определен при удалении фото");
      toast.error("Не удалось удалить фото: ID пользователя не определен");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      console.log(`Удаление фото для пользователя ID:${userId}`);
      console.log(`API URL: ${apiBaseUrl}/users/${userId}/photo`);

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
    // Применяем фильтры по статусу (все/активные/заблокированные)
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

    // Нормализуем регистр при сравнении ролей, чтобы "HR" соответствовало "hr" и т.д.
    return searchedUsers.filter(
      (user) => user.role && user.role.toLowerCase() === role.toLowerCase()
    );
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
    // Генерируем временный ID для нового пользователя
    const tempId = `temp_${Date.now()}`;
    console.log("Создаём временный ID для нового пользователя:", tempId);

    setFormData({
      email: "",
      password: "",
      role: "employee",
      department: "",
      department_id: null, // Устанавливаем null вместо пустой строки
      first_name: "",
      last_name: "",
      middle_name: "",
      phone: "",
      temp_id: tempId, // Добавляем временный ID
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (user) => {
    // Добавляем подробное логирование для отладки
    console.log("Данные пользователя при редактировании:", user);
    console.log("Тип department_id:", typeof user.department_id);
    console.log("Значение department_id:", user.department_id);
    console.log("Список отделов:", departments);

    setCurrentUser(user);
    // Устанавливаем department_id сразу как число, если оно есть
    const departmentId = user.department_id ? Number(user.department_id) : null;

    setFormData({
      email: user.email,
      role: user.role,
      department: user.department || "",
      department_id: departmentId,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      middle_name: user.middle_name || "",
      phone: user.phone || "",
    });

    console.log("FormData после установки:", {
      department: user.department || "",
      department_id: departmentId,
    });

    setPhotoPreview(user.photo ? `${apiBaseUrl}${user.photo}` : null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (user) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(true);
  };

  // Удалили неиспользуемую функцию openUserProfile, т.к. эта функциональность избыточна

  // Мы удалили избыточную функциональность просмотра профиля

  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log(
      `Изменение поля ${name} на значение:`,
      value,
      "тип:",
      typeof value
    );

    // Специальная обработка для поля department_id
    if (name === "department_id") {
      if (value) {
        // Преобразуем строковое значение select в число
        const departmentId = parseInt(value, 10);
        console.log(
          "Преобразованный ID отдела:",
          departmentId,
          "тип:",
          typeof departmentId
        );

        // Находим отдел по ID
        const selectedDepartment = departments.find(
          (dept) => dept.id === departmentId
        );
        console.log("Найденный отдел:", selectedDepartment);

        if (selectedDepartment) {
          const newFormData = {
            ...formData,
            department_id: departmentId, // Числовое значение
            department: selectedDepartment.name,
          };

          console.log("Обновляем formData с отделом:", newFormData);
          setFormData(newFormData);
        } else {
          console.error("Отдел с ID", departmentId, "не найден!");
        }
      } else {
        // Если выбрано пустое значение, очищаем оба поля
        const newFormData = {
          ...formData,
          department_id: null,
          department: "",
        };

        console.log("Очищаем значения отдела:", newFormData);
        setFormData(newFormData);
      }
      return;
    }

    // Стандартная обработка для остальных полей
    setFormData((prevData) => {
      const newData = { ...prevData, [name]: value };
      console.log(`Обновлено поле ${name}:`, newData);
      return newData;
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Сохраняем временный ID пользователя
      const tempUserId = formData.temp_id;

      // Подготавливаем данные для отправки (только те поля, которые ожидает API)
      const formDataToSend = {
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department || null,
        department_id:
          formData.department_id !== "" ? formData.department_id : null,
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        middle_name: formData.middle_name || null,
        phone: formData.phone || null,
      };

      console.log("Создание пользователя с данными:", formDataToSend);

      const response = await axios.post(`${apiBaseUrl}/users`, formDataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Ответ сервера при создании пользователя:", response.data);

      // Загружаем фотографию, если она была выбрана
      if (photoFile) {
        // Более детальная проверка ответа сервера
        if (
          response.data &&
          response.data.id &&
          typeof response.data.id === "number" &&
          response.data.id > 0
        ) {
          try {
            const userId = response.data.id;
            console.log("Загрузка фото для нового пользователя с ID:", userId);

            // Увеличим задержку для гарантии успешного завершения создания пользователя
            console.log("Ожидаем завершения обработки данных на сервере...");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Проверка наличия временной фотографии
            const hasTempPhoto =
              window.tempUserPhotos &&
              window.tempUserPhotos[tempUserId] &&
              tempUserId;

            if (hasTempPhoto) {
              console.log("Используем сохраненную временную фотографию");
              // Убедимся, что photoFile актуальный
              if (window.tempUserPhotos[tempUserId] !== photoFile) {
                console.log("Обновляем локальную копию фотографии из кэша");
                setPhotoFile(window.tempUserPhotos[tempUserId]);
              }
            }

            // Загружаем фото на сервер с механизмом повторных попыток
            console.log("Отправляем запрос на загрузку фотографии...");
            let photoResponse = null;
            let attempts = 0;
            const maxAttempts = 3;

            while (!photoResponse && attempts < maxAttempts) {
              attempts++;
              try {
                console.log(`Попытка загрузки фото ${attempts}/${maxAttempts}`);
                photoResponse = await uploadUserPhoto(response.data.id);

                if (!photoResponse && attempts < maxAttempts) {
                  // Задержка перед повторной попыткой
                  const delayMs = 500 * attempts; // увеличиваем время ожидания с каждой попыткой
                  console.log(`Ждем ${delayMs}мс перед повторной попыткой...`);
                  await new Promise((resolve) => setTimeout(resolve, delayMs));
                }
              } catch (e) {
                console.error(`Ошибка при попытке ${attempts}:`, e);
                if (attempts >= maxAttempts) throw e;
              }
            }

            if (photoResponse) {
              console.log("Фотография успешно загружена:", photoResponse);

              // Очищаем временную фотографию
              if (window.tempUserPhotos && window.tempUserPhotos[tempUserId]) {
                delete window.tempUserPhotos[tempUserId];
                console.log("Временная фотография удалена из кэша");
              }
            } else {
              console.error(
                "Ошибка при загрузке фотографии после",
                maxAttempts,
                "попыток"
              );
              toast.warning(
                "Не удалось загрузить фото. Вы можете добавить его позже в профиле пользователя."
              );
            }
          } catch (photoError) {
            console.error("Исключение при загрузке фотографии:", photoError);
            toast.error("Произошла ошибка при загрузке фотографии");
          }
        } else {
          console.error(
            "Ошибка: некорректный ID пользователя в ответе сервера:",
            response.data
          );
          toast.error(
            "Ошибка: не удалось загрузить фотографию, ID пользователя отсутствует"
          );
        }
      }

      // Обновляем список пользователей
      try {
        console.log("Обновление списка пользователей после создания");
        const usersResponse = await axios.get(`${apiBaseUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Преобразуем department_id к числовому типу, если он существует
        const processedUsers = usersResponse.data.map((user) => ({
          ...user,
          department_id:
            user.department_id !== null ? Number(user.department_id) : null,
        }));

        setUsers(processedUsers);

        // Очищаем все временные данные
        if (
          formData.temp_id &&
          window.tempUserPhotos &&
          window.tempUserPhotos[formData.temp_id]
        ) {
          delete window.tempUserPhotos[formData.temp_id];
          console.log("Временные данные пользователя очищены");
        }

        setIsCreateModalOpen(false);
        toast.success("Пользователь успешно создан");
      } catch (updateError) {
        console.error(
          "Ошибка при обновлении списка пользователей:",
          updateError
        );
        // Не показываем эту ошибку пользователю, т.к. пользователь уже создан успешно
      }
    } catch (err) {
      console.error("Ошибка при создании пользователя:", err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Ошибка при создании пользователя";
      toast.error(errorMessage);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Отладочная информация перед отправкой данных
      console.log("Отправляем данные для обновления:", formData);
      console.log(
        "ID отдела перед отправкой:",
        formData.department_id,
        "тип:",
        typeof formData.department_id
      );

      const response = await axios.put(
        `${apiBaseUrl}/users/${currentUser.id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Ответ от сервера:", response.data);

      // Загружаем фотографию, если она была выбрана
      if (photoFile && currentUser && currentUser.id) {
        console.log(
          "Загрузка фото для редактируемого пользователя с ID:",
          currentUser.id
        );

        // Добавляем небольшую задержку перед загрузкой фото для обеспечения
        // правильной последовательности обновления данных на сервере
        await new Promise((resolve) => setTimeout(resolve, 300));

        await uploadUserPhoto(currentUser.id);
      } else if (photoFile) {
        console.error(
          "Ошибка: не удалось получить ID пользователя для загрузки фото"
        );
        toast.error(
          "Ошибка: не удалось загрузить фотографию, ID пользователя отсутствует"
        );
      }

      // Обновляем список пользователей
      const usersResponse = await axios.get(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Преобразуем department_id к числовому типу, если он существует
      const processedUsers = usersResponse.data.map((user) => ({
        ...user,
        department_id:
          user.department_id !== null ? Number(user.department_id) : null,
      }));

      setUsers(processedUsers);

      setIsEditModalOpen(false);
      toast.success("Данные пользователя обновлены");
    } catch (err) {
      console.error("Ошибка при обновлении пользователя:", err);
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
            <EditableCard
              key={user.id}
              className={`overflow-hidden ${user.disabled ? "opacity-70" : ""}`}
              onClick={() => openEditModal(user)}
            >
              <div className={`${colorClasses.cardHeader} p-4`}>
                <div className="flex items-center">
                  <div
                    className={`h-16 w-16 rounded-full mr-4 overflow-hidden flex-shrink-0 border-2 ${colorClasses.iconContainer}`}
                  >
                    {user.photo ? (
                      <img
                        src={`${apiBaseUrl}${user.photo}?t=${Date.now()}`}
                        alt={`${user.first_name || user.email}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          console.error(
                            `Ошибка загрузки фото для ${user.id}: ${user.photo}`
                          );
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

                {userRole && userRole.toLowerCase() === "hr" && (
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
                      onClick={(e) => {
                        e.stopPropagation(); // Предотвращаем всплытие события
                        openDeleteModal(user);
                      }}
                      title="Удалить"
                      aria-label="Удалить пользователя"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </EditableCard>
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
        onClick={() => {
          // Очищаем временные данные при отмене создания
          if (
            formData &&
            formData.temp_id &&
            window.tempUserPhotos &&
            window.tempUserPhotos[formData.temp_id]
          ) {
            console.log(
              "Удаление временных данных пользователя при отмене создания"
            );
            delete window.tempUserPhotos[formData.temp_id];
          }
          setIsCreateModalOpen(false);
        }}
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
        onClick={() => {
          // При отмене редактирования сбрасываем временные данные
          setPhotoFile(null);
          setPhotoPreview(null);
          setIsEditModalOpen(false);
        }}
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">
            Профили пользователей
          </h2>
          <p className="mt-1 text-gray-500">
            Управление профилями и пользователями системы
          </p>
        </div>

        {userRole && userRole.toLowerCase() === "hr" && (
          <div className="flex space-x-3">
            <button
              onClick={() => setIsDepartmentModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <BuildingOfficeIcon className="h-5 w-5 mr-2" />
              Управление отделами
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UsersIcon className="h-5 w-5 mr-2" />
              Добавить пользователя
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6 mt-6">
        {/* Фильтры и поиск */}
        <div className="mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm">
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
      </div>
      {/* Модальное окно создания пользователя */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          // Очищаем временные данные при закрытии окна
          if (
            formData &&
            formData.temp_id &&
            window.tempUserPhotos &&
            window.tempUserPhotos[formData.temp_id]
          ) {
            console.log(
              "Удаление временных данных пользователя при закрытии модального окна"
            );
            delete window.tempUserPhotos[formData.temp_id];
          }
          setIsCreateModalOpen(false);
        }}
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
            {" "}
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
            <select
              id="department_id"
              name="department_id"
              value={formData.department_id?.toString() || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Выберите отдел</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id.toString()}>
                  {department.name}
                </option>
              ))}
            </select>
            {userRole === "hr" && (
              <button
                type="button"
                onClick={() => setIsDepartmentModalOpen(true)}
                className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <PlusCircleIcon className="h-4 w-4 mr-1" />
                Создать новый отдел
              </button>
            )}
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
          onClose={() => {
            // При закрытии окна редактирования сбрасываем временные данные
            setPhotoFile(null);
            setPhotoPreview(null);
            setIsEditModalOpen(false);
          }}
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
              <select
                id="edit-department_id"
                name="department_id"
                value={
                  formData.department_id !== null
                    ? formData.department_id.toString()
                    : ""
                }
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Выберите отдел</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id.toString()}>
                    {department.name}
                  </option>
                ))}
              </select>
              {userRole === "hr" && (
                <button
                  type="button"
                  onClick={() => setIsDepartmentModalOpen(true)}
                  className="mt-2 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  <PlusCircleIcon className="h-4 w-4 mr-1" />
                  Создать новый отдел
                </button>
              )}
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

      {/* Модальное окно профиля было удалено, т.к. это избыточная функциональность */}

      {/* Модальное окно создания отдела */}
      <DepartmentForm
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
        refreshProfiles={() => {
          // Обновляем список пользователей и отделов после создания нового отдела
          const token = localStorage.getItem("token");
          axios
            .get(`${apiBaseUrl}/api/departments`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
              setDepartments(response.data);
            })
            .catch((error) => {
              console.error("Ошибка при загрузке отделов:", error);
            });

          axios
            .get(`${apiBaseUrl}/users`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((response) => {
              setUsers(response.data);
            })
            .catch((error) => {
              console.error("Ошибка при загрузке пользователей:", error);
            });
        }}
      />

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Profiles;
