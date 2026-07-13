import fs from 'fs';
import path from 'path';
import React from 'react';
import { CheckCircle2, Info, Dumbbell, Shield, Activity, Calendar, ArrowUp } from 'lucide-react';

function getPPLData() {
  const filePath = path.join(process.cwd(), 'data', 'giao-an.json');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch {
    return null;
  }
}

function SectionHeading({ title, id, icon: Icon }: { title: string; id: string; icon?: React.ComponentType<{ size?: number; className?: string }> }) {
  return (
    <h2 id={id} className="text-2xl font-semibold tracking-tight mt-16 mb-6 border-b border-slate-800 pb-2 flex items-center gap-2 text-slate-200 scroll-mt-8">
      {Icon && <Icon className="text-slate-500" size={22} />}
      {title}
    </h2>
  );
}

function ExerciseTable({ title, exercises, type }: { title: string; exercises: any[]; type: 'A' | 'B' }) {
  if (!exercises || exercises.length === 0) return null;
  return (
    <div className="mb-10">
      <h4 className="text-xl font-bold mb-4 flex items-center gap-3">
        <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${type === 'A' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
          Buổi {type}
        </span>
        {title}
      </h4>
      <div className="block lg:hidden space-y-3">
        {exercises.map((ex: any, idx: number) => (
          <div key={ex.id || idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
            {ex.locked && (
              <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg">Tier 1</div>
            )}
            <div className="flex gap-3 mb-3">
              <div className="w-7 h-7 shrink-0 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center font-bold text-xs">{ex.order || idx + 1}</div>
              <div>
                <h5 className="font-bold text-slate-100 text-base leading-tight pr-14">{ex.name}</h5>
                <div className="text-xs text-slate-500 mt-0.5">{ex.nameEn}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3 bg-slate-950/50 p-3 rounded-lg text-sm">
              <div><div className="text-xs text-slate-500 mb-0.5">Sets × Reps</div><div className="font-mono font-bold text-slate-200">{ex.sets} × {ex.repsDisplay}</div></div>
              <div><div className="text-xs text-slate-500 mb-0.5">Nghỉ</div><div className="font-medium text-slate-200">{ex.rest}</div></div>
            </div>
            {ex.notes && (
              <div className="text-sm text-slate-400 bg-slate-800/50 p-2.5 rounded-lg">{ex.notes}</div>
            )}
          </div>
        ))}
      </div>
      <div className="hidden lg:block border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left border-collapse bg-slate-900">
          <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-5 py-4 font-semibold w-12 text-center">#</th>
              <th className="px-5 py-4 font-semibold">Bài tập</th>
              <th className="px-5 py-4 font-semibold whitespace-nowrap">Sets × Reps</th>
              <th className="px-5 py-4 font-semibold whitespace-nowrap">Nghỉ</th>
              <th className="px-5 py-4 font-semibold">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {exercises.map((ex: any, idx: number) => (
              <tr key={ex.id || idx} className="hover:bg-slate-800/30 transition-colors group">
                <td className="px-5 py-4 text-center text-slate-500 font-bold">{ex.order || idx + 1}</td>
                <td className="px-5 py-4">
                  <div className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">{ex.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{ex.nameEn}</div>
                  {ex.locked && <span className="inline-block mt-1.5 px-1.5 py-0.5 bg-rose-500/15 text-rose-400 rounded text-[10px] font-bold uppercase">Tier 1</span>}
                </td>
                <td className="px-5 py-4 font-mono font-bold text-slate-300">
                  <span className="px-2 py-1 bg-slate-800 rounded-md">{ex.sets} × {ex.repsDisplay}</span>
                </td>
                <td className="px-5 py-4 text-slate-400">{ex.rest}</td>
                <td className="px-5 py-4 text-slate-400 text-sm leading-relaxed">{ex.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ReferencePage() {
  const data = getPPLData();
  if (!data) return <div className="p-8 text-slate-500">Không tìm thấy dữ liệu</div>;

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-12">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Mục lục</h3>
            <nav className="flex flex-col gap-2 text-sm font-medium text-slate-500">
              <a href="#overview" className="hover:text-blue-400 transition-colors">Tổng quan</a>
              <a href="#principles" className="hover:text-blue-400 transition-colors">Nguyên tắc</a>
              <a href="#rules" className="hover:text-blue-400 transition-colors">Quy tắc nghỉ</a>
              <a href="#core-ramp" className="hover:text-blue-400 transition-colors">Core Ramp</a>
              {data.months.map((m: any) => (
                <a key={m.monthNumber} href={`#month-${m.monthNumber}`} className="hover:text-blue-400 transition-colors pl-3">
                  Tháng {m.monthNumber}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 max-w-4xl pb-16">
          {/* Mobile TOC */}
          <div className="md:hidden mb-8 overflow-x-auto pb-3">
            <div className="flex gap-2 w-max">
              {['Tổng quan', 'Nguyên tắc', 'Quy tắc', 'Core Ramp'].map((t, i) => (
                <a key={t} href={['#overview','#principles','#rules','#core-ramp'][i]}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-sm text-slate-400 whitespace-nowrap">{t}</a>
              ))}
              {data.months.map((m: any) => (
                <a key={m.monthNumber} href={`#month-${m.monthNumber}`} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-sm whitespace-nowrap">
                  Tháng {m.monthNumber}
                </a>
              ))}
            </div>
          </div>

          {/* Header */}
          <header className="mb-12" id="overview">
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold uppercase tracking-widest border border-blue-500/30">v{data.meta.version}</span>
              <span className="px-3 py-1 rounded-full bg-slate-900 text-slate-400 text-xs border border-slate-800">{data.meta.totalMonths} tháng · {data.meta.totalWeeks} tuần</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">{data.meta.programName}</h1>
            <p className="text-lg text-slate-400 leading-relaxed">{data.meta.description}</p>
          </header>

          {/* Changes */}
          <div className="mb-8 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
            <h4 className="font-semibold flex items-center gap-2 mb-3 text-slate-200">
              <Info size={18} className="text-blue-500" /> Cập nhật bản 2.0
            </h4>
            <ul className="space-y-1.5">
              {data.meta.changesFromV1.map((c: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />{c}
                </li>
              ))}
            </ul>
          </div>

          {/* Frequency */}
          <div className="mb-12">
            <h4 className="text-xl font-bold mb-4 text-slate-200 flex items-center gap-2">
              <Calendar size={22} className="text-slate-500" /> Lịch tập
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.frequencyOptions.map((opt: any) => (
                <div key={opt.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                  <h5 className="font-bold text-slate-100 text-lg mb-1">{opt.label}</h5>
                  <div className="text-sm text-slate-500 mb-3">{opt.suitableFor}</div>
                  <div className="text-sm bg-slate-950/50 p-3 rounded-lg text-slate-300">{opt.schedule}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Principles */}
          <SectionHeading id="principles" title="Nguyên tắc cốt lõi" icon={Shield} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {data.principles.map((p: any, i: number) => (
              <div key={i} className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                <h5 className="font-semibold text-slate-100 mb-2">{p.title}</h5>
                <p className="text-sm text-slate-400 leading-relaxed">{p.content}</p>
              </div>
            ))}
          </div>

          {/* Rest Rules */}
          <SectionHeading id="rules" title="Quy tắc nghỉ & Tăng tiến" icon={Activity} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {['sessionA', 'sessionB'].map(key => {
              const r = data.restRules[key];
              return (
                <div key={key} className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
                  <h5 className="font-bold text-blue-400 mb-3">{key === 'sessionA' ? 'Buổi A (Power)' : 'Buổi B (Hypertrophy)'}</h5>
                  <ul className="text-sm space-y-1.5 text-slate-300">
                    {key === 'sessionA' ? (
                      <>
                        <li><span className="text-slate-500">Tier 1:</span> {r.tier1}</li>
                        <li><span className="text-slate-500">Bài phụ:</span> {r.accessory}</li>
                        <li><span className="text-slate-500">Core:</span> {r.core}</li>
                      </>
                    ) : (
                      <>
                        <li><span className="text-slate-500">Bài chính:</span> {r.main}</li>
                        <li><span className="text-slate-500">Bài phụ:</span> {r.accessory}</li>
                        <li><span className="text-slate-500">Core:</span> {r.core}</li>
                      </>
                    )}
                  </ul>
                  <p className="text-xs text-slate-600 mt-3 italic">{r.accessoryRationale}</p>
                </div>
              );
            })}
          </div>
          <div className="mb-12 p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <h5 className="font-semibold text-slate-200 mb-3">Tiến trình 4 tuần (Tier 1)</h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.weeklyProgressionRules.tier1GeneralFormula.map((w: any) => (
                <div key={w.week} className="bg-slate-950/50 p-3 rounded-xl">
                  <div className="text-xs text-slate-500 font-bold uppercase mb-1">Tuần {w.week}</div>
                  <div className="font-semibold text-slate-200 text-sm mb-1">{w.goal}</div>
                  <div className="text-xs text-slate-500 mb-2">{w.instruction}</div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 bg-slate-800 rounded text-blue-400">RIR {w.rir}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-emerald-950/30 border border-emerald-800/30 rounded-xl text-sm text-emerald-300">
              <strong>Double Progression:</strong> {data.weeklyProgressionRules.doubleProgressionRule}
            </div>
          </div>

          {/* Core Ramp */}
          <SectionHeading id="core-ramp" title="Tiến trình Core (Core Ramp)" icon={Dumbbell} />
          <div className="mb-12 overflow-x-auto pb-4">
            <table className="w-full text-sm border-collapse border border-slate-800 rounded-xl overflow-hidden">
              <thead className="bg-slate-800 text-slate-400">
                <tr>
                  <th className="px-4 py-3 border-r border-slate-700 whitespace-nowrap">Tháng</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">T1</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">T2</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">T3</th>
                  <th className="px-4 py-3 text-center whitespace-nowrap">T4</th>
                  <th className="px-4 py-3 border-l border-slate-700 min-w-[180px]">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {['push','pull','legs'].map(type => {
                  const c = data.coreRamp[type];
                  return (
                    <React.Fragment key={type}>
                      <tr className="bg-slate-800/50">
                        <td colSpan={6} className="px-4 py-2 font-bold text-slate-200">
                          {type.toUpperCase()}: <span className="text-blue-400">{c.exerciseVi}</span>
                          <span className="text-slate-500 font-normal ml-1">({c.unit})</span>
                        </td>
                      </tr>
                      {c.months.map((m: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                          <td className="px-4 py-3 font-medium border-r border-slate-800 text-slate-300 whitespace-nowrap">Tháng {m.month}</td>
                          {m.weeks.map((w: number, j: number) => (
                            <td key={j} className="px-4 py-3 text-center font-mono font-bold text-slate-200">{w}</td>
                          ))}
                          <td className="px-4 py-3 text-slate-400 border-l border-slate-800 text-xs leading-relaxed">
                            <strong className="text-slate-300">Đích {m.target}</strong>
                            {m.note && <span className="block text-slate-600 mt-0.5">{m.note}</span>}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Months */}
          <div className="space-y-20">
            {data.months.map((m: any) => (
              <div key={m.monthNumber} id={`month-${m.monthNumber}`} className="scroll-mt-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-4 mb-8">
                  <div>
                    <div className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-1.5">
                      Giai đoạn {m.monthNumber} (Tuần {m.weekRange[0]}–{m.weekRange[1]})
                    </div>
                    <h2 className="text-3xl font-bold text-white">Tháng {m.monthNumber}: {m.phaseName}</h2>
                  </div>
                </div>
                {['push','pull','legs'].map(dayKey => {
                  const day = m.days[dayKey];
                  return (
                    <div key={dayKey} className="mb-12">
                      <h3 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                        <Calendar size={22} className="text-slate-500" />
                        {day.dayLabel}
                      </h3>
                      <div className="space-y-6">
                        <ExerciseTable title="Power (Sức mạnh)" exercises={day.sessionA} type="A" />
                        <ExerciseTable title="Hypertrophy (Phì đại)" exercises={day.sessionB} type="B" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Back to top - mobile */}
      <a href="#" className="md:hidden fixed bottom-24 right-5 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg flex items-center justify-center">
        <ArrowUp size={18} strokeWidth={2.5} />
      </a>
    </div>
  );
}
