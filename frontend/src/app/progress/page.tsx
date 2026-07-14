'use client';

import { useState, useEffect } from 'react';
import { getAllWorkouts, deleteWorkout, saveWorkoutSession } from '@/lib/firestore';
import { WorkoutSession } from '@/lib/types';
import { getDayLabel, getSessionLabel } from '@/lib/workout-engine';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Flame, Calendar, Clock, Target, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';

// A1: Luôn dùng múi giờ Việt Nam (UTC+7)
function todayVN(): string {
  return new Date().toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
}
function dateVN(d: Date): string {
  return d.toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const TIER1_EXERCISES = [
  { key: 'Đẩy ngực tạ đòn', label: 'Bench Press', color: '#3b82f6' },
  { key: 'Đẩy vai tạ đơn ngồi', label: 'OHP', color: '#8b5cf6' },
  { key: 'Kéo tạ đòn cúi người', label: 'Barbell Row', color: '#10b981' },
  { key: 'Kéo xà / Lat Pulldown', label: 'Pull-up', color: '#f59e0b' },
  { key: 'Squat tạ đòn', label: 'Back Squat', color: '#ef4444' },
  { key: 'RDL', label: 'RDL', color: '#06b6d4' },
];

function buildChartData(workouts: WorkoutSession[]) {
  return workouts
    .filter(w => w.status === 'completed')
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(w => {
      const point: Record<string, any> = { date: w.date.slice(5) }; // MM-DD
      TIER1_EXERCISES.forEach(ex => {
        const found = w.exercises.find(e => e.name === ex.key);
        if (found) {
          const maxWeight = Math.max(...found.sets.filter(s => s.completed).map(s => s.weight), 0);
          if (maxWeight > 0) point[ex.label] = maxWeight;
        }
      });
      return point;
    });
}

// A2: Calendar data — 24 tuần (6 tháng), bắt đầu từ T2
function buildCalendarData(workouts: WorkoutSession[]) {
  const done = new Map<string, WorkoutSession>();
  workouts.filter(w => w.status === 'completed').forEach(w => done.set(w.date, w));

  // Tìm T2 gần nhất (hoặc hôm nay nếu là T2) để làm anchor
  const todayStr = todayVN();
  const today = new Date(todayStr);
  const dayOfWeek = today.getDay(); // 0=CN, 1=T2...
  // Lùi về T2 của tuần hiện tại
  const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMon);

  // 24 tuần = 168 ngày, từ T2 cách đây 23 tuần
  const WEEKS = 24;
  const startMonday = new Date(thisMonday);
  startMonday.setDate(thisMonday.getDate() - ((WEEKS - 1) * 7));

  // weeks[col][row] where col=week, row=day(0=T2..6=CN)
  const weeks: { date: string; session?: WorkoutSession }[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: { date: string; session?: WorkoutSession }[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(startMonday);
      dt.setDate(startMonday.getDate() + w * 7 + d);
      const iso = dateVN(dt);
      week.push({ date: iso, session: done.get(iso) });
    }
    weeks.push(week);
  }
  return weeks;
}

function getDaysDiff(d1: string, d2: string) {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return Math.round((date1.getTime() - date2.getTime()) / (1000 * 3600 * 24));
}

// A1: Tính chuỗi buổi tập (cho phép nghỉ tối đa 3 ngày mà không mất chuỗi)
function calcStreak(workouts: WorkoutSession[]): number {
  const doneDates = Array.from(new Set(workouts.filter(w => w.status === 'completed').map(w => w.date))).sort().reverse();
  
  if (doneDates.length === 0) return 0;

  const todayStr = todayVN();
  const lastWorkoutStr = doneDates[0];
  
  // Nếu đã nghỉ quá 3 ngày tính từ hôm nay, chuỗi bị reset về 0
  if (getDaysDiff(todayStr, lastWorkoutStr) > 3) return 0;

  let streak = 1;
  for (let i = 0; i < doneDates.length - 1; i++) {
    const gap = getDaysDiff(doneDates[i], doneDates[i+1]);
    
    // Nếu khoảng cách giữa 2 buổi tập <= 3 ngày (tức là nghỉ tối đa 2 ngày)
    if (gap <= 3) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="text-slate-400 font-medium mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-bold text-white">{p.value}kg</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function ProgressPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLines, setActiveLines] = useState<Set<string>>(
    new Set(TIER1_EXERCISES.map(e => e.label))
  );
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    getAllWorkouts().then(data => {
      setWorkouts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const completed = workouts.filter(w => w.status === 'completed');
  const chartData = buildChartData(workouts);
  const calendarWeeks = buildCalendarData(workouts);
  const streak = calcStreak(workouts);
  const totalTime = completed.reduce((s, w) => s + w.durationSeconds, 0);
  // A3: tổng buổi thay cho tổng khối lượng
  const totalSessions = completed.length;

  const toggleLine = (label: string) => {
    setActiveLines(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500 text-sm animate-pulse">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (completed.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="text-5xl">📊</div>
        <h2 className="text-xl font-bold text-white">Chưa có dữ liệu</h2>
        <p className="text-slate-400 text-sm max-w-xs">
          Hoàn thành buổi tập đầu tiên để xem biểu đồ tiến độ và thống kê của bạn ở đây.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen pb-8">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <h1 className="text-2xl font-extrabold text-white">Tiến độ</h1>

        {/* Stats Row — A3: thay tổng khối → tổng buổi */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame,  value: `${streak}`,        sub: 'ngày streak',   color: 'text-orange-400' },
            { icon: Target, value: `${totalSessions}`, sub: 'buổi hoàn thành', color: 'text-emerald-400' },
            { icon: Clock,  value: `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m`, sub: 'tổng thời gian', color: 'text-blue-400' },
          ].map(({ icon: Icon, value, sub, color }) => (
            <div key={sub} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-1.5">
              <Icon size={18} className={color} />
              <div className="font-extrabold text-white text-lg leading-none text-center">{value}</div>
              <div className="text-[10px] text-slate-500 text-center">{sub}</div>
            </div>
          ))}
        </div>

        {/* A2: Calendar kiểu GitHub — cột=tuần, hàng=thứ */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-slate-500" />
            6 tháng gần đây
          </h3>
          <div className="flex gap-2">
            {/* Row labels */}
            <div className="flex flex-col gap-1 pt-0.5 justify-between">
              {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
                <div key={d} className="h-4 flex items-center text-[10px] text-slate-500 w-4">{d}</div>
              ))}
            </div>
            {/* Grid: cột = tuần */}
            <div className="flex-1 overflow-x-auto scrollbar-none pb-2 flex justify-end">
              <div className="flex gap-1 min-w-max">
                {calendarWeeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-1">
                    {week.map((cell, di) => {
                      const dayColors: Record<string, string> = {
                        push: 'bg-sky-500',
                        pull: 'bg-indigo-500',
                        legs: 'bg-emerald-500',
                      };
                      const color = cell.session ? (dayColors[cell.session.day] || 'bg-slate-400') : 'bg-slate-800/40';
                      
                      let opacityClass = 'opacity-100';
                      if (cell.session) {
                        const mins = Math.floor(cell.session.durationSeconds / 60);
                        if (mins < 45) opacityClass = 'opacity-40';
                        else if (mins <= 60) opacityClass = 'opacity-70';
                        else opacityClass = 'opacity-100';
                      }

                      const title = cell.session
                        ? `${new Date(cell.date).toLocaleDateString('vi-VN')} · ${getDayLabel(cell.session.day)} ${cell.session.session} (${Math.floor(cell.session.durationSeconds / 60)}m)`
                        : new Date(cell.date).toLocaleDateString('vi-VN');
                      
                      return (
                        <div
                          key={di}
                          title={title}
                          className={`w-4 h-4 rounded-[3px] transition-colors ${color} ${opacityClass}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-3 gap-3 border-t border-slate-800 pt-3">
            <div className="flex flex-wrap items-center gap-3">
              {[{c:'bg-sky-500',l:'Push'},{c:'bg-indigo-500',l:'Pull'},{c:'bg-emerald-500',l:'Legs'},{c:'bg-slate-800/40',l:'Nghỉ'}].map(({c,l})=>(
                <div key={l} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-[2px] ${c}`} />
                  <span className="text-[10px] text-slate-500 font-medium">{l}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-medium">Nhẹ</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-slate-400 opacity-40" />
                <div className="w-3 h-3 rounded-[2px] bg-slate-400 opacity-70" />
                <div className="w-3 h-3 rounded-[2px] bg-slate-400 opacity-100" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Nặng</span>
            </div>
          </div>
        </div>

        {/* Strength Progress Chart */}
        {chartData.length >= 2 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-slate-500" />
              Tiến trình tạ Tier 1 (kg)
            </h3>
            {/* Toggle lines */}
            <div className="flex flex-wrap gap-2 mb-4">
              {TIER1_EXERCISES.map(ex => (
                <button
                  key={ex.label}
                  onClick={() => toggleLine(ex.label)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    activeLines.has(ex.label)
                      ? 'border-transparent text-white'
                      : 'border-slate-700 bg-transparent text-slate-500'
                  }`}
                  style={activeLines.has(ex.label) ? { backgroundColor: ex.color + '30', borderColor: ex.color + '60', color: ex.color } : {}}
                >
                  <div className="w-2 h-2 rounded-full" style={{ background: activeLines.has(ex.label) ? ex.color : '#475569' }} />
                  {ex.label}
                </button>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                {TIER1_EXERCISES.filter(ex => activeLines.has(ex.label)).map(ex => (
                  <Line
                    key={ex.label}
                    type="monotone"
                    dataKey={ex.label}
                    stroke={ex.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: ex.color, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Session History */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Clock size={18} className="text-slate-500" />
              Lịch sử buổi tập
            </h3>
            {completed.length > 0 && (
              <Link href="/progress/history" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                Xem tất cả
              </Link>
            )}
          </div>
          <div className="divide-y divide-slate-800">
            {[...completed].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map(w => (
              <div key={w.id}>
                <div
                  onClick={() => setExpandedSession(expandedSession === w.id ? null : w.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <div className="font-semibold text-slate-200 text-sm">
                        {getDayLabel(w.day)} · <span className="text-slate-400 font-normal">{getSessionLabel(w.session)}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {new Date(w.date).toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'long' })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-slate-400 font-mono">Tuần {w.week}</div>
                      <div className="text-xs text-slate-600">{Math.floor(w.durationSeconds / 60)}m</div>
                    </div>
                    {expandedSession === w.id
                      ? <ChevronDown size={16} className="text-slate-500" />
                      : <ChevronRight size={16} className="text-slate-500" />
                    }
                  </div>
                </div>
                {expandedSession === w.id && (
                  <div className="px-5 pb-5 space-y-2">
                    {w.exercises.map(ex => {
                      const doneSets = ex.sets.filter(s => s.completed);
                      if (doneSets.length === 0) return null;
                      const maxW = Math.max(...doneSets.map(s => s.weight));
                      const isTimeBased = ex.tier === 'core' || ex.targetReps.includes('giây') || ex.targetReps.includes('s');
                      
                      return (
                        <div key={ex.exerciseId} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                          <div>
                            <div className="text-sm font-medium text-slate-300">{ex.name}</div>
                            <div className="text-xs text-slate-500">{doneSets.length}/{ex.targetSets} hiệp</div>
                          </div>
                          {maxW > 0 && !isTimeBased && (
                            <div className="font-mono text-sm font-bold text-slate-400">
                              {maxW}kg × {Math.round(doneSets.reduce((s, h) => s + h.reps, 0) / doneSets.length)}r
                            </div>
                          )}
                          {isTimeBased && (
                            <div className="font-mono text-sm font-bold text-slate-400">
                              {Math.round(doneSets.reduce((s, h) => s + h.reps, 0) / doneSets.length)}s
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
