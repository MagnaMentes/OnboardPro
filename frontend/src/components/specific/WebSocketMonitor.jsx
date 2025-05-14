/**
 * Компонент для отображения мониторинга WebSocket соединений
 */
import React, { useState, useEffect } from "react";
import {
  ArrowPathIcon,
  SignalIcon,
  UsersIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../config/theme";
import WebSocketMonitorService from "../../services/WebSocketMonitorService";
import Table from "../common/Table";

/**
 * Компонент для отображения статистики WebSocket соединений
 * @returns {JSX.Element} Отображение мониторинга WebSocket
 */
const WebSocketMonitor = () => {
  // Состояния компонента
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [connectionsData, setConnectionsData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showConnectionsTable, setShowConnectionsTable] = useState(false);

  // Колонки для таблицы соединений
  const connectionsColumns = [
    { header: "ID клиента", accessor: "id" },
    { header: "ID пользователя", accessor: "userId" },
    { header: "Роль", accessor: "role" },
    { header: "Статус", accessor: "state" },
    { header: "Подключен", accessor: "connectedAt" },
    { header: "Последняя активность", accessor: "lastActivity" },
    { header: "Неактивность (мин)", accessor: "inactivityMinutes" },
    { header: "Отправлено", accessor: "messagesSent" },
    { header: "Получено", accessor: "messagesReceived" },
    { header: "Трафик отпр. (KB)", accessor: "trafficSentKB" },
    { header: "Трафик получ. (KB)", accessor: "trafficReceivedKB" },
    { header: "Ping (мс)", accessor: "pingLatencyMS" },
    { header: "Последняя ошибка", accessor: "lastError" },
  ];

  /**
   * Функция обновления данных мониторинга
   */
  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Получаем общую статистику WebSocket
      const stats = await WebSocketMonitorService.getWebSocketStats();
      const formattedStats =
        WebSocketMonitorService.formatStatsForDisplay(stats);
      setStatsData(formattedStats);
      setLastUpdated(new Date().toLocaleString());

      // Если показываем таблицу соединений, получаем подробные данные
      if (showConnectionsTable) {
        const connections =
          await WebSocketMonitorService.getWebSocketConnections();
        const tableData =
          WebSocketMonitorService.prepareConnectionsTableData(connections);
        setConnectionsData(tableData);
      }
    } catch (err) {
      console.error("Ошибка при загрузке данных мониторинга:", err);
      setError("Не удалось загрузить данные мониторинга. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Функция для получения данных о соединениях
   */
  const fetchConnectionsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const connections =
        await WebSocketMonitorService.getWebSocketConnections();
      const tableData =
        WebSocketMonitorService.prepareConnectionsTableData(connections);
      setConnectionsData(tableData);
      setShowConnectionsTable(true);
    } catch (err) {
      console.error("Ошибка при загрузке данных о соединениях:", err);
      setError("Не удалось загрузить данные о соединениях. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    fetchMonitoringData();

    // Устанавливаем интервал обновления данных каждые 30 секунд
    const interval = setInterval(() => {
      fetchMonitoringData();
    }, 30000);

    // Очищаем интервал при размонтировании компонента
    return () => clearInterval(interval);
  }, [showConnectionsTable]); // Повторно запрашиваем данные при изменении флага отображения таблицы

  // Функция для переключения отображения таблицы соединений
  const toggleConnectionsTable = () => {
    if (!showConnectionsTable) {
      fetchConnectionsData();
    } else {
      setShowConnectionsTable(false);
    }
  };

  // Если данных еще нет, показываем индикатор загрузки
  if (!statsData && !error && loading) {
    return (
      <div className="p-4 bg-white shadow-md rounded-lg">
        <div className="flex justify-center items-center py-10">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">
            Загрузка данных мониторинга...
          </span>
        </div>
      </div>
    );
  }

  // Если произошла ошибка, показываем сообщение
  if (error) {
    return (
      <div className="p-4 bg-white shadow-md rounded-lg">
        <div className="flex justify-center items-center py-6">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
          <span className="ml-2 text-red-600">{error}</span>
        </div>
        <div className="flex justify-center">
          <Button onClick={fetchMonitoringData} disabled={loading}>
            {loading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ArrowPathIcon className="w-5 h-5 mr-2" />
            )}
            Повторить попытку
          </Button>
        </div>
      </div>
    );
  }

  // Основной рендер компонента
  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Мониторинг WebSocket
        </h2>
        <div className="flex space-x-2">
          <Button
            onClick={fetchMonitoringData}
            disabled={loading}
            className="flex items-center"
          >
            {loading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ArrowPathIcon className="w-5 h-5 mr-2" />
            )}
            Обновить
          </Button>
          <Button
            onClick={toggleConnectionsTable}
            className={`flex items-center ${
              showConnectionsTable ? "bg-blue-700" : ""
            }`}
          >
            <UsersIcon className="w-5 h-5 mr-2" />
            {showConnectionsTable ? "Скрыть соединения" : "Показать соединения"}
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <div className="mb-3 text-xs text-gray-500 flex items-center">
          <ClockIcon className="w-4 h-4 mr-1" />
          Последнее обновление: {lastUpdated}
        </div>
      )}

      {statsData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-md">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-blue-800">
                Активные соединения
              </div>
              <SignalIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {statsData.activeConnections}
            </div>
          </div>

          <div className="p-3 bg-green-100 rounded-md">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-green-800">
                Уникальных пользователей
              </div>
              <UsersIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">
              {statsData.uniqueUsers}
            </div>
          </div>

          <div className="p-3 bg-purple-100 rounded-md">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-purple-800">
                Сообщений отправлено
              </div>
              <DocumentTextIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {statsData.messagesSent}
            </div>
          </div>

          <div className="p-3 bg-amber-100 rounded-md">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-amber-800">
                Сообщений получено
              </div>
              <DocumentTextIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-900">
              {statsData.messagesReceived}
            </div>
          </div>

          <div className="p-3 bg-cyan-100 rounded-md">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-cyan-800">
                Исходящий трафик
              </div>
              <span className="text-xs text-cyan-600">KB</span>
            </div>
            <div className="text-2xl font-bold text-cyan-900">
              {statsData.trafficSentKB}
            </div>
          </div>

          <div className="p-3 bg-teal-100 rounded-md">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-teal-800">Входящий трафик</div>
              <span className="text-xs text-teal-600">KB</span>
            </div>
            <div className="text-2xl font-bold text-teal-900">
              {statsData.trafficReceivedKB}
            </div>
          </div>

          <div className="p-3 bg-pink-100 rounded-md">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-pink-800">Ping задержка</div>
              <span className="text-xs text-pink-600">мс</span>
            </div>
            <div className="text-2xl font-bold text-pink-900">
              {statsData.avgPingLatencyMS}
            </div>
          </div>

          <div className="p-3 bg-red-100 rounded-md">
            <div className="flex justify-between items-center">
              <div className="font-semibold text-red-800">Ошибки сообщений</div>
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-900">
              {statsData.messageErrors}
            </div>
          </div>
        </div>
      )}

      {/* Распределение соединений по ролям пользователей */}
      {statsData &&
        statsData.connectionsByRole &&
        Object.keys(statsData.connectionsByRole).length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Соединения по ролям
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Object.entries(statsData.connectionsByRole).map(
                ([role, count]) => (
                  <div key={role} className="p-3 bg-gray-100 rounded-md">
                    <div className="font-semibold text-gray-700">{role}</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {count}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

      {/* Таблица детальной информации о соединениях */}
      {showConnectionsTable && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Активные соединения
          </h3>
          {connectionsData.length > 0 ? (
            <Table
              columns={connectionsColumns}
              data={connectionsData}
              pagination={{ pageSize: 10 }}
              sortable={true}
            />
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded">
              <p className="text-gray-500">Нет активных соединений</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WebSocketMonitor;
