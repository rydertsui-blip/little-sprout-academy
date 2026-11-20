import type { MasteryLevel, SkillEvidence } from "../lib/types";

export interface BktObservation {
  correct: boolean;
  hintUsed: boolean;
  template: string;
  at?: Date;
  questionId?: string;
}

const DEFAULT_PARAMS = {
  pInit: 0.3,
  pGuess: 0.25,
  pSlip: 0.1,
  pTransit: 0.12
};

export function createSkillEvidence(skillId: string, at = new Date()): SkillEvidence {
  return {
    skillId,
    pKnown: DEFAULT_PARAMS.pInit,
    pInit: DEFAULT_PARAMS.pInit,
    pGuess: DEFAULT_PARAMS.pGuess,
    pSlip: DEFAULT_PARAMS.pSlip,
    pTransit: DEFAULT_PARAMS.pTransit,
    nEff: 0,
    independentCorrect: 0,
    correctWithHint: 0,
    templates: [],
    questionIds: [],
    lastAttemptAt: null,
    firstEvidenceAt: null,
    lastStageAdvanceAt: null,
    delayedEvidence: false,
    reviewStage: 0,
    dueAt: new Date(at.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    wrongStreak: 0
  };
}

export function updateBktEvidence(evidence: SkillEvidence, observation: BktObservation): SkillEvidence {
  const at = observation.at ?? new Date();
  const independent = !observation.hintUsed;
  const newQuestion = independent && (!observation.questionId || !evidence.questionIds.includes(observation.questionId));
  if (!newQuestion) {
    return {
      ...evidence,
      correctWithHint: evidence.correctWithHint + (observation.correct && observation.hintUsed ? 1 : 0),
      lastAttemptAt: at.toISOString()
    };
  }
  const prior = evidence.pKnown;
  let posterior: number;
  if (observation.correct) {
    const numerator = prior * (1 - evidence.pSlip);
    const denominator = numerator + (1 - prior) * evidence.pGuess;
    posterior = numerator / denominator;
  } else {
    const numerator = prior * evidence.pSlip;
    const denominator = numerator + (1 - prior) * (1 - evidence.pGuess);
    posterior = numerator / denominator;
  }
  const pKnown = Math.min(0.999, Math.max(0.001, posterior + (1 - posterior) * evidence.pTransit));
  const nextQuestionIds = newQuestion && observation.questionId && !evidence.questionIds.includes(observation.questionId)
    ? [...evidence.questionIds, observation.questionId]
    : evidence.questionIds;
  const nextTemplates = newQuestion && !evidence.templates.includes(observation.template)
    ? [...evidence.templates, observation.template]
    : evidence.templates;
  const delayedEvidence = evidence.delayedEvidence || Boolean(
    newQuestion
    &&
    evidence.firstEvidenceAt
      && at.getTime() - new Date(evidence.firstEvidenceAt).getTime() >= 24 * 60 * 60 * 1000
  );

  let reviewStage = evidence.reviewStage;
  let lastStageAdvanceAt = evidence.lastStageAdvanceAt;
  let scheduledDueAt = evidence.dueAt;
  if (observation.correct && newQuestion) {
    const dueReached = !evidence.dueAt || at.getTime() >= new Date(evidence.dueAt).getTime();
    if (reviewStage === 0 || dueReached) {
      reviewStage = Math.min(5, reviewStage + 1);
      lastStageAdvanceAt = at.toISOString();
      const intervals = [1, 3, 7, 14, 30, 60];
      scheduledDueAt = new Date(at.getTime() + intervals[Math.max(0, reviewStage - 1)] * 24 * 60 * 60 * 1000).toISOString();
    }
  }
  if (!observation.correct && independent) reviewStage = 0;
  if (!observation.correct && independent) scheduledDueAt = new Date(at.getTime() + 24 * 60 * 60 * 1000).toISOString();

  return {
    ...evidence,
    pKnown,
    nEff: evidence.nEff + (newQuestion ? 1 : 0),
    independentCorrect: evidence.independentCorrect + (observation.correct && newQuestion ? 1 : 0),
    correctWithHint: evidence.correctWithHint + (observation.correct && observation.hintUsed ? 1 : 0),
    templates: nextTemplates,
    questionIds: nextQuestionIds,
    lastAttemptAt: at.toISOString(),
    firstEvidenceAt: evidence.firstEvidenceAt ?? (independent ? at.toISOString() : null),
    lastStageAdvanceAt,
    delayedEvidence,
    reviewStage,
    dueAt: scheduledDueAt,
    wrongStreak: observation.correct ? 0 : evidence.wrongStreak + 1
  };
}

export function predictedSuccess(evidence: SkillEvidence): number {
  return evidence.pKnown * (1 - evidence.pSlip) + (1 - evidence.pKnown) * evidence.pGuess;
}

export function wilsonLowerBound(successes: number, trials: number, z = 1.645): number {
  if (trials <= 0) return 0;
  const p = successes / trials;
  const center = (p + (z * z) / (2 * trials)) / (1 + (z * z) / trials);
  const margin = z * Math.sqrt((p * (1 - p)) / trials + (z * z) / (4 * trials * trials)) / (1 + (z * z) / trials);
  return Math.max(0, center - margin);
}

export function classifyMastery(evidence: SkillEvidence, now = new Date()): MasteryLevel {
  const lower = wilsonLowerBound(evidence.independentCorrect, evidence.nEff);
  const hasDelayedReview = evidence.delayedEvidence && evidence.lastAttemptAt
    && new Date(evidence.lastAttemptAt).getTime() >= new Date(evidence.firstEvidenceAt ?? evidence.lastAttemptAt).getTime() + 24 * 60 * 60 * 1000;
  if (evidence.independentCorrect >= 4 && evidence.nEff >= 4 && evidence.questionIds.length >= 4 && lower >= 0.59 && hasDelayedReview) {
    return "secure";
  }
  if (evidence.independentCorrect >= 3 && evidence.nEff >= 3 && evidence.questionIds.length >= 3 && lower >= 0.5) {
    return "likely-secure";
  }
  if (evidence.independentCorrect >= 1 || evidence.pKnown >= 0.45) {
    return "developing";
  }
  return "unknown";
}
