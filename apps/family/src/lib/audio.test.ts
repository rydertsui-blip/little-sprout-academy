import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeAudio {
  static instances: FakeAudio[] = [];
  src = "";
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  static rejectPlayback = false;
  play = vi.fn(() => (FakeAudio.rejectPlayback ? Promise.reject(new Error("audio blocked")) : Promise.resolve()));
  load = vi.fn();
  pause = vi.fn();

  constructor() {
    FakeAudio.instances.push(this);
  }
}

vi.stubGlobal("Audio", FakeAudio);

const speechSpy = vi.fn();
vi.stubGlobal("speechSynthesis", { speak: speechSpy, cancel: vi.fn(), getVoices: () => [] });

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

type AudioModule = typeof import("./audio");
let audioModule: AudioModule;

describe("neural-only audio playback", () => {
  beforeEach(async () => {
    FakeAudio.instances.length = 0;
    FakeAudio.rejectPlayback = false;
    speechSpy.mockClear();
    vi.resetModules();
    audioModule = await import("./audio");
  });

  afterEach(() => {
    audioModule?.stopAudio();
  });

  const playOrSpeak = (...args: Parameters<AudioModule["playOrSpeak"]>) => audioModule.playOrSpeak(...args);

  it("plays the pre-synthesised neural clip and reports ended", () => {
    const states: string[] = [];
    playOrSpeak("apple", "en-US", (status) => states.push(status));
    const audio = FakeAudio.instances[0];

    expect(audio.src).toContain("en-apple.m4a");
    expect(audio.load).toHaveBeenCalled();
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(states).toEqual(["playing"]);

    audio.onended?.();
    expect(states).toEqual(["playing", "ended"]);
  });

  it("retries once from the network before reporting an error", async () => {
    FakeAudio.rejectPlayback = true;
    const states: string[] = [];
    playOrSpeak("apple", "en-US", (status) => states.push(status));
    const audio = FakeAudio.instances.at(-1)!;

    await flush();
    expect(audio.src).toContain("?retry=");
    expect(audio.play).toHaveBeenCalledTimes(2);

    await flush();
    expect(states[states.length - 1]).toBe("error");
    expect(speechSpy).not.toHaveBeenCalled();
  });

  it("reports an error instead of falling back to the system voice when a clip is missing", () => {
    const states: string[] = [];
    playOrSpeak("a phrase that has no neural clip yet", "en-US", (status) => states.push(status));

    expect(states).toEqual(["error"]);
    expect(speechSpy).not.toHaveBeenCalled();
  });

  it("does not report a stale finish after a newer request starts", () => {
    const states: string[] = [];
    playOrSpeak("apple", "en-US", (status) => states.push(status));
    const audio = FakeAudio.instances.at(-1)!;
    const firstEnded = audio.onended;
    playOrSpeak("bear", "en-US", (status) => states.push(status));

    firstEnded?.();
    expect(states).toEqual(["playing", "playing"]);
  });
});
