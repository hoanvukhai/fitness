import fs from 'fs';
import path from 'path';
import React from 'react';
import { CheckCircle2, Info, AlertTriangle, Dumbbell, Shield, Activity, Calendar, ArrowUp } from 'lucide-react';

function getPPLData() {
  const filePath = path.join(process.cwd(), 'data', 'giao-an.json');
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    return null;
  }
}

function SectionHeading({ title, id, icon: Icon }: { title: string, id: string, icon?: any }) {
  return (
    <h2 id={id} className="text-2xl font-semibold tracking-tight mt-16 mb-6 border-b pb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200 scroll-mt-8">
      {Icon && <Icon className="text-slate-400" size={24} />}
      {title}
    </h2>
  );
}

function ExerciseTable({ title, exercises, type }: { title: string, exercises: any[], type: 'A' | 'B' }) {
  if (!exercises || exercises.length === 0) return null;
  
  return (
    <div className="mb-10">
      <h4 className="text-xl font-bold mb-4 flex items-center gap-3">
        <span className={`px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider ${type === 'A' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'}`}>
          Buổi {type}
        </span>
        {title}
      </h4>
      
      {/* Giao diện Mobile (Dạng Card) */}
      <div className="block lg:hidden space-y-4">
        {exercises.map((ex, idx) => (
          <div key={ex.id || idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
            {ex.locked && (
              <div className="absolute top-0 right-0 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-bl-lg">
                Khóa cứng (Tier 1)
              </div>
            )}
            <div className="flex gap-3 mb-3">
              <div className="w-8 h-8 shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center font-bold text-sm">
                {ex.order || idx + 1}
              </div>
              <div>
                <h5 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-tight pr-16">{ex.name}</h5>
                <div className="text-xs text-slate-500 font-medium mt-0.5">{ex.nameEn}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg text-sm">
              <div>
                <div className="text-xs text-slate-400 mb-1">Sets x Reps</div>
                <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{ex.sets} x {ex.repsDisplay}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-1">Nghỉ</div>
                <div className="font-medium text-slate-800 dark:text-slate-200">{ex.rest}</div>
              </div>
            </div>
            
            <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-blue-50/50 dark:bg-slate-800/50 p-3 rounded-lg border border-blue-100/50 dark:border-slate-700/50">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Ghi chú:</span> {ex.notes}
              {ex.substitute && (
                <div className="mt-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  → Thay thế: {ex.substitute}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Giao diện Desktop (Dạng Bảng Truyền Thống) */}
      <div className="hidden lg:block border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left border-collapse bg-white dark:bg-slate-950">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-5 py-4 font-semibold w-12 text-center">#</th>
              <th className="px-5 py-4 font-semibold min-w-[250px]">Bài tập</th>
              <th className="px-5 py-4 font-semibold whitespace-nowrap">Sets x Reps</th>
              <th className="px-5 py-4 font-semibold whitespace-nowrap">Nghỉ</th>
              <th className="px-5 py-4 font-semibold w-1/3">Ghi chú</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {exercises.map((ex, idx) => (
              <tr key={ex.id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group">
                <td className="px-5 py-4 text-center text-slate-400 font-bold">{ex.order || idx + 1}</td>
                <td className="px-5 py-4">
                  <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{ex.name}</div>
                  <div className="text-xs text-slate-500 font-medium mt-0.5">{ex.nameEn}</div>
                  {ex.locked && (
                    <span className="inline-block mt-2 px-2 py-0.5 bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 rounded text-[10px] font-bold uppercase tracking-wider">
                      Khóa cứng (Tier 1)
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                  <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 inline-block rounded-md">
                    {ex.sets} x {ex.repsDisplay}
                  </div>
                </td>
                <td className="px-5 py-4 font-medium text-slate-600 dark:text-slate-400">
                  {ex.rest}
                </td>
                <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {ex.notes}
                  {ex.substitute && (
                    <div className="mt-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded inline-block text-xs font-medium">
                      Thay thế: {ex.substitute}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PPLViewer() {
  const data = getPPLData();

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Không tìm thấy dữ liệu</h1>
          <p className="mt-2 text-slate-500">Vui lòng đảm bảo file `giao-an.json` đã có trong thư mục `data`.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row gap-12">
        
        {/* Lõi bên trái: Table of Contents (Sticky) */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-12">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Mục lục</h3>
            <nav className="flex flex-col gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-400">
              <a href="#overview" className="hover:text-blue-600 transition-colors">1. Tổng quan</a>
              <a href="#principles" className="hover:text-blue-600 transition-colors">2. Nguyên tắc cốt lõi</a>
              <a href="#rules" className="hover:text-blue-600 transition-colors">3. Quy tắc nghỉ & Tăng tạ</a>
              <a href="#core-ramp" className="hover:text-blue-600 transition-colors">4. Bảng Core Ramp</a>
              {data.months.map((m: any) => (
                <a key={`toc-m${m.monthNumber}`} href={`#month-${m.monthNumber}`} className="hover:text-blue-600 transition-colors pl-4">
                  Tháng {m.monthNumber}: {m.phaseName}
                </a>
              ))}
            </nav>
            <div className="mt-12 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg text-xs text-slate-500 leading-relaxed border border-slate-100 dark:border-slate-800">
              <strong className="block text-slate-700 dark:text-slate-300 mb-1">Mẹo đọc:</strong>
              Đây là một cuốn sách điện tử tương tác. Hãy cuộn chuột để đọc theo thứ tự hoặc bấm vào mục lục để nhảy tới phần bạn quan tâm.
            </div>
          </div>
        </aside>

        {/* Nội dung chính bên phải */}
        <main className="flex-1 w-full max-w-4xl pb-32">
          
          {/* Mobile Table of Contents */}
          <div className="md:hidden mb-10 overflow-x-auto pb-4 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Mục lục nhanh</h3>
            <div className="flex gap-2 w-max">
              <a href="#overview" className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium whitespace-nowrap">Tổng quan</a>
              <a href="#principles" className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium whitespace-nowrap">Nguyên tắc</a>
              <a href="#rules" className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium whitespace-nowrap">Quy tắc nghỉ</a>
              <a href="#core-ramp" className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm font-medium whitespace-nowrap">Core Ramp</a>
              {data.months.map((m: any) => (
                <a key={`mobile-toc-m${m.monthNumber}`} href={`#month-${m.monthNumber}`} className="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-sm font-medium whitespace-nowrap">
                  Tháng {m.monthNumber}
                </a>
              ))}
            </div>
          </div>

          {/* Header */}
          <header className="mb-12 md:mb-16">
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold uppercase tracking-widest">
                Phiên bản {data.meta.version}
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold tracking-widest">
                Thời lượng: {data.meta.totalMonths} tháng ({data.meta.totalWeeks} tuần)
              </div>
            </div>
            <h1 id="overview" className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
              {data.meta.programName}
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              {data.meta.description}
            </p>
          </header>

          {/* Thay đổi so với bản cũ */}
          <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <h4 className="font-semibold flex items-center gap-2 mb-4">
              <Info className="text-blue-500" size={20} />
              Những cập nhật ở bản 2.0
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {data.meta.changesFromV1.map((change: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                  <span>{change}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cách sử dụng (Tần suất) */}
          <div className="mb-12">
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-200">
              <Calendar className="text-slate-400" size={24} />
              Cách phân bổ lịch tập (Tần suất)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.frequencyOptions.map((opt: any) => (
                <div key={opt.id} className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-lg text-slate-900 dark:text-slate-100">{opt.label}</h5>
                    {!opt.usesSessionB && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 rounded text-[10px] font-bold uppercase tracking-wider">
                        Chỉ dùng Buổi A
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500 mb-3">{opt.suitableFor}</div>
                  <div className="text-sm font-medium bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                    {opt.schedule}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Nguyên tắc cốt lõi */}
          <SectionHeading id="principles" title="Nguyên tắc cốt lõi" icon={Shield} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-16">
            {data.principles.map((p: any, idx: number) => (
              <div key={idx} className="p-5 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-md transition-shadow bg-white dark:bg-slate-950">
                <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{p.title}</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{p.content}</p>
              </div>
            ))}
          </div>

          {/* Quy tắc nghỉ & Tăng tạ */}
          <SectionHeading id="rules" title="Quy tắc nghỉ & Tăng tiến" icon={Activity} />
          <div className="space-y-6 mb-16">
            <div className="p-6 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
              <h5 className="font-bold text-blue-900 dark:text-blue-200 mb-4 flex items-center gap-2">
                Thời gian nghỉ (Rest)
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h6 className="font-semibold text-sm mb-2 text-blue-800 dark:text-blue-300">Buổi A (Sức mạnh)</h6>
                  <ul className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
                    <li><strong className="text-slate-900 dark:text-slate-100">Bài Tier 1:</strong> {data.restRules.sessionA.tier1}</li>
                    <li><strong className="text-slate-900 dark:text-slate-100">Bài Phụ:</strong> {data.restRules.sessionA.accessory}</li>
                    <li><strong className="text-slate-900 dark:text-slate-100">Bài Core:</strong> {data.restRules.sessionA.core}</li>
                  </ul>
                  <p className="mt-3 text-xs text-blue-600/80 dark:text-blue-400/80 italic">Lý do: {data.restRules.sessionA.accessoryRationale}</p>
                </div>
                <div>
                  <h6 className="font-semibold text-sm mb-2 text-blue-800 dark:text-blue-300">Buổi B (Phì đại)</h6>
                  <ul className="text-sm space-y-2 text-slate-700 dark:text-slate-300">
                    <li><strong className="text-slate-900 dark:text-slate-100">Bài Chính:</strong> {data.restRules.sessionB.main}</li>
                    <li><strong className="text-slate-900 dark:text-slate-100">Bài Phụ:</strong> {data.restRules.sessionB.accessory}</li>
                    <li><strong className="text-slate-900 dark:text-slate-100">Bài Core:</strong> {data.restRules.sessionB.core}</li>
                  </ul>
                  <p className="mt-3 text-xs text-blue-600/80 dark:text-blue-400/80 italic">Lý do: {data.restRules.sessionB.accessoryRationale}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              <h5 className="font-bold mb-4 flex items-center gap-2">
                Tiến trình tăng tạ (Progression)
              </h5>
              <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg mb-4">
                <strong>💡 Định nghĩa RIR:</strong> {data.weeklyProgressionRules.rirDefinition}
              </p>
              
              <h6 className="font-semibold text-sm mb-3">Công thức Tier 1 theo 4 tuần:</h6>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
                {data.weeklyProgressionRules.tier1GeneralFormula.map((w: any, idx: number) => (
                  <div key={idx} className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tuần {w.week}</div>
                    <div className="font-semibold text-sm mb-2">{w.goal}</div>
                    <div className="text-xs text-slate-500 mb-3">{w.instruction}</div>
                    <div className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-mono font-medium">
                      RIR: {w.rir}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 p-3 rounded-lg">
                <strong>Double Progression (Bài phụ & Buổi B):</strong> {data.weeklyProgressionRules.doubleProgressionRule}
              </p>
            </div>
          </div>

          {/* Bảng Core Ramp */}
          <SectionHeading id="core-ramp" title="Tiến trình Core (Core Ramp)" icon={Dumbbell} />
          <div className="mb-16 overflow-x-auto pb-4">
            <table className="w-full text-sm text-left border-collapse border border-slate-200 dark:border-slate-800 rounded-lg">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">Tháng</th>
                  <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Tuần 1</th>
                  <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Tuần 2</th>
                  <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Tuần 3</th>
                  <th className="px-4 py-3 font-medium text-center whitespace-nowrap">Tuần 4</th>
                  <th className="px-4 py-3 font-medium border-l border-slate-200 dark:border-slate-700 w-1/3 min-w-[250px]">Mục tiêu & Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {/* Render Push, Pull, Legs core ramps */}
                {['push', 'pull', 'legs'].map((type) => {
                  const coreData = data.coreRamp[type];
                  return (
                    <React.Fragment key={type}>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-t-4 border-white dark:border-slate-950">
                        <td colSpan={6} className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                          {type.toUpperCase()}: <span className="text-blue-700 dark:text-blue-400">{coreData.exerciseVi}</span> <span className="text-slate-500 font-normal">({coreData.unit})</span>
                        </td>
                      </tr>
                      {coreData.months.map((m: any, mIdx: number) => (
                        <tr key={mIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-4 py-3 font-medium border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">Tháng {m.month}</td>
                          {m.weeks.map((w: number, wIdx: number) => (
                            <td key={wIdx} className="px-4 py-3 text-center font-mono font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-950">{w}</td>
                          ))}
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 leading-relaxed">
                            <strong className="text-slate-900 dark:text-slate-200 block sm:inline">Đích {m.target}</strong>
                            {m.note && <span className="block sm:inline sm:ml-1 text-slate-500">— {m.note}</span>}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Các Tháng (The Program) */}
          <div className="space-y-24">
            {data.months.map((m: any, idx: number) => (
              <div key={idx} id={`month-${m.monthNumber}`} className="scroll-mt-8">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-slate-900 dark:border-slate-100 pb-4 mb-8">
                  <div>
                    <div className="text-sm font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase mb-2">
                      Giai đoạn {m.monthNumber} (Tuần {m.weekRange[0]}-{m.weekRange[1]})
                    </div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                      Tháng {m.monthNumber}: {m.phaseName}
                    </h2>
                  </div>
                </div>

                {/* Render Push, Pull, Legs cho tháng này */}
                {['push', 'pull', 'legs'].map((dayKey) => {
                  const dayData = m.days[dayKey];
                  return (
                    <div key={dayKey} className="mb-12">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                        <Calendar className="text-slate-400" size={24} />
                        {dayData.dayLabel}
                      </h3>
                      <div className="space-y-8">
                        <ExerciseTable title="Power (Sức mạnh)" exercises={dayData.sessionA} type="A" />
                        <ExerciseTable title="Hypertrophy (Phì đại)" exercises={dayData.sessionB} type="B" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </main>
      </div>

      {/* Nút cuộn lên đầu (Chỉ hiện trên mobile) */}
      <a 
        href="#overview" 
        className="md:hidden fixed bottom-6 right-6 z-50 bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-full shadow-lg border border-blue-500/30 backdrop-blur transition-all active:scale-95 flex items-center justify-center"
        aria-label="Cuộn lên đầu trang"
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </a>
    </div>
  );
}
