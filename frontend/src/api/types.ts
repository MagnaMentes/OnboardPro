// Если не установлен axios, то определяем типы здесь
export interface AxiosError<T = any> extends Error {
  config: any;
  code?: string;
  request?: any;
  response?: {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    config: any;
  };
  isAxiosError: boolean;
}

export interface InternalAxiosRequestConfig<D = any> {
  headers: Record<string, string>;
  data?: D;
  url?: string;
  method?: string;
  baseURL?: string;
  params?: any;
  timeout?: number;
  withCredentials?: boolean;
  [key: string]: any;
}

// Типы для системы геймификации
export interface UserLevel {
  level: number;
  points: number;
  points_to_next_level: number;
  total_points?: number;
  name?: string;
  max_points?: number;
}

export interface UserReward {
  id: number;
  title?: string;
  name?: string;
  description: string;
  image_url?: string;
  icon?: string;
  reward_type?: string;
  created_at: string; // Удалено, используем только created_at
}

export interface GamificationBlockProps {
  userLevel: UserLevel | null;
  userRewards: UserReward[]; // Используется в типе
  recentRewards?: UserReward[]; // Используется в компоненте
  isLoading: boolean;
}
