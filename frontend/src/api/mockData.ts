import { UserLevel, UserReward } from "./types";

// Мок данные для разработки в случае недоступности API
export const mockUserLevel: UserLevel = {
  level: 2,
  points: 350,
  points_to_next_level: 150,
  max_points: 500,
  name: "Уровень 2",
};

export const mockUserRewards: UserReward[] = [
  {
    id: 1,
    title: "Первый день",
    description: "Успешное завершение первого дня",
    icon: "trophy",
    reward_type: "achievement",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Знакомство с командой",
    description: "Успешно познакомился со всеми членами команды",
    icon: "users",
    reward_type: "social",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Первая задача",
    description: "Выполнена первая рабочая задача",
    icon: "check-circle",
    reward_type: "task",
    created_at: new Date().toISOString(),
  },
];
