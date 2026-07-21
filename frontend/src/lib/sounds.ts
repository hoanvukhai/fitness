// Âm thanh tập luyện — dùng Web Audio API, không cần file external
// Hoạt động trên mọi trình duyệt hiện đại

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(frequency: number, duration: number, volume = 0.3, type: OscillatorType = 'sine') {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore audio errors silently
  }
}

export const sounds = {
  // Âm thanh bắt đầu bài / chuyển sang bài tiếp theo
  // 2 note nhẹ đi lên: E5 → A5
  start: () => {
    playTone(660, 0.12, 0.25);
    setTimeout(() => playTone(880, 0.18, 0.25), 130);
  },

  // Âm thanh hoàn thành 1 set
  // 1 note ngắn xác nhận
  complete: () => {
    playTone(880, 0.2, 0.3, 'sine');
  },

  // Âm thanh hết giờ nghỉ / bắt đầu lại
  // 3 note đi lên báo hiệu
  restEnd: () => {
    playTone(660, 0.1, 0.25);
    setTimeout(() => playTone(770, 0.1, 0.25), 120);
    setTimeout(() => playTone(880, 0.25, 0.3), 240);
  },

  // Âm thanh kết thúc toàn bộ bài tập
  finish: () => {
    playTone(523, 0.15, 0.3); // C5
    setTimeout(() => playTone(659, 0.15, 0.3), 180); // E5
    setTimeout(() => playTone(784, 0.3, 0.35), 360); // G5
  },
};
