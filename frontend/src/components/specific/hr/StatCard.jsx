import React from "react";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

/**
 * Цветовые классы для различных типов карточек статистики
 */
const COLOR_CLASSES = {
  blue: {
    container:
      "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-blue-500",
    iconBg: "bg-blue-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
    iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-blue-500",
  },
  green: {
    container:
      "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-green-500",
    iconBg: "bg-green-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
    iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-green-500",
  },
  yellow: {
    container:
      "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-yellow-500",
    iconBg: "bg-yellow-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
    iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-yellow-500",
  },
  purple: {
    container:
      "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-purple-500",
    iconBg: "bg-purple-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
    iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-purple-500",
  },
  red: {
    container:
      "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-red-500",
    iconBg: "bg-red-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
    iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-red-500",
  },
  default: {
    container:
      "bg-white p-4 sm:p-6 rounded-lg shadow-md border-l-4 border-gray-500",
    iconBg: "bg-gray-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4",
    iconColor: "h-6 w-6 sm:h-8 sm:w-8 text-gray-500",
  },
};

/**
 * Компонент для отображения карточки статистики с показателем и трендом
 *
 * @param {string} title - Заголовок карточки
 * @param {number|string} value - Значение показателя
 * @param {Component} icon - Компонент иконки
 * @param {string} color - Цветовая схема карточки
 * @param {string} subtitle - Дополнительный текст
 * @param {number} prevValue - Предыдущее значение показателя (для расчета тренда)
 */
const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle = null,
  prevValue = null,
}) => {
  const Icon = icon;
  const classes = COLOR_CLASSES[color] || COLOR_CLASSES.default;

  // Функция для расчета процента изменения
  const calculatePercentChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    if (previous === null || previous === undefined) return null;
    return ((current - previous) / previous) * 100;
  };

  const percentChange =
    prevValue !== null ? calculatePercentChange(value, prevValue) : null;
  const isPositiveTrend = percentChange > 0;
  const showTrend = percentChange !== null;

  // Для времени онбординга тренд инвертируется (меньше - лучше)
  const isTrendPositive = title.includes("онбординг")
    ? !isPositiveTrend
    : isPositiveTrend;
  const trendColor = isTrendPositive ? "text-green-500" : "text-red-500";
  const TrendIcon = isTrendPositive
    ? ArrowTrendingUpIcon
    : ArrowTrendingDownIcon;

  return (
    <div className={classes.container}>
      <div className="flex items-center">
        <div className={classes.iconBg}>
          <Icon className={classes.iconColor} />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500">
            {title}
          </p>
          <div className="flex items-center">
            <p className="text-xl sm:text-2xl font-bold text-gray-800">
              {value}
            </p>
            {showTrend && (
              <div className={`ml-2 flex items-center ${trendColor}`}>
                <TrendIcon className="h-4 w-4 mr-1" />
                <span className="text-xs">
                  {Math.abs(percentChange).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export { StatCard, COLOR_CLASSES };
