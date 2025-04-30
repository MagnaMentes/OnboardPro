import React, { useState, useEffect, useRef } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ru } from "date-fns/locale";

export default function CalendarView({
  events = [],
  onDateSelect,
  onEventClick,
  eventColors = {
    default: "bg-blue-500",
    important: "bg-red-500",
    casual: "bg-green-500",
  },
  className = "",
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const calendarRef = useRef(null);

  // Определяем, является ли устройство мобильным
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  // Обработчики для свайпа на мобильных устройствах
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStartX === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Если свайп достаточно длинный, меняем месяц
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Свайп влево - следующий месяц
        nextMonth();
      } else {
        // Свайп вправо - предыдущий месяц
        prevMonth();
      }
    }

    setTouchStartX(null);
  };

  // Функция перехода к предыдущему месяцу
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Функция перехода к следующему месяцу
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Функция выбора даты
  const onDateClick = (day) => {
    setSelectedDate(day);
    if (onDateSelect) {
      onDateSelect(day);
    }
  };

  // Создание массива дней для текущего месяца
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Получение событий для конкретной даты
  const getEventsForDate = (date) => {
    return events.filter((event) => isSameDay(new Date(event.date), date));
  };

  // Форматирование дня недели
  const formatDayOfWeek = (date) => {
    return format(date, "EEEEEE", { locale: ru }).toUpperCase();
  };

  // Получение дней недели
  const weekDays = [...Array(7)].map((_, i) => {
    const date = new Date(2021, 0, i + 1); // 2021-01-01 это пятница
    return formatDayOfWeek(date);
  });

  // Определение первого дня недели (воскресенье или понедельник)
  const firstDayOfWeek = 1; // 0 для воскресенья, 1 для понедельника

  // Создание календарной сетки
  const createCalendarGrid = () => {
    const monthStartDate = startOfMonth(currentMonth);
    const monthStartDay = monthStartDate.getDay();

    // Корректировка дня недели для первого дня месяца
    let firstDay = monthStartDay - firstDayOfWeek;
    if (firstDay < 0) firstDay += 7;

    // Создание пустых ячеек для начала месяца
    const blanks = Array(firstDay).fill(null);

    return [...blanks, ...daysInMonth];
  };

  const calendarGrid = createCalendarGrid();

  return (
    <div
      className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}
      ref={calendarRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Заголовок календаря с навигацией */}
      <div className="px-4 py-3 flex items-center justify-between bg-blue-600 text-white">
        <div className="flex items-center">
          <CalendarIcon className="w-6 h-6 mr-2" />
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "LLLL yyyy", { locale: ru })}
          </h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors"
            aria-label="Предыдущий месяц"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors"
            aria-label="Текущий месяц"
          >
            <span className="text-sm">Сегодня</span>
          </button>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-colors"
            aria-label="Следующий месяц"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Дни недели */}
      <div className="grid grid-cols-7 text-center bg-gray-100 text-sm text-gray-500 py-2">
        {weekDays.map((day, i) => (
          <div key={i} className="font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Календарная сетка */}
      <div
        className={`grid grid-cols-7 ${isMobile ? "gap-1 p-1" : "gap-1 p-2"}`}
      >
        {calendarGrid.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="aspect-square"></div>;
          }

          const eventsForDay = getEventsForDate(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelectedDay = isSameDay(day, selectedDate);
          const isTodayDay = isToday(day);

          return (
            <div
              key={day.toString()}
              className={`
                ${isMobile ? "p-1" : "p-2"} 
                relative rounded-md 
                ${isCurrentMonth ? "" : "opacity-40"}
                ${isSelectedDay ? "bg-blue-100 ring-2 ring-blue-400" : ""}
                ${
                  isTodayDay && !isSelectedDay
                    ? "bg-yellow-50 ring-1 ring-yellow-300"
                    : ""
                }
                hover:bg-blue-50 transition-colors cursor-pointer
              `}
              onClick={() => onDateClick(day)}
            >
              <div
                className={`
                ${isSelectedDay ? "text-blue-600" : ""}
                ${
                  isTodayDay && !isSelectedDay
                    ? "text-yellow-600 font-bold"
                    : ""
                }
                ${isMobile ? "text-sm" : ""} font-medium
              `}
              >
                {format(day, "d")}
              </div>

              {/* События для данного дня */}
              <div
                className={`
                mt-1 flex flex-col space-y-1 
                ${
                  isMobile && eventsForDay.length > 2
                    ? "h-10 overflow-y-auto"
                    : ""
                }
              `}
              >
                {eventsForDay.length > 0 &&
                isMobile &&
                eventsForDay.length > 3 ? (
                  <>
                    {eventsForDay.slice(0, 2).map((event, j) => (
                      <div
                        key={j}
                        className={`
                          px-1 py-0.5 rounded text-white text-xs truncate
                          ${eventColors[event.type] || eventColors.default}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick && onEventClick(event);
                        }}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 flex items-center justify-center">
                      <EllipsisHorizontalIcon className="w-4 h-4" />
                      <span>{eventsForDay.length - 2}</span>
                    </div>
                  </>
                ) : (
                  eventsForDay.map((event, j) => (
                    <div
                      key={j}
                      className={`
                        ${isMobile ? "px-1 py-0.5" : "px-2 py-1"} 
                        rounded text-white 
                        ${isMobile ? "text-xs" : "text-sm"} 
                        truncate
                        ${eventColors[event.type] || eventColors.default}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick && onEventClick(event);
                      }}
                      title={event.title}
                    >
                      {isMobile
                        ? event.title.slice(0, 10) +
                          (event.title.length > 10 ? "..." : "")
                        : event.title}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Мобильный вид для выбранной даты и её событий */}
      {isMobile && (
        <div className="border-t p-3">
          <h3 className="font-medium text-gray-800 mb-2">
            {format(selectedDate, "d MMMM yyyy", { locale: ru })}
          </h3>
          <div className="space-y-2">
            {getEventsForDate(selectedDate).length === 0 ? (
              <p className="text-sm text-gray-500">Нет событий на эту дату</p>
            ) : (
              getEventsForDate(selectedDate).map((event, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-md p-2 border border-gray-200"
                  onClick={() => onEventClick && onEventClick(event)}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        eventColors[event.type] || eventColors.default
                      } mr-2`}
                    ></div>
                    <h4 className="font-medium text-sm">{event.title}</h4>
                  </div>
                  {event.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {event.description}
                    </p>
                  )}
                  {event.time && (
                    <p className="text-xs text-gray-600 mt-1">{event.time}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
