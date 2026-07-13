// Engine tính toán gợi ý tạ theo giáo án PPL 2.0
import { AppSettings, ExerciseLog, SetLog } from './types';

const TIER1_IDS_BY_KEY: Record<string, string> = {
  benchPress: 'bench-press',
  ohp: 'ohp',
  barbellRow: 'barbell-row',
  pullup: 'pullup',
  backSquat: 'back-squat',
  rdl: 'rdl',
};

/**
 * Tính gợi ý tạ cho bài Tier 1 dựa vào tuần hiện tại trong tháng
 */
export function suggestTier1Weight(
  currentWeight: number,
  weekInMonth: number // 1-4
): { weight: number; reason: string; rule: string } {
  if (weekInMonth <= 2) {
    return {
      weight: currentWeight,
      reason: `Tuần ${weekInMonth}: Giữ nguyên tạ, củng cố kỹ thuật (RIR 2-3)`,
      rule: 'tier1_week1-2',
    };
  }
  if (weekInMonth === 3) {
    const newWeight = Math.ceil(currentWeight * 1.025 / 2.5) * 2.5; // làm tròn lên 2.5kg
    return {
      weight: newWeight,
      reason: `Tuần 3: Tăng tạ +2.5% (${currentWeight}kg → ${newWeight}kg), RIR 1-2`,
      rule: 'tier1_week3',
    };
  }
  // Tuần 4: giữ tạ tuần 3, dồn sức
  return {
    weight: currentWeight,
    reason: `Tuần 4 (Đỉnh điểm): Giữ tạ tuần 3, dồn hết sức (RIR 1). Tạ này là cơ sở cho tháng sau.`,
    rule: 'tier1_week4',
  };
}

/**
 * Double Progression cho bài Phụ & Buổi B
 * Nếu 2 buổi liên tiếp đạt đầu trên rep range → tăng tạ
 */
export function suggestDoubleProgression(
  exerciseName: string,
  currentWeight: number,
  lastTwoSessions: SetLog[][], // mảng [[set logs session -2], [set logs session -1]]
  maxRepRange: number,
  increment: number = 2.5
): { weight: number; reason: string; shouldIncrease: boolean } {
  if (lastTwoSessions.length < 2) {
    return {
      weight: currentWeight,
      reason: 'Chưa đủ 2 buổi dữ liệu để đánh giá.',
      shouldIncrease: false,
    };
  }

  const allSetsReachMax = lastTwoSessions.every(sessionSets =>
    sessionSets.every(s => s.completed && s.reps >= maxRepRange)
  );

  if (allSetsReachMax) {
    const newWeight = currentWeight + increment;
    return {
      weight: newWeight,
      reason: `2 buổi liên tiếp đạt ${maxRepRange} reps → Tăng ${increment}kg (${currentWeight} → ${newWeight}kg)`,
      shouldIncrease: true,
    };
  }

  return {
    weight: currentWeight,
    reason: `Chưa đạt đầu trên rep range 2 buổi liên tiếp. Giữ ${currentWeight}kg, tiếp tục hoàn thiện.`,
    shouldIncrease: false,
  };
}

/**
 * Tính tuần trong tháng hiện tại (1-4)
 */
export function getWeekInMonth(settings: AppSettings): number {
  return ((settings.currentWeek - 1) % 4) + 1;
}

/**
 * Tính hôm nay là buổi tập gì (theo lịch 6 buổi/tuần)
 * 0=CN, 1=T2, 2=T3, 3=T4, 4=T5, 5=T6, 6=T7
 */
const SCHEDULE_6DAY = [
  { weekday: 1, day: 'push', session: 'A' as const },
  { weekday: 2, day: 'pull', session: 'A' as const },
  { weekday: 3, day: 'legs', session: 'A' as const },
  { weekday: 4, day: 'push', session: 'B' as const },
  { weekday: 5, day: 'pull', session: 'B' as const },
  { weekday: 6, day: 'legs', session: 'B' as const },
];

const SCHEDULE_3DAY = [
  { weekday: 1, day: 'push', session: 'A' as const },
  { weekday: 3, day: 'pull', session: 'A' as const },
  { weekday: 5, day: 'legs', session: 'A' as const },
];

export function getTodaySession(settings: AppSettings): { day: string; session: 'A' | 'B' } | null {
  const today = new Date().getDay(); // 0=Sunday
  const schedule = settings.scheduleType === '6day' ? SCHEDULE_6DAY : SCHEDULE_3DAY;
  const found = schedule.find(s => s.weekday === today);
  return found ? { day: found.day, session: found.session } : null;
}

/**
 * Tạo ID cho một buổi tập
 */
export function generateWorkoutId(
  date: string,
  day: string,
  session: string
): string {
  return `${date}-${day}-${session.toLowerCase()}`;
}

/**
 * Định dạng ngày YYYY-MM-DD
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Tính tổng volume của một buổi
 */
export function calcTotalVolume(exercises: ExerciseLog[]): number {
  return exercises.reduce((total, ex) => {
    const exVolume = ex.sets
      .filter(s => s.completed)
      .reduce((sum, s) => sum + s.weight * s.reps, 0);
    return total + exVolume;
  }, 0);
}

/**
 * Tên hiển thị ngày tập
 */
export function getDayLabel(day: string): string {
  const labels: Record<string, string> = {
    push: '🔵 PUSH',
    pull: '🔴 PULL',
    legs: '🟢 LEGS',
  };
  return labels[day] || day.toUpperCase();
}

export function getSessionLabel(session: string): string {
  return session === 'A' ? 'A – Sức mạnh' : 'B – Phì đại';
}
