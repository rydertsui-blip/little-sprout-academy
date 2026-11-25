import { describe, expect, it } from "vitest";
import { getQuestionsForSubject, SKILLS } from "./catalog";
import type { ChoiceQuestion, MatchQuestion, Question } from "../lib/types";

const mathQuestions = () => getQuestionsForSubject("math");
const choices = () => mathQuestions().filter((question): question is ChoiceQuestion => question.kind === "choice");
const matches = () => mathQuestions().filter((question): question is MatchQuestion => question.kind === "match");
const A_SKILLS = new Set(["math-count-100", "math-add-sub-100", "math-multiply-tables"]);

describe("P1/P2 mathematics depth", () => {
  it("meets the target count, template variety and two response modes for every skill", () => {
    for (const skill of SKILLS.filter((item) => item.subject === "math")) {
      const questions = mathQuestions().filter((question) => question.skillId === skill.id);
      const target = A_SKILLS.has(skill.id) ? 18 : 12;
      expect(questions.length, skill.id).toBeGreaterThanOrEqual(target);
      expect(new Set(questions.map((question) => question.template)).size, skill.id).toBeGreaterThanOrEqual(A_SKILLS.has(skill.id) ? 4 : 3);
      expect(new Set(questions.map((question) => question.kind)).size, skill.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("does not repeat the same prompt and answer-shape inside a skill", () => {
    for (const skill of SKILLS.filter((item) => item.subject === "math")) {
      const signatures = mathQuestions()
        .filter((question) => question.skillId === skill.id)
        .map((question) => question.kind === "choice"
          ? `${question.prompt}|${[...question.options].sort().join("|")}`
          : question.kind === "match"
            ? `${question.prompt}|${question.pairs.map((pair) => `${pair.left}:${pair.right}`).sort().join("|")}`
            : `${question.prompt}|${question.correctOrder.join("|")}`);
      expect(new Set(signatures).size, skill.id).toBe(signatures.length);
    }
  });

  it("recomputes number sequences, tens and ones, expanded form and digit value", () => {
    for (const question of choices().filter((item) => item.template === "number-sequence")) {
      const numbers = question.prompt.match(/\d+/g)?.map(Number) ?? [];
      expect(numbers.length, question.id).toBeGreaterThanOrEqual(3);
      const answer = Number(question.correctAnswer);
      const numbersBeforeBlank = question.prompt.split("__")[0].match(/\d+/g)?.length ?? 0;
      expect(answer).toBe(question.prompt.endsWith("__.") ? numbers.at(-1)! + 1 : numbers[numbersBeforeBlank - 1] + 1);
    }
    for (const question of choices().filter((item) => item.template === "tens-ones")) {
      const match = question.prompt.match(/(\d+) tens and (\d+) ones/);
      expect(match, question.id).not.toBeNull();
      expect(Number(question.correctAnswer)).toBe(Number(match![1]) * 10 + Number(match![2]));
    }
    for (const question of choices().filter((item) => item.template === "expanded-form")) {
      const match = question.prompt.match(/^(\d+) \+ (\d+) \+ (\d+)/);
      expect(match, question.id).not.toBeNull();
      expect(Number(question.correctAnswer)).toBe(Number(match![1]) + Number(match![2]) + Number(match![3]));
    }
    for (const question of choices().filter((item) => item.template === "digit-value")) {
      const placeMatch = question.prompt.match(/digit (\d) in (\d+)/);
      expect(placeMatch, question.id).not.toBeNull();
      const digit = String(placeMatch![1]);
      const number = String(placeMatch![2]);
      const place = number.length - number.indexOf(digit) - 1;
      expect(Number(question.correctAnswer)).toBe(Number(digit) * 10 ** place);
    }
  });

  it("recomputes number bonds, fact families, fraction-of-set and graph questions", () => {
    for (const question of choices().filter((item) => item.template === "number-bond")) {
      const match = question.prompt.match(/has (\d+) and (\d+)/);
      expect(match, question.id).not.toBeNull();
      expect(Number(question.correctAnswer)).toBe(Number(match![1]) + Number(match![2]));
    }
    for (const question of choices().filter((item) => item.template === "fact-family")) {
      const match = question.prompt.match(/(\d+) × (\d+) = (\d+).*?what is (\d+) ÷ (\d+)/i);
      expect(match, question.id).not.toBeNull();
      expect(Number(question.correctAnswer)).toBe(Number(match![3]) / Number(match![5]));
    }
    for (const question of choices().filter((item) => item.template === "fraction-of-set")) {
      const match = question.prompt.match(/1\/(\d+) of (\d+)/);
      expect(match, question.id).not.toBeNull();
      expect(Number(question.correctAnswer)).toBe(Number(match![2]) / Number(match![1]));
    }
    for (const question of choices().filter((item) => ["graph-read", "graph-question"].includes(item.template))) {
      const numbers = question.prompt.match(/\d+/g)?.map(Number) ?? [];
      expect(numbers.length, question.id).toBeGreaterThanOrEqual(2);
      const answer = question.prompt.includes("fewer") || question.prompt.includes("more")
        ? numbers[0] - numbers[1]
        : numbers.reduce((sum, value) => sum + value, 0);
      expect(Number(question.correctAnswer)).toBe(answer);
    }
  });

  it("checks clock durations, equal measurement facts and all new matching answers", () => {
    for (const question of choices().filter((item) => ["duration", "daily-event-order"].includes(item.template))) {
      const timeMatch = question.prompt.match(/starts at (\d+):(\d+)/);
      const durationMatch = question.prompt.match(/(\d+)[ -]minutes?/);
      expect(timeMatch, question.id).not.toBeNull();
      expect(durationMatch, question.id).not.toBeNull();
      const totalMinutes = Number(timeMatch![2]) + Number(durationMatch![1]);
      expect(Number(question.correctAnswer)).toBe(totalMinutes % 60);
    }
    for (const question of choices().filter((item) => item.template === "unit-convert")) {
      const match = question.prompt.match(/(\d+) (kilograms|metres).*?how many (grams|centimetres)/i);
      expect(match, question.id).not.toBeNull();
      const factor = match![2].toLowerCase() === "kilograms" ? 1000 : 100;
      expect(question.correctAnswer).toBe(`${Number(match![1]) * factor} ${match![3].toLowerCase()}`);
    }

    const matchById = (id: string) => matches().find((question) => question.skillId === id)!;
    expect(matchById("math-length-measure").pairs).toEqual(expect.arrayContaining([{ id: expect.any(String), left: "12 cm − 3 cm", right: "9 cm" }]));
    expect(matchById("math-fractions-add-sub").pairs).toEqual(expect.arrayContaining([{ id: expect.any(String), left: "2/6 + 3/6", right: "5/6" }]));
    expect(matchById("math-measurement-units").pairs).toEqual(expect.arrayContaining([{ id: expect.any(String), left: "2 kg", right: "2000 g" }]));
  });

  it("keeps every new math question tied to its skill and audit source", () => {
    for (const question of mathQuestions() as Question[]) {
      expect(question.audit.sourceRefs.length).toBeGreaterThan(0);
      expect(question.audit.automatedReview).toBe("passed");
      expect(question.reviewStatus).toBe("verified");
    }
  });
});
