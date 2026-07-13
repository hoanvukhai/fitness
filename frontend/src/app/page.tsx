'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { getWorkoutSession, saveWorkoutSession } from '@/lib/firestore';
import {
  getTodaySession, generateWorkoutId, formatDate,
  calcTotalVolume, getDayLabel, getSessionLabel
} from '@/lib/workout-engine';
import { ExerciseLog, WorkoutSession } from '@/lib/types';
import Onboarding from '@/components/Onboarding';
import ExerciseCard from '@/components/ExerciseCard';
import WarmupCooldown from '@/components/WarmupCooldown';
import { Dumbbell, RefreshCw, CheckCircle2, Flame, Clock, Weight } from 'lucide-react';

// Dynamic imports để tránh lỗi SSR
let appConfig: any = null;
let giaoan: any = null;

function getAppConfig() {
  if (!appConfig) {
    try { appConfig = require('../../data/app-config.json'); } catch { appConfig = { warmup: {}, cooldown: {} }; }
  }
  return appConfig;
}

function getGiaoan() {
  if (!giaoan) {
    try { giaoan = require('../../data/giao-an.json'); } catch { giaoan = { months: [] }; }
  }
  return giaoan;
}

function getExercisesForSession(day: string, session: string, month: number) {
  const data = getGiaoan();
  const monthData = data.months?.find((m: any) => m.monthNumber === month);
  if (!monthData) return [];
  const dayData = monthData.days?.[day];
  if (!dayData) return [];
  return session === 'A' ? (dayData.sessionA || []) : (dayData.sessionB || []);
}

function buildExerciseLogs(exercises: any[], settings: any): ExerciseLog[] {
  const tier1Map: Record<string, number> = {
    'Đẩy ngực tạ đòn': settings.tier1Weights?.benchPress || 0,
    'Bench Press': settings.tier1Weights?.benchPress || 0,
    'Đẩy vai tạ đơn ngồi': settings.tier1Weights?.ohp || 0,
    'Kéo tạ đòn cúi người': settings.tier1Weights?.barbellRow || 0,
    'Kéo xà / Lat Pulldown': settings.tier1Weights?.pullup || 0,
    'Squat tạ đòn': settings.tier1Weights?.backSquat || 0,
    'RDL': settings.tier1Weights?.rdl || 0,
  };

  return exercises.map(ex => {
    let targetWeight = ex.tier === 'tier1'
      ? (tier1Map[ex.name] || tier1Map[ex.nameEn] || 0)
      : (settings.accessoryWeights?.[ex.id] || 0);

    return {
      exerciseId: ex.id,
      name: ex.name,
      nameEn: ex.nameEn || '',
      tier: ex.tier,
      targetWeight,
      targetReps: ex.repsDisplay || '',
      targetSets: ex.sets,
      rest: ex.rest || '90 giây',
      sets: Array.from({ length: ex.sets }, (_, i) => ({
        setNumber: i + 1,
        weight: targetWeight,
        reps: 0,
        completed: false,
      })),
      checked: false,
      notes: '',
    };
  });
}

const DAY_OPTIONS = [
  { day: 'push', session: 'A' as const, label: '🔵 Push A – Sức mạnh' },
  { day: 'pull', session: 'A' as const, label: '🔴 Pull A – Sức mạnh' },
  { day: 'legs', session: 'A' as const, label: '🟢 Legs A – Sức mạnh' },
  { day: 'push', session: 'B' as const, label: '🔵 Push B – Phì đại' },
  { day: 'pull', session: 'B' as const, label: '🔴 Pull B – Phì đại' },
  { day: 'legs', session: 'B' as const, label: '🟢 Legs B – Phì đại' },
];

export default function TodayPage() {
  const { settings, loading, error, reload } = useSettings();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [overrideDay, setOverrideDay] = useState<{ day: string; session: 'A' | 'B' } | null>(null);
  const [finished, setFinished] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const todayDate = formatDate();

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;
    const interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const loadSession = useCallback(async () => {
    if (!settings) return;
    setLoadingSession(true);
    const slot = overrideDay || getTodaySession(settings);
    if (!slot) { setLoadingSession(false); return; }

    const { day, session: sess } = slot;
    const id = generateWorkoutId(todayDate, day, sess);
    let existing = await getWorkoutSession(id);

    if (!existing) {
      const raw = getExercisesForSession(day, sess, settings.currentMonth);
      const logs = buildExerciseLogs(raw, settings);
      existing = {
        id, date: todayDate,
        day: day as any, session: sess,
        week: settings.currentWeek, month: settings.currentMonth,
        status: 'planned',
        warmup: { done: false },
        exercises: logs,
        cooldown: { done: false },
        durationSeconds: 0, totalVolume: 0,
      };
    }
    setSession(existing);
    setLoadingSession(false);
  }, [settings, overrideDay, todayDate]);

  useEffect(() => {
    if (settings && !loading) loadSession();
  }, [settings, loading, loadSession]);

  const startSession = async () => {
    if (!session) return;
    const updated = { ...session, status: 'in_progress' as const, startedAt: new Date().toISOString() };
    setSession(updated);
    await saveWorkoutSession(updated);
  };

  const updateExercise = async (index: number, updated: ExerciseLog) => {
    if (!session) return;
    const newExercises = session.exercises.map((ex, i) => i === index ? updated : ex);
    const newSession = { ...session, exercises: newExercises };
    setSession(newSession);
    await saveWorkoutSession(newSession);
  };

  const finishSession = async () => {
    if (!session) return;
    const vol = calcTotalVolume(session.exercises);
    const done: WorkoutSession = {
      ...session, status: 'completed',
      durationSeconds: elapsedSeconds, totalVolume: vol,
      completedAt: new Date().toISOString(),
    };
    await saveWorkoutSession(done);
    setSession(done);
    setFinished(true);
  };

  const doneCount = session?.exercises.filter(ex => ex.checked).length || 0;
  const totalCount = session?.exercises.length || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-500 text-sm animate-pulse">Đang tải...</div>
      </div>
    );
  }

  if (!settings || !settings.isOnboarded) {
    return <Onboarding onComplete={reload} />;
  }

  const todaySlot = overrideDay || getTodaySession(settings);
  const cfg = getAppConfig();

  if (!todaySlot) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-6">
        <div className="text-6xl">😌</div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Hôm nay nghỉ ngơi</h2>
          <p className="text-slate-400 text-sm">Hồi phục tốt là một phần của quá trình tập luyện.</p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <p className="text-slate-500 text-xs uppercase tracking-widest">Hoặc tập bù buổi:</p>
          {DAY_OPTIONS.map(opt => (
            <button
              key={`${opt.day}-${opt.session}`}
              onClick={() => setOverrideDay(opt)}
              className="py-3 px-6 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-sm font-medium hover:bg-slate-800 transition-colors text-left"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (finished && session) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center gap-6">
        <div className="text-6xl">🎉</div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">Xuất sắc!</h2>
          <p className="text-slate-400">{getDayLabel(session.day)} · {getSessionLabel(session.session)}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          {[
            { icon: Clock, value: formatElapsed(elapsedSeconds), label: 'Thời gian', color: 'text-blue-400' },
            { icon: Weight, value: `${session.totalVolume.toLocaleString()}kg`, label: 'Tổng khối', color: 'text-emerald-400' },
            { icon: Flame, value: `${doneCount}/${totalCount}`, label: 'Bài xong', color: 'text-orange-400' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="bg-slate-900 rounded-2xl p-4 flex flex-col items-center gap-1.5">
              <Icon size={20} className={color} />
              <div className="font-bold text-white text-lg leading-none">{value}</div>
              <div className="text-[11px] text-slate-500">{label}</div>
            </div>
          ))}
        </div>
        <div className="w-full max-w-sm space-y-2">
          {session.exercises.map(ex => (
            <div key={ex.exerciseId} className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl">
              <CheckCircle2 size={16} className={ex.checked ? 'text-emerald-400' : 'text-slate-600'} />
              <div className="flex-1 text-sm text-slate-300 font-medium">{ex.name}</div>
              <div className="text-xs font-mono text-slate-500">
                {ex.sets.filter(s => s.completed).length}/{ex.targetSets} hiệp
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const warmupItems = cfg.warmup?.[todaySlot.day] || [];
  const cooldownItems = cfg.cooldown?.[todaySlot.day] || [];

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
              <span>Tuần {settings.currentWeek} · Tháng {settings.currentMonth}</span>
              {session?.status === 'in_progress' && (
                <span className="text-blue-400 animate-pulse">⏱ {formatElapsed(elapsedSeconds)}</span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              {getDayLabel(todaySlot.day)}
            </h1>
            <p className="text-slate-500 text-sm">{getSessionLabel(todaySlot.session)}</p>
          </div>
          <button
            onClick={() => setShowDayPicker(!showDayPicker)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 transition-colors"
            title="Đổi buổi"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Day Picker Dropdown */}
        {showDayPicker && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 space-y-2">
            <p className="text-xs text-slate-500 px-1 mb-2">Chọn buổi tập:</p>
            {DAY_OPTIONS.map(opt => (
              <button
                key={`${opt.day}-${opt.session}`}
                onClick={() => { setOverrideDay(opt); setShowDayPicker(false); setSession(null); }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  todaySlot.day === opt.day && todaySlot.session === opt.session
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {session && (
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
              <span>{doneCount}/{totalCount} bài</span>
              <span>{totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0}%</span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Start button */}
        {session?.status === 'planned' && (
          <button
            onClick={startSession}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
          >
            <Dumbbell size={22} />
            Bắt đầu buổi tập
          </button>
        )}

        {/* Warmup */}
        {warmupItems.length > 0 && (
          <WarmupCooldown title="Khởi động" emoji="🔥" items={warmupItems} color="orange" />
        )}

        {/* Exercises */}
        {loadingSession ? (
          <div className="text-center text-slate-500 py-10 text-sm animate-pulse">Đang tải bài tập...</div>
        ) : (
          <div className="space-y-4">
            {session?.exercises.map((ex, i) => (
              <ExerciseCard
                key={ex.exerciseId}
                exercise={ex}
                index={i}
                nextExerciseName={session.exercises[i + 1]?.name}
                onChange={updated => updateExercise(i, updated)}
              />
            ))}
          </div>
        )}

        {/* Cooldown */}
        {cooldownItems.length > 0 && (
          <WarmupCooldown title="Giãn cơ" emoji="🧘" items={cooldownItems} color="teal" />
        )}

        {/* Finish */}
        {session?.status === 'in_progress' && (
          <button
            onClick={finishSession}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
          >
            <CheckCircle2 size={22} />
            Kết thúc buổi tập
          </button>
        )}
      </div>
    </div>
  );
}
