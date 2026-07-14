'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getWorkoutSession, deleteWorkout, saveWorkoutSession } from '@/lib/firestore';
import { WorkoutSession } from '@/lib/types';
import { getDayLabel, getSessionLabel } from '@/lib/workout-engine';
import { ChevronLeft, Pencil, Trash2, Calendar, Clock, Target } from 'lucide-react';
import EditSessionSheet from '@/components/EditSessionSheet';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (id) {
      getWorkoutSession(id).then(data => {
        setSession(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa buổi tập này khỏi lịch sử?')) return;
    await deleteWorkout(id);
    router.replace('/progress');
  };

  const handleSaveEdit = async (updated: WorkoutSession) => {
    await saveWorkoutSession(updated);
    setSession(updated);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-500 animate-pulse">Đang tải...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="text-slate-500">Không tìm thấy buổi tập.</div>
        <button onClick={() => router.back()} className="text-blue-500">Quay lại</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors -ml-2 p-2"
          >
            <ChevronLeft size={20} />
            <span className="font-medium text-sm">Tiến độ</span>
          </button>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-colors"
              title="Sửa"
            >
              <Pencil size={18} />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
              title="Xóa"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
              Tuần {session.week}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
              session.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
            }`}>
              {session.status === 'completed' ? 'Hoàn thành' : session.status}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            {getDayLabel(session.day)} · {getSessionLabel(session.session)}
          </h1>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <Calendar className="text-slate-500 shrink-0" size={20} />
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Ngày tập</div>
              <div className="text-sm font-semibold text-slate-200">
                {new Date(session.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <Clock className="text-slate-500 shrink-0" size={20} />
            <div>
              <div className="text-xs text-slate-500 mb-0.5">Thời gian</div>
              <div className="text-sm font-semibold text-slate-200">
                {Math.floor(session.durationSeconds / 60)} phút
              </div>
            </div>
          </div>
        </div>

        {/* Exercises List */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Target size={16} /> Chi tiết bài tập
          </h2>
          <div className="space-y-4">
            {session.exercises.map((ex, i) => {
              const doneSets = ex.sets.filter(s => s.completed);
              if (doneSets.length === 0) return null; // Skip if no completed sets in detail view

              const isTimeBased = ex.tier === 'core' || ex.targetReps.includes('giây') || ex.targetReps.includes('s');

              return (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-200">{ex.name}</h3>
                    <span className="text-xs font-mono text-slate-500">{doneSets.length}/{ex.targetSets} hiệp</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {ex.sets.map((set, sIdx) => {
                      if (!set.completed) return null;
                      return (
                        <div key={sIdx} className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-xl text-sm">
                          <span className="text-slate-500 font-mono">Hiệp {sIdx + 1}</span>
                          <span className="font-bold font-mono text-slate-300">
                            {!isTimeBased && <>{set.weight}kg × </>}{set.reps}{isTimeBased ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isEditing && (
        <EditSessionSheet 
          session={session} 
          onSave={handleSaveEdit} 
          onClose={() => setIsEditing(false)} 
        />
      )}
    </div>
  );
}
