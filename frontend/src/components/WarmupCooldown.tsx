'use client';

import { useState } from 'react';
import { Check, Info } from 'lucide-react';
import ExerciseDetailSheet from './ExerciseDetailSheet';
import dbData from '../../data/db.json';

interface ChecklistItem {
  name: string;
  nameEn: string;
  duration?: number;
  sets?: number;
  reps?: number;
  unit: string;
}

interface WarmupCooldownProps {
  title: string;
  emoji: string;
  items: ChecklistItem[];
  color: 'orange' | 'teal';
  onComplete?: () => void;
}

export default function WarmupCooldown({ title, emoji, items, color, onComplete }: WarmupCooldownProps) {
  const [checked, setChecked] = useState<boolean[]>(new Array(items.length).fill(false));
  const [done, setDone] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<any>(null);

  const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const getGuide = (item: ChecklistItem) => {
    return dbData.exercises.find((e: any) => {
      const eName = normalize(e.name);
      const exNameEn = normalize(item.nameEn);
      const exName = normalize(item.name);
      if (eName === exNameEn || eName === exName) return true;
      if (exNameEn && eName.includes(exNameEn)) return true;
      if (exName && eName.includes(exName)) return true;
      return false;
    });
  };

  const toggle = (i: number) => {
    const next = [...checked];
    next[i] = !next[i];
    setChecked(next);
    if (next.every(Boolean)) {
      setDone(true);
      onComplete?.();
    }
  };

  const markAllDone = () => {
    setChecked(new Array(items.length).fill(true));
    setDone(true);
    onComplete?.();
  };

  const accent = color === 'orange'
    ? 'text-orange-400 border-orange-500/30 bg-orange-500/10'
    : 'text-teal-400 border-teal-500/30 bg-teal-500/10';

  return (
    <div className={`rounded-2xl border p-4 ${done ? 'opacity-70 bg-slate-900/40 border-slate-800/40' : 'bg-slate-900 border-slate-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <h3 className="font-bold text-slate-200">{title}</h3>
          {done && <span className="text-xs text-emerald-400 font-medium">✓ Xong</span>}
        </div>
        <button
          onClick={markAllDone}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Xong hết
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => toggle(i)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer select-none ${
              checked[i] ? 'bg-emerald-950/20 opacity-60' : 'bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              checked[i] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
            }`}>
              {checked[i] && <Check size={10} strokeWidth={3} className="text-white" />}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <div>
                <div className={`text-sm font-medium ${checked[i] ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {item.name}
                </div>
                <div className="text-xs text-slate-500">{item.nameEn}</div>
              </div>
              {getGuide(item) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedGuide(getGuide(item)); }}
                  className="p-1 text-slate-500 hover:text-blue-400 bg-slate-800/50 rounded-full transition-colors"
                >
                  <Info size={14} />
                </button>
              )}
            </div>
            <div className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${accent}`}>
              {item.sets && item.reps
                ? `${item.sets}×${item.reps}`
                : item.duration
                ? `${item.duration}s`
                : ''}
              {' '}{item.unit}
            </div>
          </div>
        ))}
      </div>

      {selectedGuide && (
        <ExerciseDetailSheet ex={selectedGuide} onClose={() => setSelectedGuide(null)} />
      )}
    </div>
  );
}
