import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import TaskForm from "../common/TaskForm";
import TaskTemplateForm from "./TaskTemplateForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DocumentIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ArrowsUpDownIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";

// Компонент для отображения таблицы предпросмотра задач
const TaskPreviewTable = ({
  tasks,
  onEdit,
  onDelete,
  isDraggable = false,
  taskType = "template", // "template" или "custom"
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {isDraggable && (
              <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <ArrowsUpDownIcon
                  className="h-4 w-4"
                  title="Перетащите для изменения порядка"
                />
              </th>
            )}
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Задача
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Приоритет
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {taskType === "template" ? "Длительность" : "Срок"}
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Действия
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.length === 0 ? (
            <tr>
              <td
                colSpan={isDraggable ? 5 : 4}
                className="px-3 py-4 text-center text-sm text-gray-500"
              >
                Нет {taskType === "template" ? "шаблонных" : "кастомных"} задач
              </td>
            </tr>
          ) : (
            tasks.map((task, index) => (
              <tr
                key={task.id || `custom-${index}`}
                className="hover:bg-gray-50"
              >
                {isDraggable && (
                  <td className="px-2 py-2">
                    <div className="flex justify-center cursor-move">
                      <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </td>
                )}
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {taskType === "template" ? (
                      <DocumentDuplicateIcon className="h-5 w-5 text-blue-500 mr-2" />
                    ) : (
                      <DocumentIcon className="h-5 w-5 text-purple-500 mr-2" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {task.title}
                      </div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">
                        {task.description}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      task.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {task.priority === "high"
                      ? "Высокий"
                      : task.priority === "medium"
                      ? "Средний"
                      : "Низкий"}
                  </span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    {taskType === "template" ? (
                      <span>
                        {task.duration_days || task.default_days_to_complete}{" "}
                        дн.
                      </span>
                    ) : (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-500" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(task, index)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title={
                        taskType === "template"
                          ? "Редактировать шаблон"
                          : "Редактировать задачу"
                      }
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => onDelete(task, index)}
                      className="text-red-600 hover:text-red-900"
                      title="Удалить"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Компонент для адаптивного отображения на мобильных устройствах
const MobileTaskSelector = ({
  templates,
  onSelect,
  filterRole,
  filterDepartment,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  const handleChange = (e) => {
    const id = e.target.value;
    setSelectedTemplateId(id);

    if (id) {
      const selectedTemplate = templates.find((t) => t.id === parseInt(id));
      if (selectedTemplate) {
        onSelect(selectedTemplate);
      }
    }
  };

  // Фильтруем шаблоны для отображения
  const filteredTemplates = templates.filter((template) => {
    let match = true;

    if (filterRole) {
      match = match && template.role === filterRole;
    }

    if (filterDepartment) {
      match =
        match &&
        (template.department === filterDepartment || !template.department);
    }

    return match;
  });

  return (
    <div className="md:hidden">
      <label
        htmlFor="mobile-template-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Выберите шаблон для добавления
      </label>
      <select
        id="mobile-template-select"
        value={selectedTemplateId}
        onChange={handleChange}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
      >
        <option value="">Выберите шаблон</option>
        {filteredTemplates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.title} - {template.priority},{" "}
            {template.duration_days || template.default_days_to_complete} дн.
            {template.department ? ` (${template.department})` : ""}
          </option>
        ))}
      </select>
      <div className="mt-2">
        <button
          type="button"
          onClick={() => {
            if (selectedTemplateId) {
              const template = templates.find(
                (t) => t.id === parseInt(selectedTemplateId)
              );
              onSelect(template);
              setSelectedTemplateId("");
            } else {
              toast.warn("Сначала выберите шаблон");
            }
          }}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
          Добавить в план
        </button>
      </div>
    </div>
  );
};

const PlanForm = ({ onPlanCreated, editPlan = null, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    role: "employee",
  });
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [customTasks, setCustomTasks] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filterRole, setFilterRole] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [editingCustomTaskIndex, setEditingCustomTaskIndex] = useState(null);
  const [showNewTemplateForm, setShowNewTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [
    selectedGoogleCalendarIntegration,
    setSelectedGoogleCalendarIntegration,
  ] = useState(false);

  // Иницииализация React Query для оптимизации запросов
  const queryClient = useQueryClient();

  // Запрос шаблонов задач с использованием React Query
  const { data: taskTemplates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["taskTemplates"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/task_templates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
      } catch (error) {
        console.error("Ошибка при загрузке шаблонов задач:", error);
        toast.error("Не удалось загрузить шаблоны задач");
        return [];
      }
    },
  });

  // Запрос списка пользователей
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Только активные пользователи (не заблокированные)
        return response.data.filter((user) => !user.disabled);
      } catch (error) {
        console.error("Ошибка при загрузке пользователей:", error);
        toast.error("Не удалось загрузить список пользователей");
        return [];
      }
    },
  });

  // Получаем список уникальных отделов из данных пользователей
  const departments = useMemo(() => {
    if (!users || users.length === 0) return [];
    return [...new Set(users.map((user) => user.department).filter(Boolean))];
  }, [users]);

  // Устанавливаем первого пользователя по умолчанию при загрузке списка
  useEffect(() => {
    if (users && users.length > 0 && !selectedUser) {
      setSelectedUser(users[0]);
    }
  }, [users, selectedUser]);

  // Заполнение формы данными, если редактируем существующий план
  useEffect(() => {
    if (editPlan) {
      setFormData({
        title: editPlan.title || "",
        description: editPlan.description || "",
        role: editPlan.role || "employee",
      });

      // Загрузка задач плана, если это режим редактирования
      if (editPlan.id) {
        const fetchPlanTasks = async () => {
          try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
              `/api/plans/${editPlan.id}/tasks`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );

            // Разделяем задачи на шаблонные и кастомные
            const templateTasks = response.data.filter(
              (task) => task.template_id
            );
            const custom = response.data.filter((task) => !task.template_id);

            // Загружаем соответствующие шаблоны
            const templateIds = templateTasks.map((t) => t.template_id);
            if (templateIds.length > 0) {
              const templatesResponse = await axios.get(
                `/api/task_templates?ids=${templateIds.join(",")}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (templatesResponse.data && templatesResponse.data.length > 0) {
                setSelectedTemplates(templatesResponse.data);
              }
            }

            setCustomTasks(custom);
          } catch (error) {
            console.error("Ошибка при загрузке задач плана:", error);
            toast.error("Не удалось загрузить задачи плана");
          }
        };

        fetchPlanTasks();
      }
    }
  }, [editPlan]);

  // Обновляем состояние формы при изменении полей
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Добавляем шаблон задачи в выбранные
  const handleSelectTemplate = (template) => {
    // Проверяем, не выбран ли уже этот шаблон
    if (!selectedTemplates.some((t) => t.id === template.id)) {
      setSelectedTemplates([...selectedTemplates, template]);
      toast.success(`Шаблон "${template.title}" добавлен в план`);
    } else {
      toast.info("Этот шаблон уже добавлен в план");
    }
  };

  // Удаляем шаблон задачи из выбранных
  const handleRemoveTemplate = (template) => {
    setSelectedTemplates(selectedTemplates.filter((t) => t.id !== template.id));
  };

  // Редактирование шаблона задачи
  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setShowNewTemplateForm(true);
  };

  // Обработка создания нового шаблона задачи
  const handleTemplateCreated = (template) => {
    queryClient.invalidateQueries(["taskTemplates"]);
    setShowNewTemplateForm(false);
    setEditingTemplate(null);

    // Если шаблон был создан (а не отредактирован), добавляем его в выбранные
    if (!selectedTemplates.some((t) => t.id === template.id)) {
      setSelectedTemplates([...selectedTemplates, template]);
    }
  };

  // Добавляем кастомную задачу
  const handleAddCustomTask = (taskData) => {
    if (editingCustomTaskIndex !== null) {
      // Обновляем существующую задачу
      const updatedTasks = [...customTasks];
      updatedTasks[editingCustomTaskIndex] = {
        ...taskData,
        user_id: selectedUser?.id,
      };
      setCustomTasks(updatedTasks);
      setEditingCustomTaskIndex(null);
    } else {
      // Добавляем новую задачу
      setCustomTasks([
        ...customTasks,
        {
          ...taskData,
          user_id: selectedUser?.id,
        },
      ]);
    }
    setShowNewTaskForm(false);
    toast.success(
      editingCustomTaskIndex !== null
        ? "Кастомная задача обновлена"
        : "Кастомная задача добавлена в план"
    );
  };

  // Редактирование кастомной задачи
  const handleEditCustomTask = (task, index) => {
    setEditingCustomTaskIndex(index);
    setShowNewTaskForm(true);
  };

  // Удаление кастомной задачи
  const handleRemoveCustomTask = (_, index) => {
    setCustomTasks(customTasks.filter((_, i) => i !== index));
  };

  // Изменение выбранного пользователя
  const handleUserChange = (e) => {
    const userId = parseInt(e.target.value);
    const user = users.find((u) => u.id === userId);
    setSelectedUser(user);
  };

  // Обработчик drag-and-drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Перетаскивание в списке шаблонов
    if (
      source.droppableId === "templates" &&
      destination.droppableId === "templates"
    ) {
      const newTemplates = Array.from(selectedTemplates);
      const [movedTemplate] = newTemplates.splice(source.index, 1);
      newTemplates.splice(destination.index, 0, movedTemplate);
      setSelectedTemplates(newTemplates);
    }

    // Перетаскивание в списке кастомных задач
    if (
      source.droppableId === "customTasks" &&
      destination.droppableId === "customTasks"
    ) {
      const newTasks = Array.from(customTasks);
      const [movedTask] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, movedTask);
      setCustomTasks(newTasks);
    }
  };

  // Отправка формы создания/редактирования плана
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const planData = {
        ...formData,
        template_ids: selectedTemplates.map((t) => t.id),
        custom_tasks: customTasks,
        send_to_google_calendar: selectedGoogleCalendarIntegration,
      };

      let response;
      if (editPlan) {
        response = await axios.put(`/api/plans/${editPlan.id}`, planData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("План адаптации успешно обновлен");
      } else {
        response = await axios.post("/api/plans", planData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("План адаптации успешно создан");
      }

      // Обновляем кеш React Query для списка планов
      queryClient.invalidateQueries(["plans"]);

      // Очищаем форму для нового плана
      if (!editPlan) {
        setFormData({
          title: "",
          description: "",
          role: "employee",
        });
        setSelectedTemplates([]);
        setCustomTasks([]);
      }

      // Вызываем колбэк с созданным/обновленным планом
      if (onPlanCreated) {
        onPlanCreated(response.data);
      }

      // Если это редактирование, закрываем форму
      if (editPlan && onCancel) {
        onCancel();
      }
    } catch (error) {
      console.error("Ошибка при сохранении плана:", error);
      const errorMessage =
        error.response?.data?.detail || "Произошла ошибка при сохранении плана";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Фильтрация шаблонов для отображения
  const filteredTemplates = useMemo(() => {
    if (!taskTemplates || taskTemplates.length === 0) return [];

    return taskTemplates.filter((template) => {
      let match = true;

      if (filterRole) {
        match = match && template.role === filterRole;
      }

      if (filterDepartment) {
        match =
          match &&
          (template.department === filterDepartment || !template.department);
      }

      return match;
    });
  }, [taskTemplates, filterRole, filterDepartment]);

  // Синхронизация роли плана и фильтра шаблонов
  useEffect(() => {
    setFilterRole(formData.role);
  }, [formData.role]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">
        {editPlan
          ? "Редактирование плана адаптации"
          : "Создание плана адаптации"}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="title">
            Название плана*
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-gray-700 font-bold mb-2"
            htmlFor="description"
          >
            Описание плана
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ""}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2" htmlFor="role">
            Целевая роль*
          </label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="employee">Сотрудник</option>
            <option value="manager">Менеджер</option>
            <option value="hr">HR</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">
            Выберите сотрудника для задач
          </label>
          {isLoadingUsers ? (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              <span>Загрузка списка сотрудников...</span>
            </div>
          ) : (
            <select
              value={selectedUser?.id || ""}
              onChange={handleUserChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email}{" "}
                  ({user.department || "Без отдела"})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Секция с фильтрами и выбором шаблонов */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex flex-wrap items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Добавление шаблонов задач</h3>
            <button
              type="button"
              onClick={() => {
                setEditingTemplate(null);
                setShowNewTemplateForm(true);
              }}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mt-1 md:mt-0"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Создать новый шаблон
            </button>
          </div>

          {/* Форма для создания/редактирования шаблона задачи */}
          {showNewTemplateForm && (
            <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg mb-4">
              <TaskTemplateForm
                onTemplateCreated={handleTemplateCreated}
                editTemplate={editingTemplate}
                onCancel={() => {
                  setShowNewTemplateForm(false);
                  setEditingTemplate(null);
                }}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="flex items-center mb-2">
                <FunnelIcon className="h-4 w-4 mr-1 text-gray-500" />
                <label className="block text-gray-700 font-bold">
                  Фильтр по роли
                </label>
              </div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Все роли</option>
                <option value="employee">Сотрудник</option>
                <option value="manager">Менеджер</option>
                <option value="hr">HR</option>
              </select>
            </div>
            <div>
              <div className="flex items-center mb-2">
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1 text-gray-500" />
                <label className="block text-gray-700 font-bold">
                  Фильтр по отделу
                </label>
              </div>
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Все отделы</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Адаптивный селект для мобильных устройств */}
          <MobileTaskSelector
            templates={taskTemplates}
            onSelect={handleSelectTemplate}
            filterRole={filterRole}
            filterDepartment={filterDepartment}
          />

          {/* Стандартный вид списка шаблонов для десктопных устройств */}
          <div className="hidden md:block border p-3 rounded-lg bg-white mb-4 max-h-60 overflow-y-auto">
            <h4 className="font-medium mb-2">Доступные шаблоны:</h4>
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center p-4">
                <svg
                  className="animate-spin h-5 w-5 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
                <span className="ml-2">Загрузка шаблонов...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <p className="text-gray-500">
                Нет доступных шаблонов с выбранными фильтрами
              </p>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border p-2 rounded flex justify-between items-center hover:bg-gray-50"
                  >
                    <div className="flex items-start">
                      <DocumentDuplicateIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium">{template.title}</div>
                        <div className="text-sm text-gray-600">
                          {template.role}, {template.priority},{" "}
                          {template.duration_days} дн.
                          {template.department && `, ${template.department}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditTemplate(template)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded"
                        title="Редактировать шаблон"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectTemplate(template)}
                        className="bg-green-500 hover:bg-green-600 text-white py-1 px-3 rounded"
                      >
                        Добавить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Секция с выбранными шаблонами и кастомными задачами */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-3">
            Предпросмотр задач плана
          </h3>

          <DragDropContext onDragEnd={handleDragEnd}>
            {/* Выбранные шаблоны */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Шаблонные задачи:</h4>
                <div className="text-sm text-gray-500">
                  {selectedTemplates.length} задач
                </div>
              </div>

              {selectedTemplates.length === 0 ? (
                <div className="bg-white p-4 rounded border border-dashed border-gray-300 text-center">
                  <p className="text-gray-500 mb-2">Нет выбранных шаблонов</p>
                  <p className="text-sm text-gray-400">
                    Добавьте шаблоны задач из списка выше
                  </p>
                </div>
              ) : (
                <Droppable droppableId="templates">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="bg-white rounded border overflow-hidden"
                    >
                      <TaskPreviewTable
                        tasks={selectedTemplates}
                        onDelete={(template) => handleRemoveTemplate(template)}
                        onEdit={(template) => handleEditTemplate(template)}
                        isDraggable={true}
                        taskType="template"
                      />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>

            {/* Кастомные задачи */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Кастомные задачи:</h4>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCustomTaskIndex(null);
                    setShowNewTaskForm(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                >
                  Добавить задачу
                </button>
              </div>

              {customTasks.length === 0 ? (
                <div className="bg-white p-4 rounded border border-dashed border-gray-300 text-center">
                  <p className="text-gray-500 mb-2">Нет кастомных задач</p>
                  <p className="text-sm text-gray-400">
                    Добавьте индивидуальные задачи для этого плана
                  </p>
                </div>
              ) : (
                <Droppable droppableId="customTasks">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="bg-white rounded border overflow-hidden"
                    >
                      <TaskPreviewTable
                        tasks={customTasks}
                        onDelete={handleRemoveCustomTask}
                        onEdit={handleEditCustomTask}
                        isDraggable={true}
                        taskType="custom"
                      />
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          </DragDropContext>

          {/* Интеграция с Google Calendar */}
          <div className="mt-6 bg-white p-4 rounded border">
            <div className="flex items-center space-x-2">
              <input
                id="google-calendar-integration"
                type="checkbox"
                checked={selectedGoogleCalendarIntegration}
                onChange={(e) =>
                  setSelectedGoogleCalendarIntegration(e.target.checked)
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <label
                  htmlFor="google-calendar-integration"
                  className="font-medium text-gray-700"
                >
                  Интеграция с Google Calendar
                </label>
                <p className="text-sm text-gray-500">
                  Отправить шаблонные задачи в календарь сотрудника после
                  создания плана
                </p>
              </div>
            </div>
          </div>

          {/* Форма добавления новой кастомной задачи */}
          {showNewTaskForm && (
            <div className="border border-blue-200 bg-blue-50 p-4 rounded-lg mt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">
                  {editingCustomTaskIndex !== null
                    ? "Редактирование задачи"
                    : "Новая кастомная задача"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowNewTaskForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Отмена
                </button>
              </div>
              <TaskForm
                onTaskCreated={handleAddCustomTask}
                initialData={
                  editingCustomTaskIndex !== null
                    ? customTasks[editingCustomTaskIndex]
                    : { user_id: selectedUser?.id }
                }
                submitButtonText={
                  editingCustomTaskIndex !== null
                    ? "Сохранить изменения"
                    : "Добавить задачу в план"
                }
                hideUserSelect
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              disabled={isSubmitting}
            >
              Отмена
            </button>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Сохранение...
              </>
            ) : editPlan ? (
              "Сохранить изменения"
            ) : (
              "Создать план"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlanForm;
