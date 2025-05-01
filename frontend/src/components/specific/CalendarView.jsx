import React, { useState, useEffect, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import ruLocale from "@fullcalendar/core/locales/ru";
import { toast } from "react-toastify";
import {
  AdjustmentsHorizontalIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon,
  CalendarDaysIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import debounce from "lodash/debounce";
import Modal from "../common/Modal";

const EVENT_TYPES = {
  task: { title: "Задача", color: "#3B82F6" },
  deadline: { title: "Дедлайн", color: "#EF4444" },
  training: { title: "Тренинг", color: "#10B981" },
  meeting: { title: "Встреча", color: "#8B5CF6" },
};

const PRIORITIES = {
  low: { title: "Низкий", color: "#94A3B8" },
  medium: { title: "Средний", color: "#F59E0B" },
  high: { title: "Высокий", color: "#EF4444" },
};

export default function CalendarView({ tasks, departments = [] }) {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    eventType: [],
    department: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    priority: "",
    status: "",
  });
  const [viewType, setViewType] = useState(() => {
    return window.innerWidth < 768 ? "listWeek" : "dayGridMonth";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dragInfo, setDragInfo] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const [userSettings, setUserSettings] = useState(() => {
    const savedSettings = localStorage.getItem("calendarViewSettings");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          filters: { eventType: [], department: "" },
          viewType: window.innerWidth < 768 ? "listWeek" : "dayGridMonth",
        };
  });

  useEffect(() => {
    if (userSettings) {
      setFilters(userSettings.filters);
      setViewType(userSettings.viewType);
    }
  }, []);

  useEffect(() => {
    const settings = {
      filters,
      viewType,
    };
    localStorage.setItem("calendarViewSettings", JSON.stringify(settings));
  }, [filters, viewType]);

  useEffect(() => {
    if (!tasks || !Array.isArray(tasks)) return;

    const mappedEvents = tasks.map((task) => {
      let eventType = "task";

      const lowerTitle = (task.title || "").toLowerCase();
      const lowerDesc = (task.description || "").toLowerCase();

      if (
        lowerTitle.includes("встреча") ||
        lowerDesc.includes("встреча") ||
        lowerTitle.includes("собеседование") ||
        lowerDesc.includes("собеседование")
      ) {
        eventType = "meeting";
      } else if (
        lowerTitle.includes("тренинг") ||
        lowerDesc.includes("тренинг") ||
        lowerTitle.includes("обучение") ||
        lowerDesc.includes("обучение") ||
        lowerTitle.includes("семинар") ||
        lowerDesc.includes("семинар")
      ) {
        eventType = "training";
      }

      if (
        task.priority === "high" ||
        (task.due_date &&
          new Date(task.due_date) <= new Date(Date.now() + 24 * 60 * 60 * 1000))
      ) {
        eventType = "deadline";
      }

      return {
        id: task.id,
        title: task.title,
        start: task.due_date || task.created_at,
        description: task.description || "",
        backgroundColor: EVENT_TYPES[eventType].color,
        borderColor: EVENT_TYPES[eventType].color,
        textColor: "#FFFFFF",
        extendedProps: {
          type: eventType,
          department: task.assignee?.department || "",
          status: task.status,
          priority: task.priority,
          taskId: task.id,
        },
        editable: true,
        durationEditable: false,
      };
    });

    setEvents(mappedEvents);
  }, [tasks]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (
        filters.eventType.length > 0 &&
        !filters.eventType.includes(event.extendedProps.type)
      ) {
        return false;
      }

      if (
        filters.department &&
        event.extendedProps.department !== filters.department
      ) {
        return false;
      }

      return true;
    });
  }, [events, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (filterType === "eventType") {
        if (prev.eventType.includes(value)) {
          newFilters.eventType = prev.eventType.filter(
            (type) => type !== value
          );
        } else {
          newFilters.eventType = [...prev.eventType, value];
        }
      } else {
        newFilters[filterType] = value;
      }

      return newFilters;
    });
  };

  const handleEventClick = (info) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      description: event.extendedProps.description || "",
      type: event.extendedProps.type,
      department: event.extendedProps.department,
      status: event.extendedProps.status,
      priority: event.extendedProps.priority,
      taskId: event.extendedProps.taskId,
    });
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
    setIsEditing(false);
    setEditData({
      title: "",
      description: "",
      priority: "",
      status: "",
    });
  };

  const enableEditMode = () => {
    if (!selectedEvent) return;

    setIsEditing(true);
    setEditData({
      title: selectedEvent.title,
      description: selectedEvent.description,
      priority: selectedEvent.priority,
      status: selectedEvent.status,
    });
  };

  const saveTaskChanges = useCallback(async () => {
    if (!selectedEvent) return;
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      const response = await fetch(
        `http://localhost:8000/tasks/${selectedEvent.taskId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: editData.title,
            description: editData.description,
            priority: editData.priority,
            status: editData.status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при обновлении задачи");
      }

      toast.success("Задача успешно обновлена");

      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === selectedEvent.id
            ? {
                ...event,
                title: editData.title,
                description: editData.description,
                extendedProps: {
                  ...event.extendedProps,
                  priority: editData.priority,
                  status: editData.status,
                },
              }
            : event
        )
      );

      closeEventModal();
    } catch (err) {
      console.error("Ошибка при обновлении задачи:", err);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent, editData]);

  const handleEventDrop = useCallback(async (info) => {
    const { event } = info;
    setIsDragging(true);

    setDragInfo({
      id: event.id,
      taskId: event.extendedProps.taskId,
      newDate: event.start,
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Необходимо авторизоваться");
        info.revert();
        return;
      }

      toast.info("Обновление даты...", {
        autoClose: false,
        toastId: `drag-${event.id}`,
      });

      const response = await fetch(
        `http://localhost:8000/tasks/${event.extendedProps.taskId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deadline: event.start.toISOString(),
            plan_id: event.extendedProps.planId || 1,
            user_id: event.extendedProps.userId || 1,
            title: event.title,
            description: event.extendedProps.description || "",
            priority: event.extendedProps.priority || "medium",
          }),
        }
      );

      if (!response.ok) {
        info.revert();
        throw new Error("Не удалось обновить дату задачи");
      }

      toast.dismiss(`drag-${event.id}`);
      toast.success("Дата задачи успешно обновлена");
    } catch (err) {
      info.revert();
      console.error("Ошибка при обновлении даты задачи:", err);
      toast.error(`Ошибка: ${err.message}`);
    } finally {
      setIsDragging(false);
    }
  }, []);

  const handleExternalDrop = useCallback(
    debounce(async (info) => {
      const droppedEl = info.draggedEl;
      const taskId = droppedEl.getAttribute("data-task-id");
      const taskTitle = droppedEl.getAttribute("data-task-title");

      if (taskId) {
        try {
          const token = localStorage.getItem("token");
          if (!token) {
            toast.error("Необходимо авторизоваться");
            return;
          }

          const newDate = info.date.toISOString().split("T")[0];

          toast.info(`Планирование задачи "${taskTitle}"...`, {
            autoClose: false,
            toastId: `external-drag-${taskId}`,
          });

          const response = await fetch(
            `http://localhost:8000/tasks/${taskId}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                due_date: newDate,
              }),
            }
          );

          if (!response.ok) {
            throw new Error("Не удалось обновить дату задачи");
          }

          toast.dismiss(`external-drag-${taskId}`);
          toast.success(
            `Задача "${taskTitle}" запланирована на ${new Date(
              newDate
            ).toLocaleDateString("ru-RU")}`
          );
        } catch (err) {
          console.error("Ошибка при планировании задачи:", err);
          toast.error(`Ошибка: ${err.message}`);
        }
      }
    }, 250),
    []
  );

  useEffect(() => {
    const handleResize = () => {
      const newViewType =
        window.innerWidth < 768
          ? "listWeek"
          : userSettings?.viewType || "dayGridMonth";
      setViewType(newViewType);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [userSettings]);

  const handleViewTypeChange = (newViewType) => {
    setViewType(newViewType);
    setUserSettings((prev) => ({
      ...prev,
      viewType: newViewType,
    }));
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800 flex items-center">
          <CalendarDaysIcon className="h-5 w-5 mr-2 text-blue-500" />
          Календарь задач
        </h3>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
            Фильтры
          </button>

          <div className="sm:hidden">
            <button
              onClick={() =>
                handleViewTypeChange(
                  viewType === "listWeek" ? "dayGridMonth" : "listWeek"
                )
              }
              className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              <DevicePhoneMobileIcon className="h-4 w-4 mr-1" />
              {viewType === "listWeek" ? "Календарь" : "Список"}
            </button>
          </div>

          <div className="hidden sm:flex space-x-2">
            <button
              onClick={() => handleViewTypeChange("dayGridMonth")}
              className={`px-2 py-1 text-xs rounded ${
                viewType === "dayGridMonth"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Месяц
            </button>
            <button
              onClick={() => handleViewTypeChange("timeGridWeek")}
              className={`px-2 py-1 text-xs rounded ${
                viewType === "timeGridWeek"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Неделя
            </button>
            <button
              onClick={() => handleViewTypeChange("listWeek")}
              className={`px-2 py-1 text-xs rounded ${
                viewType === "listWeek"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Список
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Типы событий:
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(EVENT_TYPES).map(([type, { title, color }]) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange("eventType", type)}
                  className={`px-2 py-1 text-xs rounded-full flex items-center ${
                    filters.eventType.includes(type)
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <div
                    className="w-2 h-2 rounded-full mr-1"
                    style={{ backgroundColor: color }}
                  ></div>
                  {title}
                </button>
              ))}
            </div>
          </div>

          {departments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Отдел:</h4>
              <select
                value={filters.department}
                onChange={(e) =>
                  handleFilterChange("department", e.target.value)
                }
                className="block w-full sm:w-auto px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Все отделы</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button
              onClick={() => {
                setFilters({ eventType: [], department: "" });
                setUserSettings((prev) => ({
                  ...prev,
                  filters: { eventType: [], department: "" },
                }));
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>
      )}

      <div className="mb-3 text-sm text-gray-600 italic">
        Подсказка: вы можете перетаскивать задачи в календаре для изменения их
        даты.
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={viewType}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,listWeek",
        }}
        locale={ruLocale}
        events={filteredEvents}
        eventClick={handleEventClick}
        height={window.innerWidth < 768 ? "auto" : 600}
        themeSystem="standard"
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
          hour12: false,
        }}
        dayMaxEvents={3}
        moreLinkText="еще {0}"
        buttonText={{
          today: "Сегодня",
          month: "Месяц",
          week: "Неделя",
          list: "Список",
        }}
        editable={true}
        droppable={true}
        eventDrop={handleEventDrop}
        drop={handleExternalDrop}
        eventDragStart={() => {
          setIsDragging(true);
        }}
        eventDragStop={() => {
          setTimeout(() => setIsDragging(false), 100);
        }}
        slotLabelFormat={{
          hour: "numeric",
          minute: "2-digit",
          omitZeroMinute: true,
          meridiem: false,
        }}
        listDayFormat={{
          weekday: "short",
          month: "numeric",
          day: "numeric",
        }}
        views={{
          listWeek: {
            titleFormat: { year: "numeric", month: "short", day: "numeric" },
          },
        }}
      />

      {window.innerWidth < 768 && viewType !== "listWeek" && (
        <div className="mt-3 text-center">
          <button
            onClick={() => handleViewTypeChange("listWeek")}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded"
          >
            Переключиться на список
          </button>
        </div>
      )}

      {selectedEvent && (
        <Modal
          isOpen={selectedEvent !== null}
          onClose={closeEventModal}
          title={isEditing ? "Редактирование задачи" : "Детали события"}
          variant="info"
          footer={
            isEditing ? (
              <>
                <button
                  onClick={closeEventModal}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Отмена
                </button>
                <button
                  onClick={saveTaskChanges}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Сохранение..."
                  ) : (
                    <>
                      <CheckIcon className="h-4 w-4 mr-1" />
                      Сохранить
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={enableEditMode}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <PencilSquareIcon className="h-4 w-4 mr-1" />
                Редактировать
              </button>
            )
          }
        >
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Название задачи
                </label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Описание
                </label>
                <textarea
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Приоритет
                </label>
                <select
                  value={editData.priority}
                  onChange={(e) =>
                    setEditData({ ...editData, priority: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Статус
                </label>
                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({ ...editData, status: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="not_started">Не начата</option>
                  <option value="in_progress">В процессе</option>
                  <option value="completed">Завершена</option>
                  <option value="blocked">Заблокирована</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h4 className="text-lg font-medium">{selectedEvent.title}</h4>
                <p className="text-sm text-gray-500">
                  {new Date(selectedEvent.start).toLocaleString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {selectedEvent.description && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700">
                    Описание:
                  </h5>
                  <p className="text-sm text-gray-600">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <h5 className="text-xs font-medium text-gray-500">Тип:</h5>
                  <p
                    className="text-sm font-medium"
                    style={{ color: EVENT_TYPES[selectedEvent.type].color }}
                  >
                    {EVENT_TYPES[selectedEvent.type].title}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-medium text-gray-500">
                    Приоритет:
                  </h5>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: PRIORITIES[selectedEvent.priority]?.color,
                    }}
                  >
                    {PRIORITIES[selectedEvent.priority]?.title || "Не указан"}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-medium text-gray-500">Отдел:</h5>
                  <p className="text-sm">
                    {selectedEvent.department || "Не указан"}
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-medium text-gray-500">Статус:</h5>
                  <p className="text-sm">
                    {selectedEvent.status === "not_started" && "Не начата"}
                    {selectedEvent.status === "in_progress" && "В процессе"}
                    {selectedEvent.status === "completed" && "Завершена"}
                    {selectedEvent.status === "blocked" && "Заблокирована"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      )}

      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Типы событий:
        </h4>
        <div className="flex flex-wrap gap-3">
          {Object.entries(EVENT_TYPES).map(([type, { title, color }]) => (
            <div key={type} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-xs text-gray-600">{title}</span>
            </div>
          ))}
        </div>
      </div>

      {isDragging && (
        <div className="fixed inset-0 bg-blue-900 bg-opacity-10 pointer-events-none z-40"></div>
      )}
    </div>
  );
}
