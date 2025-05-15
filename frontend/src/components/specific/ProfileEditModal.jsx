import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getApiBaseUrl } from "../../config/api";
import Modal from "../common/Modal";
import {
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

/**
 * Компонент модального окна для редактирования профиля пользователя
 *
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.isOpen - Флаг открытия модального окна
 * @param {Function} props.onClose - Функция закрытия модального окна
 * @param {Object} props.user - Объект пользователя для редактирования
 * @param {Function} props.onSave - Функция, вызываемая после сохранения изменений
 * @param {Array} props.departments - Список доступных отделов
 */
const ProfileEditModal = ({
  isOpen,
  onClose,
  user,
  onSave,
  departments = [],
}) => {
  const apiBaseUrl = getApiBaseUrl();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    phone: "",
    department_id: null,
    role: "",
  });

  // Инициализация формы при открытии модального окна
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        middle_name: user.middle_name || "",
        phone: user.phone || "",
        department_id: user.department_id || null,
        role: user.role || "",
      });
    }
  }, [user, isOpen]);

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]:
        name === "department_id" ? (value ? parseInt(value) : null) : value,
    });
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${apiBaseUrl}/users/${user.id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Профиль пользователя успешно обновлен");
      if (onSave) onSave(response.data);
      onClose();
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast.error(
        error.response?.data?.detail || "Ошибка при обновлении профиля"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Рендер футера модального окна
  const renderFooter = () => {
    return (
      <>
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          onClick={onClose}
          disabled={isLoading}
        >
          Отмена
        </button>
        <button
          type="submit"
          form="edit-profile-form"
          className="inline-flex justify-center px-4 py-2 ml-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {isLoading ? "Сохранение..." : "Сохранить"}
        </button>
      </>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Редактирование профиля пользователя"
      footer={renderFooter()}
    >
      <form
        id="edit-profile-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center">
              <EnvelopeIcon className="h-4 w-4 mr-1" />
              Email
            </div>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Введите email пользователя"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <div className="flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                Фамилия
              </div>
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Фамилия"
            />
          </div>

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
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Имя"
            />
          </div>

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
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Отчество"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center">
              <PhoneIcon className="h-4 w-4 mr-1" />
              Телефон
            </div>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="+7 (XXX) XXX-XX-XX"
          />
        </div>

        <div>
          <label
            htmlFor="department_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center">
              <BuildingOfficeIcon className="h-4 w-4 mr-1" />
              Отдел
            </div>
          </label>
          <select
            id="department_id"
            name="department_id"
            value={formData.department_id || ""}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Не выбран</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
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
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="employee">Сотрудник</option>
            <option value="manager">Менеджер</option>
            <option value="hr">HR</option>
            <option value="admin">Администратор</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileEditModal;
