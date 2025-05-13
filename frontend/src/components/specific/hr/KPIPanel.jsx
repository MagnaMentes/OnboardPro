import React from "react";
import {
  ChartPieIcon,
  ClockIcon,
  DocumentChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

/**
 * Компонент для отображения ключевых показателей аналитики (KPI)
 *
 * @param {Object} kpiData - Данные KPI
 * @param {Object} filters - Текущие фильтры
 * @param {Object} taskStats - Статистика по задачам
 * @param {Object} prevTaskStats - Статистика по задачам за предыдущий период
 */
const KPIPanel = ({ kpiData, filters, taskStats, prevTaskStats }) => {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-800 flex items-center mb-4">
        <ChartPieIcon className="h-5 w-5 mr-2 text-blue-500" />
        Ключевые показатели эффективности (KPI)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* NPS (Индекс лояльности) */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">NPS</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-blue-800">
                  {kpiData?.nps?.toFixed(1) || "—"}
                </p>
                {kpiData?.prevNps !== undefined &&
                  filters.compareWithPrevious && (
                    <div
                      className={`ml-2 flex items-center ${
                        kpiData.nps > kpiData.prevNps
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {kpiData.nps > kpiData.prevNps ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-xs">
                        {Math.abs(
                          ((kpiData.nps - kpiData.prevNps) /
                            Math.abs(kpiData.prevNps || 1)) *
                            100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  )}
              </div>
            </div>
            <ChartPieIcon className="h-6 w-6 text-blue-500" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Индекс лояльности сотрудников
          </p>

          {kpiData?.nps !== undefined && (
            <div className="mt-3">
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    kpiData.nps < 0
                      ? "bg-red-500"
                      : kpiData.nps < 30
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      Math.max((kpiData.nps + 100) / 2, 0),
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>-100</span>
                <span>0</span>
                <span>+100</span>
              </div>
            </div>
          )}
        </div>

        {/* Среднее время онбординга */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Среднее время онбординга
              </p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-green-800">
                  {kpiData?.avgOnboardingTime?.toFixed(1) || "—"} дней
                </p>
                {kpiData?.prevAvgOnboardingTime !== null &&
                  filters.compareWithPrevious && (
                    <div
                      className={`ml-2 flex items-center ${
                        kpiData.avgOnboardingTime <
                        kpiData.prevAvgOnboardingTime
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {kpiData.avgOnboardingTime <
                      kpiData.prevAvgOnboardingTime ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-xs">
                        {Math.abs(
                          ((kpiData.avgOnboardingTime -
                            kpiData.prevAvgOnboardingTime) /
                            kpiData.prevAvgOnboardingTime) *
                            100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  )}
              </div>
            </div>
            <ClockIcon className="h-6 w-6 text-green-500" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            На основе {kpiData?.totalOnboardingUsers || 0} пользователей
          </p>

          {kpiData?.avgOnboardingTime !== undefined && (
            <div className="mt-3 flex items-center">
              <div className="relative h-1 flex-grow bg-gray-200">
                <div
                  className="absolute w-3 h-3 rounded-full bg-green-500 transform -translate-y-1/2"
                  style={{
                    left: `${Math.min(
                      100,
                      (kpiData.avgOnboardingTime / 30) * 100
                    )}%`,
                  }}
                ></div>
              </div>
              <span className="ml-2 text-xs text-gray-500">Цель: 14 дней</span>
            </div>
          )}
        </div>

        {/* Выполнено задач */}
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">
                Выполнено задач
              </p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-yellow-800">
                  {Math.round((kpiData?.completionRate || 0) * 100)}%
                </p>
                {kpiData?.prevCompletionRate !== undefined &&
                  filters.compareWithPrevious && (
                    <div
                      className={`ml-2 flex items-center ${
                        kpiData.completionRate > kpiData.prevCompletionRate
                          ? "text-green-500"
                          : "text-red-500"
                      }`}
                    >
                      {kpiData.completionRate > kpiData.prevCompletionRate ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                      )}
                      <span className="text-xs">
                        {Math.abs(
                          ((kpiData.completionRate -
                            kpiData.prevCompletionRate) /
                            (kpiData.prevCompletionRate || 0.01)) *
                            100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  )}
              </div>
            </div>
            <DocumentChartBarIcon className="h-6 w-6 text-yellow-500" />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {taskStats.completed} из {taskStats.total} задач
            {prevTaskStats && filters.compareWithPrevious && (
              <span className="ml-2 text-xs">
                (пред. период: {prevTaskStats.completed} из{" "}
                {prevTaskStats.total})
              </span>
            )}
          </p>

          <div className="mt-3">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-yellow-200">
              <div
                style={{
                  width: `${Math.round((kpiData?.completionRate || 0) * 100)}%`,
                }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIPanel;
