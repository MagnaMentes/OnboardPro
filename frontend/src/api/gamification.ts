// Этот файл реэкспортирует из gamificationApi.ts для обратной совместимости
// DEPRECATED: используйте import { gamificationApi } from './gamificationApi'; вместо этого
import { gamificationApi, UserReward, UserLevel } from "./gamificationApi";

// Реэкспортируем типы для использования компонентами
export type { UserReward, UserLevel };

export default gamificationApi;
