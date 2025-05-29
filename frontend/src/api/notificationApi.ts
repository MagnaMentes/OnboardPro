import apiClient from "./apiClient";

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: "info" | "warning" | "deadline" | "system";
  is_read: boolean;
  created_at: string;
}

export interface NotificationSettings {
  info: boolean;
  warning: boolean;
  deadline: boolean;
  system: boolean;
}

export interface NotificationFilters {
  type?: string;
  is_read?: boolean;
  created_after?: string;
  created_before?: string;
}

class NotificationApi {
  /**
   * Получение списка уведомлений с опциональной фильтрацией
   */
  async getNotifications(
    filters?: NotificationFilters
  ): Promise<Notification[]> {
    const url = "/notifications/";
    const response = await apiClient.get(url, { params: filters });
    return response.data;
  }

  /**
   * Получение одного уведомления по ID
   */
  async getNotification(id: number): Promise<Notification> {
    const url = `/notifications/${id}/`;
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Отметка уведомления как прочитанное
   */
  async markAsRead(id: number): Promise<Notification> {
    const url = `/notifications/${id}/read/`;
    const response = await apiClient.post(url);
    return response.data;
  }

  /**
   * Отметка всех уведомлений как прочитанные
   */
  async markAllAsRead(): Promise<{ count: number }> {
    const url = `/notifications/read-all/`;
    const response = await apiClient.post(url);
    return response.data;
  }

  /**
   * Удаление уведомления
   */
  async deleteNotification(id: number): Promise<void> {
    const url = `/notifications/${id}/`;
    await apiClient.delete(url);
  }

  /**
   * Получение настроек уведомлений
   */
  async getSettings(): Promise<NotificationSettings> {
    const url = `/notifications/settings/`;
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Обновление настроек уведомлений
   */
  async updateSettings(
    settings: NotificationSettings
  ): Promise<{ message: string; settings: NotificationSettings }> {
    const url = `/notifications/settings/`;
    const response = await apiClient.post(url, settings);
    return response.data;
  }

  /**
   * Получение количества непрочитанных уведомлений
   */
  async getUnreadCount(): Promise<number> {
    const url = `/notifications/`;
    const response = await apiClient.get(url, { params: { is_read: false } });
    return response.data.length;
  }
}

export default new NotificationApi();
