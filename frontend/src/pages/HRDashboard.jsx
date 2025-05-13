import { useState, useEffect, useMemo, useCallback } from "react";
import { apiRequest } from "../config/api";
import usePageTitle from "../utils/usePageTitle";
import webSocketService from "../services/WebSocketService";
import {
  UsersIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import AnalyticsChart from "../components/specific/AnalyticsChart";
import CalendarView from "../components/specific/CalendarView";
import Table from "../components/common/Table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Импортируем компоненты и стили из нашей системы темы
import { Button } from "../config/theme";

// Импортируем выделенные компоненты HR Dashboard
import AnalyticsTabs from "../components/specific/hr/AnalyticsTabs";
import { StatCard } from "../components/specific/hr/StatCard";
import {
  FilterPanel,
  ChartFilterPanel,
} from "../components/specific/hr/FilterPanels";
import KPIPanel from "../components/specific/hr/KPIPanel";
import InProgressTasksList from "../components/specific/hr/InProgressTasksList";

// Импортируем вспомогательные утилиты для обработки данных и управления WebSocket
import {
  verifyAndFixAnalyticsData,
  prepareChartData,
  extractKPIData,
} from "../utils/hrAnalyticsHelpers";
import { setupHRWebSocketHandlers } from "../utils/hrWebSocketHelpers";

export default function HRDashboard() {
  usePageTitle("Панель HR");

  const [analytics, setAnalytics] = useState(null);
  const [previousAnalytics, setPreviousAnalytics] = useState(null);
  const [taskAnalytics, setTaskAnalytics] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState(() => {
    const savedFilters = localStorage.getItem("hrDashboardFilters");
    if (savedFilters) {
      try {
        return JSON.parse(savedFilters);
      } catch (e) {
        console.error("Ошибка при парсинге сохраненных фильтров:", e);
      }
    }
    return {
      startDate: "",
      endDate: "",
      department: "",
      compareWithPrevious: true,
    };
  });
  const [lastUpdate, setLastUpdate] = useState(null);
  const [activeTab, setActiveTab] = useState("analytics");
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [showChartFiltersPanel, setShowChartFiltersPanel] = useState(false);
  const [hasRealtimeUpdates, setHasRealtimeUpdates] = useState(false);
  const [wsDisabled] = useState(false); // Флаг для отключения WebSocket

  useEffect(() => {
    localStorage.setItem("hrDashboardFilters", JSON.stringify(filters));
  }, [filters]);

  // Функция для обновления аналитических данных с сервера
  const fetchUpdatedAnalytics = useCallback(async () => {
    try {
      console.log("Запрашиваем свежие данные аналитики от API...");
      // Формируем параметры запроса
      let queryParams = [];

      if (filters.startDate) {
        queryParams.push(`start_date=${filters.startDate}`);
      }

      if (filters.endDate) {
        queryParams.push(`end_date=${filters.endDate}`);
      }

      if (filters.department) {
        queryParams.push(
          `department=${encodeURIComponent(filters.department)}`
        );
      }

      if (filters.compareWithPrevious) {
        queryParams.push("include_previous=true");
      }

      // Добавляем метку времени для предотвращения кэширования
      queryParams.push(`_t=${Date.now()}`);

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      // Используем централизованный API клиент вместо прямого fetch
      const [analyticsResponse, tasksResponse, usersResponse] =
        await Promise.all([
          apiRequest(`/analytics/summary${queryString}`), // Используем правильный путь без дублирования /api
          apiRequest("/tasks"),
          apiRequest("/users"),
        ]);

      // Проверяем и исправляем данные аналитики перед установкой
      const fixedAnalyticsResponse =
        verifyAndFixAnalyticsData(analyticsResponse);

      // Устанавливаем проверенные и исправленные данные
      setAnalytics(fixedAnalyticsResponse);
      setPreviousAnalytics(fixedAnalyticsResponse.previous); // Устанавливаем, если есть

      // Для совместимости с предыдущим кодом
      const taskAnalyticsData = {
        summary: {
          tasksByPriority: fixedAnalyticsResponse.task_stats?.priority || {},
          departmentStats:
            fixedAnalyticsResponse.task_stats?.department_stats || {}, // ИЗМЕНЕНО
        },
      };

      setTaskAnalytics(taskAnalyticsData);

      // Для user_analytics формируем данные на основе пользователей
      const userAnalyticsData = {
        users: usersResponse.map((user) => ({
          id: user.id,
          name:
            `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
            user.email,
          department: user.department || "Не указан",
          completion_rate: 0, // Заполняем нулями для совместимости
          tasks_completed: 0,
          tasks_total: 0,
          onboarding_time: null,
          start_date: user.created_at,
        })),
      };

      setUserAnalytics(userAnalyticsData);
      setTasks(tasksResponse);

      console.log("Установлены данные аналитики:", fixedAnalyticsResponse);
      console.log("Для визуализации используется структура:", {
        task_stats: fixedAnalyticsResponse.task_stats,
        feedback_stats: fixedAnalyticsResponse.feedback_stats,
      });

      return {
        analytics: fixedAnalyticsResponse,
        previousAnalytics: fixedAnalyticsResponse.previous,
        taskAnalytics: taskAnalyticsData,
        userAnalytics: userAnalyticsData,
      };
    } catch (error) {
      console.error("Ошибка при загрузке аналитики:", error);
      setError(error.message);
      throw error;
    }
  }, [filters]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        // Используем централизованный API клиент вместо прямого fetch
        const data = await apiRequest("/users/departments");
        setDepartments(data.departments || []);
      } catch (error) {
        console.error("Ошибка при загрузке отделов:", error);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await fetchUpdatedAnalytics();
        const now = new Date();
        setLastUpdate(now);
        setIsRefreshing(false);
      } catch (err) {
        console.error("Ошибка при загрузке данных:", err);
        setError(err.message || "Не удалось загрузить данные");
        setIsRefreshing(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters, isRefreshing, fetchUpdatedAnalytics]);

  // Инициализация WebSocket соединения
  useEffect(() => {
    if (wsDisabled) {
      return;
    }

    // Получаем JWT токен из localStorage
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("[WebSocket] Отсутствует токен аутентификации");
      return;
    }

    // Импортируем и используем вспомогательную функцию setupHRWebSocketHandlers из утилиты
    const {
      handleAnalyticsUpdate,
      handleTaskStatusChanged,
      handleConnectionEstablished,
      handleError,
      cleanupWebSocket,
    } = setupHRWebSocketHandlers(
      webSocketService,
      setAnalytics,
      setPreviousAnalytics,
      setTaskAnalytics,
      setUserAnalytics,
      setHasRealtimeUpdates,
      setLastUpdate,
      toast
    );

    // Подписываемся на WebSocket события
    webSocketService.onAnalyticsUpdate(handleAnalyticsUpdate);
    webSocketService.onTaskStatusChanged(handleTaskStatusChanged);
    webSocketService.onConnectionEstablished(handleConnectionEstablished);
    webSocketService.onError(handleError);

    // Инициализируем соединение с передачей токена
    webSocketService
      .connect(token)
      .then(() => {
        console.log("[HR Dashboard] WebSocket соединение инициализировано");
      })
      .catch((err) => {
        console.error("[HR Dashboard] Ошибка подключения WebSocket:", err);
        toast.error("Не удалось подключиться к серверу аналитики");
      });

    // Очистка при размонтировании
    return cleanupWebSocket;
  }, [wsDisabled, fetchUpdatedAnalytics]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  };

  const refreshData = () => {
    setIsRefreshing(true);
    toast.info("Обновление данных...");
  };

  const handleExportCSV = async () => {
    // ... существующий код ...
  };

  // Эта функция теперь реализована в StatCard.jsx

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Теперь импортируем вместо локального определения

  const chartData = useMemo(() => {
    // Используем вспомогательную функцию для подготовки данных графика
    return prepareChartData(analytics, taskAnalytics);
  }, [analytics, taskAnalytics]);

  const kpiData = useMemo(() => {
    // Используем вспомогательную функцию для извлечения KPI данных
    return extractKPIData(analytics, previousAnalytics);
  }, [analytics, previousAnalytics]);

  const usersTableData = useMemo(() => {
    if (!userAnalytics || !userAnalytics.users) return [];

    // ... существующий код ...

    return [];
  }, [userAnalytics]);

  const usersTableColumns = [
    {
      header: "Сотрудник",
      accessor: "name",
    },
    {
      header: "Отдел",
      accessor: "department",
    },
    {
      header: "% Выполнения",
      accessor: "completion_rate",
      formatter: (value) => `${Math.round((value || 0) * 100)}%`,
    },
    {
      header: "Задачи",
      accessor: "tasks_completed",
      formatter: (value, row) => `${value} / ${row.tasks_total}`,
    },
    {
      header: "Время онбординга",
      accessor: "onboarding_time",
      formatter: (value) => (value ? `${value} дн.` : "В процессе"),
    },
    {
      header: "Дата начала",
      accessor: "start_date",
      formatter: (value) =>
        value ? new Date(value).toLocaleDateString("ru-RU") : "-",
    },
  ];

  // Флаг для определения, используются ли кэшированные данные
  useMemo(() => {
    return analytics?.metadata?.version !== undefined;
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !analytics && !taskAnalytics) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong className="font-bold">Ошибка!</strong>
        <span className="block sm:inline"> {error}</span>
        <button
          onClick={refreshData}
          className="mt-2 px-3 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
        >
          Повторить
        </button>
      </div>
    );
  }

  // Получаем базовые данные статистики задач с проверкой и коррекцией
  const taskStats = analytics?.task_stats || {
    total: 0,
    completed: 0,
    completion_rate: 0,
    in_progress: 0,
    in_progress_tasks_details: [],
    priority: {
      low: { total: 0, completed: 0 },
      medium: { total: 0, completed: 0 },
      high: { total: 0, completed: 0 },
    },
  };

  const prevTaskStats = previousAnalytics?.task_stats;

  const feedbackStats = analytics?.feedback_stats || {
    total: 0,
    avg_per_user: 0,
  };

  const prevFeedbackStats = previousAnalytics?.feedback_stats;

  const dataWasTruncated = taskAnalytics?.metadata?.truncated;

  return (
    <div className="space-y-6">
      {/* Скрытый элемент для отслеживания изменений в реальном времени */}
      <div
        id="websocket-update-trigger"
        data-value="0"
        style={{ display: "none" }}
        data-last-update={lastUpdate?.toISOString()}
      />

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
      />

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-blue-600">Панель HR</h2>
          <p className="mt-1 text-gray-500">
            Аналитика и управление процессами адаптации сотрудников
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            variant="secondary"
            size="sm"
            className="flex items-center"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Фильтры
          </Button>

          {lastUpdate && (
            <span className="hidden sm:inline-block text-xs text-gray-500 mr-3">
              Обновлено: {formatDate(lastUpdate)}
              {hasRealtimeUpdates && " (real-time)"}
            </span>
          )}
          <Button
            onClick={refreshData}
            disabled={isRefreshing}
            variant="secondary"
            size="sm"
            className="flex items-center"
          >
            <ArrowPathIcon
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Обновить
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {(filters.startDate || filters.endDate || filters.department) && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
            <p className="text-xs sm:text-sm text-blue-700">
              <strong>Фильтры:</strong>
              {filters.startDate && ` Начало: ${filters.startDate}`}
              {filters.endDate && ` Окончание: ${filters.endDate}`}
              {filters.department && ` Отдел: ${filters.department}`}
            </p>
          </div>
        )}

        {showFiltersPanel && (
          <FilterPanel
            filters={filters}
            departments={departments}
            onFilterChange={handleFilterChange}
            onClose={() => setShowFiltersPanel(false)}
            onApply={() => {
              refreshData();
              setShowFiltersPanel(false);
            }}
            onReset={() =>
              handleFilterChange({
                startDate: "",
                endDate: "",
                department: "",
              })
            }
          />
        )}

        {dataWasTruncated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md flex items-center p-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-xs sm:text-sm text-yellow-700">
              Некоторые данные были сокращены из-за большого объема. Для
              получения полных данных используйте экспорт в CSV.
            </p>
          </div>
        )}

        <KPIPanel
          kpiData={kpiData}
          filters={filters}
          taskStats={taskStats}
          prevTaskStats={prevTaskStats}
        />

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <AnalyticsTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="p-4">
            {activeTab === "analytics" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                  <StatCard
                    title="Всего задач"
                    value={taskStats.total}
                    icon={DocumentTextIcon}
                    color="blue"
                    prevValue={prevTaskStats?.total}
                  />

                  <StatCard
                    title="Задачи в процессе"
                    value={taskStats.in_progress || 0}
                    icon={ClockIcon}
                    color="yellow"
                    prevValue={prevTaskStats?.in_progress}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
                  <StatCard
                    title="Выполнено задач"
                    value={taskStats.completed}
                    icon={CheckCircleIcon}
                    color="green"
                    prevValue={prevTaskStats?.completed}
                  />
                  <StatCard
                    title="Отзывов"
                    value={feedbackStats.total}
                    icon={ChatBubbleLeftRightIcon}
                    color="yellow"
                    prevValue={prevFeedbackStats?.total}
                  />
                  <StatCard
                    title="Отзывов на пользователя"
                    value={feedbackStats.avg_per_user.toFixed(1)}
                    icon={UsersIcon}
                    color="purple"
                    prevValue={prevFeedbackStats?.avg_per_user}
                  />
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                  <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4">
                    Процент выполнения задач
                  </h3>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                          Прогресс
                        </span>
                      </div>
                      <div className="text-right flex items-center">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                          {Math.round(taskStats.completion_rate * 100)}%
                        </span>
                        {prevTaskStats?.completion_rate !== undefined &&
                          filters.compareWithPrevious && (
                            <div
                              className={`ml-2 flex items-center ${
                                taskStats.completion_rate >
                                prevTaskStats.completion_rate
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              <span className="text-xs">
                                {taskStats.completion_rate >
                                prevTaskStats.completion_rate
                                  ? "+"
                                  : ""}
                                {Math.round(
                                  (taskStats.completion_rate -
                                    prevTaskStats.completion_rate) *
                                    100
                                )}
                                %
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                      <div
                        style={{
                          width: `${Math.round(
                            taskStats.completion_rate * 100
                          )}%`,
                        }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Компонент для отображения задач в процессе выполнения */}
                {taskStats?.in_progress_tasks_details && (
                  <InProgressTasksList
                    inProgressTasks={taskStats.in_progress_tasks_details}
                  />
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleExportCSV}
                    variant="success"
                    size="md"
                    className="flex items-center"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Экспорт аналитики в CSV
                  </Button>
                </div>

                {chartData && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center">
                        <ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-500" />
                        Аналитические графики
                      </h3>
                      <Button
                        onClick={() =>
                          setShowChartFiltersPanel(!showChartFiltersPanel)
                        }
                        variant="secondary"
                        size="sm"
                        className="flex items-center"
                      >
                        <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
                        Фильтры
                      </Button>
                    </div>

                    {showChartFiltersPanel && (
                      <ChartFilterPanel
                        filters={filters}
                        departments={departments}
                        onFilterChange={handleFilterChange}
                        onClose={() => setShowChartFiltersPanel(false)}
                        onApply={() => {
                          refreshData();
                          setShowChartFiltersPanel(false);
                        }}
                        onReset={() =>
                          handleFilterChange({
                            startDate: "",
                            endDate: "",
                            department: "",
                          })
                        }
                      />
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                      <AnalyticsChart
                        title="Распределение задач по приоритетам"
                        type="pie"
                        labels={chartData.priority.labels}
                        datasets={chartData.priority.datasets}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        departments={departments}
                        maxPoints={10}
                      />

                      <AnalyticsChart
                        title="Распределение задач по отделам"
                        type="bar"
                        labels={chartData.department.labels}
                        datasets={chartData.department.datasets}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        departments={departments}
                        maxPoints={12}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "calendar" && (
              <CalendarView tasks={tasks} departments={departments} />
            )}

            {activeTab === "reports" && (
              <Table
                id="hr-users-report"
                title="Прогресс сотрудников по онбордингу"
                data={usersTableData}
                columns={usersTableColumns}
                enableExport={true}
                exportUrl="http://localhost:8000/analytics/users"
                filters={filters}
                pagination={true}
                pageSize={10}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
