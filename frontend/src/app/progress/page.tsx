'use client';

import { useState, useEffect } from 'react';
import { getAllWorkouts } from '@/lib/firestore';
import { WorkoutSession } from '@/lib/types';
import { getDayLabel, getSessionLabel, formatDate } from '@/lib/workout-engine';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Flame, Calendar, Clock, Weight, ChevronDown, ChevronRight } from 'lucide-react';

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

function buildStreakData(workouts: WorkoutSession[]) {
  const done = new Set(workouts.filter(w => w.status === 'completed').map(w => w.date));
  const today = new Date();
  const days: { date: string; active: boolean; label: string }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = formatDate(d);
    days.push({
      date: iso,
      active: done.has(iso),
      label: d.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'numeric' }),
    });
  }
  return days;
}

function calcStreak(workouts: WorkoutSession[]): number {
  const done = new Set(workouts.filter(w => w.status === 'completed').map(w => w.date));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (done.has(formatDate(d))) streak++;
    else break;
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
  const streakDays = buildStreakData(workouts);
  const streak = calcStreak(workouts);
  const totalVolume = completed.reduce((s, w) => s + w.totalVolume, 0);
  const totalTime = completed.reduce((s, w) => s + w.durationSeconds, 0);

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

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, value: `${streak}`, sub: 'ngày streak', color: 'text-orange-400' },
            { icon: Weight, value: `${(totalVolume / 1000).toFixed(1)}T`, sub: 'tổng khối lượng', color: 'text-emerald-400' },
            { icon: Clock, value: `${Math.floor(totalTime / 3600)}h`, sub: `${Math.floor((totalTime % 3600) / 60)}m tập`, color: 'text-blue-400' },
          ].map(({ icon: Icon, value, sub, color }) => (
            <div key={sub} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-1.5">
              <Icon size={18} className={color} />
              <div className="font-extrabold text-white text-xl leading-none">{value}</div>
              <div className="text-[10px] text-slate-500 text-center">{sub}</div>
            </div>
          ))}
        </div>

        {/* Streak Calendar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-slate-500" />
            28 ngày gần đây
          </h3>
          <div className="grid grid-cols-7 gap-1.5">
            {streakDays.map(day => (
              <div
                key={day.date}
                title={day.label}
                className={`aspect-square rounded-lg transition-colors ${
                  day.active
                    ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span className="text-xs text-slate-500">Ngày đã tập</span>
            <div className="w-3 h-3 rounded bg-slate-800 ml-2" />
            <span className="text-xs text-slate-500">Nghỉ</span>
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
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 flex items-center gap-2">
              <Clock size={18} className="text-slate-500" />
              Lịch sử buổi tập
            </h3>
          </div>
          <div className="divide-y divide-slate-800">
            {[...completed].sort((a, b) => b.date.localeCompare(a.date)).map(w => (
              <div key={w.id}>
                <button
                  onClick={() => setExpandedSession(expandedSession === w.id ? null : w.id)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/50 transition-colors"
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
                      <div className="text-xs text-slate-400 font-mono">{(w.totalVolume / 1000).toFixed(1)}T</div>
                      <div className="text-xs text-slate-600">{Math.floor(w.durationSeconds / 60)}m</div>
                    </div>
                    {expandedSession === w.id
                      ? <ChevronDown size={16} className="text-slate-500" />
                      : <ChevronRight size={16} className="text-slate-500" />
                    }
                  </div>
                </button>
                {expandedSession === w.id && (
                  <div className="px-5 pb-5 space-y-2">
                    {w.exercises.map(ex => {
                      const doneSets = ex.sets.filter(s => s.completed);
                      const maxW = doneSets.length ? Math.max(...doneSets.map(s => s.weight)) : 0;
                      return (
                        <div key={ex.exerciseId} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                          <div>
                            <div className="text-sm font-medium text-slate-300">{ex.name}</div>
                            <div className="text-xs text-slate-500">{doneSets.length}/{ex.targetSets} hiệp</div>
                          </div>
                          {maxW > 0 && (
                            <div className="font-mono text-sm font-bold text-slate-400">
                              {maxW}kg × {Math.round(doneSets.reduce((s, h) => s + h.reps, 0) / (doneSets.length || 1))}r
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
