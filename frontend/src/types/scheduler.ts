/**
 * Type definitions for Smart Scheduler
 */

export namespace SmartScheduler {
  /**
   * Запланированный шаг онбординга
   */
  export interface ScheduledStep {
    id: number;
    step_progress: number;
    scheduled_start_time: string;
    scheduled_end_time: string;
    last_rescheduled_at: string;
    priority: number;
    auto_scheduled: boolean;
    time_zone: string;
    step_name?: string;
    step_type?: string;
    step_status?: string;
    user?: UserMinimal;
  }

  /**
   * Ограничение для планирования
   */
  export interface ScheduleConstraint {
    id: number;
    name: string;
    description: string;
    constraint_type: "dependency" | "time_slot" | "workload" | "role";
    dependent_step?: number;
    dependent_step_name?: string;
    prerequisite_step?: number;
    prerequisite_step_name?: string;
    max_duration_minutes?: number;
    max_concurrent_steps?: number;
    required_roles?: string[];
    active: boolean;
  }

  /**
   * Доступность пользователя
   */
  export interface UserAvailability {
    id: number;
    user: number;
    user_name?: string;
    start_time: string;
    end_time: string;
    availability_type:
      | "working_hours"
      | "vacation"
      | "unavailable"
      | "preferred";
    recurrence_rule: string;
    time_zone: string;
  }

  /**
   * Нагрузка на ментора
   */
  export interface MentorLoad {
    id: number;
    mentor: number;
    mentor_name?: string;
    max_weekly_hours: number;
    max_daily_sessions: number;
    current_weekly_hours: number;
    current_daily_sessions: Record<string, number>;
    specializations: string[];
    active: boolean;
  }

  /**
   * Событие календаря
   */
  export interface CalendarEvent {
    id: number;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    participants: number[];
    participants_data?: UserMinimal[];
    event_type: "onboarding_step" | "meeting" | "training" | "other";
    location: string;
    virtual_meeting_link: string;
    scheduled_step?: number;
    external_calendar_id: string;
    time_zone: string;
    is_all_day: boolean;
    reminder_minutes: number;
  }

  /**
   * Минимальная информация о пользователе
   */
  export interface UserMinimal {
    id: number;
    email: string;
    full_name?: string;
  }

  /**
   * Запрос на запуск планирования
   */
  export interface SchedulePlanRequest {
    assignment_id: number;
  }

  /**
   * Запрос на ручное изменение расписания
   */
  export interface ScheduleOverrideRequest {
    scheduled_step_id: number;
    new_start_time: string;
    new_end_time: string;
  }

  /**
   * Запрос на получение конфликтов
   */
  export interface ConflictsRequest {
    user_id?: number;
    start_date?: string;
    end_date?: string;
  }

  /**
   * Запрос на получение расписания пользователя
   */
  export interface UserScheduleRequest {
    user_id: number;
    start_date?: string;
    end_date?: string;
  }

  /**
   * Шаг расписания с риском задержки
   */
  export interface DelayRisk {
    step_id: number;
    step_name: string;
    risk_score: number;
    risk_level: "Низкий" | "Средний" | "Высокий";
    risk_factors: string[];
    planned_date_end: string;
  }

  /**
   * Метрики для критического шага
   */
  export interface CriticalStepMetrics {
    dependency_count: number;
    average_delay_days: number;
    on_time_percentage: number;
  }

  /**
   * Критически важный шаг
   */
  export interface CriticalStep {
    step_id: number;
    step_name: string;
    priority: number;
    metrics: CriticalStepMetrics;
    is_required: boolean;
    step_type: string;
  }

  /**
   * Информация о пользователе с нагрузкой
   */
  export interface UserWorkload {
    user_id: number;
    name: string;
    email: string;
    workload: number;
    overload_percentage?: number;
    capacity_percentage?: number;
  }

  /**
   * Рекомендация по перераспределению нагрузки
   */
  export interface WorkloadRecommendation {
    action: "reassign_step";
    step_id: number;
    step_name: string;
    from_user_id: number;
    from_user_name: string;
    to_user_id: number;
    to_user_name: string;
    workload_hours: number;
  }

  /**
   * Результат оптимизации нагрузки
   */
  export interface WorkloadDistribution {
    average_workload_hours: number;
    overloaded_users: UserWorkload[];
    underloaded_users: UserWorkload[];
    recommendations: WorkloadRecommendation[];
  }

  /**
   * Информация о конфликте в расписании
   */
  export interface ScheduleConflict {
    step1: {
      id: number;
      name: string;
      start_time: string;
      end_time: string;
    };
    step2: {
      id: number;
      name: string;
      start_time: string;
      end_time: string;
    };
    overlap_start: string;
    overlap_end: string;
  }

  /**
   * Информация о конфликтах пользователя
   */
  export interface UserConflicts {
    user_id: number;
    user_name: string;
    conflicts: ScheduleConflict[];
  }

  /**
   * Расписание пользователя
   */
  export interface UserSchedule {
    user: UserMinimal;
    steps: ScheduledStep[];
    events: CalendarEvent[];
    period: {
      start_date: string;
      end_date: string;
    };
  }
}
