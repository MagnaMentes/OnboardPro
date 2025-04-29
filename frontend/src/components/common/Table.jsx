import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsUpDownIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

export default function Table({
  data = [],
  columns = [],
  title = "Таблица",
  enableExport = false,
  exportUrl = "",
  filters = {},
  loading = false,
  className = "",
  pagination = false,
  pageSize = 10,
  id = "default-table", // Добавлен id для разных таблиц
}) {
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  // Загружаем сохраненные настройки таблицы
  useEffect(() => {
    const savedSettings = localStorage.getItem(`table-settings-${id}`);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setSortConfig(settings.sortConfig || { key: "", direction: "" });
        setSearchQuery(settings.searchQuery || "");
        setCurrentPage(settings.currentPage || 1);
      } catch (err) {
        console.error("Ошибка при загрузке настроек таблицы:", err);
      }
    }
  }, [id]);

  // Сохраняем настройки при их изменении
  useEffect(() => {
    const settings = {
      sortConfig,
      searchQuery,
      currentPage,
    };
    localStorage.setItem(`table-settings-${id}`, JSON.stringify(settings));
  }, [sortConfig, searchQuery, currentPage, id]);

  // Сортировка данных
  const sortedData = useMemo(() => {
    let sortableData = [...data];

    // Применяем строковый поиск по всем полям, если задана строка поиска
    if (searchQuery.trim() !== "") {
      sortableData = sortableData.filter((item) =>
        Object.values(item).some(
          (value) =>
            value !== null &&
            value !== undefined &&
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Сортировка данных, если указаны параметры сортировки
    if (sortConfig.key && sortConfig.direction) {
      sortableData.sort((a, b) => {
        // Получаем значения поля, по которому сортируем
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Преобразование к нижнему регистру для строк
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // Обработка значений null и undefined
        if (aValue === null || aValue === undefined)
          return sortConfig.direction === "ascending" ? -1 : 1;
        if (bValue === null || bValue === undefined)
          return sortConfig.direction === "ascending" ? 1 : -1;

        // Собственно сравнение
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableData;
  }, [data, sortConfig, searchQuery]);

  // Пагинация данных
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  // Общее количество страниц
  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    return Math.ceil(sortedData.length / pageSize);
  }, [sortedData.length, pagination, pageSize]);

  // Сброс текущей страницы при изменении данных или размера страницы
  useEffect(() => {
    setCurrentPage(1);
  }, [data, pageSize]);

  // Обработчик изменения сортировки
  const requestSort = (key) => {
    let direction = "ascending";

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (
      sortConfig.key === key &&
      sortConfig.direction === "descending"
    ) {
      // Циклический переключатель: ascending -> descending -> none
      key = "";
      direction = "";
    }

    setSortConfig({ key, direction });
  };

  // Функция для отображения иконки сортировки
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowsUpDownIcon className="h-4 w-4 text-gray-400" />;
    }

    if (sortConfig.direction === "ascending") {
      return <ChevronUpIcon className="h-4 w-4 text-blue-600" />;
    }

    return <ChevronDownIcon className="h-4 w-4 text-blue-600" />;
  };

  // Обработчик экспорта данных в CSV
  const handleExportCSV = async () => {
    if (isExporting) return; // Предотвращение множественных нажатий
    setIsExporting(true);

    try {
      toast.info("Подготовка CSV файла...");
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Не авторизован");
      }

      // Формирование URL с параметрами фильтрации для экспорта
      let url = exportUrl ? `${exportUrl}?export_csv=true` : "";

      // Добавляем параметры фильтрации из проп filters, если они есть
      if (filters && Object.keys(filters).length > 0) {
        const queryParams = [];

        for (const [key, value] of Object.entries(filters)) {
          if (value) {
            if (key.includes("date")) {
              queryParams.push(
                `${key}=${value}${
                  key.includes("start") ? "T00:00:00" : "T23:59:59"
                }`
              );
            } else {
              queryParams.push(`${key}=${encodeURIComponent(value)}`);
            }
          }
        }

        if (queryParams.length > 0) {
          url += `&${queryParams.join("&")}`;
        }
      }

      if (exportUrl) {
        // Если указан URL для экспорта, используем API
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Ошибка при экспорте данных");
        }

        // Получаем файл и создаем ссылку для скачивания
        const blob = await response.blob();
        const url1 = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url1;

        // Формируем имя файла с текущей датой
        const today = new Date().toISOString().slice(0, 10);
        a.download = `onboardpro_export_${today}.csv`;

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url1);
        document.body.removeChild(a);

        toast.success("Файл CSV успешно скачан");
      } else {
        // Если URL не указан, экспортируем локально
        exportTableToCSV();
      }
    } catch (err) {
      console.error("Ошибка при экспорте данных:", err);
      toast.error(`Ошибка при экспорте данных: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Улучшенная функция для экспорта данных таблицы в CSV на стороне клиента
  const exportTableToCSV = () => {
    try {
      toast.info("Подготовка CSV файла...");

      // Используем заголовки колонок из props
      const headers = columns.map((column) => column.header);

      // Подготовка BOM для правильного отображения кириллицы в Excel
      const BOM = "\uFEFF";

      // Преобразуем данные в строки CSV
      const dataRows = sortedData.map((row) =>
        columns
          .map((column) => {
            let cellValue = row[column.accessor];

            // Форматирование данных, если указан formatter
            if (column.formatter) {
              cellValue = column.formatter(cellValue, row);
            }

            // Преобразуем в строку и экранируем запятые и кавычки
            cellValue = String(cellValue || "")
              .replace(/"/g, '""') // Экранируем кавычки
              .replace(/\n/g, " "); // Заменяем переносы строк

            return `"${cellValue}"`; // Оборачиваем в кавычки
          })
          .join(",")
      );

      // Собираем CSV-контент с BOM для поддержки кириллицы
      const csvContent = BOM + [headers.join(","), ...dataRows].join("\n");

      // Создаем Blob и ссылку для скачивания
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Формируем имя файла с текущей датой
      const today = new Date().toISOString().slice(0, 10);
      a.download = `onboardpro_export_${today}.csv`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Файл CSV успешно скачан");
    } catch (err) {
      console.error("Ошибка при экспорте данных:", err);
      toast.error(`Ошибка при экспорте данных: ${err.message}`);
    }
  };

  // Функция для сброса настроек таблицы
  const resetTableSettings = () => {
    setSortConfig({ key: "", direction: "" });
    setSearchQuery("");
    setCurrentPage(1);
    localStorage.removeItem(`table-settings-${id}`);
    toast.info("Настройки таблицы сброшены");
  };

  // Функция для генерации кнопок пагинации
  const renderPaginationButtons = () => {
    if (!pagination || totalPages <= 1) return null;

    const buttons = [];

    // Кнопка "Предыдущая страница"
    buttons.push(
      <button
        key="prev"
        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 text-sm rounded ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        &laquo;
      </button>
    );

    // Генерация номеров страниц
    // Показываем 5 страниц одновременно плюс первую и последнюю
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    // Первая страница
    if (startPage > 1) {
      buttons.push(
        <button
          key="1"
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
        >
          1
        </button>
      );

      // Троеточие, если есть пропуск
      if (startPage > 2) {
        buttons.push(
          <span key="dots1" className="px-3 py-1 text-sm text-gray-600">
            ...
          </span>
        );
      }
    }

    // Генерация кнопок для страниц
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 text-sm rounded ${
            currentPage === i
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {i}
        </button>
      );
    }

    // Троеточие в конце, если нужно
    if (endPage < totalPages - 1) {
      buttons.push(
        <span key="dots2" className="px-3 py-1 text-sm text-gray-600">
          ...
        </span>
      );
    }

    // Последняя страница
    if (endPage < totalPages) {
      buttons.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
        >
          {totalPages}
        </button>
      );
    }

    // Кнопка "Следующая страница"
    buttons.push(
      <button
        key="next"
        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 text-sm rounded ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        &raquo;
      </button>
    );

    return <div className="flex space-x-1 justify-center mt-4">{buttons}</div>;
  };

  // Если нет данных или колонок
  if (!data.length && !loading) {
    return (
      <div className={`bg-white p-4 sm:p-6 rounded-lg shadow-md ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        </div>
        <div className="py-6 text-center text-gray-500">
          Нет данных для отображения
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-4 sm:p-6 rounded-lg shadow-md ${className}`}>
      {/* Заголовок и кнопки управления */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>

        <div className="flex flex-wrap mt-2 sm:mt-0 space-x-2">
          {/* Строка поиска */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="block w-full sm:w-48 pl-10 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-2"
                onClick={() => setSearchQuery("")}
              >
                <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Кнопка сброса настроек */}
          <button
            onClick={resetTableSettings}
            className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 focus:outline-none"
            title="Сбросить настройки"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
            Сбросить
          </button>

          {/* Кнопка экспорта */}
          {enableExport && (
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className={`flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                isExporting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              {isExporting ? "Экспорт..." : "Экспорт CSV"}
            </button>
          )}
        </div>
      </div>

      {/* Индикатор загрузки */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Таблица */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.accessor}
                      scope="col"
                      className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable !== false
                          ? "cursor-pointer hover:bg-gray-100"
                          : ""
                      }`}
                      onClick={() => {
                        if (column.sortable !== false) {
                          requestSort(column.accessor);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <span className="mr-1">{column.header}</span>
                        {column.sortable !== false && (
                          <span>{getSortIcon(column.accessor)}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    {columns.map((column) => (
                      <td
                        key={`${rowIndex}-${column.accessor}`}
                        className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-800"
                      >
                        {column.formatter
                          ? column.formatter(row[column.accessor], row)
                          : row[column.accessor]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Информация о количестве записей */}
          <div className="mt-3 text-sm text-gray-500 flex justify-between items-center flex-wrap">
            <div>
              Показано: {pagination ? (currentPage - 1) * pageSize + 1 : 1} -{" "}
              {pagination
                ? Math.min(currentPage * pageSize, sortedData.length)
                : sortedData.length}{" "}
              из {sortedData.length} записей
              {data.length !== sortedData.length && searchQuery && (
                <span className="ml-2 text-blue-500">
                  (отфильтровано из {data.length})
                </span>
              )}
            </div>

            {/* Элементы управления пагинацией */}
            {renderPaginationButtons()}
          </div>
        </>
      )}
    </div>
  );
}
