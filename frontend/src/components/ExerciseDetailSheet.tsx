import { useEffect } from 'react';
import { X, Zap, Target, LayoutGrid } from 'lucide-react';
import type { Exercise } from '@/app/library/page';

export const MUSCLE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  chest:     { label: 'Ngực',       emoji: '🫀', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  shoulders: { label: 'Vai',        emoji: '🔺', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  triceps:   { label: 'Tay sau',    emoji: '💪', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  back:      { label: 'Lưng',       emoji: '🏋️', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  biceps:    { label: 'Tay trước',  emoji: '💪', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  legs:      { label: 'Chân',       emoji: '🦵', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  core:      { label: 'Core',       emoji: '⚡', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

export const TIER_LABELS: Record<string, { label: string; color: string }> = {
  TIER_1_PRIMARY:   { label: 'Tier 1', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  TIER_2_SECONDARY: { label: 'Tier 2', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  TIER_3_ISOLATION: { label: 'Tier 3', color: 'bg-slate-600/30 text-slate-400 border-slate-600/30' },
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  BARBELL: '🏋️ Tạ đòn', DUMBBELL: '🔩 Tạ đơn',
  MACHINE: '🤖 Máy', CABLE: '🔗 Cáp',
  BODYWEIGHT: '🤸 Tự trọng',
};

export default function ExerciseDetailSheet({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const muscle = MUSCLE_LABELS[ex.targetMuscle] || { label: ex.targetMuscle, emoji: '💪', color: '' };
  const tier = TIER_LABELS[ex.tier] || { label: ex.tier, color: '' };

  const steps = ex.instructions
    .split(/\d+\./)
    .map(s => s.trim())
    .filter(Boolean);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 px-5 pt-5 pb-4 rounded-t-3xl z-10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${tier.color}`}>
                  {tier.label}
                </span>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${muscle.color}`}>
                  {muscle.emoji} {muscle.label}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                  {EQUIPMENT_LABELS[ex.equipment] || ex.equipment}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">{ex.nameVi?.[0] || ex.name}</h2>
              {ex.nameVi?.[0] && <p className="text-sm font-medium text-slate-400 mt-0.5">{ex.name}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-8 pt-4 space-y-6">
          {/* Media */}
          {ex.mediaUrls && ex.mediaUrls.length > 0 && (
            <div className="flex gap-4 overflow-x-auto snap-x scrollbar-none pb-2 w-full">
              {ex.mediaUrls.map((url, i) => {
                if (url.includes('youtube.com') || url.includes('youtu.be')) {
                  const videoId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
                  return (
                    <div key={i} className="shrink-0 w-[90%] sm:w-full aspect-video rounded-2xl overflow-hidden bg-slate-800 snap-center flex-1">
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`}
                        title="YouTube video player" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="border-none"
                      />
                    </div>
                  );
                }
                if (url.endsWith('.mp4') || url.endsWith('.webm')) {
                  return (
                    <div key={i} className="shrink-0 w-[90%] sm:w-full aspect-video rounded-2xl overflow-hidden bg-slate-800 snap-center flex-1">
                      <video src={url} controls loop muted playsInline className="w-full h-full object-cover" />
                    </div>
                  );
                }
                return (
                  <div key={i} className="shrink-0 w-[90%] sm:w-full aspect-video rounded-2xl overflow-hidden bg-slate-800 snap-center flex items-center justify-center flex-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={ex.name} className="max-w-full max-h-full object-contain" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Instructions */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
              <Target size={12} />
              Hướng dẫn thực hiện
            </h4>
            <ol className="space-y-2.5">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-slate-300 text-sm leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Pattern */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
            <Zap size={16} className="text-amber-400 shrink-0" />
            <div>
              <div className="text-xs text-slate-500">Movement Pattern</div>
              <div className="text-sm font-semibold text-slate-200">
                {ex.pattern?.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          {/* Alternatives */}
          {ex.alternatives?.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-1.5">
                <LayoutGrid size={12} />
                Bài thay thế
              </h4>
              <div className="flex flex-wrap gap-2">
                {ex.alternatives.map(alt => (
                  <span
                    key={alt}
                    className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
