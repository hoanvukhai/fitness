'use client';

import { useState, useEffect } from 'react';
import { getAllWorkouts } from '@/lib/firestore';
import { WorkoutSession } from '@/lib/types';
import { getDayLabel, getSessionLabel } from '@/lib/workout-engine';
import { ChevronLeft, ChevronRight, ChevronDown, Clock, Pencil, Trash2 } from 'lucide-react';
import EditSessionSheet from '@/components/EditSessionSheet';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getAllWorkouts().then(data => {
      setWorkouts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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

  const completed = workouts.filter(w => w.status === 'completed');

  return (
    <div className="bg-slate-950 min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors -ml-2 p-2"
          >
            <ChevronLeft size={20} />
            <span className="font-medium text-sm">Tiến độ</span>
          </button>
          <div className="flex-1 text-center font-bold text-lg text-white mr-8">
            Tất cả lịch sử
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center text-slate-500 py-10 animate-pulse">Đang tải...</div>
        ) : completed.length === 0 ? (
          <div className="text-center text-slate-500 py-10">Chưa có buổi tập nào</div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800">
              <h3 className="font-bold text-slate-200 flex items-center gap-2">
                <Clock size={18} className="text-slate-500" />
                Lịch sử buổi tập ({completed.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-800">
              {[...completed].sort((a, b) => b.date.localeCompare(a.date)).map(w => (
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
                      
                      <div className="flex items-center gap-1 mr-2">
                        <button
                          onClick={e => { e.stopPropagation(); setEditingId(w.id); }}
                          className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors cursor-pointer"
                          title="Sửa buổi tập"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(w.id); }}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
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
        )}
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
