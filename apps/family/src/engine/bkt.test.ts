import { describe, expect, it } from "vitest";
import {
  classifyMastery,
  createSkillEvidence,
  createEvidenceDiversity,
  predictedSuccess,
  updateBktEvidence,
  wilsonLowerBound
} from "./bkt";

describe("BKT knowledge tracking", () => {
  it("records template family, response mode and transfer diversity", () => {
    const start = new Date("2026-11-20T08:00:00Z");
    let evidence = createSkillEvidence("math-add-sub-100", start);
    evidence = updateBktEvidence(evidence, {
      correct: true, hintUsed: false, questionId: "q1", template: "number-bond",
      templateFamily: "number-bond", responseMode: "tap-choice", transferLevel: "near-transfer",
      contextKey: "bare-number", at: start
    });
    evidence = updateBktEvidence(evidence, {
      correct: true, hintUsed: false, questionId: "q2", template: "story-change",
      templateFamily: "story-change", responseMode: "tap-match", transferLevel: "far-transfer",
      contextKey: "story", at: new Date("2026-11-21T08:00:00Z")
    });
    expect(evidence.diversity.templateFamilies["number-bond"]).toBe(1);
    expect(evidence.diversity.responseModes["tap-choice"]).toBe(1);
    expect(evidence.diversity.responseModes["tap-match"]).toBe(1);
    expect(evidence.diversity.transferCorrect).toBe(2);
    expect(evidence.diversity.farTransferCorrect).toBe(1);
    expect(evidence.diversity.delayedIndependentCorrect).toBe(1);
    expect(evidence.diversity.contextKeys).toEqual(["bare-number", "story"]);
  });

  it("does not count repeated same-family answers as breadth", () => {
    let evidence = createSkillEvidence("english-phonics", new Date("2026-11-20T08:00:00Z"));
    for (const [index, questionId] of ["a", "b", "c"].entries()) {
      evidence = updateBktEvidence(evidence, {
        correct: true, hintUsed: false, questionId, template: "initial-sound",
        templateFamily: "initial-sound", responseMode: "tap-choice", transferLevel: "same-context",
        contextKey: "word", at: new Date(`2026-11-20T0${index}:00:00Z`)
      });
    }
    expect(Object.keys(evidence.diversity.templateFamilies)).toEqual(["initial-sound"]);
    expect(evidence.diversity.contextKeys).toEqual(["word"]);
  });

  it("starts migrated evidence with an empty diversity record", () => {
    expect(createEvidenceDiversity().templateFamilies).toEqual({});
    expect(createEvidenceDiversity().transferCorrect).toBe(0);
  });
  it("raises mastery after an independent correct answer using the BKT update", () => {
    const initial = createSkillEvidence("math-count-100");
    const updated = updateBktEvidence(initial, { correct: true, hintUsed: false, template: "count" });
    expect(updated.pKnown).toBeGreaterThan(initial.pKnown);
    expect(updated.pKnown).toBeLessThan(0.7);
    expect(updated.independentCorrect).toBe(1);
  });

  it("does not count a hinted answer as independent mastery evidence", () => {
    const initial = createSkillEvidence("mandarin-tone");
    const updated = updateBktEvidence(initial, { correct: true, hintUsed: true, template: "tone" });
    expect(updated.independentCorrect).toBe(0);
    expect(updated.nEff).toBe(0);
    expect(updated.correctWithHint).toBe(1);
  });

  it("never marks a skill secure from one correct answer", () => {
    const initial = createSkillEvidence("english-sight-words");
    const oneCorrect = updateBktEvidence(initial, { correct: true, hintUsed: false, template: "meaning" });
    expect(classifyMastery(oneCorrect, new Date("2026-11-20T10:00:00Z"))).toBe("developing");
  });

  it("does not mark four same-family answers as secure", () => {
    let evidence = createSkillEvidence("math-count-100", new Date("2026-11-20T00:00:00Z"));
    for (const questionId of ["q1", "q2", "q3", "q4"]) {
      evidence = updateBktEvidence(evidence, {
        correct: true, hintUsed: false, questionId, template: "place-value",
        templateFamily: "place-value", responseMode: "tap-choice", transferLevel: "same-context",
        contextKey: "bare-number", at: new Date("2026-11-21T00:00:00Z")
      });
    }
    expect(classifyMastery(evidence, new Date("2026-11-21T01:00:00Z"))).not.toBe("secure");
  });

  it("marks secure only after three families, two modes, transfer and delayed evidence", () => {
    let evidence = createSkillEvidence("math-count-100", new Date("2026-11-20T00:00:00Z"));
    const observations = [
      ["q1", "number-sequence", "tap-choice", "same-context", "2026-11-20T01:00:00Z"],
      ["q2", "place-value-tens-ones", "tap-match", "same-context", "2026-11-20T02:00:00Z"],
      ["q3", "compare-order", "tap-choice", "same-context", "2026-11-20T03:00:00Z"],
      ["q4", "number-sequence", "tap-order", "same-context", "2026-11-20T04:00:00Z"],
      ["q5", "place-value-tens-ones", "tap-match", "near-transfer", "2026-11-20T05:00:00Z"],
      ["q6", "compare-order", "tap-choice", "far-transfer", "2026-11-21T05:00:00Z"]
    ] as const;
    for (const [questionId, family, responseMode, transferLevel, at] of observations) {
      evidence = updateBktEvidence(evidence, {
        correct: true, hintUsed: false, questionId, template: family, templateFamily: family,
        responseMode, transferLevel, contextKey: family, at: new Date(at)
      });
    }
    expect(classifyMastery(evidence, new Date("2026-11-21T06:00:00Z"))).toBe("secure");
  });

  it("resets review progress after an incorrect independent answer", () => {
    let evidence = createSkillEvidence("mandarin-character", new Date("2026-11-20T10:00:00Z"));
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "meaning", at: new Date("2026-11-20T10:00:00Z") });
    evidence = updateBktEvidence(evidence, { correct: false, hintUsed: false, template: "reading", at: new Date("2026-11-21T10:00:00Z") });
    expect(evidence.reviewStage).toBe(0);
    expect(evidence.independentCorrect).toBe(1);
  });

  it("drops secure after the most recent independent answer is wrong", () => {
    let evidence = createSkillEvidence("math-count-100", new Date("2026-11-20T00:00:00Z"));
    const observations = [
      ["q1", "number-sequence", "tap-choice", "same-context", "2026-11-20T01:00:00Z"],
      ["q2", "place-value-tens-ones", "tap-match", "same-context", "2026-11-20T02:00:00Z"],
      ["q3", "compare-order", "tap-choice", "same-context", "2026-11-20T03:00:00Z"],
      ["q4", "number-sequence", "tap-order", "same-context", "2026-11-20T04:00:00Z"],
      ["q5", "place-value-tens-ones", "tap-match", "near-transfer", "2026-11-20T05:00:00Z"],
      ["q6", "compare-order", "tap-choice", "far-transfer", "2026-11-21T05:00:00Z"]
    ] as const;
    for (const [questionId, family, responseMode, transferLevel, at] of observations) {
      evidence = updateBktEvidence(evidence, {
        correct: true, hintUsed: false, questionId, template: family, templateFamily: family,
        responseMode, transferLevel, contextKey: family, at: new Date(at)
      });
    }
    evidence = updateBktEvidence(evidence, {
      correct: false, hintUsed: false, questionId: "q7", template: "compare-order",
      templateFamily: "compare-order", responseMode: "tap-choice", transferLevel: "same-context",
      contextKey: "compare-order", at: new Date("2026-11-22T05:00:00Z")
    });
    expect(classifyMastery(evidence, new Date("2026-11-22T06:00:00Z"))).not.toBe("secure");
  });

  it("does not add mastery evidence when the same question is repeated", () => {
    let evidence = createSkillEvidence("english-letters", new Date("2026-11-20T08:00:00Z"));
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "starting-letter", at: new Date("2026-11-20T08:00:00Z"), questionId: "same-question" });
    const firstAnswerProbability = evidence.pKnown;
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "starting-letter", at: new Date("2026-11-21T08:00:00Z"), questionId: "same-question" });
    expect(evidence.nEff).toBe(1);
    expect(evidence.independentCorrect).toBe(1);
    expect(evidence.questionIds).toEqual(["same-question"]);
    expect(evidence.pKnown).toBe(firstAnswerProbability);
  });

  it("does not change knowledge probability after a hinted answer", () => {
    const evidence = createSkillEvidence("mandarin-tones");
    const updated = updateBktEvidence(evidence, { correct: true, hintUsed: true, template: "tone", questionId: "hinted" });
    expect(updated.pKnown).toBe(evidence.pKnown);
    expect(updated.correctWithHint).toBe(1);
  });

  it("does not advance a scheduled review early", () => {
    const start = new Date("2026-11-20T08:00:00Z");
    let evidence = updateBktEvidence(createSkillEvidence("math-add-sub-100", start), { correct: true, hintUsed: false, template: "addition", at: start, questionId: "q1" });
    expect(evidence.reviewStage).toBe(1);
    const dueAt = new Date(evidence.dueAt!);
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "addition", at: new Date(start.getTime() + 60_000), questionId: "q2" });
    expect(evidence.reviewStage).toBe(1);
    expect(evidence.dueAt).toBe(dueAt.toISOString());
  });

  it("advances review stage only after the due interval has elapsed", () => {
    const start = new Date("2026-11-20T08:00:00Z");
    let evidence = updateBktEvidence(createSkillEvidence("math-add-sub-100", start), { correct: true, hintUsed: false, template: "addition", at: start, questionId: "q1" });
    const due = new Date(evidence.dueAt!);
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "addition", at: due, questionId: "q2" });
    expect(evidence.reviewStage).toBe(2);
    expect(new Date(evidence.dueAt!).getTime()).toBeGreaterThan(due.getTime());
  });

  it("calculates predicted success within zero and one", () => {
    expect(predictedSuccess(createSkillEvidence("english-phonics"))).toBeGreaterThan(0);
    expect(predictedSuccess(createSkillEvidence("english-phonics"))).toBeLessThan(1);
  });

  it("uses a conservative Wilson lower bound for evidence uncertainty", () => {
    expect(wilsonLowerBound(1, 1)).toBeGreaterThan(0.2);
    expect(wilsonLowerBound(3, 4)).toBeGreaterThan(0.35);
    expect(wilsonLowerBound(0, 0)).toBe(0);
  });
});
