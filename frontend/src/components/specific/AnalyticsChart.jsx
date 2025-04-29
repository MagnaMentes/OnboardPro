import { useState, useEffect, useRef, useMemo } from "react";
import { Chart, registerables } from "chart.js";
// Регистрируем все компоненты Chart.js
Chart.register(...registerables);

/**
 * Компонент для отображения аналитических данных с возможностью фильтрации
 *
 * @param {Object} props - Свойства компонента
 * @param {string} props.title - Заголовок графика
 * @param {string} props.type - Тип графика (bar, line, pie, doughnut)
 * @param {Object} props.data - Данные для отображения
 * @param {Array} props.labels - Метки для оси X или для секторов (для круговых диаграмм)
 * @param {Array} props.datasets - Наборы данных для графика
 * @param {Object} props.filters - Примененные фильтры
 * @param {Function} props.onFilterChange - Функция обратного вызова при изменении фильтров
 * @param {Array} props.departments - Список доступных отделов для фильтрации
 * @param {number} props.maxPoints - Максимальное количество точек данных для отображения (для оптимизации)
 */
const AnalyticsChart = ({
  title,
  type = "bar",
  labels = [],
  datasets = [],
  filters = {},
  onFilterChange,
  departments = [],
  maxPoints = 50, // По умолчанию ограничиваем 50 точками данных
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [startDate, setStartDate] = useState(filters.startDate || "");
  const [endDate, setEndDate] = useState(filters.endDate || "");
  const [department, setDepartment] = useState(filters.department || "");
  const [isResponsive, setIsResponsive] = useState(false);
  const [chartWidth, setChartWidth] = useState(0);
  const [chartHeight, setChartHeight] = useState(0);

  // Оптимизация данных в зависимости от размера экрана и максимального количества точек
  const optimizedData = useMemo(() => {
    if (!labels || labels.length <= maxPoints) {
      return { labels, datasets };
    }

    if (type === "line") {
      const step = Math.ceil(labels.length / maxPoints);
      const newLabels = [];
      const newDatasets = datasets.map((dataset) => {
        const newData = [];
        let tempSum = 0;
        let count = 0;

        for (let i = 0; i < dataset.data.length; i++) {
          tempSum += dataset.data[i];
          count++;

          if (count === step || i === dataset.data.length - 1) {
            newData.push(tempSum / count);
            if (newLabels.length < newData.length) {
              newLabels.push(labels[i]);
            }
            tempSum = 0;
            count = 0;
          }
        }

        return {
          ...dataset,
          data: newData,
        };
      });

      return { labels: newLabels, datasets: newDatasets };
    } else if (type === "bar" || type === "pie" || type === "doughnut") {
      if (type === "pie" || type === "doughnut") {
        const newDatasets = datasets.map((dataset) => {
          if (dataset.data.length > maxPoints) {
            const values = [...dataset.data];
            const originalLabels = [...labels];

            const pairs = values.map((value, index) => ({
              value,
              label: originalLabels[index],
            }));
            pairs.sort((a, b) => b.value - a.value);

            const topItems = pairs.slice(0, maxPoints - 1);
            const otherSum = pairs
              .slice(maxPoints - 1)
              .reduce((sum, item) => sum + item.value, 0);

            const newData = topItems.map((item) => item.value);
            newData.push(otherSum);

            const newLabels = topItems.map((item) => item.label);
            newLabels.push("Другие");

            return {
              ...dataset,
              data: newData,
              backgroundColor: [...(dataset.backgroundColor || []), "#cccccc"],
            };
          }
          return dataset;
        });

        return {
          labels:
            newDatasets[0].data.length === labels.length
              ? labels
              : [...labels.slice(0, maxPoints - 1), "Другие"],
          datasets: newDatasets,
        };
      }

      if (labels.length > maxPoints) {
        const step = Math.ceil(labels.length / maxPoints);
        const newLabels = [];

        const newDatasets = datasets.map((dataset) => {
          const newData = [];

          for (let i = 0; i < labels.length; i += step) {
            const chunk = dataset.data.slice(i, i + step);
            const sum = chunk.reduce((acc, val) => acc + val, 0);
            newData.push(sum);

            if (newLabels.length < newData.length) {
              if (step > 1 && i + step < labels.length) {
                newLabels.push(`${labels[i]} - ${labels[i + step - 1]}`);
              } else {
                newLabels.push(labels[i]);
              }
            }
          }

          return {
            ...dataset,
            data: newData,
          };
        });

        return { labels: newLabels, datasets: newDatasets };
      }
    }

    return { labels, datasets };
  }, [labels, datasets, type, maxPoints]);

  // Обработка изменения размеров экрана для адаптивности
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setChartWidth(width);
      setIsResponsive(width < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Создание и обновление графика
  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const dynamicOptions = {
      line: {
        tension: 0.4,
        borderWidth: isResponsive ? 2 : 3,
        pointRadius: isResponsive || optimizedData.labels.length > 20 ? 0 : 3,
        pointHoverRadius: 4,
        spanGaps: true,
        animation:
          optimizedData.labels.length > 100 ? { duration: 0 } : undefined,
        parsing: optimizedData.labels.length > 500 ? false : undefined,
      },
      bar: {
        barPercentage: optimizedData.labels.length > 10 ? 0.9 : 0.8,
        categoryPercentage: optimizedData.labels.length > 10 ? 0.8 : 0.9,
        animation:
          optimizedData.labels.length > 50 ? { duration: 0 } : undefined,
      },
      pie: {
        animation: { duration: isResponsive ? 0 : 800 },
        cutout: "0%",
        radius: isResponsive ? "90%" : "100%",
      },
      doughnut: {
        animation: { duration: isResponsive ? 0 : 800 },
        cutout: "50%",
        radius: isResponsive ? "90%" : "100%",
      },
    };

    const options = {
      responsive: true,
      maintainAspectRatio: !isResponsive,
      aspectRatio: isResponsive ? 1 : 2,
      animation:
        isResponsive && optimizedData.labels.length > 30
          ? { duration: 0 }
          : undefined,
      plugins: {
        legend: {
          position: isResponsive ? "bottom" : "top",
          labels: {
            boxWidth: isResponsive ? 12 : 20,
            font: {
              size: isResponsive ? 10 : 12,
            },
          },
          display: !(isResponsive && optimizedData.labels.length > 50),
        },
        title: {
          display: true,
          text: title,
          font: {
            size: isResponsive ? 14 : 16,
          },
        },
        tooltip: {
          enabled: true,
          mode: type === "line" ? "index" : "nearest",
          intersect: type !== "line",
          animation: {
            duration: optimizedData.labels.length > 100 ? 0 : 150,
          },
        },
        ...(isResponsive &&
          optimizedData.labels.length > 30 && {
            datalabels: {
              display: false,
            },
          }),
      },
      scales:
        type !== "pie" && type !== "doughnut"
          ? {
              x: {
                ticks: {
                  font: {
                    size: isResponsive ? 10 : 12,
                  },
                  maxRotation: optimizedData.labels.length > 10 ? 90 : 0,
                  minRotation: optimizedData.labels.length > 10 ? 45 : 0,
                  autoSkip: true,
                  autoSkipPadding: 10,
                  maxTicksLimit: isResponsive ? 8 : 20,
                },
                grid: {
                  display: !isResponsive,
                },
              },
              y: {
                beginAtZero: true,
                ticks: {
                  font: {
                    size: isResponsive ? 10 : 12,
                  },
                  precision: 0,
                  maxTicksLimit: isResponsive ? 5 : 10,
                },
                grid: {
                  display: !isResponsive && optimizedData.labels.length <= 20,
                },
              },
            }
          : undefined,
      ...(dynamicOptions[type] || {}),
    };

    chartInstance.current = new Chart(chartRef.current, {
      type,
      data: {
        labels: optimizedData.labels,
        datasets: optimizedData.datasets,
      },
      options,
    });

    if (chartRef.current) {
      setChartHeight(chartRef.current.height);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [
    optimizedData.labels,
    optimizedData.datasets,
    title,
    type,
    isResponsive,
    chartWidth,
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onFilterChange) {
      onFilterChange({
        startDate,
        endDate,
        department,
      });
    }
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setDepartment("");

    if (onFilterChange) {
      onFilterChange({
        startDate: "",
        endDate: "",
        department: "",
      });
    }
  };

  const isDataTruncated = labels && labels.length > maxPoints;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <form onSubmit={handleSubmit} className="mb-4 p-3 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Фильтры</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-700"
            >
              Дата начала
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-700"
            >
              Дата окончания
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="department"
              className="block text-sm font-medium text-gray-700"
            >
              Отдел
            </label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Все отделы</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Сбросить
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Применить
          </button>
        </div>
      </form>

      <div className={`mt-1 ${isResponsive ? "h-64" : "h-80"}`}>
        <canvas ref={chartRef}></canvas>
      </div>

      {isDataTruncated && (
        <div className="mt-2 text-xs text-gray-500 italic text-center">
          * Данные были оптимизированы для отображения. Некоторые точки были
          объединены для улучшения производительности.
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;
