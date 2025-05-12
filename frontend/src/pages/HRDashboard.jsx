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
  CalendarDaysIcon,
  ChartPieIcon,
  TrophyIcon,
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
  AdjustmentsHorizontalIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AnalyticsChart from "../components/specific/AnalyticsChart";
import CalendarView from "../components/specific/CalendarView";
import Table from "../components/common/Table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Импортируем компоненты и стили из нашей системы темы
import { Button, Card, FORM_STYLES } from "../config/theme";

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

      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      // Используем централизованный API клиент вместо прямого fetch
      const [analyticsResponse, tasksResponse, usersResponse] =
        await Promise.all([
          apiRequest(`/api/analytics/summary${queryString}`), // Исправляем путь, добавляя префикс /api
          apiRequest("/tasks"),
          apiRequest("/users"),
        ]);

      // Устанавливаем аналитику напрямую из ответа API
      setAnalytics(analyticsResponse); // API возвращает аналитику напрямую, без обертки current
      setPreviousAnalytics(analyticsResponse.previous); // Устанавливаем, если есть

      // Для совместимости с предыдущим кодом
      const taskAnalyticsData = {
        summary: {
          tasksByPriority: analyticsResponse.task_stats?.priority || {},
          departmentStats: {},
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

      console.log("Установлены данные аналитики:", analyticsResponse);
      console.log("Для визуализации используется структура:", {
        task_stats: analyticsResponse.task_stats,
        feedback_stats: analyticsResponse.feedback_stats,
      });

      return {
        analytics: analyticsResponse,
        previousAnalytics: analyticsResponse.previous,
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

    // Обработчик сообщений от WebSocket для аналитики
    const handleAnalyticsUpdate = (data) => {
      console.log("Получено WebSocket обновление аналитики:", data);

      // Проверяем, что данные содержат правильную структуру
      if (!data.data) {
        console.error("Неверный формат данных аналитики от WebSocket:", data);
        return;
      }

      // Обновляем данные аналитики
      if (data.data.current) {
        setAnalytics(data.data.current);

        // Форматируем данные для taskAnalytics в правильном формате
        // Это важно для корректного отображения графиков
        const analyticsResponse = data.data.current;

        const taskAnalyticsData = {
          summary: {
            tasksByPriority: analyticsResponse.task_stats?.priority || {},
            departmentStats: analyticsResponse.department_stats || {},
          },
        };

        setTaskAnalytics(taskAnalyticsData);
      }

      if (data.data.previous) {
        setPreviousAnalytics(data.data.previous);
      }

      if (data.data.user_analytics) {
        setUserAnalytics(data.data.user_analytics);
      }

      // Устанавливаем флаг обновления в реальном времени
      setHasRealtimeUpdates(true);
      setLastUpdate(new Date());

      // Показываем уведомление пользователю
      toast.info("Данные аналитики обновлены в реальном времени");
    };

    // Обработчик изменения статуса задачи
    const handleTaskStatusChanged = (data) => {
      console.log("Получено уведомление об изменении статуса задачи:", data);
      // При изменении статуса задачи запрашиваем свежие данные
      fetchUpdatedAnalytics().catch(console.error);
    };

    // Обработчик установления соединения
    const handleConnectionEstablished = () => {
      console.log("WebSocket соединение установлено");

      // После успешного подключения запрашиваем актуальные данные аналитики
      setTimeout(() => {
        webSocketService.requestAnalyticsUpdate();
      }, 500); // Небольшая задержка для стабильности
    };

    // Обработчик ошибок WebSocket
    const handleError = (error) => {
      console.error("WebSocket ошибка:", error);
      toast.error("Ошибка WebSocket соединения: " + error.message);
    };

    // Подписываемся на WebSocket события, используя правильные методы API
    webSocketService.onAnalyticsUpdate(handleAnalyticsUpdate);
    webSocketService.onTaskStatusChanged(handleTaskStatusChanged);
    webSocketService.onConnectionEstablished(handleConnectionEstablished);
    webSocketService.onError(handleError);

    // Инициализируем соединение с передачей токена
    webSocketService
      .connect(token)
      .then(() => {
        console.log("WebSocket соединение инициализировано");
      })
      .catch((err) => {
        console.error("Ошибка подключения WebSocket:", err);
        toast.error("Не удалось подключиться к серверу аналитики");
      });

    // Очистка при размонтировании
    return () => {
      webSocketService.removeListener(
        "analytics_update",
        handleAnalyticsUpdate
      );
      webSocketService.removeListener(
        "task_status_changed",
        handleTaskStatusChanged
      );
      webSocketService.removeListener(
        "connection_established",
        handleConnectionEstablished
      );
      webSocketService.removeListener("error", handleError);
      webSocketService.disconnect();
    };
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

  const calculatePercentChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    if (previous === null || previous === undefined) return null;
    return ((current - previous) / previous) * 100;
  };

  const COLOR_CLASSES = {
    blue: {
      container:
        "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-blue-500",
      iconBg: "bg-blue-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
      iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-blue-500",
    },
    green: {
      container:
        "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-green-500",
      iconBg: "bg-green-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
      iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-green-500",
    },
    yellow: {
      container:
        "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-yellow-500",
      iconBg: "bg-yellow-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
      iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-yellow-500",
    },
    purple: {
      container:
        "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-purple-500",
      iconBg: "bg-purple-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
      iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-purple-500",
    },
    red: {
      container:
        "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-red-500",
      iconBg: "bg-red-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
      iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-red-500",
    },
    default: {
      container:
        "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-gray-500",
      iconBg: "bg-gray-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
      iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-gray-500",
    },
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle = null,
    prevValue = null,
  }) => {
    const Icon = icon;
    const classes = COLOR_CLASSES[color] || COLOR_CLASSES.default;

    const percentChange =
      prevValue !== null ? calculatePercentChange(value, prevValue) : null;
    const isPositiveTrend = percentChange > 0;
    const showTrend = percentChange !== null;

    const isTrendPositive = title.includes("онбординг")
      ? !isPositiveTrend
      : isPositiveTrend;
    const trendColor = isTrendPositive ? "text-green-500" : "text-red-500";
    const TrendIcon = isTrendPositive
      ? ArrowTrendingUpIcon
      : ArrowTrendingDownIcon;

    return (
      <div className={classes.container}>
        <div className="flex items-center">
          <div className={classes.iconBg}>
            <Icon className={classes.iconColor} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">
              {title}
            </p>
            <div className="flex items-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-800">
                {value}
              </p>
              {showTrend && (
                <div className={`ml-2 flex items-center ${trendColor}`}>
                  <TrendIcon className="h-4 w-4 mr-1" />
                  <span className="text-xs">
                    {Math.abs(percentChange).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

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

  const FilterPanel = () => {
    return (
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            Фильтры аналитики
          </h3>
          <button
            onClick={() => setShowFiltersPanel(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={FORM_STYLES.label}>Дата начала</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                handleFilterChange({ startDate: e.target.value })
              }
              className={FORM_STYLES.input}
            />
          </div>

          <div>
            <label className={FORM_STYLES.label}>Дата окончания</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange({ endDate: e.target.value })}
              className={FORM_STYLES.input}
            />
          </div>

          <div>
            <label className={FORM_STYLES.label}>Отдел</label>
            <select
              value={filters.department}
              onChange={(e) =>
                handleFilterChange({ department: e.target.value })
              }
              className={FORM_STYLES.select}
            >
              <option value="">Все отделы</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.compareWithPrevious}
                onChange={(e) =>
                  handleFilterChange({ compareWithPrevious: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Сравнить с предыдущим периодом
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-3">
          <Button
            onClick={() =>
              handleFilterChange({
                startDate: "",
                endDate: "",
                department: "",
              })
            }
            variant="secondary"
            size="md"
          >
            Сбросить
          </Button>
          <Button
            onClick={() => {
              refreshData();
              setShowFiltersPanel(false);
            }}
            variant="primary"
            size="md"
          >
            Применить
          </Button>
        </div>
      </Card>
    );
  };

  const chartData = useMemo(() => {
    if (
      !analytics ||
      !analytics.task_stats ||
      !taskAnalytics ||
      !taskAnalytics.summary
    )
      return null;

    // Получаем данные о задачах по приоритету из API
    const tasksByPriority = analytics.task_stats.priority || {};

    // Создаем правильные метки и данные для графика приоритетов
    const priorityLabels = [];
    const priorityData = [];

    // Сопоставление приоритетов с русскими названиями
    const priorityMapping = {
      high: "Высокий",
      medium: "Средний",
      low: "Низкий",
    };

    // Создаем массивы меток и данных
    for (const [priority, stats] of Object.entries(tasksByPriority)) {
      priorityLabels.push(priorityMapping[priority] || priority);
      priorityData.push(stats.total || 0);
    }

    // Получаем данные о задачах по отделам
    // Если доступны статистики отделов, используем их
    const departments = Object.keys(
      taskAnalytics.summary.departmentStats || {}
    );
    const departmentTotalTasks = [];
    const departmentCompletedTasks = [];

    // Если есть данные по отделам в аналитике
    if (departments.length > 0) {
      for (const dept of departments) {
        const deptStats = taskAnalytics.summary.departmentStats[dept] || {};
        departmentTotalTasks.push(deptStats.total || 0);
        departmentCompletedTasks.push(deptStats.completed || 0);
      }
    }
    // Иначе создаем график из доступных данных
    else if (
      analytics.filters_applied &&
      analytics.filters_applied.department
    ) {
      // Если применен фильтр по отделу, показываем только его статистику
      const dept = analytics.filters_applied.department;
      departments.push(dept);
      departmentTotalTasks.push(analytics.task_stats.total || 0);
      departmentCompletedTasks.push(analytics.task_stats.completed || 0);
    } else {
      // Используем общую статистику вместо разбивки по отделам
      departments.push("Все отделы");
      departmentTotalTasks.push(analytics.task_stats.total || 0);
      departmentCompletedTasks.push(analytics.task_stats.completed || 0);
    }

    return {
      priority: {
        labels: priorityLabels,
        datasets: [
          {
            label: "Количество задач",
            data: priorityData,
            backgroundColor: ["#FFCC80", "#81D4FA", "#FF8A80"],
            borderColor: ["#FB8C00", "#03A9F4", "#F44336"],
            borderWidth: 1,
          },
        ],
      },
      department: {
        labels: departments,
        datasets: [
          {
            label: "Выполнено задач",
            data: departmentCompletedTasks,
            backgroundColor: "#4CAF50",
            borderColor: "#388E3C",
            borderWidth: 1,
          },
          {
            label: "Общее количество задач",
            data: departmentTotalTasks,
            backgroundColor: "#2196F3",
            borderColor: "#1976D2",
            borderWidth: 1,
          },
        ],
      },
    };
  }, [analytics, taskAnalytics]);

  const kpiData = useMemo(() => {
    if (!analytics)
      return {
        nps: 0,
        prevNps: 0,
        avgOnboardingTime: 0,
        prevAvgOnboardingTime: 0,
        completionRate: 0,
        prevCompletionRate: 0,
        totalOnboardingUsers: 0,
      };

    try {
      // Извлекаем данные из аналитики
      const onboardingStats = analytics.onboarding_stats || {};
      const feedbackStats = analytics.feedback_stats || {};
      const taskStats = analytics.task_stats || {};

      // Извлекаем данные из предыдущего периода, если есть
      const prevOnboardingStats = previousAnalytics?.onboarding_stats || {};
      const prevTaskStats = previousAnalytics?.task_stats || {};

      // Формируем данные для KPI
      return {
        // NPS (индекс лояльности) от -100 до 100
        nps: feedbackStats.nps || 0,
        prevNps: previousAnalytics?.feedback_stats?.nps || 0,

        // Среднее время онбординга в днях
        avgOnboardingTime: onboardingStats.avg_time || 0,
        prevAvgOnboardingTime: prevOnboardingStats.avg_time || 0,

        // Процент выполненных задач (от 0 до 1)
        completionRate: taskStats.completion_rate || 0,
        prevCompletionRate: prevTaskStats.completion_rate || 0,

        // Общее число пользователей в онбординге
        totalOnboardingUsers: onboardingStats.total_users || 0,
      };
    } catch (error) {
      console.error("Ошибка при обработке данных KPI:", error);
      return {
        nps: 0,
        prevNps: 0,
        avgOnboardingTime: 0,
        prevAvgOnboardingTime: 0,
        completionRate: 0,
        prevCompletionRate: 0,
        totalOnboardingUsers: 0,
      };
    }
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

  const taskStats = analytics?.task_stats || {
    total: 0,
    completed: 0,
    completion_rate: 0,
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

        {showFiltersPanel && <FilterPanel />}

        {dataWasTruncated && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md flex items-center p-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
            <p className="text-xs sm:text-sm text-yellow-700">
              Некоторые данные были сокращены из-за большого объема. Для
              получения полных данных используйте экспорт в CSV.
            </p>
          </div>
        )}

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-800 flex items-center mb-4">
            <TrophyIcon className="h-5 w-5 mr-2 text-blue-500" />
            Ключевые показатели эффективности (KPI)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">NPS</p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-blue-800">
                      {kpiData?.nps?.toFixed(1) || "—"}
                    </p>
                    {kpiData?.prevNps !== undefined &&
                      filters.compareWithPrevious && (
                        <div
                          className={`ml-2 flex items-center ${
                            kpiData.nps > kpiData.prevNps
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {kpiData.nps > kpiData.prevNps ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-xs">
                            {Math.abs(
                              ((kpiData.nps - kpiData.prevNps) /
                                Math.abs(kpiData.prevNps || 1)) *
                                100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                  </div>
                </div>
                <ChartPieIcon className="h-6 w-6 text-blue-500" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Индекс лояльности сотрудников
              </p>

              {kpiData?.nps !== undefined && (
                <div className="mt-3">
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        kpiData.nps < 0
                          ? "bg-red-500"
                          : kpiData.nps < 30
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(
                          Math.max((kpiData.nps + 100) / 2, 0),
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span>-100</span>
                    <span>0</span>
                    <span>+100</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Среднее время онбординга
                  </p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-green-800">
                      {kpiData?.avgOnboardingTime?.toFixed(1) || "—"} дней
                    </p>
                    {kpiData?.prevAvgOnboardingTime !== null &&
                      filters.compareWithPrevious && (
                        <div
                          className={`ml-2 flex items-center ${
                            kpiData.avgOnboardingTime <
                            kpiData.prevAvgOnboardingTime
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {kpiData.avgOnboardingTime <
                          kpiData.prevAvgOnboardingTime ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-xs">
                            {Math.abs(
                              ((kpiData.avgOnboardingTime -
                                kpiData.prevAvgOnboardingTime) /
                                kpiData.prevAvgOnboardingTime) *
                                100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                  </div>
                </div>
                <ClockIcon className="h-6 w-6 text-green-500" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                На основе {kpiData?.totalOnboardingUsers || 0} пользователей
              </p>

              {kpiData?.avgOnboardingTime !== undefined && (
                <div className="mt-3 flex items-center">
                  <div className="relative h-1 flex-grow bg-gray-200">
                    <div
                      className="absolute w-3 h-3 rounded-full bg-green-500 transform -translate-y-1/2"
                      style={{
                        left: `${Math.min(
                          100,
                          (kpiData.avgOnboardingTime / 30) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-500">
                    Цель: 14 дней
                  </span>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    Выполнено задач
                  </p>
                  <div className="flex items-center">
                    <p className="text-2xl font-bold text-yellow-800">
                      {Math.round((kpiData?.completionRate || 0) * 100)}%
                    </p>
                    {kpiData?.prevCompletionRate !== undefined &&
                      filters.compareWithPrevious && (
                        <div
                          className={`ml-2 flex items-center ${
                            kpiData.completionRate > kpiData.prevCompletionRate
                              ? "text-green-500"
                              : "text-red-500"
                          }`}
                        >
                          {kpiData.completionRate >
                          kpiData.prevCompletionRate ? (
                            <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                          ) : (
                            <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                          )}
                          <span className="text-xs">
                            {Math.abs(
                              ((kpiData.completionRate -
                                kpiData.prevCompletionRate) /
                                (kpiData.prevCompletionRate || 0.01)) *
                                100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                  </div>
                </div>
                <DocumentChartBarIcon className="h-6 w-6 text-yellow-500" />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {taskStats.completed} из {taskStats.total} задач
                {prevTaskStats && filters.compareWithPrevious && (
                  <span className="ml-2 text-xs">
                    (пред. период: {prevTaskStats.completed} из{" "}
                    {prevTaskStats.total})
                  </span>
                )}
              </p>

              <div className="mt-3">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-yellow-200">
                  <div
                    style={{
                      width: `${Math.round(
                        (kpiData?.completionRate || 0) * 100
                      )}%`,
                    }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "analytics"
                  ? "text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <ChartBarIcon className="h-4 w-4 inline-block mr-1" />
              Аналитика
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "calendar"
                  ? "text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CalendarDaysIcon className="h-4 w-4 inline-block mr-1" />
              Календарь
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === "reports"
                  ? "text-blue-700 border-b-2 border-blue-500"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <DocumentTextIcon className="h-4 w-4 inline-block mr-1" />
              Отчеты
            </button>
          </div>

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
                      <Card className="transform transition-transform duration-300 ease-in-out">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-medium text-gray-800">
                            Фильтры графиков
                          </h3>
                          <button
                            onClick={() => setShowChartFiltersPanel(false)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className={FORM_STYLES.label}>
                              Дата начала
                            </label>
                            <input
                              type="date"
                              value={filters.startDate}
                              onChange={(e) =>
                                handleFilterChange({
                                  startDate: e.target.value,
                                })
                              }
                              className={FORM_STYLES.input}
                            />
                          </div>

                          <div>
                            <label className={FORM_STYLES.label}>
                              Дата окончания
                            </label>
                            <input
                              type="date"
                              value={filters.endDate}
                              onChange={(e) =>
                                handleFilterChange({
                                  endDate: e.target.value,
                                })
                              }
                              className={FORM_STYLES.input}
                            />
                          </div>

                          <div>
                            <label className={FORM_STYLES.label}>Отдел</label>
                            <select
                              value={filters.department}
                              onChange={(e) =>
                                handleFilterChange({
                                  department: e.target.value,
                                })
                              }
                              className={FORM_STYLES.select}
                            >
                              <option value="">Все отделы</option>
                              {departments.map((dept) => (
                                <option key={dept} value={dept}>
                                  {dept}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center space-x-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.compareWithPrevious}
                                onChange={(e) =>
                                  handleFilterChange({
                                    compareWithPrevious: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Сравнить с предыдущим периодом
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="flex justify-end mt-4 space-x-3">
                          <Button
                            onClick={() =>
                              handleFilterChange({
                                startDate: "",
                                endDate: "",
                                department: "",
                              })
                            }
                            variant="secondary"
                            size="md"
                          >
                            Сбросить
                          </Button>
                          <Button
                            onClick={() => {
                              refreshData();
                              setShowChartFiltersPanel(false);
                            }}
                            variant="primary"
                            size="md"
                          >
                            Применить
                          </Button>
                        </div>
                      </Card>
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
