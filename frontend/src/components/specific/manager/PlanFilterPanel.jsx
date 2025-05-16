import React, { useRef } from "react";
import { CSSTransition } from "react-transition-group";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Card, Button, FORM_STYLES } from "../../../config/theme";

/**
 * Компонент панели фильтров планов адаптации
 *
 * @param {Object} props - Свойства компонента
 * @param {string} props.searchQuery - Поисковый запрос
 * @param {Function} props.onSearchChange - Функция обработки изменения поискового запроса
 * @param {string} props.roleFilter - Фильтр по роли
 * @param {Function} props.onRoleFilterChange - Функция обработки изменения фильтра по роли
 * @param {string} props.departmentFilter - Фильтр по отделу
 * @param {Function} props.onDepartmentFilterChange - Функция обработки изменения фильтра по отделу
 * @param {Array} props.departments - Список доступных отделов
 * @param {boolean} props.isOpen - Состояние открытия панели фильтров
 * @param {Function} props.onToggle - Функция для переключения состояния панели
 */
const PlanFilterPanel = ({
  searchQuery,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  departmentFilter,
  onDepartmentFilterChange,
  departments = [],
  isOpen,
  onToggle,
}) => {
  const nodeRef = useRef(null);

  // Обработчик сброса всех фильтров
  const handleResetFilters = () => {
    onSearchChange("");
    onRoleFilterChange("all");
    onDepartmentFilterChange("all");
  };

  return (
    <CSSTransition
      in={isOpen}
      appear={true}
      nodeRef={nodeRef}
      unmountOnExit
      timeout={400}
      classNames="filter-animation"
    >
      <div ref={nodeRef} className="filter-animation-wrapper">
        <Card className="filter-panel transform transition-all shadow-lg border border-blue-100">
          <div className="flex items-center mb-4 gap-2">
            <div className="flex-grow relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Поиск по названию или описанию плана"
                className={FORM_STYLES.input}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  title="Очистить поиск"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <button
              onClick={() => onToggle(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Закрыть панель фильтров"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Фильтры */}

            {/* Фильтр по роли */}
            <div>
              <label className={FORM_STYLES.label}>Целевая роль</label>
              <select
                value={roleFilter}
                onChange={(e) => onRoleFilterChange(e.target.value)}
                className={FORM_STYLES.select}
              >
                <option value="all">Все роли</option>
                <option value="employee">Сотрудник</option>
                <option value="manager">Менеджер</option>
              </select>
            </div>

            {/* Фильтр по отделу */}
            <div>
              <label className={FORM_STYLES.label}>Отдел</label>
              <select
                value={departmentFilter}
                onChange={(e) => onDepartmentFilterChange(e.target.value)}
                className={FORM_STYLES.select}
              >
                <option value="all">Все отделы</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleResetFilters}
              variant="secondary"
              className="mr-2"
            >
              Сбросить фильтры
            </Button>
          </div>
        </Card>
      </div>
    </CSSTransition>
  );
};

export default PlanFilterPanel;
