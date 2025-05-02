import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AdjustmentsVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import axios from "axios";
import { getApiBaseUrl } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import TaskTemplateForm from "../components/specific/TaskTemplateForm";

const TaskTemplates = () => {
  usePageTitle("Шаблоны задач");

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Фильтры
  const [filterCategory, setFilterCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const apiUrl = getApiBaseUrl();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Не авторизован");

      const response = await axios.get(`${apiUrl}/task_templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTemplates(response.data);
      setError(null);
    } catch (err) {
      setError(
        "Ошибка при загрузке шаблонов задач: " +
          (err.response?.data?.detail || err.message)
      );
      toast.error("Не удалось загрузить шаблоны задач");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditTemplate(null);
    setShowForm(true);
  };

  const handleEditTemplate = (template) => {
    setEditTemplate(template);
    setShowForm(true);
  };

  const handleDeleteClick = (template) => {
    setTemplateToDelete(template);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${apiUrl}/task_templates/${templateToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTemplates((prevTemplates) =>
        prevTemplates.filter((t) => t.id !== templateToDelete.id)
      );

      toast.success("Шаблон задачи успешно удален");
      setTemplateToDelete(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      toast.error(
        "Ошибка при удалении шаблона: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Не авторизован");

      let response;

      if (editTemplate) {
        // Обновление существующего шаблона
        response = await axios.put(
          `${apiUrl}/task_templates/${editTemplate.id}`,
          templateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setTemplates((prevTemplates) =>
          prevTemplates.map((t) =>
            t.id === editTemplate.id ? response.data : t
          )
        );

        toast.success("Шаблон задачи успешно обновлен");
      } else {
        // Создание нового шаблона
        response = await axios.post(`${apiUrl}/task_templates`, templateData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTemplates((prevTemplates) => [...prevTemplates, response.data]);
        toast.success("Шаблон задачи успешно создан");
      }

      setShowForm(false);
      setEditTemplate(null);
    } catch (err) {
      toast.error(
        "Ошибка при сохранении шаблона: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  // Фильтрация шаблонов
  const filteredTemplates = templates.filter((template) => {
    const matchesCategory =
      !filterCategory || template.category === filterCategory;
    const matchesSearch =
      !searchTerm ||
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  // Получение уникальных категорий для фильтра
  const categories = [
    ...new Set(templates.map((t) => t.category).filter(Boolean)),
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Шаблоны задач</h1>
          <p className="mt-1 text-gray-500">
            Создавайте и редактируйте шаблоны задач для планов адаптации
          </p>
        </div>

        <button
          onClick={handleCreateTemplate}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Создать шаблон
        </button>
      </div>

      {/* Панель фильтров */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Фильтр по категории */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фильтр по категории
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border rounded w-full py-2 px-3 text-gray-700"
            >
              <option value="">Все категории</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Поиск */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Поиск
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск по названию или описанию..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded w-full py-2 px-3 pl-10 text-gray-700"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
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

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterCategory("");
                setSearchTerm("");
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <AdjustmentsVerticalIcon className="h-5 w-5 mr-2" />
              Сбросить фильтры
            </button>
          </div>
        </div>
      </div>

      {/* Состояние загрузки */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex">
            <XCircleIcon className="h-6 w-6 text-red-500 mr-2" />
            <p>{error}</p>
          </div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow">
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 rounded-full p-3 mb-4">
              <PlusIcon className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {templates.length === 0
                ? "Шаблоны задач не найдены"
                : "Нет шаблонов, соответствующих фильтрам"}
            </h3>
            <p className="text-gray-500 mb-4">
              {templates.length === 0
                ? "Создайте первый шаблон задачи для использования в планах адаптации"
                : "Попробуйте изменить параметры фильтрации или сбросить фильтры"}
            </p>
            {templates.length === 0 && (
              <button
                onClick={handleCreateTemplate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Создать шаблон
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white overflow-hidden shadow rounded-lg"
            >
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    {template.title}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Редактировать шаблон"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(template)}
                      className="text-red-600 hover:text-red-800"
                      title="Удалить шаблон"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {template.category && (
                  <div className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                    {template.category}
                  </div>
                )}

                <p className="mt-2 text-sm text-gray-500">
                  {template.description}
                </p>

                <div className="mt-4 flex flex-col space-y-2">
                  <div className="flex items-center text-sm">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                    <span className="text-gray-700">
                      Срок выполнения: {template.default_days_to_complete} дней
                    </span>
                  </div>

                  <div className="flex items-center text-sm">
                    {template.is_required ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                        <span className="text-gray-700">
                          Обязательная задача
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="h-5 w-5 text-gray-400 mr-1" />
                        <span className="text-gray-700">
                          Необязательная задача
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно формы шаблона */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditTemplate(null);
        }}
        title={
          editTemplate ? "Редактирование шаблона" : "Создание шаблона задачи"
        }
      >
        <TaskTemplateForm
          template={editTemplate}
          onSave={handleSaveTemplate}
          onCancel={() => {
            setShowForm(false);
            setEditTemplate(null);
          }}
        />
      </Modal>

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Удаление шаблона задачи"
        message={`Вы действительно хотите удалить шаблон "${templateToDelete?.title}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        isDangerous={true}
      />
    </div>
  );
};

export default TaskTemplates;
