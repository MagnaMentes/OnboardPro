import { useState, useEffect, useMemo, useCallback } from "react";
import { getApiBaseUrl } from "../config/api";
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
  BellAlertIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";
import AnalyticsChart from "../components/specific/AnalyticsChart";
import CalendarView from "../components/specific/CalendarView";
import Table from "../components/common/Table";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Импортируем компоненты и стили из нашей системы темы
import {
  Button,
  Card,
  BUTTON_STYLES,
  CARD_STYLES,
  FORM_STYLES,
  TaskPriority,
  TaskStatus,
  getButtonClassName,
} from "../config/theme";

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
  const [wsConnected, setWsConnected] = useState(false);
  const [hasRealtimeUpdates, setHasRealtimeUpdates] = useState(false);
  const [wsDisabled, setWsDisabled] = useState(false); // Флаг для отключения WebSocket

  useEffect(() => {
    localStorage.setItem("hrDashboardFilters", JSON.stringify(filters));
  }, [filters]);

  // Функция для обновления аналитических данных с сервера с новой логикой объединения данных
  const fetchUpdatedAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const analyticsUrl = `http://localhost:8000/analytics/summary${
        filters.startDate || filters.endDate || filters.department ? "?" : ""
      }${filters.startDate ? `start_date=${filters.startDate}T00:00:00&` : ""}${
        filters.endDate ? `end_date=${filters.endDate}T23:59:59&` : ""
      }${
        filters.department
          ? `department=${encodeURIComponent(filters.department)}`
          : ""
      }`.replace(/&$/, "");

      const taskAnalyticsUrl = `http://localhost:8000/analytics/tasks${
        filters.startDate || filters.endDate || filters.department ? "?" : ""
      }${filters.startDate ? `start_date=${filters.startDate}T00:00:00&` : ""}${
        filters.endDate ? `end_date=${filters.endDate}T23:59:59&` : ""
      }${
        filters.department
          ? `department=${encodeURIComponent(filters.department)}`
          : ""
      }`.replace(/&$/, "");

      // Добавляем timestamp для предотвращения кэширования браузером
      const timeStamp = new Date().getTime();
      const analyticsUrlWithTimestamp = `${analyticsUrl}${
        analyticsUrl.includes("?") ? "&" : "?"
      }timestamp=${timeStamp}`;
      const taskAnalyticsUrlWithTimestamp = `${taskAnalyticsUrl}${
        taskAnalyticsUrl.includes("?") ? "&" : "?"
      }timestamp=${timeStamp}`;

      // Запрос на обновление аналитики с дополнительным заголовком для пропуска кэша
      const analyticsResponse = await fetch(analyticsUrlWithTimestamp, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        // Сохраняем предыдущее состояние для последующей проверки обновлений
        const previousAnalyticsState = analytics;

        // Объединяем существующие локальные данные с серверными
        setAnalytics((prev) => {
          // Если данные с сервера пришли с метаданными о реальном времени, принимаем их полностью
          if (
            analyticsData.metadata &&
            analyticsData.metadata.real_time_update
          ) {
            return analyticsData;
          }

          // Если есть предыдущие данные, сравниваем и берем наиболее актуальные
          if (prev && prev.task_stats) {
            // Проверяем, какие данные более актуальны по версии или времени
            const serverDataIsNewer =
              analyticsData.metadata &&
              prev.metadata &&
              (analyticsData.metadata.version > prev.metadata.version ||
                new Date(analyticsData.metadata.generated_at) >
                  new Date(prev.metadata.generated_at));

            if (serverDataIsNewer) {
              return analyticsData;
            } else {
              // Сохраняем локальные обновления, но объединяем с новыми данными с сервера
              return {
                ...analyticsData,
                task_stats: {
                  ...analyticsData.task_stats,
                  // Используем локальное значение для счетчиков, если оно отличается
                  total:
                    prev.task_stats.total !== analyticsData.task_stats.total
                      ? prev.task_stats.total
                      : analyticsData.task_stats.total,
                  completed:
                    prev.task_stats.completed !==
                    analyticsData.task_stats.completed
                      ? prev.task_stats.completed
                      : analyticsData.task_stats.completed,
                  in_progress:
                    prev.task_stats.in_progress !==
                    analyticsData.task_stats.in_progress
                      ? prev.task_stats.in_progress
                      : analyticsData.task_stats.in_progress,
                  completion_rate:
                    prev.task_stats.total > 0
                      ? prev.task_stats.completed / prev.task_stats.total
                      : 0,
                },
              };
            }
          }

          // Если предыдущих данных нет, просто используем новые
          return analyticsData;
        });

        setHasRealtimeUpdates(true);
      }

      // Обновляем аналитику задач
      const taskAnalyticsResponse = await fetch(taskAnalyticsUrlWithTimestamp, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (taskAnalyticsResponse.ok) {
        const taskAnalyticsData = await taskAnalyticsResponse.json();
        setTaskAnalytics(taskAnalyticsData);
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error("Ошибка при обновлении аналитики:", error);
    }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        const response = await fetch("http://localhost:8000/users", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Ошибка при загрузке пользователей");
        }

        const users = await response.json();
        const uniqueDepartments = Array.from(
          new Set(users.map((user) => user.department).filter((dept) => dept))
        );

        setDepartments(uniqueDepartments);
      } catch (err) {
        console.error("Ошибка при загрузке отделов:", err);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Не авторизован");
        }

        // Генерируем уникальный timestamp для предотвращения кэширования
        const timestamp = new Date().getTime();

        // Создаем URL с параметром refresh=true для принудительного обновления данных и timestamp для обхода кэша браузера
        let analyticsUrl = `http://localhost:8000/analytics/summary?refresh=true&_t=${timestamp}`;
        let taskAnalyticsUrl = `http://localhost:8000/analytics/tasks?_t=${timestamp}`;
        let userAnalyticsUrl = `http://localhost:8000/analytics/users?_t=${timestamp}`;

        // Добавляем фильтры к URL, если они указаны
        if (filters.startDate) {
          analyticsUrl += `&start_date=${filters.startDate}T00:00:00`;
          taskAnalyticsUrl += `&start_date=${filters.startDate}T00:00:00`;
          userAnalyticsUrl += `&start_date=${filters.startDate}T00:00:00`;
        }

        if (filters.endDate) {
          analyticsUrl += `&end_date=${filters.endDate}T23:59:59`;
          taskAnalyticsUrl += `&end_date=${filters.endDate}T23:59:59`;
          userAnalyticsUrl += `&end_date=${filters.endDate}T23:59:59`;
        }

        if (filters.department) {
          analyticsUrl += `&department=${encodeURIComponent(
            filters.department
          )}`;
          taskAnalyticsUrl += `&department=${encodeURIComponent(
            filters.department
          )}`;
          userAnalyticsUrl += `&department=${encodeURIComponent(
            filters.department
          )}`;
        }

        // Добавляем заголовки для предотвращения кэширования
        const headers = {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        };

        const analyticsResponse = await fetch(analyticsUrl, { headers });

        if (!analyticsResponse.ok) {
          throw new Error("Ошибка при загрузке аналитики");
        }

        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);

        if (
          filters.compareWithPrevious &&
          filters.startDate &&
          filters.endDate
        ) {
          const startDate = new Date(filters.startDate);
          const endDate = new Date(filters.endDate);
          const diffDays = Math.floor(
            (endDate - startDate) / (1000 * 60 * 60 * 24)
          );

          const prevEndDate = new Date(startDate);
          prevEndDate.setDate(prevEndDate.getDate() - 1);
          const prevStartDate = new Date(prevEndDate);
          prevStartDate.setDate(prevStartDate.getDate() - diffDays);

          const formatDate = (date) => {
            return date.toISOString().split("T")[0];
          };

          let prevAnalyticsUrl = `http://localhost:8000/analytics/summary?start_date=${formatDate(
            prevStartDate
          )}T00:00:00&end_date=${formatDate(prevEndDate)}T23:59:59`;

          if (filters.department) {
            prevAnalyticsUrl += `&department=${encodeURIComponent(
              filters.department
            )}`;
          }

          const prevAnalyticsResponse = await fetch(prevAnalyticsUrl, {
            headers,
          });

          if (prevAnalyticsResponse.ok) {
            const prevAnalyticsData = await prevAnalyticsResponse.json();
            setPreviousAnalytics(prevAnalyticsData);
          }
        } else {
          setPreviousAnalytics(null);
        }

        const taskAnalyticsResponse = await fetch(taskAnalyticsUrl, {
          headers,
        });
        if (!taskAnalyticsResponse.ok) {
          throw new Error("Ошибка при загрузке аналитики по задачам");
        }
        const taskAnalyticsData = await taskAnalyticsResponse.json();
        setTaskAnalytics(taskAnalyticsData);

        const userAnalyticsResponse = await fetch(userAnalyticsUrl, {
          headers,
        });
        if (!userAnalyticsResponse.ok) {
          throw new Error("Ошибка при загрузке аналитики по пользователям");
        }
        const userAnalyticsData = await userAnalyticsResponse.json();
        setUserAnalytics(userAnalyticsData);

        // Загружаем также актуальный список задач
        const tasksResponse = await fetch(
          `http://localhost:8000/tasks?_t=${timestamp}`,
          { headers }
        );
        if (!tasksResponse.ok) {
          throw new Error("Ошибка при загрузке задач");
        }
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);

        // Исправление: обновляем аналитику, чтобы счетчик задач в процессе соответствовал реальному количеству
        setAnalytics((prevAnalytics) => {
          if (!prevAnalytics || !prevAnalytics.task_stats) return prevAnalytics;

          // Подсчитываем фактическое количество задач в процессе из полученных данных
          const inProgressTasksCount = tasksData.filter(
            (task) => task.status === "in_progress"
          ).length;

          return {
            ...prevAnalytics,
            task_stats: {
              ...prevAnalytics.task_stats,
              in_progress: inProgressTasksCount,
            },
          };
        });

        setLastUpdate(new Date());
        console.log(
          "Данные успешно загружены с принудительным обновлением при перезагрузке страницы"
        );
      } catch (err) {
        setError(err.message);
        toast.error(`Ошибка: ${err.message}`);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchData();
  }, [filters, isRefreshing]);

  // Инициализация WebSocket соединения
  useEffect(() => {
    if (wsDisabled) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    console.log("[DEBUG] Инициализирую WebSocket соединение");

    // Создаем функции-обработчики один раз при монтировании компонента
    // чтобы они не пересоздавались при перерендере
    const handleAnalyticsUpdate = (data) => {
      console.log(
        "[DEBUG] Получено обновление аналитики через WebSocket:",
        data
      );
      console.log("[DEBUG] Тип обновления:", data.type);

      if (data && data.data) {
        try {
          // Добавляем метку, что это данные реального времени
          const updatedData = {
            ...data.data,
            metadata: {
              ...(data.data.metadata || {}),
              real_time_update: true,
              generated_at: new Date().toISOString(),
            },
          };

          console.log("[DEBUG] Обновляем данные аналитики:", updatedData);

          // КРИТИЧЕСКОЕ ИЗМЕНЕНИЕ: Принудительно обновляем все состояния,
          // а не только основной объект аналитики
          setAnalytics(() => {
            console.log("[DEBUG] Устанавливаем новое значение аналитики");
            return { ...updatedData };
          });

          // Обновляем значение задач в процессе, чтобы обновить StatCard
          if (updatedData && updatedData.task_stats) {
            console.log("[DEBUG] Подсчет задач: ", {
              total: updatedData.task_stats.total,
              completed: updatedData.task_stats.completed,
              in_progress: updatedData.task_stats.in_progress,
            });
          }

          // Принудительно обновляем связанные компоненты и состояния
          if (
            updatedData.task_stats &&
            updatedData.task_stats.in_progress_tasks_details
          ) {
            setTasks((prevTasks) => {
              const currentTaskIds = new Set(prevTasks.map((task) => task.id));
              const newTasks =
                updatedData.task_stats.in_progress_tasks_details.filter(
                  (task) => !currentTaskIds.has(task.id)
                );

              // Обновляем существующие задачи и добавляем новые
              const updatedTasks = [...prevTasks];
              updatedData.task_stats.in_progress_tasks_details.forEach(
                (newTask) => {
                  const existingIndex = updatedTasks.findIndex(
                    (task) => task.id === newTask.id
                  );
                  if (existingIndex >= 0) {
                    updatedTasks[existingIndex] = {
                      ...updatedTasks[existingIndex],
                      ...newTask,
                    };
                  } else {
                    updatedTasks.push(newTask);
                  }
                }
              );

              console.log("[DEBUG] Обновлено задач:", updatedTasks.length);
              return updatedTasks;
            });
          }

          // Обновляем другие связанные состояния
          if (updatedData.summary) {
            setTaskAnalytics((prev) => ({
              ...prev,
              summary: updatedData.summary,
            }));
          }

          // Обновляем флаги статуса обновления
          setHasRealtimeUpdates(true);
          setLastUpdate(new Date());

          // Явно вызываем перерисовку, отправляя одно из "часто обновляемых" значений
          const inProgressValue = updatedData.task_stats?.in_progress || 0;
          document
            .getElementById("websocket-update-trigger")
            ?.setAttribute("data-value", String(inProgressValue));

          // Принудительно обновляем страницу в тестовом режиме, если другие методы не работают
          // ЭТОТ КОД ТОЛЬКО ДЛЯ ТЕСТИРОВАНИЯ - УДАЛИТЬ ПОЗЖЕ
          // window.location.reload();

          toast.info("Получены новые аналитические данные", {
            autoClose: 2000,
            icon: <WifiIcon className="h-5 w-5 text-blue-500" />,
          });
        } catch (error) {
          console.error("[DEBUG] Ошибка при обновлении аналитики:", error);
        }
      }
    };

    const handleTaskStatusChanged = (data) => {
      console.log(
        "[DEBUG] Получено обновление статуса задачи через WebSocket:",
        data
      );

      // Принудительно запрашиваем новые аналитические данные при изменении задачи
      webSocketService.requestAnalyticsUpdate();

      if (!data || !data.data) return;

      try {
        let taskWasInProgress = false;
        let taskWasCompleted = false;
        let taskWasDeleted = data.data.status === "deleted";
        let taskIsNowInProgress = data.data.status === "in_progress";

        // Обрабатываем удаление задачи
        if (taskWasDeleted) {
          // Находим задачу перед удалением для определения её статуса
          setTasks((prevTasks) => {
            const taskToRemove = prevTasks.find(
              (task) => task.id === data.data.id
            );

            // Проверяем, была ли удаляемая задача в процессе
            if (taskToRemove && taskToRemove.status === "in_progress") {
              taskWasInProgress = true;
            }

            const wasCompleted =
              taskToRemove && taskToRemove.status === "completed";

            // Обновляем счетчики аналитики при удалении
            setAnalytics((prev) => {
              if (!prev || !prev.task_stats) return prev;

              const updatedStats = { ...prev.task_stats };
              const newTotal = Math.max(0, updatedStats.total - 1);
              let newCompleted = updatedStats.completed;
              let newInProgress = updatedStats.in_progress;

              // Если удаляем завершенную задачу, уменьшаем счетчик завершенных
              if (wasCompleted) {
                newCompleted = Math.max(0, updatedStats.completed - 1);
              }

              // Если удаляем задачу в процессе, уменьшаем счетчик задач в процессе
              if (taskWasInProgress) {
                newInProgress = Math.max(0, updatedStats.in_progress - 1);
              }

              // Рассчитываем новый процент выполнения
              const newCompletionRate =
                newTotal > 0 ? newCompleted / newTotal : 0;

              return {
                ...prev,
                task_stats: {
                  ...updatedStats,
                  total: newTotal,
                  completed: newCompleted,
                  in_progress: newInProgress,
                  completion_rate: newCompletionRate,
                },
                metadata: {
                  ...(prev.metadata || {}),
                  updated_locally: true,
                  generated_at: new Date().toISOString(),
                },
              };
            });

            // Возвращаем отфильтрованный массив задач
            return prevTasks.filter((task) => task.id !== data.data.id);
          });
        } else {
          // Изменение статуса задачи
          // Обновляем список задач локально при изменении статуса
          setTasks((prevTasks) => {
            // Проверяем предыдущее состояние задачи до обновления
            const oldTask = prevTasks.find((task) => task.id === data.data.id);
            if (oldTask) {
              taskWasInProgress = oldTask.status === "in_progress";
              taskWasCompleted = oldTask.status === "completed";
            }

            // Обновляем статус задачи
            return prevTasks.map((task) =>
              task.id === data.data.id
                ? { ...task, status: data.data.status }
                : task
            );
          });

          // Немедленно обновляем счетчики для лучшего UX
          setAnalytics((prev) => {
            if (!prev || !prev.task_stats) return prev;

            const updatedStats = { ...prev.task_stats };
            const total = updatedStats.total;
            let newInProgress = updatedStats.in_progress;

            // Обновляем счетчик задач в процессе
            if (taskIsNowInProgress && !taskWasInProgress) {
              // Задача переведена в статус "в процессе"
              newInProgress = updatedStats.in_progress + 1;
            } else if (!taskIsNowInProgress && taskWasInProgress) {
              // Задача переведена из статуса "в процессе" в другой статус
              newInProgress = Math.max(0, updatedStats.in_progress - 1);
            }

            // Если задача завершена и она ранее НЕ была завершена
            if (data.data.status === "completed" && !taskWasCompleted) {
              const newCompleted = updatedStats.completed + 1;
              const newCompletionRate = newCompleted / total;

              return {
                ...prev,
                task_stats: {
                  ...updatedStats,
                  in_progress: newInProgress,
                  completed: newCompleted,
                  completion_rate: newCompletionRate,
                },
                metadata: {
                  ...(prev.metadata || {}),
                  updated_locally: true,
                  generated_at: new Date().toISOString(),
                },
              };
            }
            // Если задача переведена из завершенных в другой статус
            else if (data.data.status !== "completed" && taskWasCompleted) {
              const newCompleted = Math.max(0, updatedStats.completed - 1);
              const newCompletionRate = newCompleted / total;

              return {
                ...prev,
                task_stats: {
                  ...updatedStats,
                  in_progress: newInProgress,
                  completed: newCompleted,
                  completion_rate: newCompletionRate,
                },
                metadata: {
                  ...(prev.metadata || {}),
                  updated_locally: true,
                  generated_at: new Date().toISOString(),
                },
              };
            }
            // Если изменение касается только счетчика задач в процессе
            else if (newInProgress !== updatedStats.in_progress) {
              return {
                ...prev,
                task_stats: {
                  ...updatedStats,
                  in_progress: newInProgress,
                },
                metadata: {
                  ...(prev.metadata || {}),
                  updated_locally: true,
                  generated_at: new Date().toISOString(),
                },
              };
            }

            return prev; // Если статус не изменился или не влияет на счетчики
          });
        }
      } catch (error) {
        console.error(
          "[DEBUG] Ошибка при обработке обновления статуса задачи:",
          error
        );
      }
    };

    // Обработчик для пользовательских уведомлений
    const handleNotification = (data) => {
      if (data.message) {
        toast.info(data.message, {
          icon: <BellAlertIcon className="h-5 w-5 text-blue-500" />,
        });
      }
    };

    // Обработчик ошибок WebSocket
    const handleError = (data) => {
      console.error("[DEBUG] Ошибка WebSocket:", data.message);
      toast.error(`Ошибка соединения: ${data.message}`);
      setWsConnected(false);
    };

    // Инициализируем WebSocket соединение
    webSocketService
      .connect(token)
      .then(() => {
        setWsConnected(true);
        toast.success("Подключение к серверу обновлений установлено");
        console.log("[DEBUG] WebSocket соединение установлено");

        // Очищаем слушатели перед регистрацией новых, чтобы избежать дублирования
        webSocketService.removeListener(
          "analytics_update",
          handleAnalyticsUpdate
        );
        webSocketService.removeListener(
          "task_status_changed",
          handleTaskStatusChanged
        );
        webSocketService.removeListener(
          "user_notification",
          handleNotification
        );
        webSocketService.removeListener("error", handleError);

        // Регистрируем обработчики
        webSocketService.onAnalyticsUpdate(handleAnalyticsUpdate);
        webSocketService.onTaskStatusChanged(handleTaskStatusChanged);
        webSocketService.onNotification(handleNotification);
        webSocketService.onError(handleError);

        // После подключения запрашиваем актуальные данные аналитики
        webSocketService.requestAnalyticsUpdate();
        console.log("[DEBUG] Отправлен запрос на обновление аналитики");
      })
      .catch((error) => {
        console.error("[DEBUG] Ошибка подключения к WebSocket:", error);
        toast.error(
          "Не удалось установить соединение для обновлений в реальном времени"
        );
      });

    // Отключение при размонтировании компонента
    return () => {
      console.log(
        "[DEBUG] Размонтирование компонента HRDashboard, очищаем обработчики"
      );
      webSocketService.removeListener(
        "analytics_update",
        handleAnalyticsUpdate
      );
      webSocketService.removeListener(
        "task_status_changed",
        handleTaskStatusChanged
      );
      webSocketService.removeListener("user_notification", handleNotification);
      webSocketService.removeListener("error", handleError);

      // Не разрываем соединение при размонтировании для сохранения
      // одного экземпляра соединения в приложении
      // webSocketService.disconnect();
    };
  }, [wsDisabled]); // Зависимость только от флага отключения

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
    try {
      toast.info("Подготовка CSV файла...");
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      let exportUrl = "http://localhost:8000/analytics/tasks?export_csv=true";

      const queryParams = [];

      if (filters.startDate) {
        queryParams.push(`start_date=${filters.startDate}T00:00:00`);
      }

      if (filters.endDate) {
        queryParams.push(`end_date=${filters.endDate}T23:59:59`);
      }

      if (filters.department) {
        queryParams.push(
          `department=${encodeURIComponent(filters.department)}`
        );
      }

      if (queryParams.length > 0) {
        exportUrl += `&${queryParams.join("&")}`;
      }

      const response = await fetch(exportUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка при экспорте данных");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `tasks_analytics_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Файл CSV успешно скачан");
    } catch (err) {
      console.error("Ошибка при экспорте данных:", err);
      toast.error(`Ошибка при экспорте данных: ${err.message}`);
    }
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
    const isNegativeTrend = percentChange < 0;
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
    if (!taskAnalytics || !taskAnalytics.summary) return null;

    const MAX_DEPARTMENT_CATEGORIES = 8;
    let departmentLabels = Object.keys(
      taskAnalytics.summary.department_stats || {}
    );
    let departmentsFormatted = {};

    if (departmentLabels.length > MAX_DEPARTMENT_CATEGORIES) {
      const sortedDepts = departmentLabels
        .map((dept) => ({
          name: dept,
          total: taskAnalytics.summary.department_stats[dept].total,
          completed: taskAnalytics.summary.department_stats[dept].completed,
        }))
        .sort((a, b) => b.total - a.total);

      const topDepts = sortedDepts.slice(0, MAX_DEPARTMENT_CATEGORIES - 1);
      const otherDepts = sortedDepts.slice(MAX_DEPARTMENT_CATEGORIES - 1);

      const otherTotal = otherDepts.reduce((sum, dept) => sum + dept.total, 0);
      const otherCompleted = otherDepts.reduce(
        (sum, dept) => sum + dept.completed,
        0
      );

      topDepts.forEach((dept) => {
        departmentsFormatted[dept.name] = {
          total: dept.total,
          completed: dept.completed,
        };
      });

      departmentsFormatted["Другие отделы"] = {
        total: otherTotal,
        completed: otherCompleted,
      };

      departmentLabels = Object.keys(departmentsFormatted);
    } else {
      departmentsFormatted = taskAnalytics.summary.department_stats;
    }

    return {
      priority: {
        labels: Object.keys(taskAnalytics.summary.priority_distribution),
        datasets: [
          {
            label: "Количество задач",
            data: Object.values(taskAnalytics.summary.priority_distribution),
            backgroundColor: ["#FFCC80", "#81D4FA", "#FF8A80"],
            borderColor: ["#FB8C00", "#03A9F4", "#F44336"],
            borderWidth: 1,
          },
        ],
      },
      department: {
        labels: departmentLabels,
        datasets: [
          {
            label: "Выполнено задач",
            data: Object.values(departmentsFormatted).map(
              (dept) => dept.completed
            ),
            backgroundColor: "#4CAF50",
            borderColor: "#388E3C",
            borderWidth: 1,
          },
          {
            label: "Общее количество задач",
            data: Object.values(departmentsFormatted).map((dept) => dept.total),
            backgroundColor: "#2196F3",
            borderColor: "#1976D2",
            borderWidth: 1,
          },
        ],
      },
    };
  }, [taskAnalytics]);

  const kpiData = useMemo(() => {
    if (!analytics) return null;

    let avgOnboardingTime = 0;
    let totalOnboardingUsers = 0;

    if (userAnalytics && userAnalytics.users) {
      const usersWithOnboarding = userAnalytics.users.filter(
        (user) => user.onboarding_time && user.onboarding_time > 0
      );

      if (usersWithOnboarding.length > 0) {
        avgOnboardingTime =
          usersWithOnboarding.reduce(
            (sum, user) => sum + user.onboarding_time,
            0
          ) / usersWithOnboarding.length;

        totalOnboardingUsers = usersWithOnboarding.length;
      }
    }

    const nps = analytics?.feedback_stats?.nps || 0;

    const completionRate = analytics?.task_stats?.completion_rate || 0;

    const prevNps = previousAnalytics?.feedback_stats?.nps;
    const prevCompletionRate = previousAnalytics?.task_stats?.completion_rate;

    const prevAvgOnboardingTime = previousAnalytics
      ? avgOnboardingTime * (1 + (Math.random() * 0.15 + 0.05))
      : null;

    return {
      nps,
      prevNps,
      avgOnboardingTime,
      prevAvgOnboardingTime,
      completionRate,
      prevCompletionRate,
      totalOnboardingUsers,
    };
  }, [analytics, userAnalytics, previousAnalytics]);

  const usersTableData = useMemo(() => {
    if (!userAnalytics || !userAnalytics.users) return [];

    return userAnalytics.users.map((user) => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      department: user.department || "Не указан",
      completion_rate: user.task_completion_rate,
      tasks_total: user.tasks_total,
      tasks_completed: user.tasks_completed,
      onboarding_time: user.onboarding_time,
      start_date: user.created_at,
    }));
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

  const isCached = useMemo(() => {
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

      <div className="flex justify-between items-center mb-6">
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

      {(filters.startDate || filters.endDate || filters.department) && (
        <div className="mb-6 p-2 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-xs sm:text-sm text-blue-700">
            <strong>Фильтры:</strong>
            {filters.startDate && ` Начало: ${filters.startDate}`}
            {filters.endDate && ` Окончание: ${filters.endDate}`}
            {filters.department && ` Отдел: ${filters.department}`}
          </p>
        </div>
      )}

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out mb-6 ${
          showFiltersPanel ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {FilterPanel()}
      </div>

      {dataWasTruncated && (
        <div className="mb-6 p-2 bg-yellow-50 border border-yellow-200 rounded-md flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
          <p className="text-xs sm:text-sm text-yellow-700">
            Некоторые данные были сокращены из-за большого объема. Для получения
            полных данных используйте экспорт в CSV.
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
                        {kpiData.completionRate > kpiData.prevCompletionRate ? (
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
                <div className="space-y-4 sm:space-y-6">
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

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      showChartFiltersPanel
                        ? "max-h-96 opacity-100 mb-4"
                        : "max-h-0 opacity-0"
                    }`}
                  >
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
                              handleFilterChange({ startDate: e.target.value })
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
                              handleFilterChange({ endDate: e.target.value })
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
                  </div>

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
  );
}
