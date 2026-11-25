import { buildMathQuestions } from "./math";
import { buildLanguageQuestions } from "./language";
import { buildMatchingQuestions } from "./matching";
import { buildOrderQuestions } from "./ordering";
import { SKILLS } from "./skills";
import type { Question, ContentIssue, Subject } from "../lib/types";
import { CONTENT_PACK, CONTENT_VERSION } from "./release";
import { OFFICIAL_OUTCOMES_BY_ID } from "./officialSources";
import { getDepthBlueprint, missingDepthBlueprints } from "./depthBlueprint";
import { buildFarTransferQuestions } from "./farTransfer";
import { preAnswerAudio, speechRevealsAnswer } from "../lib/questionAudio";

export { SKILLS };
export { CONTENT_PACK, CONTENT_VERSION };

const rawQuestions: Question[] = [
  ...SKILLS.flatMap((skill) => skill.subject === "math" ? buildMathQuestions(skill) : buildLanguageQuestions(skill)),
  ...buildMatchingQuestions(),
  ...buildOrderQuestions(),
  ...buildFarTransferQuestions()
];

const KNOWN_IMAGE_NAMES = new Set(["abc", "apple", "bear", "bird", "books", "cat", "compass", "dog", "fish", "flower", "house", "moon", "mountain", "music", "pencil", "rabbit", "rain", "seedling", "sparkles", "speech", "star", "sun", "trophy", "water", "tree"]);
const FACTUAL_MATH_TEMPLATES = new Set([
  "k2-count-dots",
  "k2-compare-number",
  "k2-number-sequence",
  "k2-pattern",
  "k2-shape-identify",
  "k2-compare-groups",
  "unit-fraction",
  "fraction-words",
  "shape-property",
  "shape-identify",
  "shape-classify",
  "compose-decompose",
  "fraction-add-sub",
  "visual-bar",
  "fraction-story",
  "length-measure",
  "length-compare",
  "length-change",
  "measurement-unit",
  "unit-conversion",
  "measurement-compare",
  "measurement-change",
  "unit-select",
  "unit-convert",
  "unit-compare"
  ,"time-duration"
  ,"time-change"
  ,"time-convert"
  ,"time-start"
  ,"real-world-fraction"
  ,"real-world-shape"
]);

rawQuestions.forEach((question) => {
  question.diagnostic = question.transferLevel !== "far-transfer";
  if (!question.audioOnly) {
    question.audioText = preAnswerAudio(question);
  } else if (question.audioOnly) {
    question.passage = undefined;
  }
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
  for (const skillId of missingDepthBlueprints()) {
    issues.push({ code: "depth-blueprint-missing", message: `No depth blueprint for ${skillId}`, skillId });
  }
  const skillIds = new Set<string>();
  const questionIds = new Set<string>();

  for (const skill of SKILLS) {
    if (skillIds.has(skill.id)) {
      issues.push({ code: "duplicate-skill-id", message: `Duplicate skill ${skill.id}`, skillId: skill.id });
    }
    if (!skill.officialOutcomes.length && skill.provenanceScope !== "supplementary-practice") {
      issues.push({ code: "missing-official-outcome", message: `${skill.id} has no official outcome mapping but is not marked supplementary`, skillId: skill.id });
    }
    for (const mapping of skill.officialOutcomes) {
      const outcome = OFFICIAL_OUTCOMES_BY_ID.get(mapping.outcomeId);
      if (!outcome) {
        issues.push({ code: "unknown-official-outcome", message: `${skill.id} references unknown outcome ${mapping.outcomeId}`, skillId: skill.id });
      } else if (outcome.subject !== skill.subject) {
        issues.push({ code: "official-outcome-subject", message: `${skill.id} maps to a ${outcome.subject} outcome`, skillId: skill.id });
      } else if (!outcome.levels.some((level) => skill.gradeBand.includes(level))) {
        issues.push({ code: "official-outcome-level", message: `${skill.id} maps to an outcome outside ${skill.gradeBand}`, skillId: skill.id });
      }
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
      if (question.optionImages) {
        const expected = new Set(question.options);
        for (const option of question.options) if (!question.optionImages[option]) issues.push({ code: "missing-option-image", message: `${question.id} has no image for ${option}`, questionId: question.id, skillId: question.skillId });
        for (const image of Object.values(question.optionImages)) if (!KNOWN_IMAGE_NAMES.has(image)) issues.push({ code: "unknown-option-image", message: `${question.id} references unknown image ${image}`, questionId: question.id, skillId: question.skillId });
        if (Object.keys(question.optionImages).some((option) => !expected.has(option))) issues.push({ code: "extra-option-image", message: `${question.id} has an image for an unknown option`, questionId: question.id, skillId: question.skillId });
      }
      if (question.audioOnly && !question.audioText) issues.push({ code: "audio-only-source", message: `${question.id} is audio-only without audioText`, questionId: question.id, skillId: question.skillId });
      if (!question.audioOnly && question.audioText && speechRevealsAnswer(question, question.audioText)) issues.push({ code: "audio-answer-leak", message: `${question.id} audioText reveals the answer`, questionId: question.id, skillId: question.skillId });
      if (question.audioOnly && question.passage && speechRevealsAnswer(question, question.passage)) issues.push({ code: "audio-passage-leak", message: `${question.id} audio-only passage reveals the answer`, questionId: question.id, skillId: question.skillId });
    } else if (question.kind === "match") {
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
      for (const pair of question.pairs) {
        if (pair.rightImage && !KNOWN_IMAGE_NAMES.has(pair.rightImage)) {
          issues.push({ code: "unknown-match-image", message: `${question.id} references unknown picture ${pair.rightImage}`, questionId: question.id, skillId: question.skillId });
        }
        if (pair.rightImage && !pair.right.trim()) {
          issues.push({ code: "empty-match-picture-label", message: `${question.id} picture pair has no word`, questionId: question.id, skillId: question.skillId });
        }
      }
      if (question.template === "match-listen-word" || question.template === "match-listen-wh") {
        if (question.pairs.some((pair) => !pair.audioText)) {
          issues.push({ code: "missing-listen-pair-audio", message: `${question.id} listening match pair has no audio`, questionId: question.id, skillId: question.skillId });
        }
      }
      if (question.template === "match-listen-word" && question.pairs.some((pair) => !pair.rightImage)) {
        issues.push({ code: "missing-match-picture", message: `${question.id} listening match pair has no picture`, questionId: question.id, skillId: question.skillId });
      }
      if (!question.leftLabel.trim() || !question.rightLabel.trim()) {
        issues.push({ code: "missing-match-column-label", message: `${question.id} has no column label`, questionId: question.id, skillId: question.skillId });
      }
    } else {
      if (question.correctOrder.length < 3 || question.tokens.length < question.correctOrder.length) {
        issues.push({ code: "order-token-count", message: `${question.id} must have at least 3 ordered tokens`, questionId: question.id, skillId: question.skillId });
      }
      if (question.correctOrder.some((token) => !question.tokens.includes(token))) {
        issues.push({ code: "order-missing-token", message: `${question.id} correctOrder contains token missing from tokens`, questionId: question.id, skillId: question.skillId });
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
    if (skill) {
      for (const mapping of skill.officialOutcomes) {
        const outcome = OFFICIAL_OUTCOMES_BY_ID.get(mapping.outcomeId);
        if (outcome && (!question.audit.sourceRefs.includes(outcome.id) || !question.audit.sourceRefs.includes(outcome.sourceId))) {
          issues.push({ code: "content-audit", message: `${question.id} does not reference outcome ${outcome.id} and its source`, questionId: question.id, skillId: question.skillId });
        }
      }
    }
    if (question.audit.automatedReview !== "passed") {
      issues.push({ code: "content-audit", message: `${question.id} has not passed automated review`, questionId: question.id, skillId: question.skillId });
    }
    if (question.audit.provenanceScope !== (skill?.provenanceScope ?? "supplementary-practice")) {
      issues.push({ code: "content-audit", message: `${question.id} provenance scope does not match its skill`, questionId: question.id, skillId: question.skillId });
    }
    if (CONTENT_PACK.releaseStatus === "approved" && (question.audit.humanLanguageReview !== "approved" || question.audit.humanPedagogyReview !== "approved")) {
      issues.push({ code: "human-review-required", message: `${question.id} lacks required human review`, questionId: question.id, skillId: question.skillId });
    }
    if (question.kind === "choice" && question.subject === "math" && !FACTUAL_MATH_TEMPLATES.has(question.template)) {
      const numeric = Number(question.correctAnswer);
      if (!Number.isFinite(numeric) || numeric < 0) {
        issues.push({ code: "math-range", message: `${question.id} has an invalid numeric answer`, questionId: question.id, skillId: question.skillId });
      }
    }
  }

  for (const skill of SKILLS) {
    const count = QUESTIONS.filter((question) => question.skillId === skill.id).length;
    const blueprint = missingDepthBlueprints().includes(skill.id) ? null : getDepthBlueprint(skill.id);
    if (blueprint && count < blueprint.targetItemCount) {
      issues.push({ code: "too-few-questions", message: `${skill.id} has ${count} questions; target ${blueprint.targetItemCount}`, skillId: skill.id });
    }
    if (blueprint) {
      const skillQuestions = QUESTIONS.filter((question) => question.skillId === skill.id);
      const families = new Set(skillQuestions.map((question) => question.template));
      const modes = new Set(skillQuestions.map((question) => question.kind));
      if (families.size < blueprint.minTemplateFamilies) {
        issues.push({ code: "depth-template-families", message: `${skill.id} has ${families.size} template families; target ${blueprint.minTemplateFamilies}`, skillId: skill.id });
      }
      if (modes.size < blueprint.minResponseModes) {
        issues.push({ code: "depth-response-modes", message: `${skill.id} has ${modes.size} response modes; target ${blueprint.minResponseModes}`, skillId: skill.id });
      }
      for (const required of blueprint.requiredTemplateFamilies) {
        const familyCount = skillQuestions.filter((question) => question.template === required).length;
        if (familyCount < 2) {
          issues.push({ code: "depth-family-count", message: `${skill.id} has ${familyCount} ${required} items`, skillId: skill.id });
        }
      }
    }
  }

  for (const subject of ["math", "mandarin", "english"] as const) {
    const count = QUESTIONS.filter((question) => question.subject === subject && question.diagnostic).length;
    if (count < 8) issues.push({ code: "too-few-diagnostics", message: `${subject} has only ${count} diagnostic questions` });
  }

  return issues;
}
