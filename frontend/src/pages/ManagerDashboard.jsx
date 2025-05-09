import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getApiBaseUrl } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import { hasRole } from "../utils/roleUtils";
import {
  UserPlusIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronRightIcon,
  FolderPlusIcon,
  CalendarIcon,
  UsersIcon,
  DocumentPlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  XMarkIcon,
  AdjustmentsVerticalIcon,
  QueueListIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "../components/common/Modal"; // Импорт универсального компонента модального окна
import TaskModal from "../components/TaskModal"; // Импорт компонента TaskModal
import PlanForm from "../components/specific/PlanForm"; // Импорт компонента PlanForm
import TaskTemplateForm from "../components/specific/TaskTemplateForm"; // Импорт компонента TaskTemplateForm

// Импортируем компоненты и стили из нашей новой системы темы
import {
  Button,
  TaskStatus,
  TaskPriority,
  FORM_STYLES,
  CARD_STYLES,
  BUTTON_STYLES,
  getButtonClassName,
} from "../config/theme";

export default function ManagerDashboard() {
  // Устанавливаем заголовок страницы
  usePageTitle("Панель менеджера");

  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userRole, setUserRole] = useState(null); // Состояние для хранения роли текущего пользователя
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newTask, setNewTask] = useState({
    plan_id: "",
    user_id: "",
    title: "",
    description: "",
    priority: "medium",
    deadline: new Date().toISOString().split("T")[0],
  });

  // Состояния для управления планами и шаблонами
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTaskTemplateModalOpen, setIsTaskTemplateModalOpen] = useState(false);
  const [isTemplatesListOpen, setIsTemplatesListOpen] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  const [isDeleteTemplateModalOpen, setIsDeleteTemplateModalOpen] =
    useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [templateToDelete, setTemplateToDelete] = useState(null);

  // Прочие состояния
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [isUpdatingTask, setIsUpdatingTask] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskPriorityFilter, setTaskPriorityFilter] = useState("all");
  const [taskUserFilter, setTaskUserFilter] = useState("all");
  const [taskPlanFilter, setTaskPlanFilter] = useState("all");
  const [taskSortField, setTaskSortField] = useState("deadline");
  const [taskSortDirection, setTaskSortDirection] = useState("asc");
  const [isTaskFiltersVisible, setIsTaskFiltersVisible] = useState(false);
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        // Получаем данные о текущем пользователе
        const currentUserResponse = await fetch(`${apiBaseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!currentUserResponse.ok) {
          throw new Error("Ошибка при получении данных пользователя");
        }
        const userData = await currentUserResponse.json();
        setUserRole(userData.role);

        // Получаем список всех пользователей
        const usersResponse = await fetch(`${apiBaseUrl}/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!usersResponse.ok) {
          throw new Error("Ошибка при получении списка пользователей");
        }
        const usersData = await usersResponse.json();
        setUsers(usersData);

        // Получаем список всех планов
        const plansResponse = await fetch(`${apiBaseUrl}/plans`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!plansResponse.ok) {
          throw new Error("Ошибка при получении списка планов");
        }
        const plansData = await plansResponse.json();
        setPlans(plansData);

        // Получаем список всех задач
        const tasksResponse = await fetch(`${apiBaseUrl}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!tasksResponse.ok) {
          throw new Error("Ошибка при получении списка задач");
        }
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);

        // Получаем список всех шаблонов задач
        if (hasRole(userData.role, ["HR", "hr"])) {
          const templatesResponse = await fetch(
            `${apiBaseUrl}/api/task_templates`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (!templatesResponse.ok) {
            throw new Error("Ошибка при получении списка шаблонов задач");
          }
          const templatesData = await templatesResponse.json();
          setTemplates(templatesData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl]);

  // Функция для обновления списка задач из базы данных
  const refreshTasksFromDatabase = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const tasksResponse = await fetch(`${apiBaseUrl}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!tasksResponse.ok) {
        throw new Error("Ошибка при получении списка задач");
      }

      const tasksData = await tasksResponse.json();
      setTasks(tasksData);
      toast.success("Список задач успешно обновлен");
      console.log("Список задач обновлен из базы данных:", tasksData);
    } catch (err) {
      console.error("Ошибка при обновлении списка задач:", err);
      toast.error(err.message);
    }
  };

  // Функция для обновления списка шаблонов задач
  const refreshTemplatesFromDatabase = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${apiBaseUrl}/api/task_templates`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Ошибка при получении списка шаблонов");
      }

      const templatesData = await response.json();
      setTemplates(templatesData);
      toast.success("Список шаблонов успешно обновлен");
    } catch (err) {
      console.error("Ошибка при обновлении списка шаблонов:", err);
      toast.error(err.message);
    }
  };

  // Функция переключения направления сортировки
  const toggleSortDirection = (field) => {
    if (taskSortField === field) {
      setTaskSortDirection(taskSortDirection === "asc" ? "desc" : "asc");
    } else {
      setTaskSortField(field);
      setTaskSortDirection("asc");
    }
  };

  // Функция сброса всех фильтров
  const resetTaskFilters = () => {
    setTaskStatusFilter("all");
    setTaskPriorityFilter("all");
    setTaskUserFilter("all");
    setTaskPlanFilter("all");
    setTaskSearchQuery("");
  };

  // Фильтрация и сортировка задач на основе выбранных параметров
  const filteredAndSortedTasks = useMemo(() => {
    // Сначала применяем фильтры
    let result = [...tasks];

    // Фильтр по поисковому запросу (ищет в названии и описании)
    if (taskSearchQuery.trim()) {
      const query = taskSearchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.description && task.description.toLowerCase().includes(query))
      );
    }

    // Фильтр по статусу
    if (taskStatusFilter !== "all") {
      result = result.filter((task) => task.status === taskStatusFilter);
    }

    // Фильтр по приоритету
    if (taskPriorityFilter !== "all") {
      result = result.filter((task) => task.priority === taskPriorityFilter);
    }

    // Фильтр по сотруднику
    if (taskUserFilter !== "all") {
      result = result.filter(
        (task) => task.user_id === parseInt(taskUserFilter)
      );
    }

    // Фильтр по плану
    if (taskPlanFilter !== "all") {
      result = result.filter(
        (task) => task.plan_id === parseInt(taskPlanFilter)
      );
    }

    // Затем применяем сортировку
    result.sort((a, b) => {
      let compareResult = 0;

      switch (taskSortField) {
        case "deadline":
          compareResult = new Date(a.deadline) - new Date(b.deadline);
          break;
        case "priority":
          const priorityValues = { low: 1, medium: 2, high: 3 };
          compareResult =
            priorityValues[a.priority] - priorityValues[b.priority];
          break;
        case "title":
          compareResult = a.title.localeCompare(b.title);
          break;
        case "status":
          compareResult = a.status.localeCompare(b.status);
          break;
        default:
          compareResult = 0;
      }

      // Если направление сортировки desc, инвертируем результат сравнения
      return taskSortDirection === "asc" ? compareResult : -compareResult;
    });

    return result;
  }, [
    tasks,
    taskSearchQuery,
    taskStatusFilter,
    taskPriorityFilter,
    taskUserFilter,
    taskPlanFilter,
    taskSortField,
    taskSortDirection,
  ]);

  // Отображение иконки сортировки возле заголовка столбца
  const renderSortIcon = (field) => {
    if (taskSortField !== field) {
      return null;
    }

    return taskSortDirection === "asc" ? (
      <ArrowUpIcon className="h-3 w-3 inline ml-1" />
    ) : (
      <ArrowDownIcon className="h-3 w-3 inline ml-1" />
    );
  };

  // Обработчики задач
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => {
      const updatedTask = { ...prev };
      updatedTask[name] = value;
      return updatedTask;
    });
  };

  // Улучшенная функция для отображения иконки статуса с единым стилем
  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return (
          <div className="bg-green-100 p-1 rounded-full" title="Выполнено">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          </div>
        );
      case "in_progress":
        return (
          <div className="bg-blue-100 p-1 rounded-full" title="В работе">
            <ClockIcon className="w-5 h-5 text-blue-600" />
          </div>
        );
      case "not_started":
      default:
        return (
          <div className="bg-gray-100 p-1 rounded-full" title="Не начато">
            <ExclamationCircleIcon className="w-5 h-5 text-gray-600" />
          </div>
        );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const getUserEmailById = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return `Пользователь #${userId}`;

    // Используем имя и фамилию если они доступны, иначе email
    if (user.first_name || user.last_name) {
      const fullName = [user.last_name, user.first_name]
        .filter(Boolean)
        .join(" ");
      return fullName || user.email;
    }
    return user.email;
  };

  const getPlanTitleById = (planId) => {
    const plan = plans.find((p) => p.id === planId);
    return plan ? plan.title : `План #${planId}`;
  };

  const refreshPlansFromDatabase = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const plansResponse = await fetch(`${apiBaseUrl}/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!plansResponse.ok) return;

      const plansData = await plansResponse.json();
      setPlans(plansData);
      toast.success("Список планов успешно обновлен");
    } catch (err) {
      console.error("Ошибка при обновлении списка планов:", err);
      toast.error(err.message);
    }
  };

  // Добавляем функцию для редактирования задачи
  const handleEditTask = (task) => {
    // Форматируем дату для редактирования в поле ввода типа date
    const formattedDeadline = new Date(task.deadline)
      .toISOString()
      .split("T")[0];

    // Создаем копию задачи с отформатированной датой
    const taskWithFormattedDate = {
      ...task,
      deadline: formattedDeadline,
    };

    // Устанавливаем задачу для редактирования и открываем модальное окно
    setEditingTask(taskWithFormattedDate);
    setIsEditTaskModalOpen(true);
  };

  // Обработчик для создания нового плана через форму
  const handleCreatePlan = async (planData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(`${apiBaseUrl}/plans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        throw new Error("Ошибка при создании плана адаптации");
      }

      const createdPlan = await response.json();
      setPlans((prev) => [...prev, createdPlan]);
      toast.success(`План "${createdPlan.title}" успешно создан`);
      setIsPlanModalOpen(false);

      return createdPlan;
    } catch (err) {
      console.error("Ошибка при создании плана:", err);
      toast.error(err.message);
      throw err;
    }
  };

  // Обработчик для обновления плана через форму
  const handleUpdatePlan = async (planData) => {
    try {
      if (!editingPlan) return;

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(`${apiBaseUrl}/plans/${editingPlan.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка при обновлении плана");
      }

      const updatedPlan = await response.json();

      setPlans((prev) =>
        prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
      );

      toast.success(`План "${updatedPlan.title}" успешно обновлен`);
      setEditingPlan(null);
      setIsPlanModalOpen(false);

      return updatedPlan;
    } catch (err) {
      console.error("Ошибка при обновлении плана:", err);
      toast.error(err.message);
      throw err;
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setIsPlanModalOpen(true);
  };

  const openDeletePlanModal = (plan) => {
    setPlanToDelete(plan);
    setIsDeletePlanModalOpen(true);
  };

  const handleDeletePlan = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      // Проверка на связанные задачи
      const relatedTasks = tasks.filter(
        (task) => task.plan_id === planToDelete.id
      );
      if (relatedTasks.length > 0) {
        throw new Error("Невозможно удалить план с активными задачами");
      }

      const response = await fetch(`${apiBaseUrl}/plans/${planToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка при удалении плана");
      }

      // Удаление из локального состояния
      setPlans((prev) => prev.filter((plan) => plan.id !== planToDelete.id));
      toast.success(`План "${planToDelete.title}" успешно удален`);

      setIsDeletePlanModalOpen(false);
      setPlanToDelete(null);
    } catch (err) {
      console.error("Ошибка при удалении плана:", err);
      toast.error(err.message);
      setError(err.message);
    }
  };

  // Функции для работы с шаблонами задач
  const handleCreateTemplate = async (templateData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(`${apiBaseUrl}/api/task_templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        throw new Error("Ошибка при создании шаблона задачи");
      }

      const createdTemplate = await response.json();
      setTemplates((prev) => [...prev, createdTemplate]);
      toast.success(`Шаблон "${createdTemplate.title}" успешно создан`);
      setIsTaskTemplateModalOpen(false);

      return createdTemplate;
    } catch (err) {
      console.error("Ошибка при создании шаблона:", err);
      toast.error(err.message);
      throw err;
    }
  };

  const handleUpdateTemplate = async (templateData) => {
    try {
      if (!editingTemplate) return;

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(
        `${apiBaseUrl}/api/task_templates/${editingTemplate.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка при обновлении шаблона");
      }

      const updatedTemplate = await response.json();

      setTemplates((prev) =>
        prev.map((tmpl) =>
          tmpl.id === updatedTemplate.id ? updatedTemplate : tmpl
        )
      );

      toast.success(`Шаблон "${updatedTemplate.title}" успешно обновлен`);
      setEditingTemplate(null);
      setIsTaskTemplateModalOpen(false);

      return updatedTemplate;
    } catch (err) {
      console.error("Ошибка при обновлении шаблона:", err);
      toast.error(err.message);
      throw err;
    }
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setIsTaskTemplateModalOpen(true);
  };

  const openDeleteTemplateModal = (template) => {
    setTemplateToDelete(template);
    setIsDeleteTemplateModalOpen(true);
  };

  const handleDeleteTemplate = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(
        `${apiBaseUrl}/api/task_templates/${templateToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка при удалении шаблона");
      }

      // Удаление из локального состояния
      setTemplates((prev) =>
        prev.filter((tmpl) => tmpl.id !== templateToDelete.id)
      );
      toast.success(`Шаблон "${templateToDelete.title}" успешно удален`);

      setIsDeleteTemplateModalOpen(false);
      setTemplateToDelete(null);
    } catch (err) {
      console.error("Ошибка при удалении шаблона:", err);
      toast.error(err.message);
      setError(err.message);
    }
  };

  // Функция для удаления задачи
  const handleDeleteTask = async (taskId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(`${apiBaseUrl}/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка при удалении задачи");
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));
      toast.success("Задача успешно удалена");
    } catch (err) {
      console.error("Ошибка при удалении задачи:", err);
      toast.error(err.message);
      setError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Панель менеджера</h2>
          <p className="mt-1 text-gray-500">
            Управление планами адаптации и назначение задач сотрудникам
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={refreshTasksFromDatabase}
            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            title="Обновить список задач из базы данных"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            <span className="text-sm">Обновить</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Ошибка!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      <div className="space-y-8 mt-6">
        {/* Модальные окна */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={async (taskData) => {
            try {
              const token = localStorage.getItem("token");
              if (!token) throw new Error("Не авторизован");

              const response = await fetch(`${apiBaseUrl}/tasks`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(taskData),
              });

              if (!response.ok) {
                throw new Error("Ошибка при создании задачи");
              }

              const createdTask = await response.json();
              setTasks((prev) => [...prev, createdTask]);
              toast.success("Задача успешно создана");
              setIsTaskModalOpen(false);
            } catch (err) {
              toast.error(err.message);
            }
          }}
          users={users}
          plans={plans}
          task={null}
          mode="create"
        />

        {/* Модальное окно для редактирования задачи */}
        <TaskModal
          isOpen={isEditTaskModalOpen}
          onClose={() => setIsEditTaskModalOpen(false)}
          onSave={async (taskData) => {
            try {
              if (!editingTask) return;

              const token = localStorage.getItem("token");
              if (!token) throw new Error("Не авторизован");

              const response = await fetch(
                `${apiBaseUrl}/tasks/${editingTask.id}`,
                {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(taskData),
                }
              );

              if (!response.ok) {
                throw new Error("Ошибка при обновлении задачи");
              }

              const updatedTask = await response.json();
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === updatedTask.id ? updatedTask : task
                )
              );
              toast.success("Задача успешно обновлена");
              setIsEditTaskModalOpen(false);
            } catch (err) {
              toast.error(err.message);
            }
          }}
          users={users}
          plans={plans}
          task={editingTask}
          mode="edit"
        />

        {/* Модальное окно для плана адаптации */}
        <Modal
          isOpen={isPlanModalOpen}
          onClose={() => {
            setIsPlanModalOpen(false);
            setEditingPlan(null);
          }}
          title={
            editingPlan
              ? "Редактирование плана адаптации"
              : "Создание плана адаптации"
          }
          size="lg"
        >
          <PlanForm
            onPlanCreated={editingPlan ? handleUpdatePlan : handleCreatePlan}
            editPlan={editingPlan}
            onCancel={() => {
              setIsPlanModalOpen(false);
              setEditingPlan(null);
            }}
          />
        </Modal>

        {/* Модальное окно для шаблона задачи */}
        <Modal
          isOpen={isTaskTemplateModalOpen}
          onClose={() => {
            setIsTaskTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          title={
            editingTemplate
              ? "Редактирование шаблона задачи"
              : "Создание шаблона задачи"
          }
        >
          <TaskTemplateForm
            onTemplateCreated={
              editingTemplate ? handleUpdateTemplate : handleCreateTemplate
            }
            editTemplate={editingTemplate}
            onCancel={() => {
              setIsTaskTemplateModalOpen(false);
              setEditingTemplate(null);
            }}
          />
        </Modal>

        {/* Диалог подтверждения удаления плана */}
        <Modal
          isOpen={isDeletePlanModalOpen}
          onClose={() => setIsDeletePlanModalOpen(false)}
          title="Удаление плана адаптации"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsDeletePlanModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Удалить
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-500">
            Вы действительно хотите удалить план "{planToDelete?.title}"? Это
            действие нельзя отменить.
          </p>
        </Modal>

        {/* Диалог подтверждения удаления шаблона */}
        <Modal
          isOpen={isDeleteTemplateModalOpen}
          onClose={() => setIsDeleteTemplateModalOpen(false)}
          title="Удаление шаблона задачи"
          footer={
            <>
              <button
                type="button"
                onClick={() => setIsDeleteTemplateModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleDeleteTemplate}
                className="ml-3 inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Удалить
              </button>
            </>
          }
        >
          <p className="text-sm text-gray-500">
            Вы действительно хотите удалить шаблон "{templateToDelete?.title}"?
            Это действие нельзя отменить.
          </p>
        </Modal>

        {/* Раздел управления задачами */}
        <div className="bg-white p-6 rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-700">
              Управление задачами
            </h3>
            <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
              <button
                onClick={refreshTasksFromDatabase}
                className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                title="Обновить список задач из базы данных"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                <span className="text-sm">Обновить</span>
              </button>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">Новая задача</span>
              </button>
            </div>
          </div>

          {/* Фильтры для задач */}
          <div className="mb-6">
            <div
              className="flex justify-between items-center py-2 px-4 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              onClick={() => setIsTaskFiltersVisible(!isTaskFiltersVisible)}
            >
              <div className="flex items-center">
                <AdjustmentsVerticalIcon className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-800">
                  Фильтры и поиск
                </span>
              </div>
              <ChevronDownIcon
                className={`h-5 w-5 text-blue-600 transition-transform duration-200 ${
                  isTaskFiltersVisible ? "transform rotate-180" : ""
                }`}
              />
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out mt-3 ${
                isTaskFiltersVisible
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                  {/* Поиск задач */}
                  <div>
                    <label
                      htmlFor="taskSearch"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Поиск задач
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="taskSearch"
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        placeholder="Название или описание"
                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Фильтр по статусу */}
                  <div>
                    <label
                      htmlFor="statusFilter"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Статус
                    </label>
                    <select
                      id="statusFilter"
                      value={taskStatusFilter}
                      onChange={(e) => setTaskStatusFilter(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="all">Все статусы</option>
                      <option value="not_started">Не начата</option>
                      <option value="in_progress">В работе</option>
                      <option value="completed">Выполнена</option>
                    </select>
                  </div>

                  {/* Фильтр по приоритету */}
                  <div>
                    <label
                      htmlFor="priorityFilter"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Приоритет
                    </label>
                    <select
                      id="priorityFilter"
                      value={taskPriorityFilter}
                      onChange={(e) => setTaskPriorityFilter(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="all">Все приоритеты</option>
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>

                  {/* Фильтр по сотруднику */}
                  <div>
                    <label
                      htmlFor="userFilter"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Сотрудник
                    </label>
                    <select
                      id="userFilter"
                      value={taskUserFilter}
                      onChange={(e) => setTaskUserFilter(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="all">Все сотрудники</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.first_name && user.last_name
                            ? `${user.last_name} ${user.first_name}`
                            : user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Фильтр по плану */}
                  <div>
                    <label
                      htmlFor="planFilter"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      План адаптации
                    </label>
                    <select
                      id="planFilter"
                      value={taskPlanFilter}
                      onChange={(e) => setTaskPlanFilter(e.target.value)}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full py-2 px-3 sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="all">Все планы</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-3">
                  <button
                    onClick={resetTaskFilters}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                    Сбросить фильтры
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Таблица задач / Карточки задач */}
          {filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <QueueListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-base font-medium text-gray-900">
                Нет доступных задач
              </h3>
              <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
                {tasks.length > 0
                  ? "Нет задач, соответствующих заданным фильтрам."
                  : "Задачи еще не были созданы. Создайте первую задачу!"}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsTaskModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-1.5" />
                  Создать новую задачу
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Мобильный вид - карточки */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
                {filteredAndSortedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="p-4">
                      {/* Заголовок и статус */}
                      <div className="flex justify-between items-start">
                        <div className="flex-grow pr-3">
                          <h4 className="font-medium text-gray-900 line-clamp-2">
                            {task.title}
                          </h4>
                        </div>
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center">
                            {getStatusIcon(task.status)}
                          </div>
                        </div>
                      </div>

                      {/* Информационная секция */}
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-gray-700">
                            <CalendarIcon className="h-4 w-4 text-gray-500 mr-1.5" />
                            <span
                              className={`${
                                new Date(task.deadline) < new Date() &&
                                task.status !== "completed"
                                  ? "text-red-600 font-medium"
                                  : ""
                              }`}
                            >
                              {formatDate(task.deadline)}
                            </span>
                          </div>
                          <div>
                            <div
                              className={`w-3 h-3 rounded-full ${
                                task.priority === "high"
                                  ? "bg-red-500"
                                  : task.priority === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              title={`Приоритет: ${
                                task.priority === "high"
                                  ? "Высокий"
                                  : task.priority === "medium"
                                  ? "Средний"
                                  : "Низкий"
                              }`}
                            ></div>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <UsersIcon className="h-4 w-4 text-gray-500 mr-1.5 mt-0.5" />
                          <span className="text-gray-700 truncate line-clamp-1">
                            {task.user_id
                              ? getUserEmailById(task.user_id)
                              : "Не назначено"}
                          </span>
                        </div>

                        {task.plan_id && (
                          <div className="flex items-start">
                            <ClipboardDocumentListIcon className="h-4 w-4 text-gray-500 mr-1.5 mt-0.5" />
                            <span className="text-gray-700 truncate line-clamp-1">
                              {getPlanTitleById(task.plan_id)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Кнопки действий */}
                      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                          title="Редактировать задачу"
                          aria-label="Редактировать задачу"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="Удалить задачу"
                          aria-label="Удалить задачу"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Десктопный вид - современная таблица */}
              <div className="hidden lg:block">
                <div className="w-full rounded-lg border border-gray-200">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                      <thead>
                        <tr className="bg-gray-50">
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[40%] cursor-pointer"
                            onClick={() => toggleSortDirection("title")}
                          >
                            <div className="flex items-center">
                              <span>Задача</span>
                              {taskSortField === "title" && (
                                <span className="ml-1">
                                  {taskSortDirection === "asc" ? (
                                    <ArrowUpIcon className="h-3 w-3 text-gray-500" />
                                  ) : (
                                    <ArrowDownIcon className="h-3 w-3 text-gray-500" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[10%]"
                            onClick={() => toggleSortDirection("status")}
                          >
                            <div className="flex items-center justify-center">
                              <span>Статус</span>
                              {taskSortField === "status" && (
                                <span className="ml-1">
                                  {taskSortDirection === "asc" ? (
                                    <ArrowUpIcon className="h-3 w-3 text-gray-500" />
                                  ) : (
                                    <ArrowDownIcon className="h-3 w-3 text-gray-500" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[10%]"
                            onClick={() => toggleSortDirection("priority")}
                          >
                            <div className="flex items-center justify-center">
                              <span>Приоритет</span>
                              {taskSortField === "priority" && (
                                <span className="ml-1">
                                  {taskSortDirection === "asc" ? (
                                    <ArrowUpIcon className="h-3 w-3 text-gray-500" />
                                  ) : (
                                    <ArrowDownIcon className="h-3 w-3 text-gray-500" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-[10%]"
                            onClick={() => toggleSortDirection("deadline")}
                          >
                            <div className="flex items-center">
                              <span>Дедлайн</span>
                              {taskSortField === "deadline" && (
                                <span className="ml-1">
                                  {taskSortDirection === "asc" ? (
                                    <ArrowUpIcon className="h-3 w-3 text-gray-500" />
                                  ) : (
                                    <ArrowDownIcon className="h-3 w-3 text-gray-500" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]"
                          >
                            Сотрудник
                          </th>
                          <th
                            scope="col"
                            className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]"
                          >
                            План
                          </th>
                          <th
                            scope="col"
                            className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-[90px]"
                          >
                            <span className="sr-only">Действия</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedTasks.map((task) => (
                          <tr
                            key={task.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {task.title}
                              </div>
                            </td>
                            <td className="px-2 py-4">
                              <div className="flex justify-center">
                                <div className="flex items-center justify-center">
                                  {getStatusIcon(task.status)}
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                                <span
                                  className={`text-sm ${
                                    new Date(task.deadline) < new Date() &&
                                    task.status !== "completed"
                                      ? "text-red-600 font-medium"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {formatDate(task.deadline)}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700 truncate">
                                {task.user_id
                                  ? getUserEmailById(task.user_id)
                                  : "—"}
                              </div>
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-700 truncate">
                                {task.plan_id
                                  ? getPlanTitleById(task.plan_id)
                                  : "—"}
                              </div>
                            </td>
                            <td className="px-2 py-4 whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="text-blue-600 hover:text-white hover:bg-blue-500 p-1.5 rounded transition-colors focus:outline-none"
                                  title="Редактировать задачу"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  <span className="sr-only">Редактировать</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-red-600 hover:text-white hover:bg-red-500 p-1.5 rounded transition-colors focus:outline-none"
                                  title="Удалить задачу"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  <span className="sr-only">Удалить</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Планшетный вид - компактная таблица */}
              <div className="hidden sm:block lg:hidden">
                <div className="w-full rounded-lg border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            style={{ width: "50%" }}
                            onClick={() => toggleSortDirection("title")}
                          >
                            <div className="flex items-center">
                              <span>Задача</span>
                              {taskSortField === "title" && (
                                <span className="ml-1">
                                  {taskSortDirection === "asc" ? (
                                    <ArrowUpIcon className="h-3 w-3 text-gray-500" />
                                  ) : (
                                    <ArrowDownIcon className="h-3 w-3 text-gray-500" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                          <th
                            scope="col"
                            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                            style={{ width: "15%" }}
                          >
                            Статус
                          </th>
                          <th
                            scope="col"
                            className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            style={{ width: "20%" }}
                            onClick={() => toggleSortDirection("deadline")}
                          >
                            <span>Срок</span>
                          </th>
                          <th
                            scope="col"
                            className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                            style={{ width: "80px" }}
                          >
                            <span className="sr-only">Действия</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredAndSortedTasks.map((task) => (
                          <tr
                            key={task.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {task.title}
                                </div>
                                <div className="flex items-center mt-1">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full mr-2 ${
                                      task.priority === "high"
                                        ? "bg-red-500"
                                        : task.priority === "medium"
                                        ? "bg-yellow-500"
                                        : "bg-green-500"
                                    }`}
                                    title={`Приоритет: ${
                                      task.priority === "high"
                                        ? "Высокий"
                                        : task.priority === "medium"
                                        ? "Средний"
                                        : "Низкий"
                                    }`}
                                  ></div>
                                  <span className="text-xs text-gray-500 truncate">
                                    {task.user_id
                                      ? getUserEmailById(task.user_id)
                                      : "Не назначено"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3">
                              <div className="flex justify-center">
                                {getStatusIcon(task.status)}
                              </div>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap">
                              <div className="flex items-center justify-center">
                                <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                                <span
                                  className={`text-sm ${
                                    new Date(task.deadline) < new Date() &&
                                    task.status !== "completed"
                                      ? "text-red-600 font-medium"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {formatDate(task.deadline)}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-3 whitespace-nowrap text-right">
                              <div className="flex justify-end space-x-1">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="text-blue-600 hover:text-blue-900 bg-white hover:bg-blue-50 p-1 rounded-full transition-colors"
                                  title="Редактировать задачу"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                  <span className="sr-only">Редактировать</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-red-600 hover:text-red-900 bg-white hover:bg-red-50 p-1 rounded-full transition-colors"
                                  title="Удалить задачу"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  <span className="sr-only">Удалить</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Раздел управления планами адаптации */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h3 className="flex items-center text-xl font-semibold text-gray-700">
              <ClipboardDocumentListIcon className="h-6 w-6 mr-2 text-blue-600" />
              Управление планами адаптации
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={refreshPlansFromDatabase}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                title="Обновить планы из базы данных"
              >
                <ArrowPathIcon className="h-4 w-4 mr-1" />
                Обновить
              </button>
              {hasRole(userRole, ["hr"]) && (
                <>
                  <button
                    onClick={() => {
                      setEditingTemplate(null);
                      setIsTaskTemplateModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <DocumentPlusIcon className="w-4 h-4 mr-2" />
                    Создать шаблон
                  </button>
                  <button
                    onClick={() => {
                      setEditingPlan(null);
                      setIsPlanModalOpen(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <FolderPlusIcon className="w-4 h-4 mr-2" />
                    Создать план
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Раздел с шаблонами задач */}
          {hasRole(userRole, ["hr"]) && (
            <div className="mb-6">
              <div
                className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                onClick={() => setIsTemplatesListOpen(!isTemplatesListOpen)}
              >
                <div className="flex items-center">
                  <DocumentDuplicateIcon className="h-5 w-5 text-purple-600 mr-2" />
                  <h4 className="text-lg font-medium text-gray-700">
                    Шаблоны задач
                  </h4>
                  <span className="ml-3 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    {templates.length} шт.
                  </span>
                </div>
                <ChevronDownIcon
                  className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                    isTemplatesListOpen ? "transform rotate-180" : ""
                  }`}
                />
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isTemplatesListOpen
                    ? "max-h-[2000px] opacity-100 mt-2"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="mt-2 overflow-x-auto rounded-lg border border-gray-200">
                  {templates.length === 0 ? (
                    <div className="bg-white px-4 py-6 text-center text-gray-500">
                      <p>Нет доступных шаблонов задач.</p>
                      <button
                        onClick={() => {
                          setEditingTemplate(null);
                          setIsTaskTemplateModalOpen(true);
                        }}
                        className="mt-3 inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Создать шаблон
                      </button>
                    </div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Название
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Описание
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Роль
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Отдел
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Действия
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <DocumentDuplicateIcon className="h-4 w-4 text-purple-500 mr-2" />
                                <span className="text-sm font-medium text-gray-900">
                                  {template.title}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-500 line-clamp-1">
                                {template.description || "—"}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-gray-500">
                                {template.role || "Любая"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm text-gray-500">
                                {template.department || "Любой"}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => handleEditTemplate(template)}
                                  className="text-blue-600 hover:text-blue-900 focus:outline-none"
                                  title="Редактировать шаблон"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() =>
                                    openDeleteTemplateModal(template)
                                  }
                                  className="text-red-600 hover:text-red-900 focus:outline-none"
                                  title="Удалить шаблон"
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
              </div>
            </div>
          )}

          {/* Список планов адаптации */}
          <div className="mt-4">
            <h4 className="text-lg font-medium text-gray-700 mb-3">
              Планы адаптации
            </h4>

            {plans.length === 0 ? (
              <div className="bg-white px-4 py-6 text-center text-gray-500 border border-gray-200 rounded-lg">
                <p>Нет активных планов адаптации</p>
                {hasRole(userRole, ["hr"]) && (
                  <button
                    onClick={() => {
                      setEditingPlan(null);
                      setIsPlanModalOpen(true);
                    }}
                    className="mt-3 inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Создать план адаптации
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  // Получаем все задачи, связанные с этим планом
                  const planTasks = tasks.filter(
                    (task) => task.plan_id === plan.id
                  );
                  // Считаем процент выполненных задач
                  const completedTasks = planTasks.filter(
                    (task) => task.status === "completed"
                  ).length;
                  const totalTasks = planTasks.length;
                  const progressPercentage =
                    totalTasks > 0
                      ? Math.round((completedTasks / totalTasks) * 100)
                      : 0;

                  // Находим пользователя, связанного с планом (если есть)
                  const assignedUser =
                    planTasks.length > 0 ? planTasks[0].user_id : null;

                  return (
                    <div
                      key={plan.id}
                      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3
                            className="text-lg font-medium text-gray-900 line-clamp-1"
                            title={plan.title}
                          >
                            {plan.title}
                          </h3>
                          {hasRole(userRole, ["hr"]) && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleEditPlan(plan)}
                                className="text-blue-600 hover:text-blue-900 focus:outline-none p-1 hover:bg-blue-50 rounded"
                                title="Редактировать план"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => openDeletePlanModal(plan)}
                                className="text-red-600 hover:text-red-900 focus:outline-none p-1 hover:bg-red-50 rounded"
                                title="Удалить план"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Отображаем роль плана */}
                        <div className="mb-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                              plan.role === "manager"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {plan.role === "manager" ? "Менеджер" : "Сотрудник"}
                          </span>
                        </div>

                        {/* Отображаем описание плана */}
                        {plan.description && (
                          <p
                            className="text-sm text-gray-600 line-clamp-2 mb-3"
                            title={plan.description}
                          >
                            {plan.description}
                          </p>
                        )}

                        {/* Отображаем назначенного пользователя, если есть */}
                        {assignedUser && (
                          <div className="flex items-center mb-3">
                            <UsersIcon className="h-4 w-4 text-gray-500 mr-1" />
                            <span className="text-sm text-gray-600">
                              {getUserEmailById(assignedUser)}
                            </span>
                          </div>
                        )}

                        {/* Прогресс выполнения задач */}
                        <div className="mt-2">
                          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                            <span>
                              {completedTasks} из {totalTasks} задач выполнено
                            </span>
                            <span>{progressPercentage}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Добавление контейнера для уведомлений */}
        <ToastContainer position="bottom-right" />
      </div>
    </div>
  );
}
