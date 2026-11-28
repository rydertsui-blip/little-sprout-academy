// Pure Web Audio API sound effects synthesizer for Little Sprout Island
// Zero external audio asset footprint, safe fallback in jsdom / headless environments

export type SfxKind =
  | "pop"
  | "blend-step"
  | "correct"
  | "combo"
  | "gentle-retry"
  | "chest-open"
  | "pet-happy"
  | "page-turn";

let audioCtx: AudioContext | null = null;
let sfxMuted = false;

export function setSfxMuted(muted: boolean): void {
  sfxMuted = muted;
}

export function isSfxMuted(): boolean {
  return sfxMuted;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  try {
    audioCtx ??= new Ctx();
    if (audioCtx.state === "suspended" && typeof audioCtx.resume === "function") {
      void audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = "sine",
  gainPeak = 0.14,
  endFreq?: number
): void {
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0 = ctx.currentTime + startOffset;
    const t1 = t0 + duration;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t1);
    }

    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.linearRampToValueAtTime(gainPeak, t0 + Math.min(0.02, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0008, t1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t1 + 0.01);
  } catch {
    // Ignore audio context scheduling errors in restricted environments
  }
}

export function playSfx(kind: SfxKind, stepIndex = 0): void {
  if (sfxMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  switch (kind) {
    case "pop": {
      // Crisp bubble pop
      playTone(ctx, 420, 0, 0.075, "sine", 0.12, 740);
      break;
    }
    case "blend-step": {
      // Marimba-style rising step for Pinyin 3-step blend
      const scale = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const freq = scale[Math.min(stepIndex, scale.length - 1)] ?? 523.25;
      playTone(ctx, freq, 0, 0.16, "triangle", 0.14, freq * 1.03);
      break;
    }
    case "correct": {
      // Warm major triad chime (C5 -> E5 -> G5 -> C6)
      playTone(ctx, 523.25, 0, 0.14, "triangle", 0.13);
      playTone(ctx, 659.25, 0.07, 0.15, "triangle", 0.14);
      playTone(ctx, 783.99, 0.14, 0.24, "sine", 0.15);
      break;
    }
    case "combo": {
      // Sparkling harp glissando for 3+ combo streak
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
      notes.forEach((n, idx) => {
        playTone(ctx, n, idx * 0.048, 0.22, "sine", 0.12);
      });
      break;
    }
    case "gentle-retry": {
      // Soft wooden double-tap encouragement
      playTone(ctx, 330, 0, 0.12, "sine", 0.09, 293.66);
      playTone(ctx, 293.66, 0.12, 0.16, "sine", 0.08, 261.63);
      break;
    }
    case "chest-open": {
      // Treasure chest unlock fanfare
      const fanfare = [392.0, 523.25, 659.25, 783.99, 1046.5];
      fanfare.forEach((n, idx) => {
        playTone(ctx, n, idx * 0.065, 0.28, "triangle", 0.15);
      });
      break;
    }
    case "pet-happy": {
      // Happy puppy chirp-boing
      playTone(ctx, 480, 0, 0.09, "sine", 0.12, 680);
      playTone(ctx, 620, 0.1, 0.12, "sine", 0.13, 880);
      break;
    }
    case "page-turn": {
      // Soft airy chime for storybook page turn
      playTone(ctx, 587.33, 0, 0.09, "sine", 0.08, 659.25);
      break;
    }
  }
}
