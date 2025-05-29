import { VirtualMeetingSlot } from "../api/bookingApi";
import { addDays, subDays } from "date-fns";

// Текущая дата
const now = new Date();

// Генерируем мок-данные для встреч
export const mockMeetings: VirtualMeetingSlot[] = [
  {
    id: 1,
    step: 1,
    step_name: "Вводная встреча с HR",
    step_type: "introduction",
    assigned_user: 101,
    assigned_user_email: "hr@onboardpro.com",
    start_time: addDays(now, 2).toISOString(),
    end_time: addDays(now, 2).toISOString().replace("T14:00:00", "T15:00:00"),
    meeting_link: "https://zoom.us/j/123456789",
  },
  {
    id: 2,
    step: 2,
    step_name: "Знакомство с командой",
    step_type: "team_meeting",
    assigned_user: 102,
    assigned_user_email: "team_lead@onboardpro.com",
    start_time: addDays(now, 3).toISOString(),
    end_time: addDays(now, 3).toISOString().replace("T11:00:00", "T12:30:00"),
    meeting_link: "https://meet.google.com/abc-defg-hij",
  },
  {
    id: 3,
    step: 3,
    step_name: "Встреча по техническим вопросам",
    step_type: "technical",
    assigned_user: 103,
    assigned_user_email: "tech_lead@onboardpro.com",
    start_time: addDays(now, 5).toISOString(),
    end_time: addDays(now, 5).toISOString().replace("T10:00:00", "T11:00:00"),
    meeting_link: "https://teams.microsoft.com/meet/123456",
  },
  {
    id: 4,
    step: 4,
    step_name: "Обзор проектов компании",
    step_type: "project_overview",
    assigned_user: 104,
    assigned_user_email: "pm@onboardpro.com",
    start_time: subDays(now, 2).toISOString(),
    end_time: subDays(now, 2).toISOString().replace("T16:00:00", "T17:00:00"),
    meeting_link: "https://zoom.us/j/987654321",
  },
  {
    id: 5,
    step: 5,
    step_name: "Обсуждение целей и KPI",
    step_type: "goals_setting",
    assigned_user: 105,
    assigned_user_email: "manager@onboardpro.com",
    start_time: subDays(now, 5).toISOString(),
    end_time: subDays(now, 5).toISOString().replace("T14:30:00", "T16:00:00"),
    meeting_link: "https://meet.google.com/xyz-abcd-efg",
  },
];
