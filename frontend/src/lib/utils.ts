import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Chuẩn hóa tên bài tập để so sánh */
export const normalize = (str: string): string =>
  (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** Kiểm tra bài tập có phải tính theo giây không */
export const isTimeBasedExercise = (targetReps: string, name?: string): boolean =>
  /giây|giay|\b\d+\s*s\b/.test(targetReps.toLowerCase()) ||
  !!(name && name.toLowerCase().includes('plank'));

/** Format giây thành mm:ss */
export const formatSeconds = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

/** Parse chuỗi rest time thành số giây */
export const parseRestSeconds = (restStr: string): number => {
  const s = restStr.toLowerCase();
  if (s.includes('3 phút')) return 180;
  if (s.includes('2-3 phút')) return 150;
  if (s.includes('2 phút')) return 120;
  if (s.includes('90-120')) return 105;
  if (s.includes('60-90')) return 75;
  if (s.includes('90')) return 90;
  if (s.includes('45')) return 45;
  return 90;
};
