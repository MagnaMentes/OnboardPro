/**
 * Сервис для работы с API мониторинга WebSocket соединений
 */
import { apiRequest } from "../config/api";

/**
 * Класс сервиса статистики WebSocket соединений
 */
class WebSocketMonitorService {
  /**
   * Получение общей статистики WebSocket соединений
   * @returns {Promise<Object>} Статистика WebSocket соединений
   */
  static async getWebSocketStats() {
    try {
      const response = await apiRequest.get("/api/websocket/stats");
      return response.data;
    } catch (error) {
      console.error(
        "[WebSocketMonitorService] Ошибка при получении статистики WebSocket:",
        error
      );
      throw error;
    }
  }

  /**
   * Получение детальной информации о WebSocket соединениях
   * @returns {Promise<Object>} Информация о WebSocket соединениях
   */
  static async getWebSocketConnections() {
    try {
      const response = await apiRequest.get("/api/websocket/connections");
      return response.data;
    } catch (error) {
      console.error(
        "[WebSocketMonitorService] Ошибка при получении информации о соединениях WebSocket:",
        error
      );
      throw error;
    }
  }

  /**
   * Форматирование данных статистики для отображения
   * @param {Object} rawStats - Необработанные данные статистики
   * @returns {Object} - Отформатированные данные для отображения
   */
  static formatStatsForDisplay(rawStats) {
    if (!rawStats) return {};

    const { connection_stats, manager_stats } = rawStats;

    return {
      activeConnections: manager_stats?.active_connections || 0,
      uniqueUsers: manager_stats?.unique_users || 0,
      messagesSent: manager_stats?.messages_sent || 0,
      messagesReceived: connection_stats?.messages?.received || 0,
      messageErrors: manager_stats?.message_errors || 0,
      trafficSentKB: Math.round(
        (connection_stats?.traffic?.sent_bytes || 0) / 1024
      ),
      trafficReceivedKB: Math.round(
        (connection_stats?.traffic?.received_bytes || 0) / 1024
      ),
      avgPingLatencyMS: Math.round(connection_stats?.avg_ping_latency_ms || 0),
      connectionsByRole: connection_stats?.connections_by_role || {},
      lastUpdated: rawStats.timestamp,
    };
  }

  /**
   * Подготовка данных соединений для табличного отображения
   * @param {Object} rawConnections - Необработанные данные о соединениях
   * @returns {Array} - Отформатированные данные для таблицы
   */
  static prepareConnectionsTableData(rawConnections) {
    if (!rawConnections || !rawConnections.connections) {
      return [];
    }

    return rawConnections.connections.map((conn) => ({
      id: conn.client_id,
      userId: conn.user_id || "Неизвестно",
      role: conn.user_role || "Неизвестно",
      state: conn.state || "Неизвестно",
      connectedAt: new Date(conn.connection_time).toLocaleString(),
      lastActivity: new Date(conn.last_activity).toLocaleString(),
      inactivityMinutes: Math.round(conn.inactivity_seconds / 60),
      messagesSent: conn.messages_sent,
      messagesReceived: conn.messages_received,
      trafficSentKB: Math.round(conn.bytes_sent / 1024),
      trafficReceivedKB: Math.round(conn.bytes_received / 1024),
      pingLatencyMS: conn.ping_latency_ms
        ? Math.round(conn.ping_latency_ms)
        : "Н/Д",
      lastError: conn.last_error || "-",
    }));
  }
}

export default WebSocketMonitorService;
