import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getApiBaseUrl } from "../config/api";
import Modal from "./common/Modal";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { formatUserDisplayName } from "../utils/userUtils";

const DepartmentForm = ({ isOpen, onClose, refreshProfiles }) => {
  const apiBaseUrl = getApiBaseUrl();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [availableManagers, setAvailableManagers] = useState([]);
  const [mode, setMode] = useState("list"); // list, create, edit, confirm-delete
  const [selectedDepartment, setSelectedDepartment] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    manager_id: null,
  });

  // Получение списка отделов
  const fetchDepartments = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${apiBaseUrl}/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Не удалось загрузить список отделов");
    }
  }, [apiBaseUrl]);

  // Используем useCallback для предотвращения бесконечных перерисовок
  const fetchAvailableManagers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiBaseUrl}/departments/managers/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAvailableManagers(response.data);
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Не удалось загрузить список менеджеров");
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchAvailableManagers();
    }
  }, [isOpen, fetchDepartments, fetchAvailableManagers]);

  // Функция для выбора отдела для редактирования
  const handleEditDepartment = (department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      manager_id: department.manager_id,
    });
    setMode("edit");
  };

  // Функция для выбора отдела для удаления
  const handleDeleteDepartment = (department) => {
    setSelectedDepartment(department);
    setMode("confirm-delete");
  };

  // Функция для начала создания нового отдела
  const handleCreateDepartment = () => {
    setSelectedDepartment(null);
    setFormData({
      name: "",
      manager_id: null,
    });
    setMode("create");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "manager_id" ? (value ? parseInt(value) : null) : value,
    });
  };

  const handleCreateSubmit = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${apiBaseUrl}/departments`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Отдел успешно создан");
      setFormData({ name: "", manager_id: null });
      refreshProfiles(); // Обновляем список пользователей
      setMode("list");
      fetchDepartments();
    } catch (error) {
      console.error("Error creating department:", error);
      toast.error(error.response?.data?.detail || "Ошибка при создании отдела");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${apiBaseUrl}/departments/${selectedDepartment.id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Отдел успешно обновлен");
      refreshProfiles(); // Обновляем список пользователей
      setMode("list");
      fetchDepartments();
    } catch (error) {
      console.error("Error updating department:", error);
      toast.error(
        error.response?.data?.detail || "Ошибка при обновлении отдела"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${apiBaseUrl}/departments/${selectedDepartment.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Отдел успешно удален");
      refreshProfiles(); // Обновляем список пользователей
      setMode("list");
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      toast.error(error.response?.data?.detail || "Ошибка при удалении отдела");
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для рендеринга футера модального окна в зависимости от текущего режима
  const renderFooter = () => {
    switch (mode) {
      case "list":
        return (
          <>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              Закрыть
            </button>
            <button
              type="button"
              className="px-4 py-2.5 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-green-600 hover:bg-green-700 focus:ring-green-500"
              onClick={handleCreateDepartment}
            >
              Создать новый отдел
            </button>
          </>
        );
      case "create":
        return (
          <>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setMode("list")}
              disabled={isLoading}
            >
              Назад
            </button>
            <button
              type="button"
              className="px-4 py-2.5 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              onClick={handleCreateSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Создание..." : "Создать отдел"}
            </button>
          </>
        );
      case "edit":
        return (
          <>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setMode("list")}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="button"
              className="px-4 py-2.5 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
              onClick={handleEditSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </button>
          </>
        );
      case "confirm-delete":
        return (
          <>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setMode("list")}
              disabled={isLoading}
            >
              Отмена
            </button>
            <button
              type="button"
              className="px-4 py-2.5 text-sm font-medium text-white border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 bg-red-600 hover:bg-red-700 focus:ring-red-500"
              onClick={handleDeleteSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Удаление..." : "Подтвердить удаление"}
            </button>
          </>
        );
      default:
        return null;
    }
  };

  // Функция для определения заголовка модального окна
  const getModalTitle = () => {
    switch (mode) {
      case "list":
        return "Управление отделами";
      case "create":
        return "Создание нового отдела";
      case "edit":
        return "Редактирование отдела";
      case "confirm-delete":
        return "Подтверждение удаления отдела";
      default:
        return "Управление отделами";
    }
  };

  // Функция для рендеринга содержимого модального окна в зависимости от режима
  const renderContent = () => {
    switch (mode) {
      case "list":
        return (
          <div className="space-y-4">
            {departments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Отделы не найдены
              </p>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                      >
                        Название
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Руководитель
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Действия</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {departments.map((department) => (
                      <tr key={department.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {department.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {department.manager
                            ? `${department.manager.last_name || ""} ${
                                department.manager.first_name || ""
                              }`.trim()
                            : "Не назначен"}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEditDepartment(department)}
                              className="text-blue-600 hover:text-blue-900 focus:outline-none"
                              title="Редактировать отдел"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(department)}
                              className="text-red-600 hover:text-red-900 focus:outline-none"
                              title="Удалить отдел"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case "create":
      case "edit":
        return (
          <form className="space-y-4">
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
                value={formData.name}
                onChange={handleChange}
                required
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Введите название отдела"
              />
            </div>

            <div>
              <label
                htmlFor="manager_id"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Руководитель отдела
              </label>
              <select
                id="manager_id"
                name="manager_id"
                value={formData.manager_id || ""}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">Выберите руководителя</option>
                {availableManagers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {formatUserDisplayName(manager)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Руководителем отдела может быть только пользователь с ролью
                "Менеджер"
              </p>
            </div>
          </form>
        );
      case "confirm-delete":
        return (
          <div className="space-y-4">
            <p className="text-gray-500">
              Вы уверены, что хотите удалить отдел{" "}
              <strong className="text-gray-900">
                {selectedDepartment?.name}
              </strong>
              ?
            </p>
            <div className="bg-yellow-50 p-4 rounded-md">
              <p className="text-sm text-yellow-700">
                <strong>Важно:</strong> После удаления отдела все сотрудники,
                связанные с ним, больше не будут привязаны к отделу. Это
                действие нельзя отменить!
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getModalTitle()}
      footer={renderFooter()}
      size="lg"
    >
      {renderContent()}
    </Modal>
  );
};

export default DepartmentForm;
