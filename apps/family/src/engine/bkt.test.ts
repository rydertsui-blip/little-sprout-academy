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
    for (const template of ["number-bond", "vertical", "word"]) {
      evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template, at: new Date("2026-11-20T10:00:00Z") });
    }
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "word", at: new Date("2026-11-21T10:00:00Z") });
    expect(classifyMastery(evidence, new Date("2026-11-21T10:01:00Z"))).toBe("secure");
  });

  it("resets review progress after an incorrect independent answer", () => {
    let evidence = createSkillEvidence("mandarin-character", new Date("2026-11-20T10:00:00Z"));
    evidence = updateBktEvidence(evidence, { correct: true, hintUsed: false, template: "meaning", at: new Date("2026-11-20T10:00:00Z") });
    evidence = updateBktEvidence(evidence, { correct: false, hintUsed: false, template: "reading", at: new Date("2026-11-21T10:00:00Z") });
    expect(evidence.reviewStage).toBe(0);
    expect(evidence.independentCorrect).toBe(1);
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
