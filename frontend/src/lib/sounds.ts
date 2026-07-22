// Web Audio Synth Engine (Kiến trúc Master Bus 10/10)
// Không dùng file external, âm thanh to rõ, mượt mà, chuẩn UX thể thao

export const NOTES = {
  C4: 261.63,
  E4: 329.63,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.00,
  B5: 987.77,
  C6: 1046.50,
  E6: 1318.51,
} as const;

export type NoteName = keyof typeof NOTES;

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudioChain() {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx = new AudioCtxClass();
      
      // Master Chain: Master Gain -> Compressor -> LowPass Filter -> Destination
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.9;

      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -12;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 3500;

      masterGain.connect(compressor);
      compressor.connect(filter);
      filter.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return { ctx: audioCtx, output: masterGain! };
  } catch {
    return null;
  }
}

// Hàm phát 1 nốt đơn với Envelope động (Dynamic Attack/Release)
function playTone(
  freq: number,
  duration: number,
  volume = 0.4,
  type: OscillatorType = 'sine',
  delay = 0
) {
  const chain = getAudioChain();
  if (!chain) return;
  const { ctx, output } = chain;

  try {
    const osc = ctx.createOscillator();
    const voiceGain = ctx.createGain();

    osc.type = type;
    const startTime = ctx.currentTime + delay;
    osc.frequency.setValueAtTime(freq, startTime);

    // Dynamic ADSR Envelope: nốt ngắn attack sắc, nốt dài attack mượt
    const attack = Math.min(0.02, duration * 0.2);
    voiceGain.gain.setValueAtTime(0.0001, startTime);
    voiceGain.gain.linearRampToValueAtTime(volume, startTime + attack);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(voiceGain);
    voiceGain.connect(output);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch {
    // Silent fail
  }
}

// Multi-layer Synthesis: Kết hợp Triangle (thân âm) + Sine (độ tròn) + Octave (độ sáng)
function playRichTone(freq: number, duration: number, volume = 0.4, delay = 0) {
  playTone(freq, duration, volume * 0.5, 'triangle', delay);
  playTone(freq, duration, volume * 0.35, 'sine', delay);
  playTone(freq * 2, duration * 0.75, volume * 0.15, 'sine', delay);
}

export const sounds = {
  // 1. Bắt đầu bài tập / Chuyển bài (C5 -> E5 -> G5)
  start: () => {
    playRichTone(NOTES.C5, 0.25, 0.4, 0);
    playRichTone(NOTES.E5, 0.25, 0.4, 0.1);
    playRichTone(NOTES.G5, 0.4, 0.45, 0.2);
  },

  // 2. Hoàn thành 1 hiệp tập (G5 -> C6)
  complete: () => {
    playRichTone(NOTES.G5, 0.15, 0.4, 0);
    playRichTone(NOTES.C6, 0.3, 0.45, 0.1);
  },

  // 3. Hết giờ nghỉ - Còi đếm ngược thể thao chuẩn (3.. 2.. 1.. GO!)
  // Nhịp dồn dập 0.25s: 3 nốt ngắn 600Hz + 1 nốt dài 950Hz vút cao
  restEnd: () => {
    const bVol = 0.35;
    const bFreq = 600;
    const goFreq = 950;

    playRichTone(bFreq, 0.12, bVol, 0);
    playRichTone(bFreq, 0.12, bVol, 0.25);
    playRichTone(bFreq, 0.12, bVol, 0.5);
    playRichTone(goFreq, 0.45, bVol * 1.3, 0.75);
  },

  // 4. Hoàn thành toàn bộ buổi tập - Victory Fanfare (Block Chord C Major + C6 ngân dài)
  finish: () => {
    const chordVol = 0.2;
    playTone(NOTES.C5, 0.4, chordVol, 'triangle', 0);
    playTone(NOTES.E5, 0.4, chordVol, 'triangle', 0);
    playTone(NOTES.G5, 0.4, chordVol, 'triangle', 0);

    playTone(NOTES.C6, 1.2, 0.3, 'triangle', 0.25);
    playTone(NOTES.C6, 1.2, 0.35, 'sine', 0.25);
    playTone(NOTES.E6, 1.0, 0.12, 'sine', 0.25);
  },
};


