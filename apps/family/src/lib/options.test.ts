import { describe, expect, it } from "vitest";
import { QUESTIONS } from "../content/catalog";
import { deterministicOptions } from "./options";

describe("deterministicOptions", () => {
  it("keeps the correct answer present exactly once", () => {
    for (const question of QUESTIONS) {
      if (question.kind !== "choice") continue;
      const options = deterministicOptions(question);
      expect(options).toHaveLength(question.options.length);
      expect(options.filter((option) => option === question.correctAnswer)).toHaveLength(1);
    }
  });

  it("does not concentrate math answers in one position", () => {
    const positions = [0, 0, 0];
    for (const question of QUESTIONS) {
      if (question.subject !== "math" || question.kind !== "choice") continue;
      positions[deterministicOptions(question).indexOf(question.correctAnswer)] += 1;
    }
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(20);
  });
});
