// filepath: /Users/magna_mentes/Desktop/Projects/OnboardPro/frontend/src/components/specific/Table.jsx
import React, { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

export default function Table({
  data = [],
  columns = [],
  title = "",
  allowSort = true,
  allowFilter = true,
  allowEdit = false,
  allowDelete = false,
  onEdit,
  onDelete,
  emptyMessage = "Нет данных для отображения",
  pageSize = 10,
}) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [draggable, setDraggable] = useState(false);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Helper function for sorting data
  const sortData = (dataToSort) => {
    if (!sortConfig.key) return dataToSort;

    return [...dataToSort].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle null/undefined values
      if (aValue == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue == null) return sortConfig.direction === "asc" ? 1 : -1;

      // Check if values are dates
      if (isDateString(aValue) && isDateString(bValue)) {
        const dateA = new Date(aValue);
        const dateB = new Date(bValue);
        return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
      }

      // Handle strings
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      // Handle numbers and other types
      return sortConfig.direction === "asc"
        ? aValue > bValue
          ? 1
          : -1
        : aValue < bValue
        ? 1
        : -1;
    });
  };

  // Helper function to check if a string is a date
  const isDateString = (str) => {
    if (typeof str !== "string") return false;
    const date = new Date(str);
    return !isNaN(date.getTime()) && str.includes("-");
  };

  // Handle sorting when column header is clicked
  const handleSort = (key) => {
    if (!allowSort) return;

    setSortConfig((currentSortConfig) => {
      if (currentSortConfig.key === key) {
        return {
          key,
          direction: currentSortConfig.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  // Filter data based on search input
  const getFilteredData = () => {
    if (!filter.trim()) return data;

    return data.filter((item) => {
      return columns.some((column) => {
        const value = item[column.key];
        return (
          value && value.toString().toLowerCase().includes(filter.toLowerCase())
        );
      });
    });
  };

  // Get current page data
  const getCurrentPageData = () => {
    const filteredData = getFilteredData();
    const sortedData = sortData(filteredData);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return sortedData.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalItems = getFilteredData().length;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Handle drag start for moving tasks
  const handleDragStart = (e, item) => {
    // Если перетаскивание не включено, ничего не делаем
    if (!draggable) return;

    // Устанавливаем данные о задаче для перетаскивания
    e.dataTransfer.setData("application/json", JSON.stringify(item));

    // Для визуальной обратной связи
    e.dataTransfer.effectAllowed = "move";

    // Добавляем данные как атрибуты для обработки в календаре
    const taskId = item.id || item.task_id;
    if (taskId) {
      e.target.setAttribute("data-task-id", taskId);
      e.target.setAttribute(
        "data-task-title",
        item.title || item.name || "Задача"
      );
    }

    // Применяем стили для элемента при перетаскивании
    setTimeout(() => {
      e.target.classList.add("opacity-50");
    }, 0);
  };

  const handleDragEnd = (e) => {
    // Убираем визуальные эффекты после окончания перетаскивания
    e.target.classList.remove("opacity-50");
    e.target.removeAttribute("data-task-id");
    e.target.removeAttribute("data-task-title");
  };

  // Переключатель режима перетаскивания
  const toggleDraggable = () => {
    setDraggable(!draggable);
    toast.info(
      !draggable
        ? "Режим перетаскивания задач включен. Теперь вы можете перетащить задачу в календарь для планирования."
        : "Режим перетаскивания задач выключен."
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 sm:px-6 border-b border-gray-200 flex flex-wrap justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          {/* Включение режима перетаскивания */}
          <button
            onClick={toggleDraggable}
            className={`px-3 py-1 text-sm rounded flex items-center ${
              draggable
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            {draggable ? "Перетаскивание вкл." : "Перетаскивание"}
          </button>

          {/* Search input */}
          {allowFilter && (
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="block w-full sm:w-auto pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    allowSort ? "cursor-pointer select-none" : ""
                  } ${column.width ? `w-${column.width}` : ""}`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {allowSort && sortConfig.key === column.key && (
                      <span>
                        {sortConfig.direction === "asc" ? (
                          <ChevronUpIcon className="h-4 w-4" />
                        ) : (
                          <ChevronDownIcon className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(allowEdit || allowDelete) && (
                <th scope="col" className="relative px-4 py-3">
                  <span className="sr-only">Действия</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getCurrentPageData().length > 0 ? (
              getCurrentPageData().map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`${
                    draggable
                      ? "cursor-grab hover:bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  draggable={draggable}
                  onDragStart={(e) => handleDragStart(e, item)}
                  onDragEnd={handleDragEnd}
                >
                  {columns.map((column) => (
                    <td
                      key={`${item.id || index}-${column.key}`}
                      className="px-4 py-2 whitespace-normal text-sm text-gray-700"
                    >
                      {column.render
                        ? column.render(item[column.key], item)
                        : formatValue(item[column.key], column.type)}
                    </td>
                  ))}
                  {(allowEdit || allowDelete) && (
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {allowEdit && (
                          <button
                            onClick={() => onEdit && onEdit(item)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Редактировать"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        )}
                        {allowDelete && (
                          <button
                            onClick={() => onDelete && onDelete(item)}
                            className="text-red-600 hover:text-red-800"
                            title="Удалить"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (allowEdit || allowDelete ? 1 : 0)}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex sm:items-center text-sm text-gray-700">
            Показано{" "}
            <span className="font-medium mx-1">
              {Math.min((currentPage - 1) * pageSize + 1, totalItems)}
            </span>
            {" - "}
            <span className="font-medium mx-1">
              {Math.min(currentPage * pageSize, totalItems)}
            </span>{" "}
            из <span className="font-medium mx-1">{totalItems}</span>{" "}
            результатов
          </div>
          <div className="flex-1 flex justify-center sm:justify-end">
            <nav className="inline-flex rounded-md shadow-sm">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-1 border ${
                  currentPage === 1
                    ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 bg-white text-blue-600 hover:bg-gray-50"
                } text-sm font-medium rounded-l-md`}
              >
                &laquo;
              </button>
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-3 py-1 border ${
                  currentPage === 1
                    ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                } text-sm font-medium`}
              >
                &lsaquo;
              </button>

              {/* Page numbers */}
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                // Calculate page numbers to show
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-3 py-1 border text-sm font-medium ${
                      currentPage === pageNum
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-3 py-1 border ${
                  currentPage === totalPages
                    ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                } text-sm font-medium`}
              >
                &rsaquo;
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-1 border ${
                  currentPage === totalPages
                    ? "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "border-gray-300 bg-white text-blue-600 hover:bg-gray-50"
                } text-sm font-medium rounded-r-md`}
              >
                &raquo;
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Перетаскивание включено - подсказка */}
      {draggable && (
        <div className="px-4 py-2 bg-blue-50 text-blue-800 text-xs">
          <p>
            Перетащите задачу в календарь, чтобы запланировать ее на
            определенную дату
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to format different value types
function formatValue(value, type) {
  if (value === null || value === undefined) return "-";

  switch (type) {
    case "date":
      return new Date(value).toLocaleDateString("ru-RU");
    case "datetime":
      return new Date(value).toLocaleString("ru-RU");
    case "boolean":
      return value ? "Да" : "Нет";
    case "money":
      return `${Number(value).toLocaleString("ru-RU")} ₽`;
    default:
      return value.toString();
  }
}
