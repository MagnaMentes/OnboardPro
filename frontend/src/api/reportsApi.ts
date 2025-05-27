// Сервис для экспорта отчетов
import apiClient from "./apiClient";

// Класс для работы с экспортом отчетов
class ReportsApi {
  constructor() {
    // Используем напрямую apiClient
  }

  // Получение PDF отчета по назначениям программ
  async getAssignmentsPdfReport(): Promise<Blob> {
    const url = `/api/reports/assignments/pdf/`;
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  }

  // Получение CSV отчета по назначениям программ
  async getAssignmentsCsvReport(): Promise<Blob> {
    const url = `/api/reports/assignments/csv/`;
    const response = await apiClient.get(url, {
      responseType: "blob",
    });
    return response.data;
  }
}

export default new ReportsApi();
