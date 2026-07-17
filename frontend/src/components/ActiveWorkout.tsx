'use client';

import { useState, useEffect, useRef } from 'react';
import { WorkoutSession, ExerciseLog, SetLog } from '@/lib/types';
import { ChevronDown, CheckCircle2, Play, Pause, FastForward, RotateCcw, Image as ImageIcon, Minus, Plus, Info, RefreshCw, X } from 'lucide-react';
import dbData from '../../data/db.json';
import appConfig from '../../data/app-config.json';
import WorkoutOverviewSheet from './WorkoutOverviewSheet';
import ExerciseDetailSheet from './ExerciseDetailSheet';

interface ActiveWorkoutProps {
  session: WorkoutSession;
  onUpdate: (updated: WorkoutSession) => void;
  onClose: () => void;
  onFinish: () => void;
}

type Phase = 'warmup' | 'main' | 'cooldown';

const SetInputRow = ({ s, index, isCurrent, isTimeBased, onComplete, onUndo }: { s: SetLog, index: number, isCurrent: boolean, isTimeBased?: boolean, onComplete: (w: number, r: number) => void, onUndo: () => void }) => {
  const [w, setW] = useState(s.weight.toString());
  const [r, setR] = useState(s.reps.toString());

  // Update local state if prop changes (e.g. auto-fill)
  useEffect(() => {
    setW(s.weight.toString());
  }, [s.weight]);

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl transition-colors ${s.completed ? 'bg-slate-900/50 opacity-60' : isCurrent ? 'bg-slate-800 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : 'bg-slate-900 border border-slate-800'}`}>
      <div className="flex-1 flex gap-3">
        <div className="relative flex-1">
          <input type="number" value={w} onChange={e => setW(e.target.value)} disabled={s.completed} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-3 text-center text-white font-bold text-lg disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <span className="absolute right-3 top-3.5 text-xs text-slate-500 font-bold uppercase">kg</span>
        </div>
        <div className="relative flex-1">
          <input type="number" value={r} onChange={e => setR(e.target.value)} disabled={s.completed} className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-3 text-center text-white font-bold text-lg disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
          <span className="absolute right-3 top-3.5 text-xs text-slate-500 font-bold uppercase">{isTimeBased ? 'giây' : 'reps'}</span>
        </div>
      </div>
      {!s.completed ? (
        <button onClick={() => onComplete(parseFloat(w) || 0, parseInt(r) || 0)} className="w-14 h-14 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-xl text-white shadow-lg active:scale-95 transition-all shrink-0">
          <CheckCircle2 size={24} />
        </button>
      ) : (
        <button onClick={onUndo} className="w-14 h-14 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 active:scale-95 transition-all shrink-0">
          <RotateCcw size={20} />
        </button>
      )}
    </div>
  );
};

export default function ActiveWorkout({ session, onUpdate, onClose, onFinish }: ActiveWorkoutProps) {
  const [phase, setPhase] = useState<Phase>('warmup');
  const [itemIndex, setItemIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restLeft, setRestLeft] = useState(0);
  const [showOverview, setShowOverview] = useState(false);
  
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);

  const [infoExercise, setInfoExercise] = useState<any | null>(null);
  const [showSwap, setShowSwap] = useState(false);
  const [viewedSetIndex, setViewedSetIndex] = useState(0);

  const warmups = appConfig.warmup[session.day as keyof typeof appConfig.warmup] || [];
  const cooldowns = appConfig.cooldown[session.day as keyof typeof appConfig.cooldown] || [];

  // Scroll lock moved to page.tsx

  // Find exercise details from DB
  const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const getGuide = (nameEn: string, name: string) => {
    return dbData.exercises.find((e: any) => {
      if (e.nameVi && e.nameVi.includes(name)) return true;
      const eName = normalize(e.name);
      if (eName === normalize(nameEn) || eName === normalize(name)) return true;
      if (nameEn && eName.includes(normalize(nameEn))) return true;
      if (name && eName.includes(normalize(name))) return true;
      return false;
    });
  };

  // Timer effect
  useEffect(() => {
    if (session.status !== 'paused' && isResting && restLeft > 0) {
      const t = setInterval(() => setRestLeft(r => r - 1), 1000);
      return () => clearInterval(t);
    } else if (session.status !== 'paused' && isResting && restLeft <= 0) {
      setIsResting(false);
    }
  }, [isResting, restLeft, session.status]);

  useEffect(() => {
    if (session.status !== 'paused' && timerRunning && timerLeft > 0) {
      const t = setInterval(() => setTimerLeft(r => r - 1), 1000);
      return () => clearInterval(t);
    } else if (session.status !== 'paused' && timerRunning && timerLeft <= 0) {
      setTimerRunning(false);
      handleFinishTimerExercise();
    }
  }, [timerRunning, timerLeft, session.status]);

  // Handle phase changes
  const advance = () => {
    if (phase === 'warmup') {
      if (itemIndex < warmups.length - 1) {
        setItemIndex(itemIndex + 1);
      } else {
        setPhase('main');
        setItemIndex(0);
      }
    } else if (phase === 'main') {
      if (itemIndex < session.exercises.length - 1) {
        setItemIndex(itemIndex + 1);
      } else {
        setPhase('cooldown');
        setItemIndex(0);
      }
    } else {
      if (itemIndex < cooldowns.length - 1) {
        setItemIndex(itemIndex + 1);
      } else {
        onFinish();
      }
    }
  };

  const retreat = () => {
    if (phase === 'cooldown') {
      if (itemIndex > 0) {
        setItemIndex(itemIndex - 1);
      } else {
        setPhase('main');
        setItemIndex(session.exercises.length - 1);
      }
    } else if (phase === 'main') {
      if (itemIndex > 0) {
        setItemIndex(itemIndex - 1);
      } else {
        setPhase('warmup');
        setItemIndex(warmups.length - 1);
      }
    } else {
      if (itemIndex > 0) {
        setItemIndex(itemIndex - 1);
      }
    }
  };


  const handleFinishTimerExercise = () => {
    // For time-based main exercises, auto-check all sets and advance
    if (phase === 'main') {
      const ex = session.exercises[itemIndex];
      const newSets = ex.sets.map(s => ({ ...s, completed: true, reps: ex.sets[0]?.reps || 0 })); // Just mark done
      onUpdate({
        ...session,
        exercises: session.exercises.map((e, i) => i === itemIndex ? { ...e, sets: newSets, checked: true } : e)
      });
      // Start rest
      startRest(90);
    } else {
      advance();
    }
  };

  const startRest = (seconds: number) => {
    setRestLeft(seconds);
    setIsResting(true);
  };

  const handleCompleteSet = (setIdx: number, weight: number, reps: number) => {
    if (phase !== 'main') return;
    const ex = session.exercises[itemIndex];
    let newSets = ex.sets.map((s, i) => i === setIdx ? { ...s, weight, reps, completed: true } : s);
    
    // Auto fill next empty sets with this weight
    newSets = newSets.map((s, i) => i > setIdx && !s.completed && s.weight === 0 ? { ...s, weight } : s);
    
    const allDone = newSets.every(s => s.completed);
    
    onUpdate({
      ...session,
      exercises: session.exercises.map((e, i) => i === itemIndex ? { ...e, sets: newSets, checked: allDone } : e)
    });

    let restSeconds = parseInt(ex.rest) || 90;
    if (ex.rest.toLowerCase().includes('phút')) restSeconds *= 60;
    
    startRest(restSeconds);
    
    // Automatically advance viewed set tab to the next uncompleted one
    const nextUncompleted = newSets.findIndex(s => !s.completed);
    if (nextUncompleted !== -1) {
      setViewedSetIndex(nextUncompleted);
    }
  };

  // Reset viewed set when changing exercise
  useEffect(() => {
    if (phase === 'main' && session.exercises[itemIndex]) {
      const nextUncompleted = session.exercises[itemIndex].sets.findIndex(s => !s.completed);
      setViewedSetIndex(nextUncompleted !== -1 ? nextUncompleted : 0);
    }
  }, [phase, itemIndex]);

  // Setup initial timer when moving to a time-based item
  useEffect(() => {
    if (phase === 'warmup') {
      const item = warmups[itemIndex];
      if (item?.duration) setTimerLeft(item.duration);
      else setTimerLeft(0);
    } else if (phase === 'cooldown') {
      const item = cooldowns[itemIndex];
      if (item?.duration) setTimerLeft(item.duration);
      else setTimerLeft(0);
    } else {
      const ex = session.exercises[itemIndex];
      const isTimeBased = ex?.targetReps.toLowerCase().includes('giây') || 
                          ex?.targetReps.toLowerCase().includes('s') || 
                          (ex?.name && normalize(ex.name).includes('plank'));
      if (isTimeBased) {
        const d = parseInt(ex.targetReps) || 60;
        setTimerLeft(d);
      } else {
        setTimerLeft(0);
      }
    }
    setTimerRunning(false);
  }, [phase, itemIndex, warmups, cooldowns, session.exercises]);

  // Renderers
  const renderRestTimer = () => {
    if (!isResting) return null;
    return (
      <div className="absolute inset-x-0 bottom-[80px] bg-slate-950/95 backdrop-blur border-t border-slate-800 p-6 z-[60] shadow-[0_-20px_40px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-10 flex flex-col items-center justify-center space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-400">Thời gian nghỉ</h2>
          <div className="text-6xl font-mono font-bold text-blue-400 tabular-nums">
            {Math.floor(restLeft / 60)}:{(restLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => setRestLeft(r => Math.max(0, r - 15))} className="p-4 bg-slate-800 rounded-full text-slate-300 active:scale-95 transition-transform"><Minus size={20} /></button>
          <button onClick={() => setIsResting(false)} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 font-bold rounded-full text-white active:scale-95 transition-transform shadow-lg">Bỏ qua nghỉ</button>
          <button onClick={() => setRestLeft(r => r + 15)} className="p-4 bg-slate-800 rounded-full text-slate-300 active:scale-95 transition-transform"><Plus size={20} /></button>
        </div>
      </div>
    );
  };

  const renderTimerView = (title: string, subtitle: string, durationStr: string, colorClass: string, guide: any) => {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50 pb-32">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white leading-tight mb-1">{title}</h2>
            <p className="text-slate-400 text-sm">{subtitle} • {durationStr}</p>
          </div>
          {guide && (
            <button 
              onClick={() => setInfoExercise({ ...guide, name: title, nameEn: title })}
              className="p-2.5 bg-slate-800 rounded-full text-blue-400 hover:text-white shrink-0 mt-1"
            >
              <Info size={20} />
            </button>
          )}
        </div>
        
        {/* Compact Timer embedded inside */}
        <div className="p-6 bg-slate-950 rounded-3xl border border-slate-800 flex flex-col items-center justify-center space-y-6 shadow-xl">
          <div className={`text-6xl font-mono font-bold tabular-nums ${colorClass}`}>
            {Math.floor(timerLeft / 60)}:{(timerLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setTimerLeft(r => Math.max(0, r - 10))} className="p-4 bg-slate-900 rounded-full text-slate-400 active:scale-95"><Minus size={20} /></button>
            <button 
              onClick={() => setTimerRunning(!timerRunning)}
              className={`w-16 h-16 flex items-center justify-center rounded-full ${timerRunning ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500 text-white'} shadow-lg active:scale-95 transition-transform`}
            >
              {timerRunning ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={() => setTimerLeft(r => r + 10)} className="p-4 bg-slate-900 rounded-full text-slate-400 active:scale-95"><Plus size={20} /></button>
          </div>
        </div>

        {guide && guide.mediaUrls && guide.mediaUrls.length > 0 && (
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 hide-scrollbar pb-2">
            {guide.mediaUrls.map((url: string) => (
              <div key={url} className="w-full shrink-0 snap-center">
                {url.endsWith('.mp4') ? (
                   <video src={url} autoPlay loop muted playsInline className="w-full h-48 object-cover rounded-2xl bg-slate-800 shadow-lg" />
                ) : (
                   <img src={url} alt="Guide" className="w-full h-48 object-cover rounded-2xl bg-slate-800 shadow-lg" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };



  const renderMainExercise = () => {
    const ex = session.exercises[itemIndex];
    const guide = getGuide(ex.nameEn, ex.name);
    
    const isTimeBased = ex.targetReps.toLowerCase().includes('giây') || 
                        ex.targetReps.toLowerCase().includes('s') || 
                        normalize(ex.name).includes('plank');

    const currentSetIndex = ex.sets.findIndex(s => !s.completed);
    
    // Automatically advance if all sets are done but we somehow returned to this view (or user un-checked a set)
    // Actually, if they are all done, we just show them all checked and a "Next Exercise" button
    
    return (
      <div className="flex-1 flex flex-col">
        {/* Upper half: Info */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50 pb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white leading-tight">{ex.name}</h2>
                <div className="px-2 py-1 bg-blue-500/20 text-blue-400 text-[10px] font-bold rounded uppercase tracking-wider whitespace-nowrap">{ex.tier}</div>
              </div>
              <p className="text-slate-400 text-sm">{ex.nameEn}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {ex.tier !== 'tier1' && ex.tier !== 'main' && (
                <button 
                  onClick={() => setShowSwap(true)}
                  className="p-2.5 bg-slate-800 rounded-full text-slate-400 hover:text-white"
                >
                  <RefreshCw size={20} />
                </button>
              )}
              <button 
                onClick={() => {
                  const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                  const exNameEnNorm = normalize(ex.nameEn);
                  const exNameNorm = normalize(ex.name);
                  const dbEx = dbData.exercises.find(e => normalize(e.name) === exNameEnNorm || normalize(e.name) === exNameNorm);
                  if (dbEx) setInfoExercise(dbEx);
                }}
                className="p-2.5 bg-slate-800 rounded-full text-blue-400 hover:text-white"
              >
                <Info size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800">
             <div className="flex-1">
               <div className="text-xs text-slate-500 mb-1">Mục tiêu</div>
               <div className="font-bold text-white">{ex.targetSets} × {ex.targetReps}</div>
             </div>
             {ex.RIR && (
               <div className="flex-1 border-l border-slate-800 pl-4">
                 <div className="text-xs text-slate-500 mb-1">RIR</div>
                 <div className="font-bold text-orange-400">{ex.RIR}</div>
               </div>
             )}
          </div>

          {guide && guide.mediaUrls && guide.mediaUrls.length > 0 && (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 hide-scrollbar pb-2 mt-4">
              {guide.mediaUrls.map((url: string) => (
                <div key={url} className="w-full shrink-0 snap-center">
                  {url.endsWith('.mp4') ? (
                     <video src={url} autoPlay loop muted playsInline className="w-full h-48 object-cover rounded-2xl bg-slate-800 border border-slate-700/30 shadow-lg" />
                  ) : (
                     <img src={url} alt="Guide" className="w-full h-48 object-cover rounded-2xl bg-slate-800 border border-slate-700/30 shadow-lg" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lower half: Set Inputs */}
        <div className="bg-slate-950 p-4 rounded-t-3xl border-t border-slate-800 shadow-[0_-20px_40px_rgba(0,0,0,0.6)] z-10 shrink-0 max-h-[45vh] overflow-y-auto hide-scrollbar pb-24">
          <div className="max-w-md mx-auto w-full">
            {/* Set Tabs */}
            <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar pb-1 snap-x">
              {ex.sets.map((s, i) => {
                const isActive = viewedSetIndex === i;
                const isCurrentUncompleted = i === currentSetIndex;
                return (
                  <button
                    key={i}
                    onClick={() => setViewedSetIndex(i)}
                    className={`flex-1 min-w-[3.5rem] py-2 rounded-xl text-sm font-bold border transition-all snap-center ${s.completed ? 'bg-blue-600/10 text-blue-400 border-blue-600/30' : isActive ? 'bg-slate-700 text-white border-slate-500 shadow-md transform scale-105' : isCurrentUncompleted ? 'bg-blue-600/20 text-blue-300 border-blue-500/50' : 'bg-slate-900 text-slate-500 border-slate-800 hover:bg-slate-800'}`}
                  >
                    {s.completed ? <CheckCircle2 size={16} className="mx-auto" /> : i + 1}
                  </button>
                );
              })}
            </div>
            
            {ex.sets[viewedSetIndex] && (
              <SetInputRow 
                key={viewedSetIndex} 
                s={ex.sets[viewedSetIndex]} 
                index={viewedSetIndex} 
                isCurrent={viewedSetIndex === currentSetIndex} 
                isTimeBased={isTimeBased}
                onComplete={(w, r) => handleCompleteSet(viewedSetIndex, w, r)}
                onUndo={() => {
                  const newSets = ex.sets.map((set, setIdx) => setIdx === viewedSetIndex ? { ...set, completed: false } : set);
                  onUpdate({ ...session, exercises: session.exercises.map((e, exIdx) => exIdx === itemIndex ? { ...e, sets: newSets, checked: false } : e) });
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (phase === 'warmup') {
      const item: any = warmups[itemIndex];
      if (!item) return null;
      const subtitle = item.sets && item.reps ? `${item.sets} hiệp x ${item.reps} ${item.unit}` : item.duration ? `${item.duration}s ${item.unit}` : item.unit;
      const guide = getGuide(item.nameEn, item.name);
      return renderTimerView(item.name, item.nameEn, subtitle, 'text-orange-400', guide);
    }

    if (phase === 'cooldown') {
      const item: any = cooldowns[itemIndex];
      if (!item) return null;
      const subtitle = item.sets && item.reps ? `${item.sets} hiệp x ${item.reps} ${item.unit}` : item.duration ? `${item.duration}s ${item.unit}` : item.unit;
      const guide = getGuide(item.nameEn, item.name);
      return renderTimerView(item.name, item.nameEn, subtitle, 'text-teal-400', guide);
    }

    return renderMainExercise();
  };

  // Header Logic
  let headerTitle = '';
  let headerProgress = '';
  if (phase === 'warmup') {
    headerTitle = '🔥 Khởi động';
    headerProgress = `${itemIndex + 1} / ${warmups.length}`;
  } else if (phase === 'main') {
    headerTitle = '💪 Bài tập chính';
    headerProgress = `${itemIndex + 1} / ${session.exercises.length}`;
  } else {
    headerTitle = '🧘 Giãn cơ';
    headerProgress = `${itemIndex + 1} / ${cooldowns.length}`;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-900 z-20 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-white flex items-center justify-center font-medium active:scale-95 transition-transform rounded-full">
          <ChevronDown size={28} />
        </button>
        <div className="text-center">
          <div className="text-sm font-bold text-white">{headerTitle}</div>
          <div className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">{headerProgress}</div>
        </div>
        <button onClick={() => setShowOverview(true)} className="p-2 -mr-2 text-blue-400 hover:text-blue-300 font-bold active:scale-95 transition-transform">
          Danh sách
        </button>
      </div>

      {renderContent()}

      {/* Bottom Navigation Bar */}
      <div className="bg-slate-950 border-t border-slate-900 shrink-0 p-4 pb-safe flex items-center justify-between gap-4 z-50 relative">
        <button 
          onClick={retreat} 
          className="p-3 bg-slate-900 rounded-xl text-slate-400 hover:text-white active:scale-95 transition-transform flex items-center gap-2"
        >
          <RotateCcw size={20} />
        </button>
        
        {phase === 'warmup' || phase === 'cooldown' ? (
          <button 
            onClick={handleFinishTimerExercise}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(5,150,105,0.3)] active:scale-95 transition-transform"
          >
            Đánh dấu xong
          </button>
        ) : (
          <button 
            onClick={advance}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            Bài tiếp theo <FastForward size={20} />
          </button>
        )}
      </div>

      {renderRestTimer()}

      {showOverview && (
        <WorkoutOverviewSheet 
          session={session} 
          warmups={warmups}
          cooldowns={cooldowns}
          currentPhase={phase}
          currentIndex={itemIndex}
          onJump={(newPhase, index) => {
            setPhase(newPhase);
            setItemIndex(index);
            setIsResting(false);
            setShowOverview(false);
          }}
          onClose={() => setShowOverview(false)} 
        />
      )}

      {infoExercise && (
        <ExerciseDetailSheet
          ex={infoExercise}
          onClose={() => setInfoExercise(null)}
        />
      )}

      {showSwap && phase === 'main' && (
        <div className="fixed inset-0 z-[120] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSwap(false)} />
          <div className="bg-slate-900 rounded-t-3xl border-t border-slate-800 w-full max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-full duration-300 relative z-10 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Đổi bài tập
              </h2>
              <button onClick={() => setShowSwap(false)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <p className="text-sm text-slate-400">Chọn một bài tập thay thế tương đương cho <strong>{session.exercises[itemIndex]?.name}</strong>:</p>
              {(() => {
                const currentExLog = session.exercises[itemIndex];
                const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                
                // Always base alternatives on the ORIGINAL exercise
                const baseNameEnNorm = normalize(currentExLog.originalNameEn || currentExLog.nameEn);
                const baseNameNorm = normalize(currentExLog.originalName || currentExLog.name);
                const dbEx = dbData.exercises.find(e => {
                  if (e.nameVi && (e.nameVi.includes(currentExLog.originalName || '') || e.nameVi.includes(currentExLog.name))) return true;
                  if (normalize(e.name) === baseNameEnNorm || normalize(e.name) === baseNameNorm) return true;
                  return false;
                });
                
                let alts = dbEx?.alternatives ? [...dbEx.alternatives] : [];
                
                // If it's already swapped, add the original back as an alternative so they can revert
                if (currentExLog.selectedAlternative) {
                  const orig = currentExLog.originalNameEn || currentExLog.originalName || '';
                  if (orig && !alts.includes(orig) && orig !== currentExLog.nameEn && orig !== currentExLog.name) {
                    alts.unshift(orig);
                  }
                }
                
                // Remove the currently displayed exercise from the alternatives list
                alts = alts.filter(a => normalize(a) !== normalize(currentExLog.nameEn) && normalize(a) !== normalize(currentExLog.name));
                
                if (alts.length === 0) {
                  return <p className="text-center text-slate-500 py-8">Không có bài tập thay thế được đề xuất.</p>;
                }

                return (
                  <div className="space-y-2">
                    {alts.map(altNameEn => {
                      const altNameEnNorm = normalize(altNameEn);
                      const altDbEx = dbData.exercises.find(e => normalize(e.name) === altNameEnNorm);
                      const altName = altDbEx ? altDbEx.name : altNameEn;
                      return (
                        <button 
                          key={altNameEn}
                          onClick={() => {
                            const newExercises = [...session.exercises];
                            const currentEx = newExercises[itemIndex];
                            
                            const isNewTimeBased = altName.toLowerCase().includes('plank');
                            const isOldTimeBased = currentEx.targetReps.toLowerCase().includes('giây') || currentEx.targetReps.toLowerCase().includes('s');
                            let newTargetReps = currentEx.targetReps;
                            
                            if (isNewTimeBased && !isOldTimeBased) newTargetReps = '60 giây';
                            else if (!isNewTimeBased && isOldTimeBased) newTargetReps = '15';

                            const originalNameEn = currentEx.originalNameEn || currentEx.nameEn;
                            const originalName = currentEx.originalName || currentEx.name;

                            newExercises[itemIndex] = {
                              ...currentEx,
                              originalNameEn,
                              originalName,
                              name: altName,
                              nameEn: altNameEn,
                              selectedAlternative: altName,
                              targetReps: newTargetReps
                            };
                            onUpdate({ ...session, exercises: newExercises });
                            setShowSwap(false);
                          }}
                          className="w-full p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between hover:bg-slate-800 transition-colors text-left"
                        >
                          <div>
                            <div className="font-bold text-white">{altName}</div>
                            <div className="text-xs text-slate-500">{altNameEn}</div>
                          </div>
                          <RefreshCw size={16} className="text-slate-500" />
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
