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

const SetInputRow = ({ s, index, isCurrent, onComplete, onUndo }: { s: SetLog, index: number, isCurrent: boolean, onComplete: (w: number, r: number) => void, onUndo: () => void }) => {
  const [w, setW] = useState(s.weight.toString());
  const [r, setR] = useState(s.reps.toString());

  // Update local state if prop changes (e.g. auto-fill)
  useEffect(() => {
    setW(s.weight.toString());
  }, [s.weight]);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${s.completed ? 'bg-slate-900/50 opacity-60' : isCurrent ? 'bg-slate-800 border-l-4 border-blue-500 shadow-lg' : 'bg-slate-900/80'}`}>
      <div className="w-8 text-center font-bold text-slate-500 text-sm">{index + 1}</div>
      <div className="flex-1 flex gap-2">
        <div className="relative flex-1">
          <input type="number" value={w} onChange={e => setW(e.target.value)} disabled={s.completed} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-center text-white font-bold disabled:opacity-50" />
          <span className="absolute right-2 top-3 text-[10px] text-slate-500 uppercase">kg</span>
        </div>
        <div className="relative flex-1">
          <input type="number" value={r} onChange={e => setR(e.target.value)} disabled={s.completed} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 px-3 text-center text-white font-bold disabled:opacity-50" />
          <span className="absolute right-2 top-3 text-[10px] text-slate-500 uppercase">reps</span>
        </div>
      </div>
      {!s.completed ? (
        <button onClick={() => onComplete(parseFloat(w) || 0, parseInt(r) || 0)} className="w-12 h-11 flex items-center justify-center bg-blue-600 hover:bg-blue-500 rounded-lg text-white shadow-md">
          <CheckCircle2 size={20} />
        </button>
      ) : (
        <button onClick={onUndo} className="w-12 h-11 flex items-center justify-center bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400">
          <RotateCcw size={16} />
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

  const warmups = appConfig.warmup[session.day as keyof typeof appConfig.warmup] || [];
  const cooldowns = appConfig.cooldown[session.day as keyof typeof appConfig.cooldown] || [];

  // Lock body scroll when active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Find exercise details from DB
  const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const getGuide = (nameEn: string, name: string) => {
    return dbData.exercises.find((e: any) => {
      const eName = normalize(e.name);
      if (eName === normalize(nameEn) || eName === normalize(name)) return true;
      if (nameEn && eName.includes(normalize(nameEn))) return true;
      if (name && eName.includes(normalize(name))) return true;
      return false;
    });
  };

  // Timer effect
  useEffect(() => {
    if (isResting && restLeft > 0) {
      const t = setInterval(() => setRestLeft(r => r - 1), 1000);
      return () => clearInterval(t);
    } else if (isResting && restLeft <= 0) {
      setIsResting(false);
    }
  }, [isResting, restLeft]);

  useEffect(() => {
    if (timerRunning && timerLeft > 0) {
      const t = setInterval(() => setTimerLeft(r => r - 1), 1000);
      return () => clearInterval(t);
    } else if (timerRunning && timerLeft <= 0) {
      setTimerRunning(false);
      handleFinishTimerExercise();
    }
  }, [timerRunning, timerLeft]);

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

    const restSeconds = parseInt(ex.rest) || 90;
    if (allDone) {
      startRest(restSeconds);
    } else {
      startRest(restSeconds);
    }
  };

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
      const isTimeBased = ex?.targetReps.toLowerCase().includes('giây') || ex?.targetReps.toLowerCase().includes('s');
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
    return (
      <div className="flex-1 flex flex-col items-center justify-center space-y-12 bg-slate-950 p-6 z-50">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-slate-400">Thời gian nghỉ</h2>
          <div className="text-8xl font-mono font-bold text-blue-400 tabular-nums">
            {Math.floor(restLeft / 60)}:{(restLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
        
        <div className="flex gap-6">
          <button onClick={() => setRestLeft(r => Math.max(0, r - 15))} className="p-4 bg-slate-800 rounded-full text-slate-300 active:scale-95 transition-transform"><Minus size={24} /></button>
          <button onClick={() => setIsResting(false)} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 font-bold rounded-full text-white active:scale-95 transition-transform">Bỏ qua nghỉ</button>
          <button onClick={() => setRestLeft(r => r + 15)} className="p-4 bg-slate-800 rounded-full text-slate-300 active:scale-95 transition-transform"><Plus size={24} /></button>
        </div>

        <div className="pt-12 text-center text-slate-500">
          <p className="text-sm">Tiếp theo:</p>
          <p className="text-lg font-bold text-slate-300 mt-1">
            {phase === 'main' ? (
              session.exercises[itemIndex].sets.every(s => s.completed) 
                ? (itemIndex < session.exercises.length - 1 ? session.exercises[itemIndex + 1].name : 'Giãn cơ')
                : `${session.exercises[itemIndex].name} - Hiệp ${session.exercises[itemIndex].sets.findIndex(s => !s.completed) + 1}`
            ) : 'Bài tập tiếp theo'}
          </p>
        </div>
      </div>
    );
  };

  const renderTimerView = (title: string, subtitle: string, durationStr: string, colorClass: string, guide: any) => {
    return (
      <div className="flex-1 flex flex-col">
        {/* Upper half: Info */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight mb-2">{title}</h2>
              <p className="text-slate-400 text-sm">{subtitle} • {durationStr}</p>
            </div>
            {guide && (
              <button 
                onClick={() => setInfoExercise({ ...guide, name: title, nameEn: title })}
                className="p-2.5 bg-slate-800 rounded-full text-slate-400 hover:text-white shrink-0 mt-1"
              >
                <Info size={20} />
              </button>
            )}
          </div>
          {guide && (
            <div className="space-y-4">
              {guide.mediaUrls?.[0] ? (
                 <video src={guide.mediaUrls[0]} autoPlay loop muted playsInline className="w-full h-48 object-cover rounded-2xl bg-slate-800 shadow-lg" />
              ) : (
                <div className="w-full h-48 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700/50 shadow-lg">
                  <ImageIcon className="text-slate-600" size={32} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lower half: Timer Controls */}
        <div className="p-8 pb-12 bg-slate-950 border-t border-slate-800 flex flex-col items-center justify-center space-y-8">
          <div className={`text-7xl font-mono font-bold tabular-nums ${colorClass}`}>
            {Math.floor(timerLeft / 60)}:{(timerLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => setTimerLeft(r => Math.max(0, r - 10))} className="p-4 bg-slate-800 rounded-full text-slate-400"><Minus size={24} /></button>
            <button 
              onClick={() => setTimerRunning(!timerRunning)}
              className={`w-20 h-20 flex items-center justify-center rounded-full ${timerRunning ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500 text-white'} shadow-lg`}
            >
              {timerRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-2" />}
            </button>
            <button onClick={() => setTimerLeft(r => r + 10)} className="p-4 bg-slate-800 rounded-full text-slate-400"><Plus size={24} /></button>
          </div>
          <button onClick={handleFinishTimerExercise} className="w-full py-4 font-bold text-slate-400 bg-slate-900 rounded-xl hover:text-white transition-colors">
            Đánh dấu xong
          </button>
        </div>
      </div>
    );
  };



  const renderMainExercise = () => {
    const ex = session.exercises[itemIndex];
    const guide = getGuide(ex.nameEn, ex.name);
    const isTimeBased = ex.targetReps.toLowerCase().includes('giây') || ex.targetReps.toLowerCase().includes('s');

    if (isTimeBased) {
      return renderTimerView(ex.name, ex.nameEn, `${ex.targetSets} hiệp • ${ex.targetReps}`, 'text-blue-400', guide);
    }

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
              <button 
                onClick={() => setShowSwap(true)}
                className="p-2.5 bg-slate-800 rounded-full text-slate-400 hover:text-white"
              >
                <RefreshCw size={20} />
              </button>
              <button 
                onClick={() => {
                  const dbEx = dbData.exercises.find(e => e.name === ex.nameEn);
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

          {guide && (
            <div className="space-y-4">
              {guide.mediaUrls?.[0] ? (
                 <video src={guide.mediaUrls[0]} autoPlay loop muted playsInline className="w-full h-48 object-cover rounded-2xl bg-slate-800 border border-slate-700/30 shadow-lg" />
              ) : (
                <div className="w-full h-48 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700/50">
                  <ImageIcon className="text-slate-600" size={32} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Lower half: Set Inputs */}
        <div className="bg-slate-950 p-4 rounded-t-3xl border-t border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10">
          <div className="max-h-[40vh] overflow-y-auto space-y-2 pb-6 px-2">
            <div className="flex text-xs font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              <div className="w-8 text-center">Hiệp</div>
              <div className="flex-1 text-center">Tạ (kg)</div>
              <div className="flex-1 text-center">Reps</div>
              <div className="w-12"></div>
            </div>
            {ex.sets.map((s, i) => (
              <SetInputRow 
                key={i} 
                s={s} 
                index={i} 
                isCurrent={i === currentSetIndex} 
                onComplete={(w, r) => handleCompleteSet(i, w, r)}
                onUndo={() => {
                  const newSets = ex.sets.map((set, setIdx) => setIdx === i ? { ...set, completed: false } : set);
                  onUpdate({ ...session, exercises: session.exercises.map((e, exIdx) => exIdx === itemIndex ? { ...e, sets: newSets, checked: false } : e) });
                }}
              />
            ))}
            
            {ex.sets.every(s => s.completed) && (
               <button onClick={advance} className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2">
                 Bài tập tiếp theo <FastForward size={18} />
               </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isResting) return renderRestTimer();

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
      <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-900 z-20">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-white flex items-center gap-1 font-medium active:scale-95 transition-transform">
          <ChevronDown size={20} />
          Thu nhỏ
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
                const dbEx = dbData.exercises.find(e => e.name === currentExLog.nameEn);
                const alts = dbEx?.alternatives || [];
                
                if (alts.length === 0) {
                  return <p className="text-center text-slate-500 py-8">Không có bài tập thay thế được đề xuất.</p>;
                }

                return (
                  <div className="space-y-2">
                    {alts.map(altNameEn => {
                      const altDbEx = dbData.exercises.find(e => e.name === altNameEn);
                      const altName = altDbEx ? altDbEx.name : altNameEn;
                      return (
                        <button 
                          key={altNameEn}
                          onClick={() => {
                            const newExercises = [...session.exercises];
                            newExercises[itemIndex] = {
                              ...newExercises[itemIndex],
                              name: altName,
                              nameEn: altNameEn,
                              selectedAlternative: altName
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
