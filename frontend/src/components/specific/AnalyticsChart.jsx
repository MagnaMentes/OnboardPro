import { useState, useEffect, useRef, useMemo } from "react";
import { Chart, registerables } from "chart.js";
// Импортируем компоненты и стили из системы темы
import {
  Button,
  FormField,
  SelectField,
  FORM_STYLES,
  Card,
} from "../../config/theme";

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
    // Защитное условие с расширенной проверкой DOM-элементов
    if (!chartRef.current || !chartRef.current.parentElement) {
      console.log(
        "[AnalyticsChart] DOM element is not ready or already unmounted"
      );
      return;
    }

    // Проверяем наличие данных перед созданием или обновлением графика
    if (
      !optimizedData.labels ||
      !optimizedData.datasets ||
      optimizedData.labels.length === 0 ||
      optimizedData.datasets.length === 0
    ) {
      console.log("[AnalyticsChart] No data available for chart");
      return;
    }

    try {
      // Дополнительная проверка getContext для canvas
      const ctx = chartRef.current.getContext("2d");
      if (!ctx) {
        console.log("[AnalyticsChart] Canvas context is not available");
        return;
      }

      // Если график уже существует, просто обновим данные вместо пересоздания
      if (chartInstance.current) {
        // Безопасное обновление данных, обернутое в try-catch
        try {
          chartInstance.current.data.labels = optimizedData.labels;
          optimizedData.datasets.forEach((dataset, index) => {
            if (chartInstance.current.data.datasets[index]) {
              chartInstance.current.data.datasets[index].data = dataset.data;
            }
          });

          // Отложенное обновление графика после рендеринга DOM
          // Важно для предотвращения ошибок "ownerDocument"
          setTimeout(() => {
            if (
              chartInstance.current &&
              chartRef.current &&
              chartRef.current.parentElement
            ) {
              try {
                chartInstance.current.update("none"); // Используем 'none' для плавного обновления без анимации
              } catch (error) {
                console.error(
                  "[AnalyticsChart] Ошибка при обновлении графика:",
                  error
                );
                // При ошибке обновления уничтожаем и создаем заново
                if (chartInstance.current) {
                  chartInstance.current.destroy();
                  chartInstance.current = null;
                  // Перезапуск эффекта через 100ms, чтобы DOM успел обновиться
                  setTimeout(() => {
                    if (chartRef.current && chartRef.current.parentElement) {
                      // Попытка пересоздать график
                      initChart();
                    }
                  }, 100);
                }
              }
            }
          }, 0);

          return; // Выходим из эффекта, если обновление выполнено
        } catch (error) {
          console.error(
            "[AnalyticsChart] Ошибка при обновлении данных графика:",
            error
          );
          if (chartInstance.current) {
            chartInstance.current.destroy();
            chartInstance.current = null;
          }
        }
      }

      // Функция для инициализации графика
      const initChart = () => {
        // Дополнительная проверка перед созданием графика
        if (!chartRef.current || !chartRef.current.parentElement) {
          return;
        }

        // Обновляем стили для графиков
        const dynamicOptions = {
          line: {
            tension: 0.4,
            borderWidth: isResponsive ? 2 : 3,
            pointRadius:
              isResponsive || optimizedData.labels.length > 20 ? 0 : 3,
            pointHoverRadius: 4,
            spanGaps: true,
            animation: {
              duration: 800,
              easing: "easeInOutQuart",
            },
          },
          bar: {
            barPercentage: optimizedData.labels.length > 10 ? 0.9 : 0.8,
            categoryPercentage: optimizedData.labels.length > 10 ? 0.8 : 0.9,
            animation: {
              duration: 800,
              easing: "easeInOutQuart",
            },
          },
          pie: {
            animation: {
              duration: 1000,
              easing: "easeInOutQuart",
            },
            cutout: "10%",
            radius: "90%",
          },
          doughnut: {
            animation: {
              duration: 1000,
              easing: "easeInOutQuart",
            },
            cutout: "50%",
            radius: "90%",
          },
        };

        const options = {
          responsive: true,
          maintainAspectRatio: !isResponsive,
          aspectRatio: isResponsive ? 1 : 2,
          plugins: {
            legend: {
              position: isResponsive ? "bottom" : "top",
              labels: {
                boxWidth: isResponsive ? 12 : 20,
                font: {
                  size: isResponsive ? 10 : 14,
                  family: "Arial, sans-serif",
                },
              },
            },
            title: {
              display: true,
              text: title,
              font: {
                size: isResponsive ? 16 : 20,
                family: "Arial, sans-serif",
                weight: "bold",
              },
              color: "#333",
            },
            tooltip: {
              enabled: true,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              titleFont: {
                size: 14,
                weight: "bold",
              },
              bodyFont: {
                size: 12,
              },
              footerFont: {
                size: 10,
              },
              padding: 10,
              cornerRadius: 4,
            },
          },
          scales:
            type !== "pie" && type !== "doughnut"
              ? {
                  x: {
                    ticks: {
                      font: {
                        size: isResponsive ? 10 : 12,
                      },
                      color: "#666",
                    },
                    grid: {
                      color: "rgba(200, 200, 200, 0.2)",
                    },
                  },
                  y: {
                    beginAtZero: true,
                    ticks: {
                      font: {
                        size: isResponsive ? 10 : 12,
                      },
                      color: "#666",
                    },
                    grid: {
                      color: "rgba(200, 200, 200, 0.2)",
                    },
                  },
                }
              : undefined,
          ...dynamicOptions[type],
        };

        try {
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
        } catch (error) {
          console.error("[AnalyticsChart] Ошибка при создании графика:", error);
        }
      };

      // Инициализируем график
      initChart();
    } catch (error) {
      console.error("[AnalyticsChart] Ошибка в useEffect графика:", error);
    }

    return () => {
      // Очистка при размонтировании
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
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

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  const isDataTruncated = labels && labels.length > maxPoints;

  return (
    <Card className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className={`mt-1 ${isResponsive ? "h-64" : "h-80"}`}>
        <canvas ref={chartRef}></canvas>
      </div>

      {isDataTruncated && (
        <div className="mt-2 text-xs text-gray-500 italic text-center">
          * Данные были оптимизированы для отображения. Некоторые точки были
          объединены для улучшения производительности.
        </div>
      )}
    </Card>
  );
};

export default AnalyticsChart;
