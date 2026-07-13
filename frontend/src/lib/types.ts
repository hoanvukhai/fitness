// Types cho toàn bộ ứng dụng PPL Tracker

export type DayType = 'push' | 'pull' | 'legs';
export type SessionType = 'A' | 'B';

export interface SetLog {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  nameEn: string;
  tier: 'tier1' | 'main' | 'accessory' | 'core';
  targetWeight: number;
  targetReps: string;
  targetSets: number;
  sets: SetLog[];
  checked: boolean;
  notes: string;
  rest: string;
}

export interface WarmupLog {
  done: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface CooldownLog {
  done: boolean;
  completedAt?: string;
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  day: DayType;
  session: SessionType;
  week: number;
  month: number;
  status: 'planned' | 'in_progress' | 'completed' | 'skipped';
  warmup: WarmupLog;
  exercises: ExerciseLog[];
  cooldown: CooldownLog;
  durationSeconds: number;
  totalVolume: number; // tổng kg * reps
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface AppSettings {
  id: string;
  scheduleType: '3day' | '6day';
  startDate: string; // YYYY-MM-DD — ngày bắt đầu chương trình
  currentWeek: number;
  currentMonth: number;
  tier1Weights: {
    benchPress: number;
    ohp: number;
    barbellRow: number;
    pullup: number; // 0 nếu dùng Lat Pulldown
    backSquat: number;
    rdl: number;
  };
  accessoryWeights: Record<string, number>; // exerciseId -> kg
  isOnboarded: boolean;
}

export interface ProgressSuggestion {
  exerciseId: string;
  exerciseName: string;
  currentWeight: number;
  suggestedWeight: number;
  reason: string;
  rule: 'tier1_week1-2' | 'tier1_week3' | 'tier1_week4' | 'double_progression' | 'new_month';
}
