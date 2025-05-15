import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CalendarIcon,
  DocumentCheckIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import axios from "axios";
import { getApiBaseUrl } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import Modal from "../components/common/Modal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import PlanForm from "../components/specific/PlanForm";
import PlanEditModal from "../components/specific/PlanEditModal";
import EditableCard from "../components/specific/EditableCard";
import {
  Button,
  Card,
  FormField,
  SelectField,
  CARD_STYLES,
} from "../config/theme";

const Plans = () => {
  usePageTitle("Планы адаптации");

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const apiUrl = getApiBaseUrl();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Не авторизован");

      const response = await axios.get(`${apiUrl}/plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPlans(response.data);
      setError(null);
    } catch (err) {
      setError(
        "Ошибка при загрузке планов адаптации: " +
          (err.response?.data?.detail || err.message)
      );
      toast.error("Не удалось загрузить планы адаптации");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    setEditPlan(null);
    setShowForm(true);
  };

  const handleEditPlan = (plan) => {
    setEditPlan(plan);
    setShowForm(true);
  };

  const handleDeleteClick = (plan) => {
    setPlanToDelete(plan);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${apiUrl}/plans/${planToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPlans((prevPlans) =>
        prevPlans.filter((p) => p.id !== planToDelete.id)
      );

      toast.success("План адаптации успешно удален");
      setPlanToDelete(null);
      setShowDeleteConfirm(false);
    } catch (err) {
      toast.error(
        "Ошибка при удалении плана: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  const handleSavePlan = async (planData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Не авторизован");

      let response;

      if (editPlan) {
        // Обновление существующего плана
        response = await axios.put(`${apiUrl}/plans/${editPlan.id}`, planData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPlans((prevPlans) =>
          prevPlans.map((p) => (p.id === editPlan.id ? response.data : p))
        );

        toast.success("План адаптации успешно обновлен");
      } else {
        // Создание нового плана
        response = await axios.post(`${apiUrl}/plans`, planData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setPlans((prevPlans) => [...prevPlans, response.data]);
        toast.success("План адаптации успешно создан");
      }

      setShowForm(false);
      setEditPlan(null);
    } catch (err) {
      toast.error(
        "Ошибка при сохранении плана: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  // Фильтрация планов
  const filteredPlans = plans.filter((plan) => {
    // Поиск по названию и описанию
    const matchesSearch =
      !searchTerm ||
      plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Фильтр по статусу
    const matchesStatus =
      statusFilter === "all" || plan.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Получение статусов для фильтра
  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Активные";
      case "completed":
        return "Завершенные";
      case "draft":
        return "Черновики";
      default:
        return "Все статусы";
    }
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return "Не указана";
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Получение процента выполнения плана
  const getCompletionPercentage = (plan) => {
    if (!plan.tasks || plan.tasks.length === 0) return 0;

    const completedTasks = plan.tasks.filter(
      (task) => task.status === "completed"
    ).length;
    return Math.round((completedTasks / plan.tasks.length) * 100);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-600">Планы адаптации</h1>
          <p className="mt-1 text-gray-500">
            Управление планами адаптации сотрудников
          </p>
        </div>

        <Button
          onClick={handleCreatePlan}
          variant="primary"
          className="inline-flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Создать план
        </Button>
      </div>

      {/* Панель фильтров */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Поиск */}
          <FormField
            label="Поиск"
            id="search"
            name="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по названию или описанию..."
            leadingIcon={
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            }
          />

          {/* Фильтр по статусу */}
          <SelectField
            label="Статус"
            id="status"
            name="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "Все статусы" },
              { value: "draft", label: "Черновики" },
              { value: "active", label: "Активные" },
              { value: "completed", label: "Завершенные" },
            ]}
          />
        </div>
      </Card>

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
      ) : filteredPlans.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center shadow">
          <div className="flex flex-col items-center">
            <div className="bg-blue-100 rounded-full p-3 mb-4">
              <PlusIcon className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {plans.length === 0
                ? "Планы адаптации не найдены"
                : "Нет планов, соответствующих фильтрам"}
            </h3>
            <p className="text-gray-500 mb-4">
              {plans.length === 0
                ? "Создайте первый план адаптации для сотрудника"
                : "Попробуйте изменить параметры фильтрации"}
            </p>
            {plans.length === 0 && (
              <button
                onClick={handleCreatePlan}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Создать план
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <EditableCard
              key={plan.id}
              className="overflow-hidden"
              onClick={() => handleEditPlan(plan)}
            >
              <div className="px-4 py-5 sm:p-6">
                {/* Заголовок и действия */}
                <div className="flex justify-between items-start">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
                    {plan.title}
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEditPlan(plan)}
                      variant="icon"
                      title="Редактировать план"
                    >
                      <PencilIcon className="h-5 w-5 text-blue-600" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteClick(plan)}
                      variant="icon"
                      title="Удалить план"
                    >
                      <TrashIcon className="h-5 w-5 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Статус */}
                <div className="mt-1 mb-3">
                  {plan.status === "draft" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Черновик
                    </span>
                  )}
                  {plan.status === "active" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Активный
                    </span>
                  )}
                  {plan.status === "completed" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Завершен
                    </span>
                  )}
                </div>

                {/* Описание */}
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>

                {/* Информация о сотруднике */}
                {plan.employee && (
                  <div className="mt-4 flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-700">
                      {plan.employee.name || plan.employee.email}
                    </span>
                  </div>
                )}

                {/* Даты */}
                <div className="mt-2 flex items-center">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">
                    {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                  </span>
                </div>

                {/* Прогресс выполнения */}
                <div className="mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-blue-600">
                      Прогресс
                    </span>
                    <span className="text-xs font-medium text-blue-600">
                      {getCompletionPercentage(plan)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${getCompletionPercentage(plan)}%` }}
                    />
                  </div>
                </div>

                {/* Количество задач */}
                <div className="mt-4 flex items-center">
                  <DocumentCheckIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">
                    {plan.tasks?.length || 0} задач
                  </span>
                </div>
              </div>
            </EditableCard>
          ))}
        </div>
      )}

      {/* Модальное окно формы плана */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditPlan(null);
        }}
        title={editPlan ? "Редактирование плана" : "Создание плана адаптации"}
        size="lg"
      >
        <PlanForm
          plan={editPlan}
          onSave={handleSavePlan}
          onCancel={() => {
            setShowForm(false);
            setEditPlan(null);
          }}
        />
      </Modal>

      {/* Диалог подтверждения удаления */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Удаление плана адаптации"
        message={`Вы действительно хотите удалить план "${planToDelete?.title}"? Это действие нельзя отменить.`}
        confirmText="Удалить"
        cancelText="Отмена"
        isDangerous={true}
      />
    </div>
  );
};

export default Plans;
