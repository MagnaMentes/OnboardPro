import { User } from "../types/user";

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
      const response = await fetch("/api/booking/slots/");
      if (!response.ok) {
        throw new Error("Ошибка получения встреч");
      }
      return await response.json();
    } catch (error) {
      console.error("Ошибка при запросе встреч:", error);
      throw error;
    }
  },

  // Получение деталей конкретной встречи
  getMeetingDetails: async (id: number): Promise<VirtualMeetingSlot> => {
    try {
      const response = await fetch(`/api/booking/slots/${id}/`);
      if (!response.ok) {
        throw new Error("Ошибка получения деталей встречи");
      }
      return await response.json();
    } catch (error) {
      console.error("Ошибка при запросе деталей встречи:", error);
      throw error;
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
      const response = await fetch("/api/booking/slots/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Ошибка создания встречи");
      }

      return await response.json();
    } catch (error) {
      console.error("Ошибка при создании встречи:", error);
      throw error;
    }
  },

  // Удаление встречи (только для HR/Admin)
  deleteMeeting: async (id: number): Promise<void> => {
    try {
      const response = await fetch(`/api/booking/slots/${id}/`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Ошибка удаления встречи");
      }
    } catch (error) {
      console.error("Ошибка при удалении встречи:", error);
      throw error;
    }
  },
};

export default bookingApi;
