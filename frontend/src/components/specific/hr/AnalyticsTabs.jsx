import React, { useMemo } from "react";
import {
  ChartBarIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

/**
 * Компонент для отображения вкладок аналитики на странице HR Dashboard
 *
 * @param {string} activeTab - Активная вкладка
 * @param {function} setActiveTab - Функция для переключения вкладки
 */
const AnalyticsTabs = ({ activeTab, setActiveTab }) => {
  // Определяем структуру вкладок для более удобного масштабирования
  const tabs = useMemo(
    () => [
      {
        id: "analytics",
        label: "Аналитика",
        icon: ChartBarIcon,
      },
      {
        id: "calendar",
        label: "Календарь",
        icon: CalendarDaysIcon,
      },
      {
        id: "reports",
        label: "Отчеты",
        icon: DocumentTextIcon,
      },
    ],
    []
  );

  // Обработчик переключения вкладок с дополнительной логикой
  const handleTabClick = (tabId) => {
    // Добавить здесь дополнительную логику перед сменой вкладки, если потребуется
    setActiveTab(tabId);
  };

  return (
    <div className="flex flex-wrap sm:flex-nowrap border-b overflow-x-auto scrollbar-thin">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`
              flex-1 min-w-[100px] py-3 px-4 text-sm font-medium 
              transition-all duration-200 ease-in-out
              focus:outline-none focus:ring-2 focus:ring-blue-300
              ${
                isActive
                  ? "text-blue-700 border-b-2 border-blue-500 bg-blue-50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }
            `}
            aria-selected={isActive}
            role="tab"
            aria-controls={`${tab.id}-panel`}
          >
            <Icon className="h-4 w-4 inline-block mr-1" aria-hidden="true" />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default AnalyticsTabs;
