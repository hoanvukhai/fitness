'use client';

import { useRestTimer } from '@/hooks/useRestTimer';
import { X, Plus, Minus, SkipForward } from 'lucide-react';

// Quotes ngẫu nhiên khi nghỉ
const REST_QUOTES = [
  "Đau cơ hôm nay, mạnh hơn ngày mai.",
  "Không ai tiếc nuối vì đã tập xong buổi.",
  "Progressive overload là chìa khoá duy nhất.",
  "Consistency > Intensity.",
  "Tier 1 không thay đổi. Kỹ thuật không thỏa hiệp.",
  "RIR 1 hôm nay, RIR 0 tuần sau.",
  "Buổi tập tệ vẫn tốt hơn không tập.",
  "Giãn cơ là đầu tư cho buổi tập sau.",
];

interface RestTimerProps {
  duration: number;
  nextExercise?: string;
  onDone: () => void;
}

export default function RestTimer({ duration, nextExercise, onDone }: RestTimerProps) {
  const { seconds, isRunning, progress, formattedTime, start, skip, adjust } = useRestTimer(onDone);
  const quote = REST_QUOTES[Math.floor(Math.random() * REST_QUOTES.length)];

  // Auto-start on mount
  if (!isRunning && seconds === 0 && progress === 0) {
    start(duration);
  }

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-xl flex flex-col items-center justify-between py-16 px-6">
      {/* Quote */}
      <div className="text-center">
        <p className="text-slate-400 text-sm uppercase tracking-widest mb-2 font-medium">Đang nghỉ</p>
        <p className="text-slate-200 text-lg font-medium italic max-w-xs text-center leading-relaxed">
          "{quote}"
        </p>
      </div>

      {/* Timer Circle */}
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <svg width="144" height="144" className="-rotate-90">
            <circle
              cx="72" cy="72" r="54"
              stroke="#1e293b"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="72" cy="72" r="54"
              stroke="#3b82f6"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold font-mono text-white tabular-nums">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* Adjust buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => adjust(-10)}
            className="flex items-center gap-1 px-4 py-2 bg-slate-800 rounded-xl text-slate-300 text-sm font-medium active:bg-slate-700 transition-colors"
          >
            <Minus size={14} /> 10s
          </button>
          <button
            onClick={() => adjust(10)}
            className="flex items-center gap-1 px-4 py-2 bg-slate-800 rounded-xl text-slate-300 text-sm font-medium active:bg-slate-700 transition-colors"
          >
            <Plus size={14} /> 10s
          </button>
        </div>
      </div>

      {/* Next exercise hint + Skip */}
      <div className="flex flex-col items-center gap-4 w-full">
        {nextExercise && (
          <div className="bg-slate-900 rounded-2xl px-5 py-3 w-full max-w-xs text-center">
            <p className="text-xs text-slate-500 mb-1">Bài tiếp theo</p>
            <p className="text-slate-200 font-medium">{nextExercise}</p>
          </div>
        )}
        <button
          onClick={skip}
          className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-2xl text-white font-semibold text-base active:scale-95 transition-all"
        >
          <SkipForward size={18} />
          Bỏ qua
        </button>
      </div>
    </div>
  );
}
