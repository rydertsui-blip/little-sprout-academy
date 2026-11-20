import { describe, expect, it } from "vitest";
import {
  classifyMastery,
  createSkillEvidence,
  predictedSuccess,
  updateBktEvidence,
  wilsonLowerBound
} from "./bkt";

describe("BKT knowledge tracking", () => {
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

  it("requires independent evidence, template breadth and delayed review for secure", () => {
    let evidence = createSkillEvidence("math-add-sub-100", new Date("2026-11-20T10:00:00Z"));
    for (const [index, template] of ["number-bond", "vertical", "word"].entries()) {
      evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template, at: new Date("2026-11-20T10:00:00Z"), questionId: `q${index + 1}` });
    }
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "word", at: new Date("2026-11-21T10:00:00Z"), questionId: "q4" });
    expect(classifyMastery(evidence, new Date("2026-11-21T10:01:00Z"))).toBe("secure");
  });

  it("resets review progress after an incorrect independent answer", () => {
    let evidence = createSkillEvidence("mandarin-character", new Date("2026-11-20T10:00:00Z"));
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "meaning", at: new Date("2026-11-20T10:00:00Z") });
    evidence = updateBktEvidence(evidence, { correct: false, hintUsed: false, template: "reading", at: new Date("2026-11-21T10:00:00Z") });
    expect(evidence.reviewStage).toBe(0);
    expect(evidence.independentCorrect).toBe(1);
  });

  it("counts distinct questions rather than fake template breadth", () => {
    let evidence = createSkillEvidence("math-count-100", new Date("2026-11-20T08:00:00Z"));
    for (const questionId of ["q1", "q2", "q3"]) {
      evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "place-value", at: new Date("2026-11-20T08:00:00Z"), questionId });
    }
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "place-value", at: new Date("2026-11-21T08:00:00Z"), questionId: "q4" });
    expect(classifyMastery(evidence, new Date("2026-11-21T08:01:00Z"))).toBe("secure");
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
