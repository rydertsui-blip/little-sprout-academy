import { describe, expect, it } from "vitest";
import { buildSubjectProgressView } from "./progressView";
import { createChildProfile } from "../lib/profile";
import type { DailyPlan, SessionRecord } from "../lib/types";

function plan(dateKey: string, subject: "math" | "mandarin" | "english"): DailyPlan {
  return {
    dateKey,
    timezone: "Asia/Singapore",
    subject,
    questionCount: 8,
    estimatedMinutes: 10,
    items: []
  };
}

describe("subject progress view", () => {
  it("uses stations and weekly evidence rather than a combined percentage", () => {
    const child = createChildProfile("小星", "star", new Date("2026-10-01T00:00:00.000Z"));
    child.diagnostics.math = { completedAt: "2026-11-20T00:00:00.000Z", sessionId: "diagnostic" };
    child.evidence["math-count-100"] = {
      ...child.evidence["math-count-100"],
      pKnown: 0.95,
      nEff: 6,
      independentCorrect: 6,
      questionIds: ["q1", "q2", "q3", "q4", "q5", "q6"],
      templates: ["number-sequence", "compare-order", "place-value-tens-ones"],
      firstEvidenceAt: "2026-11-19T00:00:00.000Z",
      lastAttemptAt: "2026-11-21T00:00:00.000Z",
      delayedEvidence: true,
      dueAt: "2026-11-20T00:00:00.000Z",
      diversity: {
        templateFamilies: { "number-sequence": 2, "compare-order": 2, "place-value-tens-ones": 2 },
        responseModes: { "tap-choice": 4, "tap-match": 2, "tap-order": 0, "voice-practice": 0 },
        transferCorrect: 1,
        farTransferCorrect: 0,
        delayedIndependentCorrect: 1,
        contextKeys: ["number-sequence", "compare-order", "place-value-tens-ones"],
        lastIndependentWrongAt: null
      }
    };
    const now = new Date("2026-11-21T02:00:00.000Z");
    child.sessions.push(
      {
        id: "math-today", childId: child.id, subject: "math", kind: "practice", length: 8,
        startedAt: "2026-11-21T00:00:00.000Z", completedAt: "2026-11-21T00:10:00.000Z", plannedQuestionIds: [],
        dailyPlan: plan("2026-11-21", "math"), summary: [],
        attempts: [
          { id: "a1", childId: child.id, questionId: "q1", skillId: "math-count-100", subject: "math", correct: true, hintUsed: false, createdAt: "2026-11-21T00:05:00.000Z", sessionId: "math-today" },
          { id: "a2", childId: child.id, questionId: "q2", skillId: "math-count-100", subject: "math", correct: false, hintUsed: true, createdAt: "2026-11-21T00:06:00.000Z", sessionId: "math-today" }
        ]
      } satisfies SessionRecord,
      {
        id: "english-today", childId: child.id, subject: "english", kind: "practice", length: 8,
        startedAt: "2026-11-21T00:00:00.000Z", completedAt: "2026-11-21T00:10:00.000Z", plannedQuestionIds: [],
        dailyPlan: plan("2026-11-21", "english"), summary: [], attempts: []
      } satisfies SessionRecord
    );

    const progress = buildSubjectProgressView(child, "math", now);
    expect(progress.currentSkillTitle.length).toBeGreaterThan(0);
    expect(progress.stableCount).toBeGreaterThanOrEqual(1);
    expect(progress.retainedCount).toBe(1);
    expect(progress.dueReviewCount).toBe(1);
    expect(progress.todayCompleted).toBe(true);
    expect(progress.todaySessions).toBe(1);
    expect(progress.weeklySessions).toBe(1);
    expect(progress.weeklyIndependentCorrect).toBe(1);
    expect(progress).not.toHaveProperty("percent");
  });

  it("ignores sessions outside the seven-day window and does not reset missing days", () => {
    const child = createChildProfile("小树", "star", new Date("2026-10-01T00:00:00.000Z"));
    child.rewards.lifetimeStars = 6;
    child.sessions.push({
      id: "old-math", childId: child.id, subject: "math", kind: "practice", length: 8,
      startedAt: "2026-11-01T00:00:00.000Z", completedAt: "2026-11-01T00:10:00.000Z", plannedQuestionIds: [],
      dailyPlan: plan("2026-11-01", "math"), summary: [], attempts: []
    } satisfies SessionRecord);
    const progress = buildSubjectProgressView(child, "math", new Date("2026-11-21T02:00:00.000Z"));
    expect(progress.weeklySessions).toBe(0);
    expect(progress.todayCompleted).toBe(false);
    expect(child.rewards.lifetimeStars).toBe(6);
    expect(child.evidence["math-count-100"].nEff).toBe(0);
  });
});
