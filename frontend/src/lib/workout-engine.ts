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
): { suggestedWeight: number; reason: string; oldRir: string; newRir: string } {
  if (weekInMonth === 1) {
    return {
      suggestedWeight: currentWeight,
      reason: `Tuần 1: Làm quen mức tạ mới của tháng`,
      oldRir: '1',
      newRir: '2-3',
    };
  }
  if (weekInMonth === 2) {
    return {
      suggestedWeight: currentWeight,
      reason: `Tuần 2: Củng cố kỹ thuật, đạt đủ reps`,
      oldRir: '2-3',
      newRir: '2',
    };
  }
  if (weekInMonth === 3) {
    const newWeight = currentWeight > 0 ? Math.ceil(currentWeight * 1.025 / 2.5) * 2.5 : 0;
    return {
      suggestedWeight: newWeight > 0 ? newWeight : currentWeight,
      reason: `Tuần 3: Bắt đầu đẩy cường độ, tăng nhẹ tạ`,
      oldRir: '2',
      newRir: '1-2',
    };
  }
  // Tuần 4
  return {
    suggestedWeight: currentWeight,
    reason: `Tuần 4: Đỉnh điểm (Test), dồn sức làm cơ sở cho tháng sau`,
    oldRir: '1-2',
    newRir: '1',
  };
}

/**
 * Double Progression cho bài Phụ & Buổi B
 * Giáo án: "Hễ hoàn thành đủ số hiệp ở đầu trên rep range trong 2 buổi liên tiếp → tăng tạ"
 * Điều kiện: tất cả set phải completed VÀ trung bình reps >= maxRepRange
 */
export function suggestDoubleProgression(
  currentWeight: number,
  lastTwoSessions: SetLog[][], // [[set logs session -2], [set logs session -1]]
  maxRepRange: number,
  increment: number = 2.5
): { suggestedWeight: number; reason: string } {
  if (lastTwoSessions.length < 2) {
    return {
      suggestedWeight: currentWeight,
      reason: 'Chưa đủ 2 buổi dữ liệu để đánh giá tăng tạ.',
    };
  }

  // Điều kiện: tất cả set hoàn thành VÀ avg reps của buổi đó >= maxRepRange
  const bothSessionsQualify = lastTwoSessions.every(sessionSets => {
    if (!sessionSets || sessionSets.length === 0) return false;
    const completedSets = sessionSets.filter(s => s.completed);
    if (completedSets.length === 0) return false;
    const avgReps = completedSets.reduce((sum, s) => sum + s.reps, 0) / completedSets.length;
    return avgReps >= maxRepRange;
  });

  if (bothSessionsQualify) {
    const newWeight = currentWeight > 0 ? currentWeight + increment : 0;
    return {
      suggestedWeight: newWeight > 0 ? newWeight : currentWeight,
      reason: `Đạt TB ≥ ${maxRepRange} reps trong 2 buổi → Tăng ${increment}kg`,
    };
  }

  return {
    suggestedWeight: currentWeight,
    reason: `Chưa đạt đầu trên rep range trong 2 buổi liên tiếp → Giữ nguyên tạ`,
  };
}

/**
 * Tính tuần trong tháng hiện tại (1-4)
 */
export function getWeekInMonth(settings: AppSettings): number {
  return ((settings.currentWeek - 1) % 4) + 1;
}

/**
 * Tính tuần/tháng/weekInMonth dựa trên ngày bắt đầu chương trình thực tế
 * Chu kỳ 12 tuần (3 tháng), sau đó reset về tháng 1 tuần 1 nhưng giữ ngưỡng tạ
 */
export function getWeekAndMonthFromStartDate(startDate: string): {
  week: number;
  month: number;
  weekInMonth: number;
  cycleNumber: number; // Số chu kỳ đã hoàn thành + 1
} {
  const startMs = new Date(startDate).getTime();
  // Dùng múi giờ VN cho ngày hiện tại
  const todayStr = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
  const todayMs = new Date(todayStr).getTime();
  const daysDiff = Math.max(0, Math.floor((todayMs - startMs) / 86400000));
  const weekNumber = Math.floor(daysDiff / 7) + 1; // Tuần 1-based
  const cyclePos = (weekNumber - 1) % 12; // Vị trí trong chu kỳ 12 tuần
  const cycleNumber = Math.floor((weekNumber - 1) / 12) + 1;
  const month = Math.floor(cyclePos / 4) + 1; // 1, 2, 3
  const weekInMonth = (cyclePos % 4) + 1; // 1, 2, 3, 4
  return { week: weekNumber, month, weekInMonth, cycleNumber };
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
 * Định dạng ngày YYYY-MM-DD theo múi giờ Việt Nam (UTC+7)
 * QUAN TRỌNG: KHÔNG dùng toISOString() — trả về UTC, sai giờ VN buổi tối
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
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
    pull: '🟣 PULL',
    legs: '🟢 LEGS',
  };
  return labels[day] || day.toUpperCase();
}

export function getSessionLabel(session: string): string {
  return session === 'A' ? 'A – Sức mạnh' : 'B – Phì đại';
}
