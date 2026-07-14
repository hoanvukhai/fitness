'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, X, ChevronRight, Dumbbell, Zap, Target, LayoutGrid, List } from 'lucide-react';
import type { Exercise } from './page';

// ─── Config ─────────────────────────────────────────────────────────────────

const MUSCLE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  chest:     { label: 'Ngực',       emoji: '🫀', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  shoulders: { label: 'Vai',        emoji: '🔺', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  triceps:   { label: 'Tay sau',    emoji: '💪', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  back:      { label: 'Lưng',       emoji: '🏋️', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  biceps:    { label: 'Tay trước',  emoji: '💪', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  legs:      { label: 'Chân',       emoji: '🦵', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  core:      { label: 'Core',       emoji: '⚡', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  TIER_1_PRIMARY:   { label: 'Tier 1', color: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  TIER_2_SECONDARY: { label: 'Tier 2', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  TIER_3_ISOLATION: { label: 'Tier 3', color: 'bg-slate-600/30 text-slate-400 border-slate-600/30' },
};

const EQUIPMENT_LABELS: Record<string, string> = {
  BARBELL: '🏋️ Tạ đòn', DUMBBELL: '🔩 Tạ đơn',
  MACHINE: '🤖 Máy', CABLE: '🔗 Cáp',
  BODYWEIGHT: '🤸 Tự trọng',
};

const ALL_MUSCLES = Object.keys(MUSCLE_LABELS);
const ALL_EQUIPMENT = Object.keys(EQUIPMENT_LABELS);

// ─── Exercise Card ────────────────────────────────────────────────────────────

function ExCard({ ex, onClick }: { ex: Exercise; onClick: () => void }) {
  const muscle = MUSCLE_LABELS[ex.targetMuscle] || { label: ex.targetMuscle, emoji: '💪', color: 'bg-slate-700 text-slate-400 border-slate-600' };
  const tier = TIER_LABELS[ex.tier] || { label: ex.tier, color: 'bg-slate-700 text-slate-400 border-slate-600' };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-600 hover:bg-slate-800/60 active:scale-[.98] transition-all group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${tier.color}`}>
              {tier.label}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${muscle.color}`}>
              {muscle.emoji} {muscle.label}
            </span>
          </div>
          {/* Name */}
          <h3 className="font-bold text-slate-100 text-base leading-tight group-hover:text-blue-400 transition-colors">
            {ex.name}
          </h3>
          {/* Equipment */}
          <p className="text-xs text-slate-500 mt-1">
            {EQUIPMENT_LABELS[ex.equipment] || ex.equipment}
          </p>
          {/* Instructions preview */}
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
            {ex.instructions}
          </p>
        </div>
        <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ─── Exercise Detail Modal ────────────────────────────────────────────────────

function ExModal({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const muscle = MUSCLE_LABELS[ex.targetMuscle] || { label: ex.targetMuscle, emoji: '💪', color: '' };
  const tier = TIER_LABELS[ex.tier] || { label: ex.tier, color: '' };

  // Parse instructions thành danh sách
  const steps = ex.instructions
    .split(/\d+\./)
    .map(s => s.trim())
    .filter(Boolean);

  // Khóa scroll của trang nền khi mở modal
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
              <h2 className="text-xl font-extrabold text-white">{ex.name}</h2>
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
                    <div key={i} className="shrink-0 w-[90%] sm:w-full aspect-video rounded-2xl overflow-hidden bg-slate-800 snap-center first:ml-0">
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
                    <div key={i} className="shrink-0 w-[90%] sm:w-full aspect-video rounded-2xl overflow-hidden bg-slate-800 snap-center first:ml-0">
                      <video src={url} controls loop muted playsInline className="w-full h-full object-cover" />
                    </div>
                  );
                }
                return (
                  <div key={i} className="shrink-0 w-[90%] sm:w-full aspect-video rounded-2xl overflow-hidden bg-slate-800 snap-center first:ml-0 flex items-center justify-center">
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

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ExerciseLibraryClient({ exercises }: { exercises: Exercise[] }) {
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState<string>('all');
  const [filterEquip, setFilterEquip] = useState<string>('all');
  const [selected, setSelected] = useState<Exercise | null>(null);

  // Filter
  const filtered = useMemo(() => {
    return exercises.filter(ex => {
      const matchSearch = !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.instructions.toLowerCase().includes(search.toLowerCase());
      const matchMuscle = filterMuscle === 'all' || ex.targetMuscle === filterMuscle;
      const matchEquip = filterEquip === 'all' || ex.equipment === filterEquip;
      return matchSearch && matchMuscle && matchEquip;
    });
  }, [exercises, search, filterMuscle, filterEquip]);

  // Group by muscle
  const grouped = useMemo(() => {
    const map: Record<string, Exercise[]> = {};
    filtered.forEach(ex => {
      if (!map[ex.targetMuscle]) map[ex.targetMuscle] = [];
      map[ex.targetMuscle].push(ex);
    });
    return map;
  }, [filtered]);

  // Sort muscles in PPL order
  const muscleOrder = ['chest', 'shoulders', 'triceps', 'back', 'biceps', 'legs', 'core'];
  const sortedMuscles = muscleOrder.filter(m => grouped[m]);

  const totalCount = filtered.length;

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/60 px-4 pt-5 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-white">Thư viện bài tập</h1>
          <span className="text-xs text-slate-500 font-medium">{totalCount} bài</span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm bài tập..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Muscle filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setFilterMuscle('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              filterMuscle === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-slate-400 border-slate-700 hover:border-slate-500'
            }`}
          >
            Tất cả
          </button>
          {muscleOrder.map(m => {
            const cfg = MUSCLE_LABELS[m];
            if (!cfg) return null;
            return (
              <button
                key={m}
                onClick={() => setFilterMuscle(filterMuscle === m ? 'all' : m)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  filterMuscle === m
                    ? 'bg-slate-200 text-slate-900 border-transparent'
                    : 'text-slate-400 border-slate-700 hover:border-slate-500'
                }`}
              >
                {cfg.emoji} {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Equipment filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
          <button
            onClick={() => setFilterEquip('all')}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              filterEquip === 'all'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'text-slate-400 border-slate-700 hover:border-slate-500'
            }`}
          >
            Mọi thiết bị
          </button>
          {ALL_EQUIPMENT.map(eq => (
            <button
              key={eq}
              onClick={() => setFilterEquip(filterEquip === eq ? 'all' : eq)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                filterEquip === eq
                  ? 'bg-slate-200 text-slate-900 border-transparent'
                  : 'text-slate-400 border-slate-700 hover:border-slate-500'
              }`}
            >
              {EQUIPMENT_LABELS[eq]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-5 pb-24 space-y-8">
        {sortedMuscles.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Dumbbell size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Không tìm thấy bài tập nào</p>
          </div>
        ) : (
          sortedMuscles.map(muscle => {
            const cfg = MUSCLE_LABELS[muscle] || { label: muscle, emoji: '💪', color: '' };
            return (
              <section key={muscle}>
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{cfg.emoji}</span>
                  <h2 className="font-extrabold text-slate-200 text-lg">{cfg.label}</h2>
                  <span className="text-xs text-slate-600 ml-auto">{grouped[muscle].length} bài</span>
                </div>
                <div className="space-y-3">
                  {grouped[muscle].map(ex => (
                    <ExCard key={ex.name} ex={ex} onClick={() => setSelected(ex)} />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Modal */}
      {selected && (
        <ExModal ex={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
