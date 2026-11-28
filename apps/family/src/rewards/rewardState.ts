import { COMPANIONS, getCompanionById } from "../companions/companions";
import type { GrowthRewardState } from "../lib/types";

export type RewardEventKind =
  | "session-complete"
  | "delayed-review"
  | "independent-transfer"
  | "retry-effort"
  | "wrong-answer";

export interface RewardEventInput {
  kind: RewardEventKind;
  eventKey: string;
  amount: number;
  at?: Date;
}

const DAILY_STAR_CAP = 6;

export function createRewardState(): GrowthRewardState {
  return {
    lifetimeStars: 0,
    awardedEventKeys: [],
    redeemedCompanionIds: [],
    redeemedAtByCompanionId: {},
    activeCompanionId: null,
    dailyAwardKey: null,
    dailyStars: 0
  };
}

export function singaporeDateKey(at: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(at);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function applyRewardEvent(state: GrowthRewardState, event: RewardEventInput): GrowthRewardState {
  if (!Number.isInteger(event.amount) || event.amount < 0 || event.amount > 2) throw new Error("Reward amount must be 0, 1 or 2");
  const effectiveAmount = event.kind === "wrong-answer" ? 0 : event.amount;
  if (effectiveAmount === 0 || state.awardedEventKeys.includes(event.eventKey)) return state;
  const dateKey = singaporeDateKey(event.at ?? new Date());
  const dailyStars = state.dailyAwardKey === dateKey ? state.dailyStars : 0;
  const available = Math.max(0, DAILY_STAR_CAP - dailyStars);
  const awarded = Math.min(effectiveAmount, available);
  if (awarded === 0) return { ...state, dailyAwardKey: dateKey, dailyStars };
  return {
    ...state,
    lifetimeStars: state.lifetimeStars + awarded,
    awardedEventKeys: [...state.awardedEventKeys, event.eventKey],
    dailyAwardKey: dateKey,
    dailyStars: dailyStars + awarded
  };
}

export function getRedeemableCompanionIds(state: GrowthRewardState): string[] {
  return COMPANIONS
    .filter((companion) => state.lifetimeStars >= companion.unlockAtStars && !state.redeemedCompanionIds.includes(companion.id))
    .sort((a, b) => a.unlockAtStars - b.unlockAtStars || a.id.localeCompare(b.id))
    .map((companion) => companion.id);
}

export function redeemCompanion(state: GrowthRewardState, companionId: string, at = new Date()): GrowthRewardState {
  if (state.redeemedCompanionIds.includes(companionId)) return state;
  const companion = getCompanionById(companionId);
  if (!companion) throw new Error(`Unknown companion: ${companionId}`);
  if (state.lifetimeStars < companion.unlockAtStars) throw new Error("Companion threshold not reached");
  return {
    ...state,
    redeemedCompanionIds: [...state.redeemedCompanionIds, companionId],
    redeemedAtByCompanionId: {
      ...state.redeemedAtByCompanionId,
      [companionId]: at.toISOString()
    }
  };
}

export function setActiveCompanion(state: GrowthRewardState, companionId: string): GrowthRewardState {
  if (!state.redeemedCompanionIds.includes(companionId)) throw new Error("Companion is not redeemed");
  return { ...state, activeCompanionId: companionId };
}

export function toggleEquippedAccessory(state: GrowthRewardState, accessoryId: string, sameSlotIds: string[]): GrowthRewardState {
  const current = state.equippedAccessoryIds ?? [];
  if (current.includes(accessoryId)) {
    return {
      ...state,
      equippedAccessoryIds: current.filter((id) => id !== accessoryId)
    };
  }
  const withoutSameSlot = current.filter((id) => !sameSlotIds.includes(id));
  return {
    ...state,
    equippedAccessoryIds: [...withoutSameSlot, accessoryId]
  };
}
