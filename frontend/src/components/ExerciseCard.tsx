'use client';

import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Lock, Timer, StickyNote, Info } from 'lucide-react';
import { ExerciseLog, SetLog } from '@/lib/types';
import RestTimer from './RestTimer';
import ExerciseDetailSheet from './ExerciseDetailSheet';
import dbData from '../../data/db.json';

interface ExerciseCardProps {
  exercise: ExerciseLog;
  index: number;
  nextExerciseName?: string;
  lastPerformance?: { weight: number; reps: number; date: string } | null;
  suggestion?: string | null;
  onChange: (updated: ExerciseLog) => void;
  onFinishAllSets?: () => void;
}

export default function ExerciseCard({
  exercise,
  index,
  nextExerciseName,
  lastPerformance,
  suggestion,
  onChange,
  onFinishAllSets,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [showTimer, setShowTimer] = useState(false);
  const [activeRestSet, setActiveRestSet] = useState<number | null>(null);
  const [note, setNote] = useState(exercise.notes || '');
  const [showGuide, setShowGuide] = useState(false);
  const [showSwapDropdown, setShowSwapDropdown] = useState(false);

  const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const guide = dbData.exercises.find((e: any) => {
    const eName = normalize(e.name);
    const exNameEn = normalize(exercise.nameEn);
    const exName = normalize(exercise.name);
    if (eName === exNameEn || eName === exName) return true;
    const manualMap: Record<string, string> = {
      'benchpress': 'barbellbenchpress',
      'inclinebenchpress': 'inclinebarbellpress',
      'flatdbpress': 'dumbbellbenchpress',
      'pecdeckmachinefly': 'reversepecdeck',
      'chestsupporteddbrow': 'dumbbellrow',
      'pulluplatpulldown': 'latpulldown',
      'widegriplatpulldown': 'latpulldown',
      'dbpreacherconcentrationcurl': 'dumbbellcurl',
      'ezbarcurl': 'barbellcurl',
      'backsquat': 'barbellsquat',
      'romaniandeadlift': 'romaniandeadliftrdl',
      'seatedlegcurl': 'legcurl',
      'standinglegcurl': 'legcurl',
      'gobletsquat': 'frontsquat',
      'dbcalfraise': 'standingcalfraise',
      'cablereversefly': 'reversepecdeck',
      'dbtricepkickback': 'overheadtricepextension'
    };
    if (exNameEn && manualMap[exNameEn] === eName) return true;
    if (exName && manualMap[exName] === eName) return true;
    if (exNameEn && eName.includes(exNameEn)) return true;
    if (exName && eName.includes(exName)) return true;
    return false;
  });

  const originalGuide = dbData.exercises.find((e: any) => {
    const eName = normalize(e.name);
    const exNameEn = normalize(exercise.originalNameEn || exercise.nameEn);
    const exName = normalize(exercise.originalName || exercise.name);
    if (eName === exNameEn || eName === exName) return true;
    const manualMap: Record<string, string> = {
      'benchpress': 'barbellbenchpress',
      'inclinebenchpress': 'inclinebarbellpress',
      'flatdbpress': 'dumbbellbenchpress',
      'pecdeckmachinefly': 'reversepecdeck',
      'chestsupporteddbrow': 'dumbbellrow',
      'pulluplatpulldown': 'latpulldown',
      'widegriplatpulldown': 'latpulldown',
      'dbpreacherconcentrationcurl': 'dumbbellcurl',
      'ezbarcurl': 'barbellcurl',
      'backsquat': 'barbellsquat',
      'romaniandeadlift': 'romaniandeadliftrdl',
      'seatedlegcurl': 'legcurl',
      'standinglegcurl': 'legcurl',
      'gobletsquat': 'frontsquat',
      'dbcalfraise': 'standingcalfraise',
      'cablereversefly': 'reversepecdeck',
      'dbtricepkickback': 'overheadtricepextension'
    };
    if (exNameEn && manualMap[exNameEn] === eName) return true;
    if (exName && manualMap[exName] === eName) return true;
    if (exNameEn && eName.includes(exNameEn)) return true;
    if (exName && eName.includes(exName)) return true;
    return false;
  });

  let displayAlternatives = originalGuide?.alternatives ? [...originalGuide.alternatives] : [];
  if (exercise.selectedAlternative) {
    const origEn = exercise.originalNameEn || '';
    if (origEn && !displayAlternatives.includes(origEn) && origEn !== exercise.nameEn) {
      displayAlternatives.unshift(origEn);
    }
  }
  displayAlternatives = displayAlternatives.filter(a => normalize(a) !== normalize(exercise.nameEn) && normalize(a) !== normalize(exercise.name));

  // Parse thời gian nghỉ từ string sang giây
  const parseRestSeconds = (restStr: string): number => {
    if (restStr.includes('3 phút')) return 180;
    if (restStr.includes('2-3 phút') || restStr.includes('2 phút')) return 120;
    if (restStr.includes('90-120') || restStr.includes('90')) return 105;
    if (restStr.includes('60-90')) return 75;
    if (restStr.includes('45')) return 45;
    return 90;
  };

  const restSeconds = parseRestSeconds(exercise.rest);
  // Bài tính thời gian (Core như Plank, Ab...)
  const isTimeBased = exercise.targetReps.toLowerCase().includes('giây') || exercise.targetReps.toLowerCase().includes('s');

  const updateSet = (setIdx: number, field: 'weight' | 'reps', value: number) => {
    let newSets = exercise.sets.map((s, i) =>
      i === setIdx ? { ...s, [field]: value } : s
    );
    // Nếu nhập tạ ở hiệp đầu tiên và các hiệp sau chưa có tạ → copy xuống
    if (field === 'weight' && value > 0) {
      newSets = newSets.map((s, i) =>
        i > setIdx && !s.completed && s.weight === 0
          ? { ...s, weight: value }
          : s
      );
    }
    onChange({ ...exercise, sets: newSets });
  };

  const completeSet = (setIdx: number) => {
    const newSets = exercise.sets.map((s, i) =>
      i === setIdx ? { ...s, completed: true } : s
    );
    const allDone = newSets.every(s => s.completed);
    onChange({ ...exercise, sets: newSets, checked: allDone });

    // Auto-start timer
    setActiveRestSet(setIdx);
    setShowTimer(true);
  };

  const markAllDone = () => {
    const newSets = exercise.sets.map(s => ({ ...s, completed: true }));
    onChange({ ...exercise, sets: newSets, checked: true, notes: note });
  };

  const tierColors: Record<string, string> = {
    tier1: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    main: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    accessory: 'bg-slate-700/50 text-slate-400 border-slate-600/30',
    core: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  const tierLabels: Record<string, string> = {
    tier1: 'Tier 1',
    main: 'Chính B',
    accessory: 'Phụ',
    core: 'Core',
  };

  const allCompleted = exercise.sets.every(s => s.completed);

  return (
    <>
      {showTimer && (
        <RestTimer
          duration={restSeconds}
          nextExercise={nextExerciseName}
          onDone={() => {
            setShowTimer(false);
            setActiveRestSet(null);
            // Nếu đây là hiệp cuối cùng thì chuyển bài
            if (activeRestSet === exercise.sets.length - 1 || exercise.sets.every(s => s.completed)) {
              onFinishAllSets?.();
            }
          }}
        />
      )}

      {showGuide && guide && (
        <ExerciseDetailSheet ex={guide as any} onClose={() => setShowGuide(false)} />
      )}

      <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${exercise.checked
          ? 'bg-slate-900/40 border-slate-800/40 opacity-70'
          : 'bg-slate-900 border-slate-800'
        }`}>
        {/* Card Header */}
        <div
          className="flex items-start justify-between p-4 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start gap-3 flex-1">
            {/* Checkbox */}
            <button
              onClick={e => { e.stopPropagation(); markAllDone(); }}
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${exercise.checked
                  ? 'bg-emerald-500 border-emerald-500'
                  : 'border-slate-600 hover:border-slate-400'
                }`}
            >
              {exercise.checked && <Check size={12} strokeWidth={3} className="text-white" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${tierColors[exercise.tier]}`}>
                  {exercise.tier === 'tier1' && <Lock size={8} className="inline mr-0.5" />}
                  {tierLabels[exercise.tier]}
                </span>
                {exercise.RIR && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-400 border-amber-500/30">
                    RIR: {exercise.RIR}
                  </span>
                )}
                {guide && (
                  <button
                    onClick={e => { e.stopPropagation(); setShowGuide(true); }}
                    className="p-1 text-slate-500 hover:text-blue-400 bg-slate-800/50 rounded-full transition-colors"
                  >
                    <Info size={12} />
                  </button>
                )}
                {displayAlternatives.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setShowSwapDropdown(!showSwapDropdown);
                      }}
                      className="ml-auto bg-slate-800/80 hover:bg-slate-700/80 text-[10px] text-slate-300 border border-slate-700/80 rounded-md px-2.5 py-1 max-w-[120px] outline-none flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="truncate">Đổi bài...</span>
                      <ChevronDown size={10} className={`transition-transform duration-200 ${showSwapDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {showSwapDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={(e) => { e.stopPropagation(); setShowSwapDropdown(false); }} 
                        />
                        <div className="absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                          {displayAlternatives.map((alt: string) => (
                            <button
                              key={alt}
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowSwapDropdown(false);
                                if (alt !== exercise.nameEn) {
                                  const isNewTimeBased = alt.toLowerCase().includes('plank');
                                  const isOldTimeBased = exercise.targetReps.toLowerCase().includes('giây') || exercise.targetReps.toLowerCase().includes('s');
                                  let newTargetReps = exercise.targetReps;

                                  if (isNewTimeBased && !isOldTimeBased) newTargetReps = '60 giây';
                                  else if (!isNewTimeBased && isOldTimeBased) newTargetReps = '15';

                                  const originalNameEn = exercise.originalNameEn || exercise.nameEn;
                                  const originalName = exercise.originalName || exercise.name;

                                  onChange({ 
                                    ...exercise, 
                                    originalNameEn,
                                    originalName,
                                    name: alt, 
                                    nameEn: alt, 
                                    selectedAlternative: alt, 
                                    targetWeight: 0,
                                    targetReps: newTargetReps
                                  });
                                }
                              }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors ${alt === exercise.nameEn ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-100 text-base leading-tight">{exercise.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{exercise.nameEn}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-300">
                {exercise.targetSets} × {exercise.targetReps}
              </div>
              <div className="text-[10px] text-slate-500">{exercise.rest}</div>
            </div>
            {expanded ? <ChevronUp size={16} className="text-slate-600" /> : <ChevronDown size={16} className="text-slate-600" />}
          </div>
        </div>

        {/* Expanded Content */}
        {expanded && (
          <div className="px-4 pb-4 space-y-4">
            {/* Suggestion from last session */}
            {(lastPerformance || suggestion) && (
              <div className="bg-blue-950/40 border border-blue-800/30 rounded-xl px-4 py-3 text-sm">
                {lastPerformance && (
                  <p className="text-blue-300">
                    <span className="font-semibold">Buổi trước:</span>{' '}
                    {lastPerformance.weight}kg × {lastPerformance.reps} reps
                    <span className="text-slate-500 ml-1">({lastPerformance.date})</span>
                  </p>
                )}
                {suggestion && (
                  <p className="text-emerald-300 mt-1">
                    <span className="font-semibold">💡 Gợi ý:</span> {suggestion}
                  </p>
                )}
              </div>
            )}

            {/* Sets */}
            <div className="space-y-2">
              <div className={`grid text-[11px] text-slate-500 font-medium uppercase tracking-wider px-1 gap-1 ${isTimeBased ? 'grid-cols-8' : 'grid-cols-12'}`}>
                <div className="col-span-2">Hiệp</div>
                {!isTimeBased && <div className="col-span-4 text-center">Tạ (kg)</div>}
                <div className={`${isTimeBased ? 'col-span-4' : 'col-span-4'} text-center`}>{isTimeBased ? 'Giây' : 'Reps'}</div>
                <div className="col-span-2 text-center">✓</div>
              </div>
              {exercise.sets.map((set, i) => (
                <div
                  key={i}
                  className={`grid items-center gap-1 py-2 px-1 rounded-xl transition-colors ${isTimeBased ? 'grid-cols-8' : 'grid-cols-12'} ${set.completed ? 'bg-emerald-950/20' : 'bg-slate-800/40'
                    }`}
                >
                  <div className="col-span-2 text-center text-slate-500 font-mono font-medium text-sm">
                    {i + 1}
                  </div>
                  {!isTimeBased && (
                    <div className="col-span-4">
                      <input
                        type="number"
                        value={set.weight > 0 ? set.weight : ''}
                        onChange={e => updateSet(i, 'weight', parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                        placeholder="kg"
                        inputMode="decimal"
                      />
                    </div>
                  )}
                  <div className={isTimeBased ? 'col-span-4' : 'col-span-4'}>
                    <input
                      type="number"
                      value={set.reps > 0 ? set.reps : ''}
                      onChange={e => updateSet(i, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-slate-600"
                      placeholder={isTimeBased ? 'giây' : 'reps'}
                      inputMode="numeric"
                    />
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <button
                      onClick={() => completeSet(i)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all active:scale-95 ${set.completed
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'border-slate-600 hover:border-emerald-500'
                        }`}
                    >
                      {set.completed && <Check size={14} strokeWidth={3} className="text-white" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div className="flex items-start gap-2">
              <StickyNote size={14} className="text-slate-600 mt-2.5 shrink-0" />
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                onBlur={() => onChange({ ...exercise, notes: note })}
                placeholder="Ghi chú nhanh..."
                className="flex-1 bg-transparent border-b border-slate-800 py-2 text-sm text-slate-400 placeholder-slate-600 focus:outline-none focus:border-slate-600"
              />
            </div>

            {/* Timer button (manual) */}
            <button
              onClick={() => setShowTimer(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              <Timer size={14} />
              Bắt đầu nghỉ thủ công ({Math.floor(restSeconds / 60)}:{(restSeconds % 60).toString().padStart(2, '0')})
            </button>
          </div>
        )}
      </div>
    </>
  );
}
