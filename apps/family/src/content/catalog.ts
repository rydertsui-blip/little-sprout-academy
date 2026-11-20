import { buildMathQuestions } from "./math";
import { buildLanguageQuestions } from "./language";
import { buildMatchingQuestions } from "./matching";
import { SKILLS } from "./skills";
import type { Question, ContentIssue, Subject } from "../lib/types";
import { CONTENT_PACK, CONTENT_VERSION } from "./release";

export { SKILLS };
export { CONTENT_PACK, CONTENT_VERSION };

const rawQuestions: Question[] = [
  ...SKILLS.flatMap((skill) => skill.subject === "math" ? buildMathQuestions(skill) : buildLanguageQuestions(skill)),
  ...buildMatchingQuestions()
];

rawQuestions.forEach((question) => {
  question.diagnostic = true;
});

export const QUESTIONS = rawQuestions;

export function getQuestionsForSubject(subject: Subject): Question[] {
  return QUESTIONS.filter((question) => question.subject === subject);
}

export function getQuestionById(id: string): Question | undefined {
  return QUESTIONS.find((question) => question.id === id);
}

export function getSkillById(id: string) {
  return SKILLS.find((skill) => skill.id === id);
}

export function validateContentCatalog(): ContentIssue[] {
  const issues: ContentIssue[] = [];
  const skillIds = new Set<string>();
  const questionIds = new Set<string>();

  for (const skill of SKILLS) {
    if (skillIds.has(skill.id)) {
      issues.push({ code: "duplicate-skill-id", message: `Duplicate skill ${skill.id}`, skillId: skill.id });
    }
    skillIds.add(skill.id);
  }

  for (const skill of SKILLS) {
    for (const prerequisite of skill.prerequisites) {
      if (!skillIds.has(prerequisite)) {
        issues.push({ code: "missing-prerequisite", message: `${skill.id} references missing prerequisite ${prerequisite}`, skillId: skill.id });
      }
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (skillId: string, path: string[]) => {
    if (visiting.has(skillId)) {
      issues.push({ code: "prerequisite-cycle", message: `Prerequisite cycle: ${[...path, skillId].join(" -> ")}`, skillId });
      return;
    }
    if (visited.has(skillId)) return;
    visiting.add(skillId);
    const skill = SKILLS.find((item) => item.id === skillId);
    for (const prerequisite of skill?.prerequisites ?? []) visit(prerequisite, [...path, skillId]);
    visiting.delete(skillId);
    visited.add(skillId);
  };
  SKILLS.forEach((skill) => visit(skill.id, []));

  for (const question of QUESTIONS) {
    if (questionIds.has(question.id)) {
      issues.push({ code: "duplicate-question-id", message: `Duplicate question ${question.id}`, questionId: question.id, skillId: question.skillId });
    }
    questionIds.add(question.id);
    if (!skillIds.has(question.skillId)) {
      issues.push({ code: "unknown-skill", message: `${question.id} references unknown skill ${question.skillId}`, questionId: question.id, skillId: question.skillId });
    }
    if (question.kind === "choice") {
      if (!question.options.includes(question.correctAnswer)) {
        issues.push({ code: "invalid-answer", message: `${question.id} answer is not an option`, questionId: question.id, skillId: question.skillId });
      }
      if (question.options.filter((option) => option === question.correctAnswer).length !== 1) {
        issues.push({ code: "invalid-answer", message: `${question.id} must contain exactly one correct option`, questionId: question.id, skillId: question.skillId });
      }
      if (new Set(question.options).size !== question.options.length) {
        issues.push({ code: "duplicate-option", message: `${question.id} has duplicate options`, questionId: question.id, skillId: question.skillId });
      }
      if (question.options.length !== 3) {
        issues.push({ code: "option-count", message: `${question.id} must have exactly three answer choices`, questionId: question.id, skillId: question.skillId });
      }
    } else {
      if (question.pairs.length !== 3) {
        issues.push({ code: "match-pair-count", message: `${question.id} must have exactly three match pairs`, questionId: question.id, skillId: question.skillId });
      }
      if (new Set(question.pairs.map((pair) => pair.id)).size !== question.pairs.length) {
        issues.push({ code: "duplicate-match-pair-id", message: `${question.id} has duplicate match pair ids`, questionId: question.id, skillId: question.skillId });
      }
      if (new Set(question.pairs.map((pair) => pair.left)).size !== question.pairs.length) {
        issues.push({ code: "duplicate-match-left", message: `${question.id} has duplicate left labels`, questionId: question.id, skillId: question.skillId });
      }
      if (new Set(question.pairs.map((pair) => pair.right)).size !== question.pairs.length) {
        issues.push({ code: "duplicate-match-right", message: `${question.id} has duplicate right labels`, questionId: question.id, skillId: question.skillId });
      }
      if (question.pairs.some((pair) => !pair.left.trim() || !pair.right.trim())) {
        issues.push({ code: "empty-match-label", message: `${question.id} has an empty match label`, questionId: question.id, skillId: question.skillId });
      }
      if (!question.leftLabel.trim() || !question.rightLabel.trim()) {
        issues.push({ code: "missing-match-column-label", message: `${question.id} has no column label`, questionId: question.id, skillId: question.skillId });
      }
    }
    if (!question.explanation.trim()) {
      issues.push({ code: "missing-explanation", message: `${question.id} has no explanation`, questionId: question.id, skillId: question.skillId });
    }
    const skill = SKILLS.find((item) => item.id === question.skillId);
    if (question.audit.contentVersion !== CONTENT_VERSION) {
      issues.push({ code: "content-audit", message: `${question.id} has a stale content version`, questionId: question.id, skillId: question.skillId });
    }
    if (!question.audit.sourceRefs.length || (skill && !question.audit.sourceRefs.includes(skill.sourceDocument))) {
      issues.push({ code: "content-audit", message: `${question.id} does not reference its skill source`, questionId: question.id, skillId: question.skillId });
    }
    if (question.audit.automatedReview !== "passed") {
      issues.push({ code: "content-audit", message: `${question.id} has not passed automated review`, questionId: question.id, skillId: question.skillId });
    }
    if (CONTENT_PACK.releaseStatus === "approved" && (question.audit.humanLanguageReview !== "approved" || question.audit.humanPedagogyReview !== "approved")) {
      issues.push({ code: "human-review-required", message: `${question.id} lacks required human review`, questionId: question.id, skillId: question.skillId });
    }
    if (question.kind === "choice" && question.subject === "math" && !["unit-fraction", "shape-property"].includes(question.template)) {
      const numeric = Number(question.correctAnswer);
      if (!Number.isFinite(numeric) || numeric < 0) {
        issues.push({ code: "math-range", message: `${question.id} has an invalid numeric answer`, questionId: question.id, skillId: question.skillId });
      }
    }
  }

  for (const skill of SKILLS) {
    const count = QUESTIONS.filter((question) => question.skillId === skill.id).length;
    if (count < 6) issues.push({ code: "too-few-questions", message: `${skill.id} has only ${count} questions`, skillId: skill.id });
  }

  for (const subject of ["math", "mandarin", "english"] as const) {
    const count = QUESTIONS.filter((question) => question.subject === subject && question.diagnostic).length;
    if (count < 8) issues.push({ code: "too-few-diagnostics", message: `${subject} has only ${count} diagnostic questions` });
  }

  return issues;
}
