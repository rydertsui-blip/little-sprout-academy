import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CONTENT_PACK,
  CONTENT_VERSION,
  SKILLS,
  getQuestionById,
  getQuestionsForSubject,
  validateContentCatalog
} from "./catalog";
import { canonicalContentPayload } from "./identity";
import { classifyMastery, createSkillEvidence, updateBktEvidence } from "../engine/bkt";

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

  it("has at least four distinct questions available for mastery evidence in every skill", () => {
    for (const skill of SKILLS) {
      expect(getQuestionsForSubject(skill.subject).filter((question) => question.skillId === skill.id).map((question) => question.id).length).toBeGreaterThanOrEqual(4);
    }
  });

  it("can reach secure mastery using the actual question ids of every skill", () => {
    for (const skill of SKILLS) {
      const questions = getQuestionsForSubject(skill.subject).filter((question) => question.skillId === skill.id).slice(0, 4);
      let evidence = createSkillEvidence(skill.id, new Date("2026-11-20T08:00:00Z"));
      for (const [index, question] of questions.entries()) {
        evidence = updateBktEvidence(evidence, {
          correct: true,
          hintUsed: false,
          template: question.template,
          questionId: question.id,
          at: new Date(index === 3 ? "2026-11-21T08:00:00Z" : "2026-11-20T08:00:00Z")
        });
      }
      expect(classifyMastery(evidence, new Date("2026-11-21T08:01:00Z"))).toBe("secure");
    }
  });

  it("provides a stable content version and resolvable diagnostic items", () => {
    expect(CONTENT_VERSION).toBe(CONTENT_PACK.version);
    for (const subject of ["math", "mandarin", "english"] as const) {
      const questions = getQuestionsForSubject(subject).filter((item) => item.diagnostic);
      expect(questions.length).toBeGreaterThanOrEqual(8);
      expect(getQuestionById(questions[0].id)?.id).toBe(questions[0].id);
    }
  });

  it("has an explicit audit trail on every question", () => {
    for (const question of ["math", "mandarin", "english"].flatMap((subject) => getQuestionsForSubject(subject as "math" | "mandarin" | "english"))) {
      const skill = SKILLS.find((item) => item.id === question.skillId);
      expect(question.audit.contentVersion).toBe(CONTENT_VERSION);
      expect(question.audit.automatedReview).toBe("passed");
      expect(question.audit.sourceRefs).toContain(skill?.sourceDocument);
      expect(question.audit.humanLanguageReview).toBe("pending");
      expect(question.audit.humanPedagogyReview).toBe("pending");
    }
    expect(CONTENT_PACK.releaseStatus).toBe("pilot");
    expect(CONTENT_PACK.humanReviewStatus).toBe("pending");
  });

  it("matches the reviewed content signature", () => {
    const signature = readFileSync(resolve(process.cwd(), "src/content/content.sha256"), "utf8").trim();
    const digest = createHash("sha256").update(canonicalContentPayload(), "utf8").digest("hex");
    expect(digest).toBe(signature);
  });
});
