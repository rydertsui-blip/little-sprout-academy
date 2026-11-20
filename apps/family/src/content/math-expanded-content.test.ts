import { describe, expect, it } from "vitest";
import { getQuestionsForSubject } from "./catalog";
import type { ChoiceQuestion } from "../lib/types";

const mathChoices = () => getQuestionsForSubject("math").filter((question): question is ChoiceQuestion => question.kind === "choice");

describe("expanded P1/P2 mathematics content", () => {
  it("provides six questions for each newly covered official mathematics skill", () => {
    for (const skillId of ["math-length-measure", "math-fractions-add-sub", "math-measurement-units"]) {
      expect(mathChoices().filter((question) => question.skillId === skillId)).toHaveLength(6);
    }
  });

  it("recalculates every like-fraction addition and subtraction", () => {
    const questions = mathChoices().filter((question) => question.template === "fraction-add-sub");
    expect(questions).toHaveLength(6);
    for (const question of questions) {
      const match = question.prompt.match(/(\d+)\/(\d+)\s*([+−-])\s*(\d+)\/(\d+)/);
      expect(match).not.toBeNull();
      const firstNumerator = Number(match![1]);
      const denominator = Number(match![2]);
      const secondNumerator = Number(match![4]);
      expect(Number(match![5])).toBe(denominator);
      const result = match![3] === "+" ? firstNumerator + secondNumerator : firstNumerator - secondNumerator;
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(denominator);
      expect(question.correctAnswer).toBe(`${result}/${denominator}`);
    }
  });

  it("keeps unit conversions and comparisons factually consistent", () => {
    const questions = mathChoices().filter((question) => question.skillId === "math-measurement-units");
    const kilogramQuestion = questions.find((question) => question.prompt === "1 kilogram is equal to how many grams?");
    expect(kilogramQuestion?.correctAnswer).toBe("1000 grams");
    const volumeQuestion = questions.find((question) => question.prompt === "Which unit is best for the volume of water in a bottle?");
    expect(volumeQuestion?.correctAnswer).toBe("litres");
    const comparisonQuestion = questions.find((question) => question.prompt.includes("A bag of rice is 5 kg"));
    expect(comparisonQuestion?.correctAnswer).toBe("the rice");
  });

  it("checks simple length changes against their stated centimetre values", () => {
    const questions = mathChoices().filter((question) => question.skillId === "math-length-measure");
    const extension = questions.find((question) => question.prompt.includes("6 cm line is extended by 2 cm"));
    expect(extension?.correctAnswer).toBe("8 cm");
    const remaining = questions.find((question) => question.prompt.includes("12 cm strip has 4 cm cut off"));
    expect(remaining?.correctAnswer).toBe("8 cm");
    const difference = questions.find((question) => question.prompt.includes("9 cm long"));
    expect(difference?.correctAnswer).toBe("6 cm");
  });
});

