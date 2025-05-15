import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getApiBaseUrl } from "../../config/api";
import Modal from "../common/Modal";
import {
  CalendarIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

/**
 * Компонент модального окна для редактирования плана адаптации
 *
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.isOpen - Флаг открытия модального окна
 * @param {Function} props.onClose - Функция закрытия модального окна
 * @param {Object} props.plan - Объект плана для редактирования
 * @param {Function} props.onSave - Функция, вызываемая после сохранения изменений
 * @param {Array} props.users - Список пользователей для назначения плана
 */
const PlanEditModal = ({ isOpen, onClose, plan, onSave, users = [] }) => {
  const apiBaseUrl = getApiBaseUrl();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "draft",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
    user_id: "",
  });

  // Инициализация формы при открытии модального окна
  useEffect(() => {
    if (plan && isOpen) {
      setFormData({
        title: plan.title || "",
        description: plan.description || "",
        status: plan.status || "draft",
        start_date:
          plan.start_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0],
        end_date: plan.end_date?.split("T")[0] || "",
        user_id: plan.user_id || "",
      });
    }
  }, [plan, isOpen]);

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${apiBaseUrl}/plans/${plan.id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("План адаптации успешно обновлен");
      if (onSave) onSave(response.data);
      onClose();
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error(
        error.response?.data?.detail || "Ошибка при обновлении плана"
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
          form="edit-plan-form"
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
      title="Редактирование плана адаптации"
      footer={renderFooter()}
    >
      <form id="edit-plan-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Скрытые поля для заголовка и описания */}
        <input
          type="hidden"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <input
          type="hidden"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center">
              <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1" />
              Статус
            </div>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="draft">Черновик</option>
            <option value="active">Активный</option>
            <option value="completed">Завершен</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Дата начала
              </div>
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label
              htmlFor="end_date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1" />
                Дата окончания
              </div>
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="user_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              Сотрудник
            </div>
          </label>
          <select
            id="user_id"
            name="user_id"
            value={formData.user_id}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">Не назначен</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default PlanEditModal;
