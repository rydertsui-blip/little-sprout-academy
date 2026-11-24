import { describe, expect, it } from "vitest";
import { createPetState, transitionPetState } from "./petState";

describe("companion pet state machine", () => {
  it("starts idle and stays quiet", () => {
    const state = createPetState(1_000);
    expect(state.visual).toBe("idle");
    expect(state.allowAudio).toBe(false);
    expect(state.endsAt).toBeNull();
  });

  it("taps into a short reaction and returns to idle", () => {
    let state = transitionPetState(createPetState(1_000), { type: "TAP" }, 1_001);
    expect(state.visual).toBe("tap-react");
    expect(state.endsAt).toBe(2_201);
    state = transitionPetState(state, { type: "TICK" }, 2_200);
    expect(state.visual).toBe("tap-react");
    state = transitionPetState(state, { type: "TICK" }, 2_202);
    expect(state.visual).toBe("idle");
  });

  it("stays silent and listens while lesson audio plays", () => {
    const state = transitionPetState(createPetState(1_000), { type: "LESSON_AUDIO_START" }, 1_001);
    expect(state.visual).toBe("listen");
    expect(state.allowAudio).toBe(false);
    expect(state.endsAt).toBeNull();
  });

  it("does not react with audio while listening", () => {
    const listening = transitionPetState(createPetState(1_000), { type: "LESSON_AUDIO_START" }, 1_001);
    const tapped = transitionPetState(listening, { type: "TAP" }, 1_002);
    expect(tapped.visual).toBe("listen");
    expect(tapped.allowAudio).toBe(false);
  });

  it("shows comfort after a wrong answer without teaching or begging", () => {
    const state = transitionPetState(createPetState(1_000), { type: "ANSWER_WRONG" }, 1_001);
    expect(state.visual).toBe("comfort");
    expect(state.endsAt).toBe(2_601);
    expect(state.allowAudio).toBe(true);
  });

  it("celebrates session completion and redeem once", () => {
    for (const event of ["SESSION_COMPLETE", "COMPANION_REDEEMED"] as const) {
      const state = transitionPetState(createPetState(1_000), { type: event }, 1_001);
      expect(state.visual).toBe("celebrate");
      expect(state.endsAt).toBe(2_801);
    }
  });

  it("rests after a long idle period without locking the app", () => {
    const state = transitionPetState(createPetState(1_000), { type: "IDLE_TIMEOUT" }, 30_000);
    expect(state.visual).toBe("rest");
    expect(state.endsAt).toBeNull();
  });

  it("never exposes punishing or begging states", () => {
    expect(["angry", "sad-punish", "beg"]).not.toContain(transitionPetState(createPetState(0), { type: "ANSWER_WRONG" }, 1).visual);
  });
});
