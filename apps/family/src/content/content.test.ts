import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  CONTENT_PACK,
  CONTENT_VERSION,
  QUESTIONS,
  SKILLS,
  getQuestionById,
  getQuestionsForSubject,
  validateContentCatalog
} from "./catalog";
import { canonicalContentPayload } from "./identity";
import { classifyMastery, createSkillEvidence, updateBktEvidence } from "../engine/bkt";
import type { ChoiceQuestion, Question } from "../lib/types";

const isChoiceQuestion = (question: Question): question is ChoiceQuestion => question.kind === "choice";

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
    const choiceQuestions = ["math", "mandarin", "english"].flatMap((subject) => getQuestionsForSubject(subject as "math" | "mandarin" | "english")).filter(isChoiceQuestion);
    expect(choiceQuestions.every((question) => question.options.length === 3)).toBe(true);
  });

  it("contains far-transfer items in more than one subject", () => {
    const far = ["math", "mandarin", "english"].flatMap((subject) => getQuestionsForSubject(subject as "math" | "mandarin" | "english")).filter((question) => question.transferLevel === "far-transfer");
    expect(far.length).toBeGreaterThanOrEqual(46);
    expect(new Set(far.map((question) => question.subject)).size).toBe(3);
    for (const skill of SKILLS) expect(far.some((question) => question.skillId === skill.id), skill.id).toBe(true);
  });

  it("independently recalculates arithmetic answers", () => {
    const arithmeticTemplates = new Set(["addition", "subtraction", "regrouping", "three-digit", "multiplication", "division"]);
    const arithmetic = getQuestionsForSubject("math").filter(isChoiceQuestion).filter((question) => arithmeticTemplates.has(question.template));
    expect(arithmetic.length).toBeGreaterThan(0);
    for (const question of arithmetic) {
      const triple = question.prompt.match(/(\d+)\s*([+×÷−-])\s*(\d+)\s*([+×÷−-])\s*(\d+)\s*=/);
      const pair = question.prompt.match(/(\d+)\s*([+×÷−-])\s*(\d+)\s*=/);
      const apply = (left: number, operator: string, right: number) => operator === "+" ? left + right : operator === "-" || operator === "−" ? left - right : operator === "×" ? left * right : left / right;
      if (triple) {
        const first = apply(Number(triple[1]), triple[2], Number(triple[3]));
        expect(Number(question.correctAnswer)).toBe(apply(first, triple[4], Number(triple[5])));
      } else {
        expect(pair).not.toBeNull();
        expect(Number(question.correctAnswer)).toBe(apply(Number(pair![1]), pair![2], Number(pair![3])));
      }
    }
  });

  it("keeps every child answer tap-based without a typing task", () => {
    const forbiddenEnglish = /\b(type|enter|fill in|write your|write the answer|input|keyboard)\b/i;
    const forbiddenChinese = /打字|输入答案|填写答案|写出答案/;
    const tapCue = /tap|choose|select|match|read|start|点|选择|选|读/i;
    for (const question of QUESTIONS) {
      expect(["choice", "match", "order"], question.id).toContain(question.kind);
      const childText = `${question.instruction ?? ""} ${question.prompt}`;
      expect(childText, question.id).not.toMatch(forbiddenEnglish);
      expect(childText, question.id).not.toMatch(forbiddenChinese);
      expect(question.instruction ?? "", question.id).toMatch(tapCue);
    }
  });

  it("has at least four distinct questions available for mastery evidence in every skill", () => {
    for (const skill of SKILLS) {
      expect(getQuestionsForSubject(skill.subject).filter((question) => question.skillId === skill.id).map((question) => question.id).length).toBeGreaterThanOrEqual(4);
    }
  });

  it("can reach likely-secure using diverse evidence from actual question ids", () => {
    for (const skill of SKILLS) {
      const skillQuestions = getQuestionsForSubject(skill.subject).filter((question) => question.skillId === skill.id);
      const byTemplate = new Map<string, typeof skillQuestions[number]>();
      for (const question of skillQuestions) if (!byTemplate.has(question.template)) byTemplate.set(question.template, question);
      const questions = [...byTemplate.values()].slice(0, 4);
      while (questions.length < 4 && skillQuestions.length > questions.length) questions.push(skillQuestions[questions.length]);
      const responses: Array<"tap-choice" | "tap-match"> = ["tap-choice", "tap-match"];
      let evidence = createSkillEvidence(skill.id, new Date("2026-11-20T08:00:00Z"));
      for (const [index, question] of questions.entries()) {
        evidence = updateBktEvidence(evidence, {
          correct: true,
          hintUsed: false,
          template: question.template,
          templateFamily: question.template,
          responseMode: index === 0 || index === 1 ? responses[index] : (question.kind === "match" ? "tap-match" : "tap-choice"),
          transferLevel: "same-context",
          contextKey: question.template,
          questionId: question.id,
          at: new Date("2026-11-20T08:00:00Z")
        });
      }
      expect(questions.length, skill.id).toBeGreaterThanOrEqual(4);
      expect(classifyMastery(evidence, new Date("2026-11-20T08:01:00Z")), skill.id).toBe("likely-secure");
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

  it("contains sixty-one valid matching questions with stable pair identifiers", () => {
    const matching = ["math", "mandarin", "english"].flatMap((subject) => getQuestionsForSubject(subject as "math" | "mandarin" | "english")).filter((question) => question.kind === "match");
    expect(matching).toHaveLength(61);
    const issues = validateContentCatalog();
    expect(issues.filter((issue) => issue.code.startsWith("match-") || issue.code.startsWith("duplicate-match") || issue.code === "empty-match-label")).toEqual([]);
    for (const question of matching) {
      expect(question.pairs).toHaveLength(3);
      expect(new Set(question.pairs.map((pair) => pair.left)).size).toBe(3);
      expect(new Set(question.pairs.map((pair) => pair.right)).size).toBe(3);
      expect(new Set(question.pairs.map((pair) => pair.id)).size).toBe(3);
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

  it("keeps every released historical question id resolvable", () => {
    const history = JSON.parse(readFileSync(resolve(process.cwd(), "src/content/question-id-history.json"), "utf8")) as string[];
    for (const id of history) expect(getQuestionById(id)).toBeDefined();
  });
});
