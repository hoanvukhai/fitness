'use client';

import { useState, useEffect } from 'react';
import { getAllWorkouts, deleteWorkout, saveWorkoutSession } from '@/lib/firestore';
import { WorkoutSession } from '@/lib/types';
import { getDayLabel, getSessionLabel } from '@/lib/workout-engine';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Flame, Calendar, Clock, Target, ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import EditSessionSheet from '@/components/EditSessionSheet';

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

// A2: Calendar data — 4 tuần, bắt đầu từ T2
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

  // 4 tuần = 28 ngày, từ T2 cách đây 3 tuần
  const startMonday = new Date(thisMonday);
  startMonday.setDate(thisMonday.getDate() - 21);

  // weeks[col][row] where col=week(0-3), row=day(0=T2..6=CN)
  const weeks: { date: string; session?: WorkoutSession }[][] = [];
  for (let w = 0; w < 4; w++) {
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

// A1: Tính streak dùng VN timezone
function calcStreak(workouts: WorkoutSession[]): number {
  const done = new Set(workouts.filter(w => w.status === 'completed').map(w => w.date));
  let streak = 0;
  const today = new Date(todayVN());
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (done.has(dateVN(d))) streak++;
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa buổi tập này khỏi lịch sử?')) return;
    await deleteWorkout(id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
  };

  const handleSaveEdit = async (updated: WorkoutSession) => {
    await saveWorkoutSession(updated);
    setWorkouts(prev => prev.map(w => w.id === updated.id ? updated : w));
    setEditingId(null);
  };

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
            4 tuần gần đây
          </h3>
          <div className="flex gap-2">
            {/* Row labels */}
            <div className="flex flex-col gap-1.5 pt-0.5">
              {['T2','T3','T4','T5','T6','T7','CN'].map(d => (
                <div key={d} className="h-8 flex items-center text-[10px] text-slate-600 w-4">{d}</div>
              ))}
            </div>
            {/* Grid: cột = tuần */}
            <div className="flex gap-1.5 flex-1">
              {calendarWeeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-1.5 flex-1">
                  {week.map((cell, di) => {
                    const dayColors: Record<string, string> = {
                      push: 'bg-blue-500',
                      pull: 'bg-red-500',
                      legs: 'bg-emerald-500',
                    };
                    const color = cell.session ? (dayColors[cell.session.day] || 'bg-slate-400') : 'bg-slate-800';
                    const title = cell.session
                      ? `${cell.date}: ${getDayLabel(cell.session.day)} ${cell.session.session}`
                      : cell.date;
                    return (
                      <div
                        key={di}
                        title={title}
                        className={`h-8 rounded-md transition-colors ${color} ${cell.session ? 'opacity-90' : 'opacity-100'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-3">
            {[{c:'bg-blue-500',l:'Push'},{c:'bg-red-500',l:'Pull'},{c:'bg-emerald-500',l:'Legs'},{c:'bg-slate-800',l:'Nghỉ'}].map(({c,l})=>(
              <div key={l} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${c}`} />
                <span className="text-[10px] text-slate-500">{l}</span>
              </div>
            ))}
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
                    
                    <div className="flex items-center gap-1 mr-2">
                      <button
                        onClick={e => { e.stopPropagation(); setEditingId(w.id); }}
                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                        title="Sửa buổi tập"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(w.id); }}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                        title="Xóa buổi tập"
                      >
                        <Trash2 size={15} />
                      </button>
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
      
      {editingId && (
        <EditSessionSheet 
          session={workouts.find(w => w.id === editingId)!} 
          onSave={handleSaveEdit} 
          onClose={() => setEditingId(null)} 
        />
      )}
    </div>
  );
}
