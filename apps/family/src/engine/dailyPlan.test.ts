import { describe, expect, it } from "vitest";
import { buildDailyPlan, createDailySession, singaporeDateKey } from "./dailyPlan";
import { selectNextQuestion } from "./session";
import { createChildProfile } from "../lib/profile";
import { QUESTIONS } from "../content/catalog";
import type { ChildProfile } from "../lib/types";

function readyChild(subject: "math" | "mandarin" | "english" = "math"): ChildProfile {
  const child = createChildProfile("小星", "star", new Date("2026-11-20T00:00:00.000Z"));
  child.diagnostics[subject] = { completedAt: "2026-11-20T00:00:00.000Z", sessionId: "diagnostic" };
  return child;
}

describe("daily plan", () => {
  it("uses the Singapore date instead of the device timezone", () => {
    expect(singaporeDateKey(new Date("2026-11-20T15:59:00.000Z"))).toBe("2026-11-20");
    expect(singaporeDateKey(new Date("2026-11-20T16:00:00.000Z"))).toBe("2026-11-21");
  });

  for (const questionCount of [6, 8, 10] as const) {
    it(`builds exactly ${questionCount} unique questions with the planned mix`, () => {
      const result = buildDailyPlan({
        child: readyChild(),
        subject: "math",
        dateKey: "2026-11-21",
        questionCount,
        now: new Date("2026-11-21T01:00:00.000Z")
      });
      expect(result.status).toBe("ready");
      if (result.status !== "ready") return;
      expect(result.plan.items).toHaveLength(questionCount);
      expect(new Set(result.plan.items.map((item) => item.questionId)).size).toBe(questionCount);
      const counts = { review: 0, current: 0, transfer: 0 };
      result.plan.items.forEach((item) => { counts[item.kind] += 1; });
      expect(counts).toEqual(questionCount === 6 ? { review: 1, current: 3, transfer: 2 } : questionCount === 8 ? { review: 2, current: 4, transfer: 2 } : { review: 2, current: 5, transfer: 3 });
      expect(result.plan.questionCount).toBe(questionCount);
      expect(result.plan.dateKey).toBe("2026-11-21");
      expect(result.plan.timezone).toBe("Asia/Singapore");
    });
  }

  it("creates a resumable daily session with a fixed question order", () => {
    const child = readyChild();
    const planResult = buildDailyPlan({
      child,
      subject: "math",
      dateKey: "2026-11-21",
      questionCount: 8,
      now: new Date("2026-11-21T01:00:00.000Z")
    });
    expect(planResult.status).toBe("ready");
    if (planResult.status !== "ready") return;
    const session = createDailySession(child, "math", planResult.plan, new Date("2026-11-21T01:05:00.000Z"));
    expect(session.kind).toBe("practice");
    expect(session.dailyPlan).toEqual(planResult.plan);
    expect(session.plannedQuestionIds).toEqual(planResult.plan.items.map((item) => item.questionId));
    expect(selectNextQuestion(child, session)?.id).toBe(planResult.plan.items[0].questionId);
  });

  it("prefers transfer-tagged questions in the transfer slot", () => {
    const child = readyChild();
    child.evidence["math-count-100"] = {
      ...child.evidence["math-count-100"],
      pKnown: 0.9,
      independentCorrect: 4,
      nEff: 4,
      questionIds: ["q1", "q2", "q3", "q4"],
      dueAt: "2026-11-30T00:00:00.000Z",
      diversity: {
        templateFamilies: { "number-sequence": 2, "compare-order": 2 },
        responseModes: { "tap-choice": 2, "tap-match": 2, "tap-order": 0, "voice-practice": 0 },
        transferCorrect: 0,
        farTransferCorrect: 0,
        delayedIndependentCorrect: 0,
        contextKeys: ["number-sequence", "compare-order"],
        lastIndependentWrongAt: null
      }
    };
    const result = buildDailyPlan({ child, subject: "math", dateKey: "2026-11-21", questionCount: 8, now: new Date("2026-11-21T01:00:00.000Z") });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    const transferItems = result.plan.items.filter((item) => item.kind === "transfer");
    const transferQuestions = transferItems.map((item) => QUESTIONS.find((question) => question.id === item.questionId));
    expect(transferQuestions.every(Boolean)).toBe(true);
    expect(transferQuestions.some((question) => question?.transferLevel !== "same-context")).toBe(true);
  });

  it("does not create an empty task when the subject has no enabled skill", () => {
    const child = readyChild();
    child.settings.enabledSkills = child.settings.enabledSkills.filter((skillId) => !skillId.includes("math"));
    expect(buildDailyPlan({
      child,
      subject: "math",
      dateKey: "2026-11-21",
      questionCount: 8,
      now: new Date("2026-11-21T01:00:00.000Z")
    })).toEqual({ status: "needs-scope", reason: "no-ready-skill" });
  });
});
