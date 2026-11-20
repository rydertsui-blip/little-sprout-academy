import { describe, expect, it } from "vitest";
import { createChildProfile } from "../lib/profile";
import {
  completeSession,
  createAdaptiveSession,
  recordSessionAnswer,
  recommendedNextSkills,
  selectNextQuestion
} from "./session";

describe("adaptive session engine", () => {
  it("creates a diagnostic session with eight distinct questions", () => {
    const child = createChildProfile("小星", "star");
    const session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"));
    expect(session.kind).toBe("diagnostic");
    expect(session.plannedQuestionIds).toHaveLength(8);
    expect(new Set(session.plannedQuestionIds).size).toBe(8);
  });

  it("does not repeat an already answered item in the same session", () => {
    const child = createChildProfile("小月", "moon");
    let session = createAdaptiveSession(child, "english", new Date("2026-11-20T10:00:00Z"));
    const firstId = selectNextQuestion(child, session)!.id;
    session = recordSessionAnswer(child, session, { questionId: firstId, correct: true, hintUsed: false });
    expect(selectNextQuestion(child, session)?.id).not.toBe(firstId);
  });

  it("does not mark a skill as secure after the diagnostic", () => {
    const child = createChildProfile("小安", "leaf");
    let session = createAdaptiveSession(child, "mandarin", new Date("2026-11-20T10:00:00Z"));
    while (!completeSession(session)) {
      const question = selectNextQuestion(child, session)!;
      session = recordSessionAnswer(child, session, { questionId: question.id, correct: true, hintUsed: false });
    }
    const complete = completeSession(session)!;
    expect(complete.summary.some((row) => row.level === "secure")).toBe(false);
  });

  it("prioritises a due review before a new skill", () => {
    const child = createChildProfile("小禾", "seedling");
    child.evidence["math-add-sub-100"] = {
      ...child.evidence["math-add-sub-100"],
      pKnown: 0.93,
      independentCorrect: 4,
      nEff: 4,
      templates: ["number-bond", "vertical", "word"],
      reviewStage: 2,
      dueAt: "2026-11-19T00:00:00Z"
    };
    const session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"), { kind: "practice", length: 6 });
    expect(recommendedNextSkills(child, "math", new Date("2026-11-20T10:00:00Z"))[0].reason).toBe("review-due");
  });

  it("chooses the next practice question from the updated weak skill after a wrong answer", () => {
    const child = createChildProfile("小芽", "star", new Date("2026-11-20T10:00:00Z"));
    child.diagnostics.math = { completedAt: "2026-11-20T09:00:00Z", sessionId: "setup" };
    const session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"), { kind: "practice", length: 6 });
    const first = selectNextQuestion(child, session)!;
    const updatedSession = recordSessionAnswer(child, session, { questionId: first.id, correct: false, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    const second = selectNextQuestion(child, updatedSession)!;
    expect(second.skillId).toBe(first.skillId);
    expect(second.id).not.toBe(first.id);
  });
});
