import { getQuestionById, getQuestionsForSubject, getSkillById, SKILLS } from "../content/catalog";
import { classifyMastery, predictedSuccess, updateBktEvidence } from "./bkt";
import { startingDifficultyForLevel } from "../lib/levels";
import { selectDiverseQuestion } from "./itemSelector";
import type { Attempt, ChildProfile, MasteryLevel, Question, ResponseMode, SessionRecord, Skill, Subject } from "../lib/types";

export type RecommendationReason = "review-due" | "prerequisite-gap" | "weak-skill" | "new-skill";

export interface SkillRecommendation {
  skill: Skill;
  reason: RecommendationReason;
  priority: number;
}

function createSessionRecord(child: ChildProfile, subject: Subject, now: Date, kind: "diagnostic" | "practice", length: number): SessionRecord {
  if (kind === "diagnostic") {
    return {
      id: `session-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      childId: child.id,
      subject,
      kind,
      length,
      startedAt: now.toISOString(),
      completedAt: null,
      plannedQuestionIds: [],
      attempts: [],
      summary: []
    };
  }

  return {
    id: `session-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    childId: child.id,
    subject,
    kind,
    length,
    startedAt: now.toISOString(),
    completedAt: null,
    plannedQuestionIds: [],
    attempts: [],
    summary: []
  };
}

export function createAdaptiveSession(
  child: ChildProfile,
  subject: Subject,
  now = new Date(),
  options: { kind?: "diagnostic" | "practice"; length?: number } = {}
): SessionRecord {
  const kind = options.kind ?? (child.diagnostics[subject] ? "practice" : "diagnostic");
  const length = options.length ?? (kind === "diagnostic" ? 8 : child.settings.sessionLength);
  return createSessionRecord(child, subject, now, kind, length);
}

export function selectNextQuestion(child: ChildProfile, session: SessionRecord): Question | null {
  const answered = new Set(session.attempts.map((attempt) => attempt.questionId));
  if (session.attempts.length >= session.length) return null;
  if (session.plannedQuestionIds.length > 0) {
    const planned = session.plannedQuestionIds.find((questionId) => !answered.has(questionId));
    if (planned) return getQuestionById(planned) ?? null;
  }
  if (session.kind === "diagnostic") {
    const recent = session.attempts.slice(-2);
    const consecutiveCorrect = recent.length === 2 && recent.every((attempt) => attempt.correct);
    const lastCorrect = recent.at(-1)?.correct ?? false;
    const targetDifficulty = session.attempts.length === 0 ? startingDifficultyForLevel(child.gradeLevel) : consecutiveCorrect ? 3 : lastCorrect ? 2 : 1;
    const observedSkills = new Set(session.attempts.map((attempt) => attempt.skillId));
    const lastAttempt = session.attempts.at(-1);
    const lastQuestionKind = lastAttempt ? getQuestionById(lastAttempt.questionId)?.kind : undefined;
    const preferredKind = lastQuestionKind === "match" ? "choice" : "match";
    const candidates = getQuestionsForSubject(session.subject)
      .filter((question) => question.diagnostic && child.settings.enabledSkills.includes(question.skillId) && !answered.has(question.id))
      .sort((a, b) => {
        const aNovel = observedSkills.has(a.skillId) ? 1 : 0;
        const bNovel = observedSkills.has(b.skillId) ? 1 : 0;
        const aKind = a.kind === preferredKind ? 0 : 1;
        const bKind = b.kind === preferredKind ? 0 : 1;
        return aKind - bKind
          || aNovel - bNovel
          || Math.abs(a.difficulty - targetDifficulty) - Math.abs(b.difficulty - targetDifficulty)
          || a.id.localeCompare(b.id);
      });
    return candidates[0] ?? null;
  }
  const recommendations = recommendedNextSkills(child, session.subject, new Date());
  for (const recommendation of recommendations) {
    const skillEvidence = child.evidence[recommendation.skill.id];
    const baseDifficulty = skillEvidence.pKnown < 0.55 ? 1 : skillEvidence.pKnown < 0.8 ? 2 : 3;
    const targetDifficulty = (session.attempts.length === 0 ? Math.max(baseDifficulty, startingDifficultyForLevel(child.gradeLevel)) : baseDifficulty) as 1 | 2 | 3;
    const recentAttempts = session.attempts.slice(-4)
      .map((attempt) => getQuestionById(attempt.questionId))
      .filter((question): question is Question => Boolean(question));
    const candidates = getQuestionsForSubject(session.subject)
      .filter((item) => item.skillId === recommendation.skill.id && !answered.has(item.id))
      .filter((question) => question.kind !== "match" || question.pairs.length === 3);
    const question = selectDiverseQuestion({
      candidates,
      evidence: skillEvidence,
      recentFamilies: recentAttempts.map((item) => item.template),
      recentModes: recentAttempts.map((item) => item.kind === "match" ? "tap-match" : "tap-choice"),
      targetDifficulty,
      predictedSuccess: predictedSuccess(skillEvidence),
      tieKey: `${child.id}:${session.id}`
    });
    if (question) return question;
  }
  return null;
}

export function recordSessionAnswer(
  child: ChildProfile,
  session: SessionRecord,
  answer: { questionId: string; correct: boolean; hintUsed: boolean; at?: Date }
): SessionRecord {
  const question = getQuestionById(answer.questionId);
  if (!question) throw new Error(`Unknown question: ${answer.questionId}`);
  if (session.attempts.some((attempt) => attempt.questionId === answer.questionId)) throw new Error(`Question already answered: ${answer.questionId}`);
  const at = answer.at ?? new Date();
  const attempt: Attempt = {
    id: `attempt-${at.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    childId: child.id,
    questionId: question.id,
    skillId: question.skillId,
    subject: question.subject,
    correct: answer.correct,
    hintUsed: answer.hintUsed,
    createdAt: at.toISOString(),
    sessionId: session.id
  };
  child.evidence[question.skillId] = updateBktEvidence(child.evidence[question.skillId], {
    correct: answer.correct,
    hintUsed: answer.hintUsed,
    template: question.template,
    templateFamily: question.template,
    responseMode: question.kind === "match" ? "tap-match" : "tap-choice",
    transferLevel: question.transferLevel,
    contextKey: question.contextKey,
    at,
    questionId: question.id
  });
  child.attempts.push(attempt);
  return { ...session, attempts: [...session.attempts, attempt] };
}

export function completeSession(session: SessionRecord, child?: ChildProfile): SessionRecord | null {
  if (session.attempts.length < session.length) return null;
  const skillIds = Array.from(new Set(session.attempts.map((attempt) => attempt.skillId)));
  const summary = skillIds.map((skillId) => {
    const skill = getSkillById(skillId);
    const evidence = child?.evidence[skillId];
    return {
      skillId,
      title: skill?.shortTitle ?? skillId,
      level: evidence ? classifyMastery(evidence) : "developing" as MasteryLevel,
      pKnown: evidence?.pKnown ?? 0.55,
      evidenceCount: session.attempts.filter((attempt) => attempt.skillId === skillId).length
    };
  });
  return { ...session, completedAt: session.completedAt ?? new Date().toISOString(), summary };
}

export function recommendedNextSkills(child: ChildProfile, subject: Subject, now = new Date()): SkillRecommendation[] {
  const subjectSkills = SKILLS.filter((skill) => skill.subject === subject && child.settings.enabledSkills.includes(skill.id));
  const skillById = new Map(subjectSkills.map((skill) => [skill.id, skill]));
  const prerequisiteReady = (skillId: string) => {
    const evidence = child.evidence[skillId];
    if (!evidence) return false;
    const families = Object.values(evidence.diversity.templateFamilies).filter((count) => count > 0).length;
    const modes = (Object.entries(evidence.diversity.responseModes) as Array<[ResponseMode, number]>)
      .filter(([mode, count]) => mode !== "voice-practice" && count > 0).length;
    const lastWrong = evidence.diversity.lastIndependentWrongAt;
    const recentWrong = Boolean(lastWrong && evidence.lastAttemptAt && lastWrong >= evidence.lastAttemptAt);
    return evidence.independentCorrect >= 2 && evidence.questionIds.length >= 2 && families >= 2 && modes >= 2 && !recentWrong;
  };
  const ready = (skill: Skill) => skill.prerequisites.every((prerequisiteId) => !skillById.has(prerequisiteId) || prerequisiteReady(prerequisiteId));
  const blockingDemand = new Map<string, number>();
  for (const skill of subjectSkills) {
    if (ready(skill) || (child.evidence[skill.id]?.nEff ?? 0) > 0) continue;
    for (const prerequisiteId of skill.prerequisites) {
      if (skillById.has(prerequisiteId) && !prerequisiteReady(prerequisiteId)) blockingDemand.set(prerequisiteId, (blockingDemand.get(prerequisiteId) ?? 0) + 1);
    }
  }
  return subjectSkills.filter((skill) => (child.evidence[skill.id]?.nEff ?? 0) > 0 || ready(skill)).map((skill) => {
    const evidence = child.evidence[skill.id];
    const due = evidence.dueAt && new Date(evidence.dueAt).getTime() <= now.getTime();
    if (due && evidence.nEff > 0) return { skill, reason: "review-due" as const, priority: -1 };
    if (blockingDemand.has(skill.id)) return { skill, reason: "prerequisite-gap" as const, priority: 0 };
    if (evidence.nEff > 0 && evidence.pKnown < 0.7) return { skill, reason: "weak-skill" as const, priority: 0.2 };
    if (evidence.nEff > 0) return null;
    return { skill, reason: "new-skill" as const, priority: 1 };
  }).filter((item): item is SkillRecommendation => Boolean(item))
    .sort((a, b) => a.priority - b.priority
      || child.evidence[a.skill.id].pKnown - child.evidence[b.skill.id].pKnown
      || subjectSkills.indexOf(a.skill) - subjectSkills.indexOf(b.skill));
}

export function correctCountsForSession(session: SessionRecord): { independent: number; hinted: number } {
  return session.attempts.reduce(
    (counts, attempt) => {
      if (!attempt.correct) return counts;
      if (attempt.hintUsed) counts.hinted += 1;
      else counts.independent += 1;
      return counts;
    },
    { independent: 0, hinted: 0 }
  );
}

export function masteryForChild(child: ChildProfile, skillId: string, now = new Date()): MasteryLevel {
  return classifyMastery(child.evidence[skillId], now);
}
