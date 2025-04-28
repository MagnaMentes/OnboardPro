import { useState, useEffect } from "react";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { getApiBaseUrl } from "../config/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ManagerDashboard() {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [tasks, setTasks] = useState([]);
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
  const [newPlan, setNewPlan] = useState({
    title: "",
    description: "",
    role: "employee",
  });
  const [editingPlan, setEditingPlan] = useState(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  const apiBaseUrl = getApiBaseUrl();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

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
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiBaseUrl]);

  // Обработчики задач
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({ ...prev, [name]: value }));
  };

  // Обработчики планов
  const handlePlanInputChange = (e) => {
    const { name, value } = e.target;
    setNewPlan((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditPlanInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPlan((prev) => ({ ...prev, [name]: value }));
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const taskData = {
        ...newTask,
        plan_id: parseInt(newTask.plan_id),
        user_id: parseInt(newTask.user_id),
        deadline: new Date(newTask.deadline).toISOString(),
      };

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
      setNewTask({
        plan_id: "",
        user_id: "",
        title: "",
        description: "",
        priority: "medium",
        deadline: new Date().toISOString().split("T")[0],
      });
      setIsTaskModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    setIsCreatingPlan(true);
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
        body: JSON.stringify(newPlan),
      });

      if (!response.ok) {
        throw new Error("Ошибка при создании плана");
      }

      const createdPlan = await response.json();
      setPlans((prev) => [...prev, createdPlan]);
      setNewPlan({
        title: "",
        description: "",
        role: "employee",
      });
      setError(null);
      setIsPlanModalOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreatingPlan(false);
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan({ ...plan });
    setIsEditPlanModalOpen(true);
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    setIsEditingPlan(true);
    try {
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
        body: JSON.stringify({
          title: editingPlan.title,
          description: editingPlan.description,
          role: editingPlan.role,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Ошибка при обновлении плана");
      }

      const updatedPlan = await response.json();

      // Обновление локального состояния
      setPlans((prev) =>
        prev.map((plan) => (plan.id === updatedPlan.id ? updatedPlan : plan))
      );

      // Проверка, что данные действительно обновились
      console.log("План успешно обновлен в базе данных:", updatedPlan);
      toast.success(`План "${updatedPlan.title}" успешно обновлен`);

      setError(null);
      setIsEditPlanModalOpen(false);
    } catch (err) {
      console.error("Ошибка при обновлении плана:", err);
      toast.error(err.message);
      setError(err.message);
    } finally {
      setIsEditingPlan(false);
    }
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

      // Проверка, что план действительно удалился из базы
      console.log(`План с ID ${planToDelete.id} успешно удален из базы данных`);
      toast.success(`План "${planToDelete.title}" успешно удален`);

      setIsDeletePlanModalOpen(false);
      setPlanToDelete(null);
    } catch (err) {
      console.error("Ошибка при удалении плана:", err);
      toast.error(err.message);
      setError(err.message);
    }
  };

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
    } catch (err) {
      setError(err.message);
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
    return user ? user.email : `Пользователь #${userId}`;
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
      console.log("Список планов обновлен из базы данных:", plansData);
    } catch (err) {
      console.error("Ошибка при обновлении списка планов:", err);
    }
  };

  // Модальное окно для создания задачи
  const TaskModal = () => {
    if (!isTaskModalOpen) return null;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setIsTaskModalOpen(false)}
          ></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-3xl max-h-[90vh] overflow-y-auto z-10">
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-blue-900">
                Создать новую задачу
              </h3>
            </div>

            <div className="p-5">
              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="user_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Сотрудник
                    </label>
                    <select
                      id="user_id"
                      name="user_id"
                      value={newTask.user_id}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Выберите сотрудника</option>
                      {users
                        .filter((user) => user.role === "employee")
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.email} ({user.department || "Без отдела"})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="plan_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      План адаптации
                    </label>
                    <select
                      id="plan_id"
                      name="plan_id"
                      value={newTask.plan_id}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="">Выберите план</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.title} ({plan.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Название задачи
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={newTask.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="priority"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Приоритет
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={newTask.priority}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="deadline"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Срок выполнения
                    </label>
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={newTask.deadline}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Описание
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[100px]"
                  />
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Создать задачу
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Модальное окно для создания плана
  const PlanModal = () => {
    if (!isPlanModalOpen) return null;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setIsPlanModalOpen(false)}
          ></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-blue-900">
                Создать новый план адаптации
              </h3>
            </div>

            <div className="p-5">
              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="plan_title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Название плана
                    </label>
                    <input
                      id="plan_title"
                      name="title"
                      type="text"
                      value={newPlan.title}
                      onChange={handlePlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="plan_role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Роль
                    </label>
                    <select
                      id="plan_role"
                      name="role"
                      value={newPlan.role}
                      onChange={handlePlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Менеджер</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="plan_description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Описание
                    </label>
                    <textarea
                      id="plan_description"
                      name="description"
                      value={newPlan.description}
                      onChange={handlePlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[80px]"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsPlanModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isCreatingPlan}
                  >
                    {isCreatingPlan ? "Создание..." : "Создать план"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Модальное окно для редактирования плана
  const EditPlanModal = () => {
    if (!isEditPlanModalOpen || !editingPlan) return null;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setIsEditPlanModalOpen(false)}
          ></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-2xl max-h-[90vh] overflow-y-auto z-10">
            <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-blue-900">
                Редактировать план адаптации
              </h3>
            </div>

            <div className="p-5">
              <form onSubmit={handleUpdatePlan} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="edit_plan_title"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Название плана
                    </label>
                    <input
                      id="edit_plan_title"
                      name="title"
                      type="text"
                      value={editingPlan.title}
                      onChange={handleEditPlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit_plan_role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Роль
                    </label>
                    <select
                      id="edit_plan_role"
                      name="role"
                      value={editingPlan.role}
                      onChange={handleEditPlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    >
                      <option value="employee">Сотрудник</option>
                      <option value="manager">Менеджер</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label
                      htmlFor="edit_plan_description"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Описание
                    </label>
                    <textarea
                      id="edit_plan_description"
                      name="description"
                      value={editingPlan.description}
                      onChange={handleEditPlanInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[80px]"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditPlanModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={isEditingPlan}
                  >
                    {isEditingPlan ? "Сохранение..." : "Сохранить план"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Модальное окно подтверждения удаления плана
  const DeletePlanModal = () => {
    if (!isDeletePlanModalOpen || !planToDelete) return null;

    const relatedTasks = tasks.filter(
      (task) => task.plan_id === planToDelete.id
    );
    const hasTasks = relatedTasks.length > 0;

    return (
      <div className="fixed inset-0 overflow-y-auto z-50">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div
            className="fixed inset-0 bg-black bg-opacity-30 transition-opacity"
            onClick={() => setIsDeletePlanModalOpen(false)}
          ></div>

          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-md max-h-[90vh] overflow-y-auto z-10">
            <div className="bg-red-50 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-red-900">
                Удаление плана адаптации
              </h3>
            </div>

            <div className="p-5">
              {hasTasks ? (
                <div>
                  <p className="text-gray-600 mb-4">
                    Невозможно удалить план "{planToDelete.title}", так как с
                    ним связано {relatedTasks.length} задач.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Сначала удалите все связанные задачи, затем повторите
                    попытку.
                  </p>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsDeletePlanModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Закрыть
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 mb-4">
                    Вы действительно хотите удалить план "{planToDelete.title}"?
                  </p>
                  <p className="text-red-600 text-sm mb-4">
                    Это действие нельзя отменить.
                  </p>
                  <div className="mt-6 flex justify-end space-x-3">
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
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Удалить план
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-blue-600">Панель менеджера</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Ошибка!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Модальные окна */}
      <TaskModal />
      <PlanModal />
      <EditPlanModal />
      <DeletePlanModal />

      {/* Раздел управления задачами */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-700">
            Управление задачами
          </h3>
          <button
            onClick={() => setIsTaskModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Создать новую задачу
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-500">Нет активных задач</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Задача
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Сотрудник
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    План
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Приоритет
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Срок
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Статус
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
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {task.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {task.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getUserEmailById(task.user_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getPlanTitleById(task.plan_id)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          task.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : task.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(task.deadline)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          task.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : task.status === "in-progress"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-600 hover:text-red-900 focus:outline-none"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Раздел управления планами */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-700">
            Управление планами адаптации
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={refreshPlansFromDatabase}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              title="Обновить список планов из базы данных"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Обновить
            </button>
            <button
              onClick={() => setIsPlanModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Создать план адаптации
            </button>
          </div>
        </div>

        {plans.length === 0 ? (
          <div className="bg-gray-50 p-4 rounded">
            <p className="text-gray-500">Нет активных планов адаптации</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Описание
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Роль
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Количество задач
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
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {plan.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">
                        {plan.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${
                          plan.role === "manager"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {plan.role === "manager" ? "Менеджер" : "Сотрудник"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {
                          tasks.filter((task) => task.plan_id === plan.id)
                            .length
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="text-blue-600 hover:text-blue-900 focus:outline-none"
                          title="Редактировать план"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => openDeletePlanModal(plan)}
                          className="text-red-600 hover:text-red-900 focus:outline-none"
                          title="Удалить план"
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

      {/* Добавление контейнера для уведомлений */}
      <ToastContainer position="bottom-right" />
    </div>
  );
}
