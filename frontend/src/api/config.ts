// config.ts - конфигурационный файл для API
const config = {
  apiUrl: import.meta.env.VITE_API_URL || "/api",
  gamificationEndpoints: {
    userLevel: "/api/gamification/profile/",
    userRewards: "/api/gamification/achievements/",
    leaderboard: "/api/gamification/leaderboard/",
  },
  defaultRequestTimeout: 30000, // 30 секунд
};

export default config;
