import { afterEach, describe, expect, it, vi } from "vitest";
import { playOrSpeak, stopAudio } from "./audio";

class FakeAudio {
  static instances: FakeAudio[] = [];
  src = "";
  onplay: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  load = vi.fn();
  pause = vi.fn();

  constructor() {
    FakeAudio.instances.push(this);
  }
}

vi.stubGlobal("Audio", FakeAudio);

describe("audio playback status", () => {
  afterEach(() => {
    stopAudio();
  });

  it("reports playing immediately and ended when the audio finishes", () => {
    const states: string[] = [];
    playOrSpeak("apple", "en-US", (status) => states.push(status));
    const audio = FakeAudio.instances[0];

    expect(audio.src).toContain("en-apple.m4a");
    expect(audio.load).toHaveBeenCalled();
    expect(audio.play).toHaveBeenCalled();
    expect(states).toEqual(["playing"]);

    audio.onended?.();
    expect(states).toEqual(["playing", "ended"]);
  });

  it("reports an error when an audio asset cannot start and speech is unavailable", async () => {
    const audio = FakeAudio.instances.at(-1)!;
    audio.play.mockRejectedValueOnce(new Error("audio blocked"));
    const states: string[] = [];
    playOrSpeak("apple", "en-US", (status) => states.push(status));

    expect(states).toEqual(["playing"]);
    await Promise.resolve();
    expect(states).toContain("error");
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
