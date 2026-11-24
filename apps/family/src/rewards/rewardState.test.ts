import { describe, expect, it } from "vitest";
import {
  applyRewardEvent,
  createRewardState,
  getRedeemableCompanionIds,
  redeemCompanion,
  setActiveCompanion,
  singaporeDateKey
} from "./rewardState";

describe("growth star rewards", () => {
  it("uses the Singapore date across UTC boundaries", () => {
    expect(singaporeDateKey(new Date("2026-11-20T15:59:00.000Z"))).toBe("2026-11-20");
    expect(singaporeDateKey(new Date("2026-11-20T16:00:00.000Z"))).toBe("2026-11-21");
  });

  it("awards a session complete event only once", () => {
    const at = new Date("2026-11-21T01:00:00.000Z");
    const first = applyRewardEvent(createRewardState(), { kind: "session-complete", eventKey: "session:s1", amount: 2, at });
    const second = applyRewardEvent(first, { kind: "session-complete", eventKey: "session:s1", amount: 2, at });
    expect(first.lifetimeStars).toBe(2);
    expect(first.dailyStars).toBe(2);
    expect(second.lifetimeStars).toBe(2);
    expect(second.awardedEventKeys).toEqual(["session:s1"]);
  });

  it("caps daily awards without subtracting lifetime stars", () => {
    let state = createRewardState();
    for (const [index, eventKey] of ["s1", "s2", "s3", "s4"].entries()) {
      state = applyRewardEvent(state, {
        kind: "session-complete",
        eventKey: `session:${eventKey}`,
        amount: 2,
        at: new Date(`2026-11-21T0${index}:00:00.000Z`)
      });
    }
    expect(state.lifetimeStars).toBe(6);
    expect(state.dailyStars).toBe(6);
    const nextDay = applyRewardEvent(state, {
      kind: "session-complete",
      eventKey: "session:s5",
      amount: 2,
      at: new Date("2026-11-22T01:00:00.000Z")
    });
    expect(nextDay.lifetimeStars).toBe(8);
    expect(nextDay.dailyStars).toBe(2);
  });

  it("never awards a wrong answer or invalid amount", () => {
    expect(applyRewardEvent(createRewardState(), {
      kind: "wrong-answer",
      eventKey: "wrong:q1",
      amount: 2
    }).lifetimeStars).toBe(0);
    expect(() => applyRewardEvent(createRewardState(), {
      kind: "retry-effort",
      eventKey: "retry:q1",
      amount: 3
    })).toThrow("amount");
  });
  it("requires the star threshold before a companion is redeemable", () => {
    expect(getRedeemableCompanionIds({ ...createRewardState(), lifetimeStars: 9 })).toEqual([]);
    expect(getRedeemableCompanionIds({ ...createRewardState(), lifetimeStars: 10 })).toEqual(["gemini-doudou"]);
  });

  it("redeems without spending stars and is idempotent", () => {
    const before = { ...createRewardState(), lifetimeStars: 10 };
    const once = redeemCompanion(before, "gemini-doudou", new Date("2026-11-21T02:00:00.000Z"));
    const twice = redeemCompanion(once, "gemini-doudou", new Date("2026-11-21T02:01:00.000Z"));
    expect(once.lifetimeStars).toBe(10);
    expect(once.redeemedCompanionIds).toEqual(["gemini-doudou"]);
    expect(once.redeemedAtByCompanionId["gemini-doudou"]).toBe("2026-11-21T02:00:00.000Z");
    expect(twice).toEqual(once);
  });

  it("only activates a redeemed companion", () => {
    expect(() => setActiveCompanion(createRewardState(), "gemini-doudou")).toThrow("not redeemed");
    const redeemed = redeemCompanion({ ...createRewardState(), lifetimeStars: 10 }, "gemini-doudou");
    expect(setActiveCompanion(redeemed, "gemini-doudou").activeCompanionId).toBe("gemini-doudou");
  });
});
