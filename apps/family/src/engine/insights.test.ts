import { describe, expect, it } from "vitest";
import { createChildProfile } from "../lib/profile";
import { buildChildInsights, buildSubjectInsight } from "./insights";

describe("parent learning insights", () => {
  it("prioritises a due review and explains the next action", () => {
    const child = createChildProfile("小星", "star");
    child.diagnostics.math = { completedAt: "2026-11-19T00:00:00Z", sessionId: "diagnostic" };
    child.evidence["math-add-sub-100"] = {
      ...child.evidence["math-add-sub-100"],
      pKnown: 0.93,
      nEff: 4,
      reviewStage: 2,
      dueAt: "2026-11-19T00:00:00Z"
    };
    const insight = buildSubjectInsight(child, "math", new Date("2026-11-20T10:00:00Z"));
    expect(insight.nextSkillId).toBe("math-add-sub-100");
    expect(insight.reason).toBe("review-due");
    expect(insight.reasonText).toBe("到了复习时间");
    expect(insight.dueCount).toBe(1);
  });

  it("reports separate weekly attempts, independent correct answers and hints", () => {
    const child = createChildProfile("小月", "moon");
    child.attempts.push(
      { id: "a1", childId: child.id, questionId: "q1", skillId: "math-count-100", subject: "math", correct: true, hintUsed: false, createdAt: "2026-11-18T10:00:00Z", sessionId: "s1" },
      { id: "a2", childId: child.id, questionId: "q2", skillId: "math-count-100", subject: "math", correct: false, hintUsed: true, createdAt: "2026-11-19T10:00:00Z", sessionId: "s1" },
      { id: "a3", childId: child.id, questionId: "q3", skillId: "mandarin-tones", subject: "mandarin", correct: true, hintUsed: false, createdAt: "2026-11-01T10:00:00Z", sessionId: "s2" }
    );
    const insights = buildChildInsights(child, new Date("2026-11-20T10:00:00Z"));
    expect(insights.find((row) => row.subject === "math")?.weeklyAttempts).toBe(2);
    expect(insights.find((row) => row.subject === "math")?.weeklyCorrect).toBe(1);
    expect(insights.find((row) => row.subject === "math")?.weeklyHinted).toBe(1);
    expect(insights.find((row) => row.subject === "mandarin")?.weeklyAttempts).toBe(0);
  });
});
