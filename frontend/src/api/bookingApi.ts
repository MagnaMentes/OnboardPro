import { User } from "../types/user";
import apiClient from "./apiClient";

// Интерфейс для виртуальной встречи
export interface VirtualMeetingSlot {
  id: number;
  step: number;
  step_name: string;
  step_type: string;
  assigned_user: number;
  assigned_user_email: string;
  start_time: string;
  end_time: string;
  meeting_link?: string;
}

// Интерфейс для фильтров встреч
export interface MeetingsFilter {
  date?: string;
  stepType?: string;
}

// API для работы с виртуальными встречами
const bookingApi = {
  // Получение списка виртуальных встреч для текущего пользователя
  getUserMeetings: async (): Promise<VirtualMeetingSlot[]> => {
    try {
      const response = await apiClient.get("/booking/slots/");
      // Если данные есть, возвращаем их
      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        return response.data;
      }

      // Если данных нет и мы в режиме разработки, возвращаем мок-данные
      if (import.meta.env.DEV) {
        console.log("Используем мок-данные для встреч в режиме разработки");
        const { mockMeetings } = await import("../mocks/bookingMocks");
        return mockMeetings;
      }

      // Если нет данных и не в режиме разработки, возвращаем пустой массив
      return [];
    } catch (error) {
      console.error("Ошибка при запросе встреч:", error);

      // В режиме разработки возвращаем мок-данные при ошибке
      if (import.meta.env.DEV) {
        console.log("Произошла ошибка запроса, используем мок-данные");
        const { mockMeetings } = await import("../mocks/bookingMocks");
        return mockMeetings;
      }

      throw new Error("Ошибка получения встреч");
    }
  },

  // Получение деталей конкретной встречи
  getMeetingDetails: async (id: number): Promise<VirtualMeetingSlot> => {
    try {
      const response = await apiClient.get(`/booking/slots/${id}/`);
      return response.data;
    } catch (error) {
      console.error("Ошибка при запросе деталей встречи:", error);
      throw new Error("Ошибка получения деталей встречи");
    }
  },

  // Создание новой встречи (только для HR/Admin)
  createMeeting: async (
    meetingData: Omit<
      VirtualMeetingSlot,
      "id" | "step_name" | "step_type" | "assigned_user_email"
    >
  ): Promise<VirtualMeetingSlot> => {
    try {
      const response = await apiClient.post("/booking/slots/", meetingData);
      return response.data;
    } catch (error) {
      console.error("Ошибка при создании встречи:", error);
      throw new Error("Ошибка создания встречи");
    }
  },

  // Удаление встречи (только для HR/Admin)
  deleteMeeting: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/booking/slots/${id}/`);
    } catch (error) {
      console.error("Ошибка при удалении встречи:", error);
      throw new Error("Ошибка удаления встречи");
    }
  },
};

export default bookingApi;
