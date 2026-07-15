'use client';

import { useState } from 'react';
import { X, Save, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { WorkoutSession, ExerciseLog } from '@/lib/types';
import { calcTotalVolume } from '@/lib/workout-engine';
import dbData from '../../data/db.json';

interface EditSessionSheetProps {
  session: WorkoutSession;
  onSave: (updated: WorkoutSession) => void;
  onClose: () => void;
}

export default function EditSessionSheet({ session, onSave, onClose }: EditSessionSheetProps) {
  const [edited, setEdited] = useState<WorkoutSession>(JSON.parse(JSON.stringify(session)));

  const handleDateChange = (dateStr: string) => {
    setEdited(prev => ({ ...prev, date: dateStr }));
  };

  const handleDurationChange = (minutes: number) => {
    setEdited(prev => ({ ...prev, durationSeconds: minutes * 60 }));
  };

  const handleStatusChange = (status: 'completed' | 'skipped' | 'in_progress' | 'planned') => {
    setEdited(prev => ({ ...prev, status }));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps' | 'completed', value: any) => {
    setEdited(prev => {
      const newExercises = [...prev.exercises];
      const newSets = [...newExercises[exerciseIndex].sets];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], sets: newSets };
      return { ...prev, exercises: newExercises };
    });
  };

  const updateExerciseName = (exerciseIndex: number, newName: string) => {
    setEdited(prev => {
      const newExercises = [...prev.exercises];
      const ex = newExercises[exerciseIndex];
      const isNewTimeBased = newName.toLowerCase().includes('plank');
      const isOldTimeBased = ex.targetReps.toLowerCase().includes('giây') || ex.targetReps.toLowerCase().includes('s');
      let newTargetReps = ex.targetReps;
      
      if (isNewTimeBased && !isOldTimeBased) newTargetReps = '60 giây';
      else if (!isNewTimeBased && isOldTimeBased) newTargetReps = '15';

      newExercises[exerciseIndex] = { 
        ...ex, 
        name: newName, 
        nameEn: newName, 
        selectedAlternative: newName,
        targetReps: newTargetReps
      };
      return { ...prev, exercises: newExercises };
    });
  };

  const handleSave = () => {
    const updated = {
      ...edited,
      totalVolume: calcTotalVolume(edited.exercises)
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div className="relative bg-slate-900 w-full max-h-[90vh] rounded-t-3xl border-t border-slate-800 flex flex-col shadow-2xl">
        
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900 rounded-t-3xl sticky top-0 z-10">
          <button 
            onClick={onClose}
            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
          <h2 className="font-bold text-lg text-white">Sửa buổi tập</h2>
          <button 
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-full transition-colors"
          >
            <Save size={16} /> Lưu
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 overflow-y-auto space-y-6 pb-20 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
          
          {/* General Info */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Ngày tập</label>
              <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                <Calendar size={18} className="text-slate-400" />
                <input 
                  type="date" 
                  value={edited.date}
                  onChange={e => handleDateChange(e.target.value)}
                  className="bg-transparent border-none text-white focus:ring-0 p-0 text-sm w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Thời gian (phút)</label>
                <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                  <Clock size={18} className="text-slate-400" />
                  <input 
                    type="number" 
                    value={Math.floor(edited.durationSeconds / 60)}
                    onChange={e => handleDurationChange(parseInt(e.target.value) || 0)}
                    className="bg-transparent border-none text-white focus:ring-0 p-0 text-sm w-full font-mono"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Trạng thái</label>
                <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2">
                  <CheckCircle2 size={18} className="text-slate-400" />
                  <select 
                    value={edited.status}
                    onChange={e => handleStatusChange(e.target.value as any)}
                    className="bg-transparent border-none text-white focus:ring-0 p-0 text-sm w-full"
                  >
                    <option value="completed" className="bg-slate-800">Hoàn thành</option>
                    <option value="in_progress" className="bg-slate-800">Đang tập</option>
                    <option value="skipped" className="bg-slate-800">Bỏ qua</option>
                    <option value="planned" className="bg-slate-800">Chưa tập</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Exercises */}
          <div>
            <h3 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
              <span>Chi tiết bài tập</span>
            </h3>
            <div className="space-y-6">
              {edited.exercises.map((ex, eIdx) => {
                const isTimeBased = ex.targetReps.toLowerCase().includes('giây') || ex.targetReps.toLowerCase().includes('s');
                
                const normalize = (str: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                const originalGuide = dbData.exercises.find((e: any) => {
                  const eName = normalize(e.name);
                  const exNameEn = normalize(ex.originalNameEn || ex.nameEn);
                  const exName = normalize(ex.originalName || ex.name);
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
                if (ex.selectedAlternative) {
                  const origEn = ex.originalNameEn || '';
                  if (origEn && !displayAlternatives.includes(origEn) && origEn !== ex.nameEn) {
                    displayAlternatives.unshift(origEn);
                  }
                }
                displayAlternatives = displayAlternatives.filter(a => normalize(a) !== normalize(ex.nameEn) && normalize(a) !== normalize(ex.name));

                return (
                  <div key={eIdx} className="bg-slate-800/30 rounded-2xl p-3 border border-slate-700/30">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="font-semibold text-slate-200 text-sm">{ex.name}</div>
                      {displayAlternatives.length > 0 && (
                        <select
                          onChange={e => {
                            const newName = e.target.value;
                            if (newName !== ex.nameEn) {
                              updateExerciseName(eIdx, newName);
                            }
                          }}
                          className="bg-slate-800/80 text-[10px] text-slate-400 border border-slate-700 rounded px-2 py-0.5 outline-none max-w-[120px]"
                          value={ex.nameEn}
                        >
                          <option value={ex.nameEn}>Đổi bài...</option>
                          {displayAlternatives.map((alt: string) => (
                            <option key={alt} value={alt}>{alt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className={`grid text-[10px] text-slate-500 font-bold uppercase tracking-wider px-1 gap-1 ${isTimeBased ? 'grid-cols-6' : 'grid-cols-10'}`}>
                        <div className="col-span-2 text-center">Hiệp</div>
                        {!isTimeBased && <div className="col-span-3 text-center">Tạ (kg)</div>}
                        <div className={`${isTimeBased ? 'col-span-2' : 'col-span-3'} text-center`}>{isTimeBased ? 'Giây' : 'Reps'}</div>
                        <div className="col-span-2 text-center">Xong</div>
                      </div>
                      
                      {ex.sets.map((set, sIdx) => (
                        <div key={sIdx} className={`grid items-center gap-1 py-1.5 px-1 rounded-xl transition-colors ${isTimeBased ? 'grid-cols-6' : 'grid-cols-10'} ${set.completed ? 'bg-emerald-950/20' : 'bg-slate-800/40'}`}>
                          <div className="col-span-2 text-center text-slate-400 font-mono text-sm">{sIdx + 1}</div>
                          
                          {!isTimeBased && (
                            <div className="col-span-3">
                              <input 
                                type="number" 
                                value={set.weight}
                                onChange={e => updateSet(eIdx, sIdx, 'weight', parseFloat(e.target.value) || 0)}
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-slate-100 text-sm focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          )}
                          
                          <div className={isTimeBased ? 'col-span-2' : 'col-span-3'}>
                            <input 
                              type="number" 
                              value={set.reps}
                              onChange={e => updateSet(eIdx, sIdx, 'reps', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-slate-100 text-sm focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div className="col-span-2 flex justify-center">
                            <input 
                              type="checkbox"
                              checked={set.completed}
                              onChange={e => updateSet(eIdx, sIdx, 'completed', e.target.checked)}
                              className="w-5 h-5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 bg-slate-800"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
