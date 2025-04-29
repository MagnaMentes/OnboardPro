import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

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
 */
const AnalyticsChart = ({ 
  title, 
  type = 'bar', 
  labels = [], 
  datasets = [], 
  filters = {}, 
  onFilterChange,
  departments = []
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [startDate, setStartDate] = useState(filters.startDate || '');
  const [endDate, setEndDate] = useState(filters.endDate || '');
  const [department, setDepartment] = useState(filters.department || '');
  const [isResponsive, setIsResponsive] = useState(false);
  
  // Обработка изменения размеров экрана для адаптивности
  useEffect(() => {
    const handleResize = () => {
      setIsResponsive(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Проверка при первом рендере
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Создание и обновление графика
  useEffect(() => {
    if (!chartRef.current) return;
    
    // Уничтожаем предыдущий экземпляр графика если он существует
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Настройки графика, оптимизированные для разных размеров экрана
    const options = {
      responsive: true,
      maintainAspectRatio: !isResponsive,
      aspectRatio: isResponsive ? 1 : 2,
      plugins: {
        legend: {
          position: isResponsive ? 'bottom' : 'top',
          labels: {
            boxWidth: isResponsive ? 12 : 20,
            font: {
              size: isResponsive ? 10 : 12
            }
          }
        },
        title: {
          display: true,
          text: title,
          font: {
            size: isResponsive ? 14 : 16
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false
        }
      },
      scales: type !== 'pie' && type !== 'doughnut' ? {
        x: {
          ticks: {
            font: {
              size: isResponsive ? 10 : 12
            }
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: isResponsive ? 10 : 12
            }
          }
        }
      } : undefined
    };
    
    // Создаем новый график
    chartInstance.current = new Chart(chartRef.current, {
      type,
      data: {
        labels,
        datasets
      },
      options
    });
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [labels, datasets, title, type, isResponsive]);
  
  // Обработчик отправки формы фильтров
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onFilterChange) {
      onFilterChange({
        startDate,
        endDate,
        department
      });
    }
  };
  
  // Обработчик сброса фильтров
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setDepartment('');
    
    if (onFilterChange) {
      onFilterChange({
        startDate: '',
        endDate: '',
        department: ''
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      {/* Фильтры */}
      <form onSubmit={handleSubmit} className="mb-4 p-3 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Фильтры</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
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
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
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
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
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
      
      {/* Контейнер графика с адаптивной высотой */}
      <div className={`mt-1 ${isResponsive ? 'h-64' : 'h-80'}`}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default AnalyticsChart;