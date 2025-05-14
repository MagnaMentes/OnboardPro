import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Card, Button, FORM_STYLES } from "../../../config/theme";
import { CSSTransition } from "react-transition-group";

/**
 * Компонент панели фильтров для Manager Dashboard
 *
 * @param {Object} filters - Текущие фильтры
 * @param {Function} handleFilterChange - Функция изменения фильтров
 * @param {Array} users - Массив пользователей
 * @param {Array} plans - Массив планов
 * @param {Function} setIsTaskFiltersVisible - Функция для скрытия панели фильтров
 * @param {Function} resetTaskFilters - Функция для сброса фильтров
 * @param {boolean} isVisible - Флаг видимости панели
 */
const TaskFilterPanel = ({
  filters,
  handleFilterChange,
  users,
  plans,
  setIsTaskFiltersVisible,
  resetTaskFilters,
  isVisible,
}) => {
  const nodeRef = React.useRef(null);

  return (
    <CSSTransition
      in={isVisible}
      appear={true}
      nodeRef={nodeRef}
      unmountOnExit
      timeout={400}
      classNames="filter-animation"
    >
      <div ref={nodeRef} className="filter-animation-wrapper">
        <Card className="filter-panel transform transition-all shadow-lg border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-800">
              Фильтры и поиск задач
            </h3>
            <button
              onClick={() => setIsTaskFiltersVisible(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
            {/* Поиск задач */}
            <div>
              <label className={FORM_STYLES.label}>Поиск задач</label>
              <div className="relative rounded-md shadow-sm">
                <input
                  type="text"
                  value={filters.taskSearchQuery}
                  onChange={(e) =>
                    handleFilterChange({ taskSearchQuery: e.target.value })
                  }
                  placeholder="Поиск по названию или описанию"
                  className={FORM_STYLES.input}
                />
              </div>
            </div>

            {/* Фильтр по статусу */}
            <div>
              <label className={FORM_STYLES.label}>Статус задачи</label>
              <select
                value={filters.taskStatusFilter}
                onChange={(e) =>
                  handleFilterChange({ taskStatusFilter: e.target.value })
                }
                className={FORM_STYLES.select}
              >
                <option value="all">Все статусы</option>
                <option value="not_started">Не начато</option>
                <option value="in_progress">В работе</option>
                <option value="completed">Выполнено</option>
              </select>
            </div>

            {/* Фильтр по приоритету */}
            <div>
              <label className={FORM_STYLES.label}>Приоритет</label>
              <select
                value={filters.taskPriorityFilter}
                onChange={(e) =>
                  handleFilterChange({ taskPriorityFilter: e.target.value })
                }
                className={FORM_STYLES.select}
              >
                <option value="all">Все приоритеты</option>
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>

            {/* Фильтр по пользователю */}
            <div>
              <label className={FORM_STYLES.label}>Сотрудник</label>
              <select
                value={filters.taskUserFilter}
                onChange={(e) =>
                  handleFilterChange({ taskUserFilter: e.target.value })
                }
                className={FORM_STYLES.select}
              >
                <option value="all">Все сотрудники</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Фильтр по плану */}
            <div className="md:col-span-2">
              <label className={FORM_STYLES.label}>План</label>
              <select
                value={filters.taskPlanFilter}
                onChange={(e) =>
                  handleFilterChange({ taskPlanFilter: e.target.value })
                }
                className={FORM_STYLES.select}
              >
                <option value="all">Все планы</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Сортировка */}
            <div>
              <label className={FORM_STYLES.label}>Сортировка по</label>
              <select
                value={filters.taskSortField}
                onChange={(e) =>
                  handleFilterChange({ taskSortField: e.target.value })
                }
                className={FORM_STYLES.select}
              >
                <option value="deadline">Сроку</option>
                <option value="priority">Приоритету</option>
                <option value="title">Названию</option>
                <option value="status">Статусу</option>
              </select>
            </div>

            <div>
              <label className={FORM_STYLES.label}>Направление</label>
              <select
                value={filters.taskSortDirection}
                onChange={(e) =>
                  handleFilterChange({ taskSortDirection: e.target.value })
                }
                className={FORM_STYLES.select}
              >
                <option value="asc">По возрастанию</option>
                <option value="desc">По убыванию</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={resetTaskFilters}
              variant="secondary"
              size="md"
              className="mr-3"
            >
              Сбросить все
            </Button>
            <Button
              onClick={() => setIsTaskFiltersVisible(false)}
              variant="primary"
              size="md"
            >
              Применить
            </Button>
          </div>
        </Card>
      </div>
    </CSSTransition>
  );
};

/**
 * Компонент панели шаблонов задач для Manager Dashboard
 *
 * @param {Array} templates - Массив шаблонов
 * @param {Function} setIsTemplatesListOpen - Функция для скрытия панели шаблонов
 * @param {Function} handleCreateTemplate - Функция создания шаблона
 * @param {Function} handleEditTemplate - Функция редактирования шаблона
 * @param {Function} handleDeleteTemplate - Функция удаления шаблона
 * @param {string} userRole - Роль пользователя
 * @param {boolean} isVisible - Флаг видимости панели
 */
const TemplatesPanel = ({
  templates,
  setIsTemplatesListOpen,
  handleCreateTemplate,
  handleEditTemplate,
  handleDeleteTemplate,
  userRole,
  isVisible,
}) => {
  const nodeRef = React.useRef(null);

  return (
    <CSSTransition
      in={isVisible}
      appear={true}
      nodeRef={nodeRef}
      unmountOnExit
      timeout={400}
      classNames="filter-animation"
    >
      <div ref={nodeRef} className="filter-animation-wrapper">
        <Card className="filter-panel transform transition-all shadow-lg border border-purple-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <h3 className="text-lg font-medium text-gray-800">
                Шаблоны задач
              </h3>
              <span className="ml-3 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {templates.length} шт.
              </span>
            </div>
            <button
              onClick={() => setIsTemplatesListOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="bg-white px-4 py-6 text-center text-gray-500">
              <p>Нет доступных шаблонов задач.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Название
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Описание
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {template.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 line-clamp-2">
                          {template.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                          >
                            Изменить
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                          >
                            Удалить
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <Button
              onClick={() => {
                handleCreateTemplate();
                setIsTemplatesListOpen(false);
              }}
              variant="primary"
              size="md"
            >
              Создать шаблон
            </Button>
          </div>
        </Card>
      </div>
    </CSSTransition>
  );
};

export { TaskFilterPanel, TemplatesPanel };
