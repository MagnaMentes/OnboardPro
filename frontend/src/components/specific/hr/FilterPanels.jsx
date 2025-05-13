import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Card, Button, FORM_STYLES } from "../../../config/theme";

/**
 * Компонент панели фильтров для HR Dashboard
 *
 * @param {Object} filters - Текущие фильтры
 * @param {Function} handleFilterChange - Функция изменения фильтров
 * @param {Array} departments - Массив отделов
 * @param {Function} setShowFiltersPanel - Функция для скрытия панели фильтров
 * @param {Function} refreshData - Функция для обновления данных
 */
const FilterPanel = ({
  filters,
  handleFilterChange,
  departments,
  setShowFiltersPanel,
  refreshData,
}) => {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-800">Фильтры аналитики</h3>
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
            onChange={(e) => handleFilterChange({ startDate: e.target.value })}
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
            onChange={(e) => handleFilterChange({ department: e.target.value })}
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

/**
 * Компонент панели фильтров для графиков
 */
const ChartFilterPanel = ({
  filters,
  handleFilterChange,
  departments,
  setShowChartFiltersPanel,
  refreshData,
}) => {
  return (
    <Card className="transform transition-transform duration-300 ease-in-out">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-800">Фильтры графиков</h3>
        <button
          onClick={() => setShowChartFiltersPanel(false)}
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
              handleFilterChange({
                startDate: e.target.value,
              })
            }
            className={FORM_STYLES.input}
          />
        </div>

        <div>
          <label className={FORM_STYLES.label}>Дата окончания</label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              handleFilterChange({
                endDate: e.target.value,
              })
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
  );
};

export { FilterPanel, ChartFilterPanel };
