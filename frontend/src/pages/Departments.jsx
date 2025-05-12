// Departments.jsx - Компонент для управления отделами
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getApiBaseUrl } from "../config/api";
import {
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Modal from "../components/common/Modal";
import usePageTitle from "../utils/usePageTitle";

const Departments = () => {
  // Устанавливаем заголовок страницы
  usePageTitle("Управление отделами");

  const apiBaseUrl = getApiBaseUrl();
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState({
    name: "",
    manager_id: null,
  });

  // Загрузка списка отделов
  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${apiBaseUrl}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error("Ошибка при загрузке отделов:", error);
      toast.error("Ошибка при загрузке отделов");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  // Загрузка списка пользователей для выбора менеджера
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${apiBaseUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(
        response.data.filter((user) => user.role.toLowerCase() === "manager")
      );
    } catch (error) {
      console.error("Ошибка при загрузке пользователей:", error);
    }
  }, [apiBaseUrl]);

  // Первоначальная загрузка данных
  useEffect(() => {
    fetchDepartments();
    fetchUsers();
  }, [fetchDepartments, fetchUsers]);

  // Обработка открытия диалогового окна
  const openCreateModal = () => {
    setCurrentDepartment({
      name: "",
      manager_id: null,
    });
    setEditMode(false);
    setIsCreateModalOpen(true);
  };

  // Обработка открытия диалогового окна для редактирования
  const openEditModal = (department) => {
    setCurrentDepartment({
      ...department,
      manager_id: department.manager_id || null,
    });
    setEditMode(true);
    setIsEditModalOpen(true);
  };

  // Обработка изменения имени отдела
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "manager_id") {
      setCurrentDepartment({
        ...currentDepartment,
        [name]: value === "" ? null : parseInt(value, 10),
      });
    } else {
      setCurrentDepartment({
        ...currentDepartment,
        [name]: value,
      });
    }
  };

  // Сохранение отдела
  const handleSaveDepartment = async (e) => {
    e.preventDefault();

    if (!currentDepartment.name.trim()) {
      toast.error("Название отдела не может быть пустым");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (editMode) {
        // Обновление существующего отдела
        await axios.put(
          `${apiBaseUrl}/api/departments/${currentDepartment.id}`,
          currentDepartment,
          { headers }
        );
      } else {
        // Создание нового отдела
        await axios.post(`${apiBaseUrl}/api/departments`, currentDepartment, {
          headers,
        });
      }

      toast.success(`Отдел ${editMode ? "обновлен" : "создан"} успешно`);

      fetchDepartments();

      if (editMode) {
        setIsEditModalOpen(false);
      } else {
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error("Ошибка при сохранении отдела:", error);
      const errorMsg =
        error.response?.data?.detail || "Произошла ошибка при сохранении";
      toast.error(
        `Ошибка при ${editMode ? "обновлении" : "создании"} отдела: ${errorMsg}`
      );
    }
  };

  // Удаление отдела
  const handleDeleteDepartment = async (id) => {
    if (window.confirm("Вы действительно хотите удалить этот отдел?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${apiBaseUrl}/api/departments/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        toast.success("Отдел удален успешно");
        fetchDepartments();
      } catch (error) {
        console.error("Ошибка при удалении отдела:", error);
        const errorMsg =
          error.response?.data?.detail || "Произошла ошибка при удалении";
        toast.error(`Ошибка при удалении отдела: ${errorMsg}`);
      }
    }
  };

  // Рендер футера для модальных окон с кнопками действий
  const renderModalFooter = () => (
    <>
      <button
        type="button"
        className="text-gray-500 hover:text-gray-700 font-medium py-2 px-4 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        onClick={() =>
          editMode ? setIsEditModalOpen(false) : setIsCreateModalOpen(false)
        }
      >
        Отмена
      </button>
      <button
        type="submit"
        form="department-form"
        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {editMode ? "Сохранить" : "Создать"}
      </button>
    </>
  );

  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
          Управление отделами
          <UserGroupIcon className="h-8 w-8 ml-2 inline-block text-gray-600" />
        </h1>

        <button
          type="button"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={openCreateModal}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Создать отдел
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="text-center py-10">
            <div className="spinner"></div>
            <p className="mt-2 text-gray-600">Загрузка отделов...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-500">Отделы не найдены</p>
            <p className="mt-2 text-sm text-gray-400">
              Создайте новый отдел, нажав на кнопку выше
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Название
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Менеджер
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((department) => (
                <tr key={department.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {department.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {department.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {department.manager ? (
                      <span className="flex items-center">
                        {department.manager.first_name ||
                        department.manager.last_name
                          ? `${department.manager.last_name || ""} ${
                              department.manager.first_name || ""
                            } ${department.manager.middle_name || ""}`.trim()
                          : department.manager.email}
                      </span>
                    ) : (
                      <span className="text-gray-400">Не назначен</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-800 p-1"
                        onClick={() => openEditModal(department)}
                        title="Редактировать"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 p-1"
                        onClick={() => handleDeleteDepartment(department.id)}
                        title="Удалить"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Модальное окно создания отдела */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать новый отдел"
        footer={renderModalFooter()}
      >
        <form
          id="department-form"
          onSubmit={handleSaveDepartment}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Название отдела
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={currentDepartment.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Например: Отдел разработки"
            />
          </div>

          <div>
            <label
              htmlFor="manager_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Менеджер отдела
            </label>
            <select
              id="manager_id"
              name="manager_id"
              value={currentDepartment.manager_id || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Не назначен</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name || user.last_name
                    ? `${user.last_name || ""} ${user.first_name || ""} ${
                        user.middle_name || ""
                      }`.trim()
                    : user.email}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Модальное окно редактирования отдела */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Редактировать отдел"
        footer={renderModalFooter()}
      >
        <form
          id="department-form"
          onSubmit={handleSaveDepartment}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Название отдела
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={currentDepartment.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="manager_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Менеджер отдела
            </label>
            <select
              id="manager_id"
              name="manager_id"
              value={currentDepartment.manager_id || ""}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Не назначен</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name || user.last_name
                    ? `${user.last_name || ""} ${user.first_name || ""} ${
                        user.middle_name || ""
                      }`.trim()
                    : user.email}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      {/* Контейнер для уведомлений */}
      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default Departments;
