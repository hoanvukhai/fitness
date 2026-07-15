'use client';

import { X, CheckCircle2, Dumbbell, Flame } from 'lucide-react';
import { WorkoutSession } from '@/lib/types';

interface WorkoutOverviewSheetProps {
  session: WorkoutSession;
  warmups: any[];
  cooldowns: any[];
  currentPhase: string;
  currentIndex: number;
  onJump: (phase: 'warmup' | 'main' | 'cooldown', index: number) => void;
  onClose: () => void;
}

export default function WorkoutOverviewSheet({ session, warmups, cooldowns, currentPhase, currentIndex, onJump, onClose }: WorkoutOverviewSheetProps) {
  const renderItem = (phase: 'warmup' | 'main' | 'cooldown', index: number, name: string, isDone: boolean, subtitle: string) => {
    const isActive = currentPhase === phase && currentIndex === index;
    return (
      <button
        key={`${phase}-${index}`}
        onClick={() => onJump(phase, index)}
        className={`w-full text-left p-4 flex items-center justify-between border-b border-slate-800/50 last:border-0 transition-colors ${
          isActive ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : 'hover:bg-slate-800/30'
        }`}
      >
        <div>
          <div className={`font-semibold ${isActive ? 'text-blue-400' : 'text-slate-200'}`}>{name}</div>
          <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
        </div>
        <div>
          {isDone ? <CheckCircle2 className="text-emerald-500" size={20} /> : <div className="w-5 h-5 rounded-full border-2 border-slate-700" />}
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
      
      <div className="bg-slate-900 rounded-t-3xl border-t border-slate-800 w-full max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 relative z-10 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Danh sách buổi tập
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {warmups.length > 0 && (
            <div>
              <h3 className="font-bold text-orange-400 text-sm mb-2 flex items-center gap-2 uppercase tracking-wider px-2">
                <Flame size={16} /> Khởi động
              </h3>
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                {warmups.map((w, i) => renderItem('warmup', i, w.name, false, w.sets && w.reps ? `${w.sets}x${w.reps} ${w.unit}` : w.duration ? `${w.duration}s ${w.unit}` : w.unit))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-bold text-blue-400 text-sm mb-2 flex items-center gap-2 uppercase tracking-wider px-2">
              <Dumbbell size={16} /> Bài tập chính
            </h3>
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
              {session.exercises.map((ex, i) => renderItem(
                'main', 
                i, 
                ex.name, 
                ex.checked, 
                `${ex.sets.filter(s => s.completed).length}/${ex.targetSets} hiệp • ${ex.targetReps}`
              ))}
            </div>
          </div>

          {cooldowns.length > 0 && (
            <div>
              <h3 className="font-bold text-teal-400 text-sm mb-2 flex items-center gap-2 uppercase tracking-wider px-2">
                🧘 Giãn cơ
              </h3>
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                {cooldowns.map((c, i) => renderItem('cooldown', i, c.name, false, c.sets && c.reps ? `${c.sets}x${c.reps} ${c.unit}` : c.duration ? `${c.duration}s ${c.unit}` : c.unit))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
