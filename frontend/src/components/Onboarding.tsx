'use client';

import { useState } from 'react';
import { saveSettings } from '@/lib/firestore';
import { AppSettings } from '@/lib/types';
import { Dumbbell, Calendar, ChevronRight, ChevronLeft, Weight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const TIER1_FIELDS = [
  { key: 'benchPress', label: 'Bench Press', hint: 'Đẩy ngực tạ đòn', placeholder: 'vd: 40' },
  { key: 'ohp', label: 'OHP', hint: 'Đẩy vai tạ đơn ngồi', placeholder: 'vd: 25' },
  { key: 'barbellRow', label: 'Barbell Row', hint: 'Kéo tạ đòn cúi người', placeholder: 'vd: 40' },
  { key: 'pullup', label: 'Pull-up / Lat Pulldown', hint: 'Kéo xà hoặc cáp', placeholder: 'vd: 30' },
  { key: 'backSquat', label: 'Back Squat', hint: 'Squat tạ đòn', placeholder: 'vd: 50' },
  { key: 'rdl', label: 'RDL', hint: 'Romanian Deadlift', placeholder: 'vd: 50' },
] as const;

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleType, setScheduleType] = useState<'3day' | '6day'>('6day');
  const [tier1Weights, setTier1Weights] = useState<Record<string, number>>({
    benchPress: 0, ohp: 0, barbellRow: 0, pullup: 0, backSquat: 0, rdl: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const settings: AppSettings = {
      id: 'main',
      scheduleType,
      startDate,
      currentWeek: 1,
      currentMonth: 1,
      tier1Weights: {
        benchPress: tier1Weights.benchPress || 0,
        ohp: tier1Weights.ohp || 0,
        barbellRow: tier1Weights.barbellRow || 0,
        pullup: tier1Weights.pullup || 0,
        backSquat: tier1Weights.backSquat || 0,
        rdl: tier1Weights.rdl || 0,
      },
      accessoryWeights: {},
      alternatives: {},
      isOnboarded: true,
    };
    await saveSettings(settings);
    setSaving(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center p-6">
      <div className="max-w-sm mx-auto w-full space-y-8">

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {[1, 2].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-all ${step >= s ? 'bg-blue-500' : 'bg-slate-800'}`} />
          ))}
        </div>

        {/* Step 1: Basic setup */}
        {step === 1 && (
          <>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto">
                <Dumbbell size={32} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">PPL Tracker</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                Thiết lập nhanh để bắt đầu giáo án PPL 2.0
              </p>
            </div>

            <div className="space-y-5">
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

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">Tần suất tập mỗi tuần</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { type: '6day' as const, sessions: '6', label: 'Cả A & B', sub: 'T2–T7', recommended: true },
                    { type: '3day' as const, sessions: '3', label: 'Chỉ Buổi A', sub: 'T2, T4, T6', recommended: false },
                  ]).map(opt => (
                    <button
                      key={opt.type}
                      onClick={() => setScheduleType(opt.type)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${scheduleType === opt.type ? 'border-blue-500 bg-blue-500/10' : 'border-slate-700 hover:border-slate-600'}`}
                    >
                      {opt.recommended && (
                        <span className="absolute top-2 right-2 text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full border border-blue-500/30">Giáo án</span>
                      )}
                      <div className={`text-2xl font-extrabold ${scheduleType === opt.type ? 'text-blue-300' : 'text-slate-400'}`}>{opt.sessions}</div>
                      <div className={`text-sm font-semibold mt-0.5 ${scheduleType === opt.type ? 'text-blue-300' : 'text-slate-400'}`}>buổi/tuần</div>
                      <div className="text-xs text-slate-500 mt-1">{opt.label} · {opt.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
              >
                Tiếp theo <ChevronRight size={18} />
              </button>
            </div>
          </>
        )}

        {/* Step 2: Tier 1 weights */}
        {step === 2 && (
          <>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto">
                <Weight size={32} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Mức tạ khởi điểm</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Nhập mức tạ bạn đang dùng. Nếu chưa biết → để 0, app sẽ gợi ý khi tập.
              </p>
            </div>

            <div className="space-y-3">
              {TIER1_FIELDS.map(field => (
                <div key={field.key} className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{field.label}</div>
                    <div className="text-xs text-slate-500">{field.hint}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number"
                      min="0"
                      step="2.5"
                      value={tier1Weights[field.key] || ''}
                      placeholder={field.placeholder}
                      onChange={e => setTier1Weights(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) || 0 }))}
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono font-bold text-white text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-slate-500">kg</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white flex items-center gap-2 active:scale-95 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl font-bold text-white text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
              >
                {saving ? <span className="animate-pulse">Đang lưu...</span> : <>Bắt đầu ngay <ChevronRight size={18} /></>}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
