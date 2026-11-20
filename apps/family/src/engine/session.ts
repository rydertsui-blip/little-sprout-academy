import { getQuestionById, getQuestionsForSubject, getSkillById, SKILLS } from "../content/catalog";
import { classifyMastery, predictedSuccess, updateBktEvidence } from "./bkt";
import type { Attempt, ChildProfile, ChoiceQuestion, MasteryLevel, SessionRecord, Skill, Subject } from "../lib/types";

export type RecommendationReason = "review-due" | "prerequisite-gap" | "weak-skill" | "new-skill";

export interface SkillRecommendation {
  skill: Skill;
  reason: RecommendationReason;
  priority: number;
}

function diagnosticQuestionIds(subject: Subject): string[] {
  return getQuestionsForSubject(subject).filter((question) => question.diagnostic).map((question) => question.id).slice(0, 8);
}

function createSessionRecord(child: ChildProfile, subject: Subject, now: Date, kind: "diagnostic" | "practice", length: number): SessionRecord {
  if (kind === "diagnostic") {
    const questionIds = diagnosticQuestionIds(subject);
    return {
      id: `session-${now.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
      childId: child.id,
      subject,
      kind,
      length: questionIds.length,
      startedAt: now.toISOString(),
      completedAt: null,
      plannedQuestionIds: questionIds,
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

export function selectNextQuestion(child: ChildProfile, session: SessionRecord): ChoiceQuestion | null {
  const answered = new Set(session.attempts.map((attempt) => attempt.questionId));
  if (session.kind === "diagnostic") {
    const planned = session.plannedQuestionIds.find((id) => !answered.has(id));
    if (planned) return getQuestionById(planned) ?? null;
  }
  if (session.attempts.length >= session.length) return null;
  const recommendations = recommendedNextSkills(child, session.subject, new Date());
  for (const recommendation of recommendations) {
    const question = getQuestionsForSubject(session.subject)
      .filter((item) => item.skillId === recommendation.skill.id && !answered.has(item.id))
      .sort((a, b) => Math.abs(0.8 - predictedSuccess(child.evidence[a.skillId])) - Math.abs(0.8 - predictedSuccess(child.evidence[b.skillId])))[0];
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
  if (session.kind === "diagnostic" && !session.plannedQuestionIds.includes(answer.questionId)) throw new Error(`Question not in session: ${answer.questionId}`);
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
  return subjectSkills.map((skill) => {
    const evidence = child.evidence[skill.id];
    const due = evidence.dueAt && new Date(evidence.dueAt).getTime() <= now.getTime();
    if (due && evidence.nEff > 0) return { skill, reason: "review-due" as const, priority: -1 };
    const missingPrerequisite = skill.prerequisites.some((prerequisiteId) => {
      const prerequisite = child.evidence[prerequisiteId];
      return prerequisite && classifyMastery(prerequisite, now) === "unknown";
    });
    if (missingPrerequisite) return { skill, reason: "prerequisite-gap" as const, priority: 2 };
    if (evidence.nEff > 0 && evidence.pKnown < 0.7) return { skill, reason: "weak-skill" as const, priority: 0 };
    return { skill, reason: "new-skill" as const, priority: 1 };
  }).sort((a, b) => a.priority - b.priority || child.evidence[a.skill.id].pKnown - child.evidence[b.skill.id].pKnown);
}

export function masteryForChild(child: ChildProfile, skillId: string, now = new Date()): MasteryLevel {
  return classifyMastery(child.evidence[skillId], now);
}
