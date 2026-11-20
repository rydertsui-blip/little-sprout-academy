import { describe, expect, it } from "vitest";
import {
  CONTENT_VERSION,
  SKILLS,
  getQuestionById,
  getQuestionsForSubject,
  validateContentCatalog
} from "./catalog";

describe("curriculum content catalog", () => {
  it("has acyclic prerequisite skills", () => {
    const issues = validateContentCatalog();
    expect(issues.filter((issue) => issue.code === "prerequisite-cycle")).toEqual([]);
  });

  it("has at least six internally verified questions per skill", () => {
    const issues = validateContentCatalog();
    expect(issues.filter((issue) => issue.code === "too-few-questions")).toEqual([]);
    for (const skill of SKILLS) {
      expect(getQuestionsForSubject(skill.subject).filter((question) => question.skillId === skill.id).length).toBeGreaterThanOrEqual(6);
    }
  });

  it("has unique question ids and exactly one valid correct option for choice items", () => {
    const issues = validateContentCatalog();
    expect(issues.filter((issue) => issue.code === "duplicate-question-id" || issue.code === "invalid-answer" || issue.code === "duplicate-option")).toEqual([]);
    const questions = ["math", "mandarin", "english"].flatMap((subject) => getQuestionsForSubject(subject as "math" | "mandarin" | "english"));
    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length);
  });

  it("keeps every math answer inside its curriculum range", () => {
    const issues = validateContentCatalog();
    expect(issues.filter((issue) => issue.code === "math-range")).toEqual([]);
  });

  it("provides exactly three distinct answer choices for every question", () => {
    const issues = validateContentCatalog();
    expect(issues.filter((issue) => issue.code === "option-count")).toEqual([]);
  });

  it("independently recalculates arithmetic answers", () => {
    const arithmeticTemplates = new Set(["addition", "subtraction", "regrouping", "three-digit", "multiplication", "division"]);
    const arithmetic = getQuestionsForSubject("math").filter((question) => arithmeticTemplates.has(question.template));
    expect(arithmetic.length).toBeGreaterThan(0);
    for (const question of arithmetic) {
      const operators = question.prompt.match(/(\d+)\s*([+×÷\-])\s*(\d+)\s*=/);
      expect(operators).not.toBeNull();
      const left = Number(operators![1]);
      const right = Number(operators![3]);
      const operator = operators![2];
      const expected = operator === "+" ? left + right : operator === "-" ? left - right : operator === "×" ? left * right : left / right;
      expect(Number(question.correctAnswer)).toBe(expected);
    }
  });

  it("provides a stable content version and resolvable diagnostic items", () => {
    expect(CONTENT_VERSION).toMatch(/^pilot-[0-9]+$/);
    for (const subject of ["math", "mandarin", "english"] as const) {
      const questions = getQuestionsForSubject(subject).filter((item) => item.diagnostic);
      expect(questions.length).toBeGreaterThanOrEqual(8);
      expect(getQuestionById(questions[0].id)?.id).toBe(questions[0].id);
    }
  });
});
