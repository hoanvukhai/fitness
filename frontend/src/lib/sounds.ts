// Âm thanh tập luyện — dùng Web Audio API Synth (không cần file external)
// Âm thanh to rõ, giai điệu (jingle) tạo cảm giác sảng khoái khi tập

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  frequency: number,
  duration: number,
  volume = 0.45,
  type: OscillatorType = 'sine',
  delay = 0
) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.type = type;
    const startTime = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(frequency, startTime);

    // Fade-in nhanh + Fade-out ngân giúp âm thanh to, tròn và không bị nổ tiếng (pop/click)
    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // Silent fail
  }
}

export const sounds = {
  // 1. Bắt đầu bài tập / Chuyển bài (Kéo dài ~0.5s)
  // Giai điệu 3 nốt vươn lên mượt mà (C5 -> E5 -> G5)
  start: () => {
    playTone(523.25, 0.2, 0.45, 'sine', 0);     // Do 5
    playTone(659.25, 0.2, 0.45, 'sine', 0.12);  // Mi 5
    playTone(783.99, 0.35, 0.5, 'sine', 0.24);  // Sol 5
  },

  // 2. Hoàn thành 1 hiệp tập (Kéo dài ~0.35s)
  // 2 nốt nảy vui tươi xác nhận (G5 -> C6)
  complete: () => {
    playTone(783.99, 0.15, 0.45, 'sine', 0);    // Sol 5
    playTone(1046.5, 0.25, 0.5, 'sine', 0.1);   // Do 6
  },

  // 3. Hết giờ nghỉ / Bắt đầu hiệp mới (Kéo dài ~0.8s)
  // Chuỗi 4 nốt nhịp điệu rộn ràng giục tập (E5 -> G5 -> A5 -> C6)
  restEnd: () => {
    playTone(659.25, 0.15, 0.45, 'sine', 0);    // Mi 5
    playTone(783.99, 0.15, 0.45, 'sine', 0.14); // Sol 5
    playTone(880.00, 0.18, 0.5, 'sine', 0.28);  // La 5
    playTone(1046.5, 0.4, 0.55, 'sine', 0.44);  // Do 6
  },

  // 4. Hoàn thành toàn bộ buổi tập - Victory Fanfare (Kéo dài ~1.4s)
  // Đoạn hợp âm chiến thắng âm vang đầy tự hào
  finish: () => {
    playTone(523.25, 0.2, 0.45, 'sine', 0);     // Do 5
    playTone(659.25, 0.2, 0.45, 'sine', 0.15);  // Mi 5
    playTone(783.99, 0.25, 0.5, 'sine', 0.3);   // Sol 5
    playTone(1046.5, 0.7, 0.6, 'sine', 0.45);   // Do 6 (ngân dài)
    playTone(1318.5, 0.7, 0.4, 'triangle', 0.55); // Mi 6 (hợp âm vang)
  },
};

