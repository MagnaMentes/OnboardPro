import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import TaskForm from "../common/TaskForm";
import TaskTemplateForm from "./TaskTemplateForm";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { connect } from "react-redux";
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
  XMarkIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import {
  Button,
  FormField,
  Card,
  SelectField,
  CheckboxField,
} from "../../config/theme";

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
      <table className="min-w-full divide-y divide-gray-200 table-fixed">
        <thead className="bg-gray-50">
          <tr>
            {isDraggable && (
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <ArrowsUpDownIcon
                  className="h-4 w-4"
                  title="Перетащите для изменения порядка"
                />
              </th>
            )}
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Задача
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
              Приоритет
            </th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
              {taskType === "template" ? "Длительность" : "Срок"}
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
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
                  <td className="px-3 py-3">
                    <div className="flex justify-center cursor-move">
                      <ArrowsUpDownIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  </td>
                )}
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    {taskType === "template" ? (
                      <DocumentDuplicateIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />
                    ) : (
                      <DocumentIcon className="h-5 w-5 text-purple-500 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      task.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 mr-1.5 rounded-full ${
                        task.priority === "high"
                          ? "bg-red-600"
                          : task.priority === "medium"
                          ? "bg-yellow-600"
                          : "bg-green-600"
                      }`}
                    ></span>
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
                      <span className="flex items-center">
                        <ClipboardDocumentListIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        {task.duration_days || task.default_days_to_complete}{" "}
                        дн.
                      </span>
                    ) : (
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                        {new Date(task.deadline).toLocaleDateString("ru-RU")}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <div className="flex justify-center space-x-1">
                    <button
                      onClick={() => onEdit(task, index)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title={
                        taskType === "template"
                          ? "Редактировать шаблон"
                          : "Редактировать задачу"
                      }
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(task, index)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Удалить"
                    >
                      <TrashIcon className="h-4 w-4" />
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
    <div className="md:hidden mb-4">
      <label
        htmlFor="mobile-template-select"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Выберите шаблон для добавления
      </label>
      <div className="mb-2">
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
      </div>
      <Button
        variant="primary"
        size="sm"
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
      >
        <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
        Добавить в план
      </Button>
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
        const response = await axios.get("/api/api/task_templates", {
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
              `/api/tasks?plan_id=${editPlan.id}`,
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
                `/api/api/task_templates?ids=${templateIds.join(",")}`,
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

  // Компонент заголовка секции
  const SectionHeader = ({ icon, title, count, children }) => (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center">
        {icon}
        <h3 className="text-lg font-medium text-gray-900 ml-2">{title}</h3>
        {count !== undefined && (
          <span className="ml-2 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="bg-white rounded-lg">
      <div className="border-b border-gray-200 pb-4 mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {editPlan ? "Редактирование плана" : "Создание плана адаптации"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {editPlan
            ? "Измените параметры плана и состав задач"
            : "Заполните основные данные и добавьте задачи в план адаптации"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Основная информация о плане */}
        <div className="space-y-4">
          <SectionHeader
            icon={
              <ClipboardDocumentCheckIcon className="h-5 w-5 text-blue-500" />
            }
            title="Основная информация"
          />

          <FormField
            label="Название плана*"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Введите название плана"
            required
          />

          <FormField
            label="Описание плана"
            id="description"
            name="description"
            type="textarea"
            rows={3}
            value={formData.description || ""}
            onChange={handleChange}
            placeholder="Введите описание плана адаптации"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField
              label="Целевая роль*"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              options={[
                { value: "employee", label: "Сотрудник" },
                { value: "manager", label: "Менеджер" },
                { value: "hr", label: "HR" },
              ]}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <UserIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                Сотрудник для задач
              </label>
              {isLoadingUsers ? (
                <div className="flex items-center space-x-2 text-sm text-gray-500 py-2">
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
                <SelectField
                  id="user"
                  name="user"
                  value={selectedUser?.id || ""}
                  onChange={handleUserChange}
                  options={users.map((user) => ({
                    value: user.id,
                    label: `${
                      user.first_name && user.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user.email
                    } (${user.department || "Без отдела"})`,
                  }))}
                />
              )}
            </div>
          </div>
        </div>

        {/* Секция с фильтрами и выбором шаблонов */}
        <Card className="p-5">
          <SectionHeader
            icon={<DocumentDuplicateIcon className="h-5 w-5 text-blue-500" />}
            title="Шаблоны задач"
          >
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingTemplate(null);
                setShowNewTemplateForm(true);
              }}
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Создать шаблон
            </Button>
          </SectionHeader>

          {/* Форма для создания/редактирования шаблона задачи */}
          {showNewTemplateForm && (
            <div className="border border-blue-200 bg-blue-50/50 p-5 rounded-lg mb-5 shadow-sm">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <div className="flex items-center mb-2">
                <FunnelIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                <label className="block text-sm font-medium text-gray-700">
                  Фильтр по роли
                </label>
              </div>
              <SelectField
                id="filter-role"
                name="filter-role"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                options={[
                  { value: "", label: "Все роли" },
                  { value: "employee", label: "Сотрудник" },
                  { value: "manager", label: "Менеджер" },
                  { value: "hr", label: "HR" },
                ]}
              />
            </div>
            <div>
              <div className="flex items-center mb-2">
                <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1.5 text-gray-500" />
                <label className="block text-sm font-medium text-gray-700">
                  Фильтр по отделу
                </label>
              </div>
              <SelectField
                id="filter-department"
                name="filter-department"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                options={[
                  { value: "", label: "Все отделы" },
                  ...departments.map((dept) => ({ value: dept, label: dept })),
                ]}
              />
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
          <div className="hidden md:block border rounded-lg bg-white shadow-sm mb-5 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700">
                Доступные шаблоны задач
              </h4>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {isLoadingTemplates ? (
                <div className="flex items-center justify-center p-6">
                  <svg
                    className="animate-spin h-5 w-5 text-blue-500 mr-3"
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
                  <span className="text-sm text-gray-600">
                    Загрузка шаблонов...
                  </span>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-500 text-sm">
                    Нет доступных шаблонов с выбранными фильтрами
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredTemplates.map((template) => (
                    <li
                      key={template.id}
                      className="px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-start mr-2">
                          <DocumentDuplicateIcon className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {template.title}
                            </div>
                            <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500">
                              <span className="flex items-center">
                                <UserIcon className="h-3.5 w-3.5 mr-1" />
                                {template.role}
                              </span>
                              <span
                                className={`px-1.5 py-0.5 rounded-full ${
                                  template.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : template.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {template.priority === "high"
                                  ? "Высокий"
                                  : template.priority === "medium"
                                  ? "Средний"
                                  : "Низкий"}
                              </span>
                              <span className="flex items-center">
                                <ClipboardDocumentListIcon className="h-3.5 w-3.5 mr-1" />
                                {template.duration_days} дн.
                              </span>
                              {template.department && (
                                <span className="inline-flex items-center border border-gray-300 px-2 py-0.5 rounded text-xs font-medium">
                                  {template.department}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => handleEditTemplate(template)}
                            title="Редактировать шаблон"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => handleSelectTemplate(template)}
                          >
                            Добавить
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Выбранные шаблоны */}
          <div className="mb-5">
            <SectionHeader
              icon={
                <ClipboardDocumentListIcon className="h-5 w-5 text-green-600" />
              }
              title="Выбранные шаблоны"
              count={selectedTemplates.length}
            />

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
                    className="bg-white rounded-lg border overflow-hidden shadow-sm"
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
        </Card>

        {/* Секция с кастомными задачами */}
        <Card className="p-5">
          <SectionHeader
            icon={<DocumentIcon className="h-5 w-5 text-purple-600" />}
            title="Кастомные задачи"
            count={customTasks.length}
          >
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingCustomTaskIndex(null);
                setShowNewTaskForm(true);
              }}
            >
              <PlusIcon className="h-4 w-4 mr-1.5" />
              Добавить задачу
            </Button>
          </SectionHeader>

          {/* Форма добавления новой кастомной задачи */}
          {showNewTaskForm && (
            <div className="border border-purple-200 bg-purple-50/50 p-5 rounded-lg mb-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-purple-100 pb-3">
                <h4 className="font-medium text-purple-900">
                  {editingCustomTaskIndex !== null
                    ? "Редактирование задачи"
                    : "Новая кастомная задача"}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowNewTaskForm(false)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full"
                >
                  <XMarkIcon className="h-5 w-5" />
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

          {/* Список кастомных задач */}
          {customTasks.length === 0 ? (
            <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-center">
              <div className="mx-auto w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-3">
                <DocumentIcon className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-gray-900 font-medium mb-1">
                Нет кастомных задач
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Добавьте индивидуальные задачи для этого плана адаптации
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingCustomTaskIndex(null);
                  setShowNewTaskForm(true);
                }}
              >
                <PlusIcon className="h-4 w-4 mr-1.5" />
                Создать первую задачу
              </Button>
            </div>
          ) : (
            <Droppable droppableId="customTasks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {customTasks.map((task, index) => (
                    <div
                      key={`custom-${index}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Визуальный индикатор приоритета */}
                      <div
                        className={`h-1 w-full ${
                          task.priority === "high"
                            ? "bg-red-500"
                            : task.priority === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                      ></div>

                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <h5 className="text-base font-medium text-gray-900 mb-1 line-clamp-2">
                            {task.title}
                          </h5>
                          <span
                            className={`ml-2 flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 mr-1.5 rounded-full ${
                                task.priority === "high"
                                  ? "bg-red-600"
                                  : task.priority === "medium"
                                  ? "bg-yellow-600"
                                  : "bg-green-600"
                              }`}
                            ></span>
                            {task.priority === "high"
                              ? "Высокий"
                              : task.priority === "medium"
                              ? "Средний"
                              : "Низкий"}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2 mt-1">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <CalendarIcon className="h-4 w-4 mr-1.5 text-gray-400" />
                          <span>
                            {new Date(task.deadline).toLocaleDateString(
                              "ru-RU",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={() => handleEditCustomTask(task, index)}
                            className="text-blue-600 hover:bg-blue-50 hover:text-blue-800 p-1.5 rounded"
                            title="Редактировать задачу"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveCustomTask(task, index)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-800 p-1.5 rounded"
                            title="Удалить задачу"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </Card>

        {/* Интеграция с Google Calendar */}
        <div className="mt-6 bg-white p-4 rounded-lg border shadow-sm">
          <CheckboxField
            id="google-calendar-integration"
            label="Интеграция с Google Calendar"
            checked={selectedGoogleCalendarIntegration}
            onChange={(e) =>
              setSelectedGoogleCalendarIntegration(e.target.checked)
            }
            helpText="Отправить шаблонные задачи в календарь сотрудника после создания плана"
          />
        </div>

        {/* Кнопки отправки и отмены */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              disabled={isSubmitting}
            >
              Отмена
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isSubmitting}>
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
          </Button>
        </div>
      </form>
    </div>
  );
};

// Соединяем компонент с Redux для доступа к хранилищу
const mapStateToProps = (state) => ({});

export default connect(mapStateToProps)(PlanForm);
