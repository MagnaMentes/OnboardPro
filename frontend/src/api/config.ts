// config.ts - конфигурационный файл для API
const API_URL = import.meta.env.VITE_API_URL || "";
const API_PREFIX = import.meta.env.VITE_API_PREFIX || "/api";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "30000");

const config = {
  apiUrl: API_PREFIX,
  baseURL: API_URL ? `${API_URL}${API_PREFIX}` : API_PREFIX,
  gamificationEndpoints: {
    userLevel: "/gamification/profile/",
    userRewards: "/gamification/achievements/",
    leaderboard: "/gamification/leaderboard/",
  },
  defaultRequestTimeout: API_TIMEOUT, // 30 секунд по умолчанию
};

export default config;
