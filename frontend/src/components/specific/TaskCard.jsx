import React, { useState, useCallback, memo } from "react";
import { useDrag } from "react-dnd";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  CalendarIcon,
  ChevronDoubleRightIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

/**
 * Улучшенный компонент карточки задачи с расширенным UX/UI
 * - Добавлены иконки для разных статусов задач
 * - Улучшена визуальная иерархия элементов
 * - Добавлен индикатор времени до дедлайна
 * - Расширена доступность для скринридеров
 */
const TaskCard = ({ task, onStatusChange, onTaskClick, assignee = null }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);

  // Оптимизированный механизм drag-and-drop
  const [{ isDragging }, drag] = useDrag({
    type: "TASK",
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult && item.status !== dropResult.status) {
        // Анимируем карточку перед вызовом коллбэка
        setIsUpdating(true);
        // Используем таймаут для визуального отображения изменений
        setTimeout(() => {
          if (onStatusChange) {
            onStatusChange(task.id, dropResult.status);
          }
          setIsUpdating(false);
        }, 100);
      }
    },
  });

  // Определяем CSS классы в зависимости от статуса задачи
  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "border-yellow-500";
      case "in_progress":
        return "border-blue-500";
      case "completed":
        return "border-green-500";
      case "blocked":
        return "border-red-500";
      default:
        return "border-gray-500";
    }
  };

  // Иконка для статуса задачи
  const StatusIcon = () => {
    switch (task.status) {
      case "pending":
        return (
          <ClockIcon className="h-4 w-4 text-yellow-500" aria-hidden="true" />
        );
      case "in_progress":
        return (
          <ArrowPathIcon
            className="h-4 w-4 text-blue-500 animate-spin-slow"
            aria-hidden="true"
          />
        );
      case "completed":
        return (
          <CheckCircleIcon
            className="h-4 w-4 text-green-500"
            aria-hidden="true"
          />
        );
      case "blocked":
        return (
          <LockClosedIcon className="h-4 w-4 text-red-500" aria-hidden="true" />
        );
      default:
        return (
          <ChevronDoubleRightIcon
            className="h-4 w-4 text-gray-500"
            aria-hidden="true"
          />
        );
    }
  };

  // Текст статуса задачи
  const getStatusText = (status) => {
    const statusMap = {
      pending: "В очереди",
      in_progress: "В процессе",
      completed: "Завершено",
      blocked: "Заблокировано",
    };
    return statusMap[status] || "Неизвестно";
  };

  // Форматирование даты срока выполнения с учетом часового пояса
  const formatDueDate = (dateString) => {
    if (!dateString) return null;

    try {
      // Преобразуем строку в объект Date
      // JavaScript автоматически обрабатывает UTC даты и преобразует их в локальное время
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        return null;
      }

      // Используем Intl для форматирования даты в локальном формате с учетом часового пояса
      return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(date);
    } catch (error) {
      console.error("Ошибка форматирования даты:", error);
      return null;
    }
  };

  // Считаем сколько дней осталось до дедлайна с учетом часового пояса
  const getDaysRemaining = () => {
    if (!task.deadline) return null;

    try {
      // Преобразуем строку в объект Date с учетом локального часового пояса
      const deadline = new Date(task.deadline);

      if (isNaN(deadline.getTime())) {
        return null;
      }

      // Создаем текущую дату с временем 00:00:00 в локальном часовом поясе
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Приводим deadline к формату даты без времени для корректного сравнения дней
      const deadlineDate = new Date(deadline);
      deadlineDate.setHours(0, 0, 0, 0);

      // Рассчитываем разницу в днях
      const diffTime = deadlineDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      console.error("Ошибка расчета оставшихся дней:", error);
      return null;
    }
  };

  // Класс для отображения дней до дедлайна
  const getDaysRemainingClass = () => {
    const days = getDaysRemaining();
    if (days === null) return "";

    if (days < 0) return "text-red-600 font-medium";
    if (days === 0) return "text-red-500 font-medium";
    if (days <= 2) return "text-orange-500";
    if (days <= 5) return "text-yellow-600";
    return "text-green-600";
  };

  // Текст для отображения дней до дедлайна
  const getDaysRemainingText = () => {
    const days = getDaysRemaining();
    if (days === null) return "";

    if (days < 0)
      return `Просрочено на ${Math.abs(days)} ${getDayWord(Math.abs(days))}`;
    if (days === 0) return "Сегодня";
    return `${days} ${getDayWord(days)}`;
  };

  // Склонение слова "день"
  const getDayWord = (days) => {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;

    if (lastDigit === 1 && lastTwoDigits !== 11) {
      return "день";
    } else if (
      [2, 3, 4].includes(lastDigit) &&
      ![12, 13, 14].includes(lastTwoDigits)
    ) {
      return "дня";
    } else {
      return "дней";
    }
  };

  // Компонент для отображения приоритета
  const PriorityBadge = () => {
    const priorityClasses = {
      low: "bg-green-100 text-green-800 border-green-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      high: "bg-red-100 text-red-800 border-red-300",
    };

    const priorityText = {
      low: "Низкий",
      medium: "Средний",
      high: "Высокий",
    };

    const priorityIcon = {
      low: <ExclamationCircleIcon className="h-3 w-3 mr-1" />,
      medium: <ExclamationCircleIcon className="h-3 w-3 mr-1" />,
      high: <ExclamationCircleIcon className="h-3 w-3 mr-1" />,
    };

    return (
      <span
        className={`text-xs px-2 py-1 rounded-full border flex items-center whitespace-nowrap ${
          priorityClasses[task.priority] || "bg-gray-200 border-gray-300"
        }`}
        aria-label={`Приоритет: ${priorityText[task.priority] || "Не задан"}`}
      >
        {priorityIcon[task.priority]}
        {priorityText[task.priority] || "Не задан"}
      </span>
    );
  };

  // Индикатор прогресса для приближающихся дедлайнов
  const DeadlineProgress = () => {
    const days = getDaysRemaining();

    // Если дедлайн не задан или просрочен, не показываем прогресс-бар
    if (days === null || days < 0 || task.status === "completed") return null;

    // Определяем процент заполнения (чем ближе к дедлайну, тем больше)
    // Максимум 7 дней для полного отображения шкалы
    const maxDays = 7;
    const percent = Math.max(0, Math.min(100, 100 - (days / maxDays) * 100));

    return (
      <div
        className="w-full h-1 bg-gray-200 rounded-full mt-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            days <= 1
              ? "bg-red-500"
              : days <= 3
              ? "bg-yellow-500"
              : "bg-blue-500"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    );
  };

  return (
    <div
      ref={drag}
      className={`p-4 mb-3 rounded-lg border bg-white shadow-sm hover:shadow-md border-l-4 ${getStatusClass(
        task.status
      )} ${isDragging ? "opacity-50 shadow-lg scale-105" : "opacity-100"} ${
        isUpdating ? "animate-pulse" : ""
      } transition-all duration-200`}
      style={{ cursor: "move" }}
      onClick={() => onTaskClick && onTaskClick(task)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Задача: ${task.title}. Статус: ${getStatusText(
        task.status
      )}. Приоритет: ${task.priority}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTaskClick && onTaskClick(task);
        }
      }}
    >
      {/* Шапка карточки: заголовок и статус */}
      <div className="flex justify-between items-start">
        <h3 className="font-medium text-gray-800 break-words flex-grow mr-2">
          {task.title}
        </h3>
        <div className="flex items-center gap-1 whitespace-nowrap text-xs text-gray-500">
          <StatusIcon />
          <span className="hidden sm:inline">{getStatusText(task.status)}</span>
        </div>
      </div>

      {/* Описание задачи, если есть */}
      {task.description && (
        <div
          className={`mt-2 text-sm text-gray-600 ${
            isHovered ? "line-clamp-none" : "line-clamp-2"
          } transition-all duration-300 overflow-hidden`}
        >
          {task.description}
        </div>
      )}

      <DeadlineProgress />

      {/* Нижняя часть карточки: дедлайн, приоритет и исполнитель */}
      <div className="flex flex-wrap justify-between items-center mt-3 gap-2">
        <div className="flex items-center gap-2">
          {task.deadline && (
            <div
              className={`text-xs flex items-center gap-1 ${getDaysRemainingClass()}`}
              title={formatDueDate(task.deadline)}
            >
              <CalendarIcon className="h-3 w-3" />
              <span>{getDaysRemainingText()}</span>
            </div>
          )}

          <PriorityBadge />
        </div>

        {assignee && (
          <div
            className="flex items-center gap-1 text-xs text-gray-500"
            title={`Исполнитель: ${assignee.name || assignee.email}`}
          >
            <UserIcon className="h-3 w-3" />
            <span className="truncate max-w-[100px]">
              {assignee.name || assignee.email}
            </span>
          </div>
        )}
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-100 p-1 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

// Мемоизация компонента для предотвращения ненужных перерендеров
export default memo(TaskCard);
