import { describe, expect, it } from "vitest";
import { createChildProfile } from "../lib/profile";
import { getQuestionsForSubject } from "../content/catalog";
import { classifyMastery } from "./bkt";
import type { Question } from "../lib/types";
import {
  completeSession,
  correctCountsForSession,
  createAdaptiveSession,
  DIAGNOSTIC_MAX_QUESTIONS,
  recordSessionAnswer,
  recommendedNextSkills,
  selectNextQuestion
} from "./session";

describe("adaptive session engine", () => {
  function markPrerequisiteReady(child: ReturnType<typeof createChildProfile>, skillId: string) {
    child.evidence[skillId] = {
      ...child.evidence[skillId],
      independentCorrect: 2,
      nEff: 2,
      questionIds: ["q1", "q2"],
      pKnown: 0.62
    };
    child.evidence[skillId].diversity.templateFamilies = { "place-value": 1, "compare-order": 1 };
    child.evidence[skillId].diversity.responseModes["tap-choice"] = 1;
    child.evidence[skillId].diversity.responseModes["tap-match"] = 1;
  }

  it("counts independent and hinted correct answers separately", () => {
    const child = createChildProfile("小星", "star", new Date("2026-11-20T10:00:00Z"));
    let session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"));
    const answers = [
      { correct: true, hintUsed: false },
      { correct: true, hintUsed: true },
      { correct: false, hintUsed: false }
    ];
    for (const answer of answers) {
      const question = selectNextQuestion(child, session)!;
      session = recordSessionAnswer(child, session, { ...answer, questionId: question.id, at: new Date("2026-11-20T10:00:00Z") });
    }
    expect(correctCountsForSession(session)).toEqual({ independent: 1, hinted: 1 });
  });

  it("creates a 5-question ladder diagnostic session and selects five distinct questions dynamically", () => {
    const child = createChildProfile("小星", "star");
    let session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"));
    expect(session.kind).toBe("diagnostic");
    expect(session.length).toBe(DIAGNOSTIC_MAX_QUESTIONS);
    expect(session.length).toBe(5);
    const selected: string[] = [];
    for (let index = 0; index < DIAGNOSTIC_MAX_QUESTIONS; index += 1) {
      const question = selectNextQuestion(child, session)!;
      selected.push(question.id);
      session = recordSessionAnswer(child, session, { questionId: question.id, correct: true, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    }
    expect(new Set(selected).size).toBe(DIAGNOSTIC_MAX_QUESTIONS);
  });

  it("climbs the prerequisite tree and raises diagnostic difficulty after consecutive correct answers", () => {
    const child = createChildProfile("小星", "star", new Date("2026-11-20T10:00:00Z"));
    let session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"));
    const first = selectNextQuestion(child, session)!;
    expect(first.skillId).toBe("math-count-100");
    session = recordSessionAnswer(child, session, { questionId: first.id, correct: true, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    const second = selectNextQuestion(child, session)!;
    expect(second.skillId).toBe("math-add-sub-100");
    session = recordSessionAnswer(child, session, { questionId: second.id, correct: true, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    const third = selectNextQuestion(child, session)!;
    expect(third.difficulty).toBeGreaterThan(first.difficulty);
  });

  it("stops the diagnostic early after two mistakes and places the child at the failed skill", () => {
    const child = createChildProfile("小安", "star", new Date("2026-11-20T10:00:00Z"));
    let session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"));
    // Q1: passes root skill math-count-100
    const q1 = selectNextQuestion(child, session)!;
    expect(q1.skillId).toBe("math-count-100");
    session = recordSessionAnswer(child, session, { questionId: q1.id, correct: true, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    // Q2: misses depth-1 skill math-add-sub-100
    const q2 = selectNextQuestion(child, session)!;
    expect(q2.skillId).toBe("math-add-sub-100");
    session = recordSessionAnswer(child, session, { questionId: q2.id, correct: false, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    expect(session.length).toBe(5);
    // Q3: misses second question -> triggers early stop at 3 questions
    const q3 = selectNextQuestion(child, session)!;
    session = recordSessionAnswer(child, session, { questionId: q3.id, correct: false, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    expect(session.length).toBe(3);
    expect(selectNextQuestion(child, session)).toBeNull();
    const completed = completeSession(session, child);
    expect(completed).not.toBeNull();
    // math-count-100 is unlocked, and child starts right at math-add-sub-100
    const nextSkills = recommendedNextSkills(child, "math", new Date("2026-11-20T10:00:00Z"));
    expect(nextSkills[0].skill.id).toBe("math-add-sub-100");
  });

  it("unlocks passed foundational checkpoints after completing the diagnostic so the child truly fast-forwards", () => {
    const child = createChildProfile("小星", "star", new Date("2026-11-20T10:00:00Z"));
    let session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"));
    while (!completeSession(session)) {
      const question = selectNextQuestion(child, session)!;
      session = recordSessionAnswer(child, session, { questionId: question.id, correct: true, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    }
    completeSession(session, child);
    const nextSkills = recommendedNextSkills(child, "math", new Date("2026-11-20T10:00:00Z"));
    // Passed root skill math-count-100 is no longer blocking as a prerequisite-gap
    expect(nextSkills[0].skill.id).not.toBe("math-count-100");
  });

  it("leads every diagnostic with a hands-on matching item", () => {
    for (const subject of ["math", "mandarin", "english"] as const) {
      const child = createChildProfile("小星", "star", new Date("2026-11-20T10:00:00Z"));
      const session = createAdaptiveSession(child, subject, new Date("2026-11-20T10:00:00Z"));
      expect(selectNextQuestion(child, session)?.kind).toBe("match");
    }
  });

  it("keeps diagnostic questions inside the enabled learning scope", () => {
    const child = createChildProfile("小星", "star", new Date("2026-11-20T10:00:00Z"));
    child.settings.enabledSkills = ["math-count-100"];
    let session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"));
    for (let index = 0; index < DIAGNOSTIC_MAX_QUESTIONS; index += 1) {
      const question = selectNextQuestion(child, session)!;
      expect(question.skillId).toBe("math-count-100");
      session = recordSessionAnswer(child, session, { questionId: question.id, correct: true, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    }
  });

  it("mixes matching and choice items instead of making the whole diagnostic matching", () => {
    const child = createChildProfile("小星", "star", new Date("2026-11-20T10:00:00Z"));
    let session = createAdaptiveSession(child, "math", new Date("2026-11-20T10:00:00Z"));
    const kinds: string[] = [];
    for (let index = 0; index < DIAGNOSTIC_MAX_QUESTIONS; index += 1) {
      const question = selectNextQuestion(child, session)!;
      kinds.push(question.kind);
      session = recordSessionAnswer(child, session, { questionId: question.id, correct: true, hintUsed: false, at: new Date("2026-11-20T10:00:00Z") });
    }
    expect(kinds).toContain("match");
    expect(kinds).toContain("choice");
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
    const complete = completeSession(session, child)!;
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
    expect(session.kind).toBe("practice");
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

  it("does not unlock a dependent skill before its prerequisite has independent evidence", () => {
    const child = createChildProfile("小芽", "star", new Date("2026-11-20T10:00:00Z"));
    child.diagnostics.math = { completedAt: "2026-11-20T09:00:00Z", sessionId: "setup" };
    const before = recommendedNextSkills(child, "math", new Date("2026-11-20T10:00:00Z"));
    expect(before.map((item) => item.skill.id)).not.toContain("math-add-sub-100");
    expect(before[0].skill.id).toBe("math-count-100");
    expect(before[0].reason).toBe("prerequisite-gap");

    markPrerequisiteReady(child, "math-count-100");
    const after = recommendedNextSkills(child, "math", new Date("2026-11-20T10:00:00Z"));
    expect(after.map((item) => item.skill.id)).toContain("math-add-sub-100");
  });

  it("can reach secure through the real answer path using transfer-tagged question content", () => {
    const child = createChildProfile("小安", "star", new Date("2026-11-20T08:00:00Z"));
    const skillQuestions = getQuestionsForSubject("math").filter((question) => question.skillId === "math-add-sub-100");
    const families = new Map<string, Question>();
    for (const question of skillQuestions) if (!families.has(question.template)) families.set(question.template, question);
    const transfer = skillQuestions.find((question) => question.transferLevel !== "same-context");
    expect(families.size).toBeGreaterThanOrEqual(3);
    expect(transfer).toBeDefined();
    const chosen = [...families.values()].slice(0, 6);
    const matchQuestion = skillQuestions.find((question) => question.kind === "match");
    if (matchQuestion && !chosen.some((question) => question.id === matchQuestion.id)) chosen[3] = matchQuestion;
    if (transfer && !chosen.some((question) => question.id === transfer.id)) chosen[4] = transfer;
    const session = createAdaptiveSession(child, "math", new Date("2026-11-20T08:00:00Z"), { kind: "practice", length: chosen.length });
    const observationDays = [0, 0, 0, 0, 0, 1];
    chosen.forEach((question, index) => {
      const at = new Date(`2026-11-2${1 + observationDays[index]}T08:00:00Z`);
      const next = recordSessionAnswer(child, session, { questionId: question.id, correct: true, hintUsed: false, at });
      session.attempts = next.attempts;
    });
    expect(child.evidence["math-add-sub-100"].diversity.transferCorrect).toBeGreaterThanOrEqual(1);
    expect(classifyMastery(child.evidence["math-add-sub-100"], new Date("2026-11-22T09:00:00Z"))).toBe("secure");
  });
});
