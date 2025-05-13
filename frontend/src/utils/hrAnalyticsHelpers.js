// Утилиты для преобразования и проверки данных аналитики для HR Dashboard
/**
 * Проверяет и корректирует счетчик задач в процессе по фактическому массиву задач
 * @param {Object} analytics - Объект с аналитическими данными
 * @returns {Object} - Исправленный объект аналитики
 */
export const verifyAndFixAnalyticsData = (analytics) => {
  if (!analytics) return null;

  // Создаем копию данных, чтобы не изменять оригинальный объект
  const fixedAnalytics = JSON.parse(JSON.stringify(analytics));

  // Проверяем наличие необходимых полей и структур
  if (!fixedAnalytics.task_stats) {
    fixedAnalytics.task_stats = {};
  }

  // Обеспечиваем существование массива задач в процессе
  if (!Array.isArray(fixedAnalytics.task_stats.in_progress_tasks_details)) {
    fixedAnalytics.task_stats.in_progress_tasks_details = [];
  }

  // Получаем актуальное количество задач в процессе
  const detailsCount =
    fixedAnalytics.task_stats.in_progress_tasks_details.length;

  // Корректируем счетчик, если он не соответствует количеству задач
  if (fixedAnalytics.task_stats.in_progress !== detailsCount) {
    console.log(
      `HR Analytics: Исправлено несоответствие счетчика in_progress: ${fixedAnalytics.task_stats.in_progress} → ${detailsCount}`
    );
    fixedAnalytics.task_stats.in_progress = detailsCount;
  }

  return fixedAnalytics;
};

/**
 * Подготавливает данные для графиков из аналитических данных
 * @param {Object} analytics - Объект аналитических данных
 * @param {Object} taskAnalytics - Дополнительные данные аналитики задач
 * @returns {Object} - Объект с данными для графиков
 */
export const prepareChartData = (analytics, taskAnalytics) => {
  if (
    !analytics ||
    !analytics.task_stats ||
    !taskAnalytics ||
    !taskAnalytics.summary
  )
    return null;

  // Получаем данные о задачах по приоритету из API
  const tasksByPriority = analytics.task_stats.priority || {};

  // Создаем массивы меток и данных для графика приоритетов
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
  const departments = Object.keys(taskAnalytics.summary.departmentStats || {});
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
  else if (analytics.filters_applied && analytics.filters_applied.department) {
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
};

/**
 * Извлекает KPI данные из аналитических данных
 * @param {Object} analytics - Объект аналитических данных
 * @param {Object} previousAnalytics - Объект с данными предыдущего периода
 * @returns {Object} - Объект с данными KPI
 */
export const extractKPIData = (analytics, previousAnalytics) => {
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
};
