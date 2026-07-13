'use client';

import { useState } from 'react';
import { saveSettings } from '@/lib/firestore';
import { AppSettings } from '@/lib/types';
import { Dumbbell, Calendar, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const DEFAULT_WEIGHTS = {
  benchPress: 60, ohp: 40, barbellRow: 60,
  pullup: 0, backSquat: 80, rdl: 70,
};

const TIER1_LABELS: { key: keyof typeof DEFAULT_WEIGHTS; label: string; note: string }[] = [
  { key: 'benchPress', label: 'Bench Press', note: 'kg' },
  { key: 'ohp', label: 'Seated DB Shoulder Press (OHP)', note: 'kg mỗi tay' },
  { key: 'barbellRow', label: 'Barbell Row', note: 'kg' },
  { key: 'pullup', label: 'Pull-up / Lat Pulldown', note: 'kg (0 = chỉ tự trọng)' },
  { key: 'backSquat', label: 'Back Squat', note: 'kg' },
  { key: 'rdl', label: 'Romanian Deadlift (RDL)', note: 'kg' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleType, setScheduleType] = useState<'3day' | '6day'>('6day');
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const settings: AppSettings = {
      id: 'main',
      scheduleType,
      startDate,
      currentWeek: 1,
      currentMonth: 1,
      tier1Weights: weights,
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
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Dumbbell size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Chào mừng!</h1>
          <p className="text-slate-400 text-sm">Cài đặt giáo án PPL 2.0 của bạn</p>
        </div>

        {/* Steps */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                <Calendar size={16} className="inline mr-2" />
                Ngày bắt đầu chương trình
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Tần suất tập</label>
              <div className="grid grid-cols-2 gap-3">
                {(['3day', '6day'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setScheduleType(type)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      scheduleType === type
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    <div className="font-bold text-lg">{type === '3day' ? '3' : '6'}</div>
                    <div className="text-xs mt-0.5">buổi/tuần</div>
                    <div className="text-[10px] mt-1 opacity-70">
                      {type === '3day' ? 'Chỉ Buổi A' : 'Cả A & B'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              Tiếp theo <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-1">Mức tạ khởi điểm — Tier 1</h3>
              <p className="text-xs text-slate-500 mb-4">Nhập mức tạ bạn sẽ dùng Tuần 1 (tạ dễ làm quen, RIR 2-3)</p>
              <div className="space-y-3">
                {TIER1_LABELS.map(({ key, label, note }) => (
                  <div key={key} className="bg-slate-900 rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-200">{label}</div>
                      <div className="text-xs text-slate-500">{note}</div>
                    </div>
                    <input
                      type="number"
                      value={weights[key] || ''}
                      onChange={e => setWeights(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-center font-mono font-bold text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
                      inputMode="decimal"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl font-semibold text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {saving ? 'Đang lưu...' : '🚀 Bắt đầu chương trình!'}
            </button>
          </div>
        )}

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 1].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${
              step === i ? 'w-6 bg-blue-500' : 'w-1.5 bg-slate-700'
            }`} />
          ))}
        </div>
      </div>
    </div>
  );
}
