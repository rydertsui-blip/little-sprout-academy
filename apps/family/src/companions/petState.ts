export const PET_STATES = [
  "idle",
  "greet",
  "listen",
  "think",
  "celebrate",
  "comfort",
  "tap-react",
  "rest"
] as const;

export type CompanionPetState = (typeof PET_STATES)[number];

export interface PetState {
  visual: CompanionPetState;
  allowAudio: boolean;
  enteredAt: number;
  endsAt: number | null;
}

export type PetEvent =
  | { type: "TAP" }
  | { type: "LESSON_AUDIO_START" }
  | { type: "LESSON_AUDIO_END" }
  | { type: "ANSWER_WRONG" }
  | { type: "SESSION_COMPLETE" }
  | { type: "COMPANION_REDEEMED" }
  | { type: "IDLE_TIMEOUT" }
  | { type: "TICK" }
  | { type: "SET_STATE"; visual: CompanionPetState };

const SHORT_STATE_DURATION_MS: Partial<Record<CompanionPetState, number>> = {
  greet: 1_200,
  celebrate: 1_800,
  comfort: 1_600,
  "tap-react": 1_200
};

function state(visual: CompanionPetState, now: number, allowAudio = false): PetState {
  const duration = SHORT_STATE_DURATION_MS[visual];
  return {
    visual,
    allowAudio,
    enteredAt: now,
    endsAt: duration ? now + duration : null
  };
}

export function createPetState(now = 0): PetState {
  return state("idle", now);
}

export function transitionPetState(current: PetState, event: PetEvent, now: number): PetState {
  if (event.type === "TICK") {
    return current.endsAt !== null && now >= current.endsAt ? state("idle", now) : current;
  }
  if (event.type === "SET_STATE") return state(event.visual, now, false);
  if (event.type === "LESSON_AUDIO_START") return state("listen", now, false);
  if (event.type === "LESSON_AUDIO_END") return state("idle", now);
  if (event.type === "TAP") {
    if (current.visual === "listen") return current;
    return state("tap-react", now, true);
  }
  if (event.type === "ANSWER_WRONG") return state("comfort", now, true);
  if (event.type === "SESSION_COMPLETE" || event.type === "COMPANION_REDEEMED") return state("celebrate", now, true);
  if (event.type === "IDLE_TIMEOUT") return state("rest", now);
  return current;
}
