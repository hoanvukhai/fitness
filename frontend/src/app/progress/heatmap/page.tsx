'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllWorkouts } from '@/lib/firestore';
import { WorkoutSession } from '@/lib/types';
import { getDayLabel } from '@/lib/workout-engine';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

function dateVN(date: Date) {
  return date.toLocaleDateString('sv', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export default function HeatmapPage() {
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Danh sách các năm có dữ liệu (cộng thêm năm hiện tại)
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    workouts.filter(w => w.status === 'completed').forEach(w => {
      years.add(new Date(w.date).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [workouts]);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [timelineLimit, setTimelineLimit] = useState(3);

  // Reset limit khi đổi năm
  useEffect(() => {
    setTimelineLimit(3);
  }, [selectedYear]);

  useEffect(() => {
    getAllWorkouts().then(data => {
      setWorkouts(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Filter cho năm được chọn
  const completedThisYear = useMemo(() => {
    return workouts.filter(w => w.status === 'completed' && new Date(w.date).getFullYear() === selectedYear);
  }, [workouts, selectedYear]);

  // Xây dựng dữ liệu cho biểu đồ 1 năm
  const calendarWeeks = useMemo(() => {
    const done = new Map<string, WorkoutSession>();
    completedThisYear.forEach(w => done.set(w.date, w));

    const startDate = new Date(selectedYear, 0, 1); // Jan 1st
    // Lùi về Thứ 2
    const dayOfWeek = startDate.getDay();
    const daysFromMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - daysFromMon);

    const endDate = new Date(selectedYear, 11, 31); // Dec 31st
    
    const weeks: { date: string; session?: WorkoutSession; month: number }[][] = [];
    let current = new Date(startDate);
    
    while (current <= endDate || current.getDay() !== 1) { 
      if (current > endDate && current.getDay() === 1) break;

      const week: { date: string; session?: WorkoutSession; month: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = dateVN(current);
        week.push({ 
          date: iso, 
          session: done.get(iso),
          month: current.getMonth() 
        });
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  }, [completedThisYear, selectedYear]);

  // Hoạt động theo tháng
  const activityByMonth = useMemo(() => {
    const groups: Record<number, WorkoutSession[]> = {};
    completedThisYear.forEach(w => {
      const m = new Date(w.date).getMonth();
      if (!groups[m]) groups[m] = [];
      groups[m].push(w);
    });
    return groups;
  }, [completedThisYear]);

  const monthsInOrder = Object.keys(activityByMonth).map(Number).sort((a, b) => b - a);

  // Month labels for the top of the calendar
  const monthLabels = useMemo(() => {
    const labels: { label: string; colIndex: number }[] = [];
    let currentMonth = -1;
    calendarWeeks.forEach((week, index) => {
      const firstDayOfMonth = week.find(d => d.month !== currentMonth && new Date(d.date).getFullYear() === selectedYear);
      if (firstDayOfMonth) {
        currentMonth = firstDayOfMonth.month;
        labels.push({
          label: `Th ${currentMonth + 1}`,
          colIndex: index
        });
      }
    });
    return labels;
  }, [calendarWeeks, selectedYear]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-pulse text-slate-500">Đang tải...</div></div>;
  }

  return (
    <div className="bg-slate-950 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors -ml-2 p-2"
          >
            <ChevronLeft size={20} />
            <span className="font-medium text-sm">Tiến độ</span>
          </button>
          <div className="flex-1 text-center font-bold text-lg text-white mr-8">
            Hoạt động trong năm
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row gap-8">
        
        {/* Main Content */}
        <div className="flex-1 space-y-8 order-2 md:order-1 min-w-0">
          <div className="text-xl font-medium text-slate-300">
            {completedThisYear.length} buổi tập trong năm {selectedYear}
          </div>

          {/* Heatmap */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 overflow-hidden">
            
            <div className="flex gap-2">
              <div className="flex flex-col gap-1 pt-5 justify-between">
                {['T2','T3','T4','T5','T6','T7','CN'].map((d, i) => (
                  <div key={d} className={`h-4 flex items-center text-[10px] text-slate-500 w-4 ${(i%2===1) ? 'opacity-0' : ''}`}>{d}</div>
                ))}
              </div>
              
              <div className="flex-1 overflow-x-auto scrollbar-none pb-2" dir="rtl">
                <div className="min-w-max relative pt-5" dir="ltr">
                  {/* Month Labels */}
                  {monthLabels.map((m, i) => (
                    <div 
                      key={i} 
                      className="absolute top-0 text-[10px] text-slate-400"
                      style={{ left: `${m.colIndex * 20}px` }} 
                    >
                      {m.label}
                    </div>
                  ))}

                  <div className="flex gap-1">
                    {calendarWeeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-1">
                        {week.map((cell, di) => {
                          const isOutsideYear = new Date(cell.date).getFullYear() !== selectedYear;
                          if (isOutsideYear) {
                            return <div key={di} className="w-4 h-4 rounded-[3px] bg-transparent" />;
                          }

                          const dayColors: Record<string, string> = {
                            push: 'bg-sky-500',
                            pull: 'bg-indigo-500',
                            legs: 'bg-emerald-500',
                          };
                          const color = cell.session ? (dayColors[cell.session.day] || 'bg-slate-400') : 'bg-slate-800/40';
                          
                          let opacityClass = 'opacity-100';
                          if (cell.session) {
                            const mins = Math.floor(cell.session.durationSeconds / 60);
                            if (mins < 45) opacityClass = 'opacity-40';
                            else if (mins <= 60) opacityClass = 'opacity-70';
                            else opacityClass = 'opacity-100';
                          }

                          const title = cell.session
                            ? `${new Date(cell.date).toLocaleDateString('vi-VN')} · ${getDayLabel(cell.session.day)} ${cell.session.session} (${Math.floor(cell.session.durationSeconds / 60)}m)`
                            : new Date(cell.date).toLocaleDateString('vi-VN');
                          
                          return (
                            <div
                              key={di}
                              title={title}
                              className={`w-4 h-4 rounded-[3px] transition-colors ${color} ${opacityClass}`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end mt-4 gap-1.5 border-t border-slate-800 pt-3">
              <span className="text-[10px] text-slate-500 font-medium">Nhẹ</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-[2px] bg-slate-400 opacity-40" />
                <div className="w-3 h-3 rounded-[2px] bg-slate-400 opacity-70" />
                <div className="w-3 h-3 rounded-[2px] bg-slate-400 opacity-100" />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">Nặng</span>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Hoạt động trong năm</h2>
            {monthsInOrder.length === 0 ? (
              <div className="text-slate-500 text-sm">Không có hoạt động nào trong năm nay.</div>
            ) : (
              <div className="relative border-l border-slate-800 ml-3 space-y-8 pb-8">
                {monthsInOrder.slice(0, timelineLimit).map((month) => {
                  const sessions = activityByMonth[month];
                  const pushCount = sessions.filter(s => s.day === 'push').length;
                  const pullCount = sessions.filter(s => s.day === 'pull').length;
                  const legsCount = sessions.filter(s => s.day === 'legs').length;
                  const total = sessions.length;

                  return (
                    <div key={month} className="relative pl-6">
                      <div className="absolute -left-1.5 top-1 w-3 h-3 rounded-full bg-slate-800 border-2 border-slate-950" />
                      
                      <div className="font-bold text-slate-200 mb-2">Tháng {month + 1} <span className="text-slate-500 font-normal ml-1">{selectedYear}</span></div>
                      
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div className="text-sm text-slate-300 font-medium">
                            Hoàn thành {total} buổi tập
                          </div>
                          
                          {/* Mini breakdown bars */}
                          <div className="flex flex-col gap-1.5 w-24" title={`${pushCount} Push, ${pullCount} Pull, ${legsCount} Legs`}>
                            {pushCount > 0 && (
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${(pushCount/total)*100}%` }} />
                              </div>
                            )}
                            {pullCount > 0 && (
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${(pullCount/total)*100}%` }} />
                              </div>
                            )}
                            {legsCount > 0 && (
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${(legsCount/total)*100}%` }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {monthsInOrder.length > timelineLimit && (
                  <div className="relative pl-6">
                    <button
                      onClick={() => setTimelineLimit(prev => prev + 3)}
                      className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors bg-slate-900/50 hover:bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 w-full text-center"
                    >
                      Xem thêm hoạt động cũ hơn
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Year Selector */}
        <div className="md:w-48 flex-shrink-0 flex md:flex-col gap-2 overflow-x-auto scrollbar-none order-1 md:order-2">
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`flex-shrink-0 w-auto md:w-full text-center md:text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedYear === year 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-800 md:bg-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              Năm {year}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
