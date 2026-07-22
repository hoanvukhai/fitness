'use client';

import { useState } from 'react';
import { X, Save, Clock, Calendar, CheckCircle2, ChevronDown } from 'lucide-react';
import { WorkoutSession, ExerciseLog } from '@/lib/types';
import { calcTotalVolume } from '@/lib/workout-engine';
import dbData from '../../data/db.json';
import { normalize } from '@/lib/utils';

interface EditSessionSheetProps {
  session: WorkoutSession;
  onSave: (updated: WorkoutSession) => void;
  onClose: () => void;
}

export default function EditSessionSheet({ session, onSave, onClose }: EditSessionSheetProps) {
  const [edited, setEdited] = useState<WorkoutSession>(JSON.parse(JSON.stringify(session)));
  const [openDropdownIdx, setOpenDropdownIdx] = useState<number | null>(null);

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
      const isOldTimeBased = /giây|giay|\b\d+\s*s\b/.test(ex.targetReps.toLowerCase());
      let newTargetReps = ex.targetReps;
      
      if (isNewTimeBased && !isOldTimeBased) newTargetReps = '60 giây';
      else if (!isNewTimeBased && isOldTimeBased) newTargetReps = '15';

      const originalNameEn = ex.originalNameEn || ex.nameEn;
      const originalName = ex.originalName || ex.name;

      newExercises[exerciseIndex] = { 
        ...ex, 
        originalNameEn,
        originalName,
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
      totalVolume: calcTotalVolume(edited.exercises),
      exercises: edited.exercises.map(ex => ({
        ...ex,
        checked: ex.sets.length > 0 && ex.sets.every(s => s.completed)
      }))
    };
    onSave(updated);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => {
          if (openDropdownIdx !== null) setOpenDropdownIdx(null);
          else onClose();
        }}
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
                const isTimeBased = /giây|giay|\b\d+\s*s\b/.test(ex.targetReps.toLowerCase()) || 
                  (ex.name && ex.name.toLowerCase().includes('plank'));
                
                
                const originalGuide = dbData.exercises.find((e: any) => {
                  const searchNameEn = ex.originalNameEn || ex.nameEn;
                  return e.name === searchNameEn || (e.aliases && e.aliases.includes(searchNameEn));
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
                      {displayAlternatives.length > 0 && ex.tier !== 'tier1' && ex.tier !== 'main' && (
                        <div className="relative">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setOpenDropdownIdx(openDropdownIdx === eIdx ? null : eIdx);
                            }}
                            className="ml-auto bg-slate-800/80 hover:bg-slate-700/80 text-[10px] text-slate-300 border border-slate-700/80 rounded-md px-2.5 py-1 max-w-[120px] outline-none flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <span className="truncate">Đổi bài...</span>
                            <ChevronDown size={10} className={`transition-transform duration-200 ${openDropdownIdx === eIdx ? 'rotate-180' : ''}`} />
                          </button>

                          {openDropdownIdx === eIdx && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={(e) => { e.stopPropagation(); setOpenDropdownIdx(null); }} 
                              />
                              <div className="absolute right-0 top-full mt-1.5 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                                {displayAlternatives.map((alt: string) => (
                                  <button
                                    key={alt}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenDropdownIdx(null);
                                      if (alt !== ex.nameEn) {
                                        updateExerciseName(eIdx, alt);
                                      }
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs transition-colors ${alt === ex.nameEn ? 'bg-blue-600 text-white font-medium' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
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
