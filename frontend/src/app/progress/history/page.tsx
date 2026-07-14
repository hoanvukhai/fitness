'use client';

import { useState, useEffect } from 'react';
import { getAllWorkouts } from '@/lib/firestore';
import { WorkoutSession } from '@/lib/types';
import { getDayLabel, getSessionLabel } from '@/lib/workout-engine';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HistoryPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getAllWorkouts().then(data => {
      setWorkouts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
                  <Link
                    href={`/progress/${w.id}`}
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
                        <div className="text-xs text-slate-400 font-mono">Tuần {w.week}</div>
                        <div className="text-xs text-slate-600">{Math.floor(w.durationSeconds / 60)}m</div>
                      </div>
                      <ChevronRight size={16} className="text-slate-500" />
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
