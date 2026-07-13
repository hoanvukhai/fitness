'use client';

import { useState } from 'react';
import { saveSettings } from '@/lib/firestore';
import { AppSettings } from '@/lib/types';
import { Dumbbell, Calendar, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleType, setScheduleType] = useState<'3day' | '6day'>('6day');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Tạ mặc định là 0 — sẽ nhập thực tế trong lúc tập
    const settings: AppSettings = {
      id: 'main',
      scheduleType,
      startDate,
      currentWeek: 1,
      currentMonth: 1,
      tier1Weights: {
        benchPress: 0,
        ohp: 0,
        barbellRow: 0,
        pullup: 0,
        backSquat: 0,
        rdl: 0,
      },
      accessoryWeights: {},
      isOnboarded: true,
    };
    await saveSettings(settings);
    setSaving(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center p-6">
      <div className="max-w-sm mx-auto w-full space-y-8">

        {/* Logo / Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto">
            <Dumbbell size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">PPL Tracker</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Thiết lập nhanh để bắt đầu. Mức tạ sẽ tự nhập trong lúc tập — không cần biết trước.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">

          {/* Ngày bắt đầu */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-300 mb-2">
              <Calendar size={15} className="text-slate-500" />
              Ngày bắt đầu chương trình
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          {/* Tần suất */}
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-3">
              Tần suất tập mỗi tuần
            </label>
            <div className="grid grid-cols-2 gap-3">
              {([ 
                { type: '6day' as const, sessions: '6', label: 'Cả A & B', sub: 'T2–T7', recommended: true },
                { type: '3day' as const, sessions: '3', label: 'Chỉ Buổi A', sub: 'T2, T4, T6', recommended: false },
              ]).map(opt => (
                <button
                  key={opt.type}
                  onClick={() => setScheduleType(opt.type)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    scheduleType === opt.type
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {opt.recommended && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/30">
                      Giáo án
                    </span>
                  )}
                  <div className={`text-2xl font-extrabold ${scheduleType === opt.type ? 'text-blue-300' : 'text-slate-400'}`}>
                    {opt.sessions}
                  </div>
                  <div className={`text-sm font-semibold mt-0.5 ${scheduleType === opt.type ? 'text-blue-300' : 'text-slate-400'}`}>
                    buổi/tuần
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {opt.label} · {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Note về tạ */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-slate-400 leading-relaxed">
            💡 <strong className="text-slate-300">Về mức tạ:</strong> Bạn sẽ nhập trực tiếp khi tập từng bài. 
            Nếu không chắc → thử nhẹ trước (RIR 4-5), sau vài buổi tự biết mức phù hợp.
          </div>

          {/* CTA */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
          >
            {saving ? (
              <span className="animate-pulse">Đang lưu...</span>
            ) : (
              <>Bắt đầu ngay <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
