import { getQuestionsForSubject, SKILLS } from "../content/catalog";
import { classifyMastery } from "./bkt";
import { createAdaptiveSession, recommendedNextSkills } from "./session";
import { singaporeDateKey } from "../rewards/rewardState";
import type {
  ChildProfile,
  DailyPlan,
  DailyPlanItemKind,
  Question,
  SessionRecord,
  Subject
} from "../lib/types";

export { singaporeDateKey };

export type DailyPlanBuildResult =
  | { status: "ready"; plan: DailyPlan }
  | { status: "needs-scope"; reason: "no-ready-skill" | "not-enough-questions" };

const PLAN_DISTRIBUTION: Record<6 | 8 | 10, Record<DailyPlanItemKind, number>> = {
  6: { review: 1, current: 3, transfer: 2 },
  8: { review: 2, current: 4, transfer: 2 },
  10: { review: 2, current: 5, transfer: 3 }
};

function recentQuestionIds(child: ChildProfile, subject: Subject, now: Date): Set<string> {
  const cutoff = now.getTime() - 14 * 24 * 60 * 60 * 1000;
  return new Set(child.attempts
    .filter((attempt) => attempt.subject === subject && new Date(attempt.createdAt).getTime() >= cutoff)
    .map((attempt) => attempt.questionId));
}

function latestSubjectSkillId(child: ChildProfile, subject: Subject): string | null {
  const attempts = child.attempts
    .filter((attempt) => attempt.subject === subject)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return attempts[0]?.skillId ?? null;
}

function currentSkillFor(child: ChildProfile, subject: Subject, now: Date) {
  const subjectSkills = SKILLS.filter((skill) => skill.subject === subject && child.settings.enabledSkills.includes(skill.id));
  if (subjectSkills.length === 0) return null;
  const recommended = recommendedNextSkills(child, subject, now)[0]?.skill;
  if (recommended) return recommended;
  const latestId = latestSubjectSkillId(child, subject);
  return subjectSkills.find((skill) => skill.id === latestId)
    ?? subjectSkills.find((skill) => child.evidence[skill.id]?.nEff > 0)
    ?? subjectSkills[0];
}

function targetDifficultyForPKnown(pKnown: number): 1 | 2 | 3 | 4 | 5 {
  if (pKnown < 0.42) return 1;
  if (pKnown < 0.60) return 2;
  if (pKnown < 0.78) return 3;
  if (pKnown < 0.90) return 4;
  return 5;
}

function rankQuestions(
  skills: Array<{ id: string; pKnown: number; seenTemplates: Record<string, number> }>,
  subject: Subject,
  recentIds: Set<string>,
  usedIds: Set<string>,
  templatePenaltyIds: Set<string> = new Set(),
  preferTransfer = false
): Question[] {
  const skillOrder = new Map(skills.map((skill, index) => [skill.id, index]));
  return getQuestionsForSubject(subject)
    .filter((question) => skillOrder.has(question.skillId) && !usedIds.has(question.id))
    .sort((a, b) => {
      const aSkill = skills[skillOrder.get(a.skillId)!];
      const bSkill = skills[skillOrder.get(b.skillId)!];
      const transferRank = (question: Question) => question.transferLevel === "far-transfer" ? 0 : question.transferLevel === "near-transfer" ? 1 : 2;
      const aSeen = aSkill.seenTemplates[a.template] ?? 0;
      const bSeen = bSkill.seenTemplates[b.template] ?? 0;
      return (preferTransfer ? transferRank(a) - transferRank(b) : 0)
        || (skillOrder.get(a.skillId)! - skillOrder.get(b.skillId)!)
        || Number(recentIds.has(a.id)) - Number(recentIds.has(b.id))
        || Number(templatePenaltyIds.has(a.template)) - Number(templatePenaltyIds.has(b.template))
        || aSeen - bSeen
        || Math.abs(a.difficulty - targetDifficultyForPKnown(aSkill.pKnown)) - Math.abs(b.difficulty - targetDifficultyForPKnown(bSkill.pKnown))
        || a.id.localeCompare(b.id);
    });
}

function takeQuestions(
  skillIds: string[],
  count: number,
  child: ChildProfile,
  subject: Subject,
  recentIds: Set<string>,
  usedIds: Set<string>,
  templatePenaltyIds: Set<string> = new Set(),
  preferTransfer = false
): Question[] {
  const skills = skillIds
    .map((id) => {
      const skill = SKILLS.find((item) => item.id === id);
      const evidence = child.evidence[id];
      return skill ? { id, pKnown: evidence?.pKnown ?? 0.45, seenTemplates: evidence?.diversity.templateFamilies ?? {} } : null;
    })
    .filter((item): item is { id: string; pKnown: number; seenTemplates: Record<string, number> } => Boolean(item));
  return rankQuestions(skills, subject, recentIds, usedIds, templatePenaltyIds, preferTransfer).slice(0, count);
}

function toItem(kind: DailyPlanItemKind, question: Question) {
  return { kind, skillId: question.skillId, questionId: question.id, template: question.template };
}

export function buildDailyPlan(input: {
  child: ChildProfile;
  subject: Subject;
  dateKey: string;
  questionCount: 6 | 8 | 10;
  now?: Date;
}): DailyPlanBuildResult {
  const now = input.now ?? new Date();
  const currentSkill = currentSkillFor(input.child, input.subject, now);
  if (!currentSkill) return { status: "needs-scope", reason: "no-ready-skill" };

  const distribution = PLAN_DISTRIBUTION[input.questionCount];
  const subjectSkills = SKILLS.filter((skill) => skill.subject === input.subject && input.child.settings.enabledSkills.includes(skill.id));
  const dueSkills = subjectSkills
    .filter((skill) => {
      const evidence = input.child.evidence[skill.id];
      return evidence.nEff > 0 && evidence.dueAt && new Date(evidence.dueAt).getTime() <= now.getTime();
    })
    .sort((a, b) => (input.child.evidence[a.id].dueAt ?? "").localeCompare(input.child.evidence[b.id].dueAt ?? ""));
  const latestId = latestSubjectSkillId(input.child, input.subject);
  const recentSkillIds = latestId && subjectSkills.some((skill) => skill.id === latestId) ? [latestId] : [];
  const reviewSkillIds = Array.from(new Set([
    ...dueSkills.map((skill) => skill.id),
    ...recentSkillIds,
    currentSkill.id
  ]));
  const stableSkillIds = subjectSkills
    .filter((skill) => childStable(input.child, skill.id))
    .map((skill) => skill.id);
  const transferSkillIds = stableSkillIds.length > 0 ? Array.from(new Set([...stableSkillIds, currentSkill.id])) : [currentSkill.id];
  const recentIds = recentQuestionIds(input.child, input.subject, now);
  const usedIds = new Set<string>();

  const reviewQuestions = takeQuestions(reviewSkillIds, distribution.review, input.child, input.subject, recentIds, usedIds);
  reviewQuestions.forEach((question) => usedIds.add(question.id));
  const currentQuestions = takeQuestions([currentSkill.id], distribution.current, input.child, input.subject, recentIds, usedIds, new Set(reviewQuestions.map((question) => question.template)));
  currentQuestions.forEach((question) => usedIds.add(question.id));
  const transferQuestions = takeQuestions(transferSkillIds, distribution.transfer, input.child, input.subject, recentIds, usedIds, new Set(currentQuestions.map((question) => question.template)), true);
  transferQuestions.forEach((question) => usedIds.add(question.id));

  const required = input.questionCount;
  const selected = [...reviewQuestions, ...currentQuestions, ...transferQuestions];
  if (selected.length < required) {
    const fallbackSkills = subjectSkills.map((skill) => skill.id);
    const remaining = takeQuestions(fallbackSkills, required - selected.length, input.child, input.subject, recentIds, usedIds);
    selected.push(...remaining);
  }
  if (selected.length !== required || selected.some((question, index) => selected.findIndex((item) => item.id === question.id) !== index)) {
    return { status: "needs-scope", reason: "not-enough-questions" };
  }

  const items = [
    ...reviewQuestions.map((question) => toItem("review", question)),
    ...currentQuestions.map((question) => toItem("current", question)),
    ...transferQuestions.map((question) => toItem("transfer", question)),
    ...selected.slice(reviewQuestions.length + currentQuestions.length + transferQuestions.length).map((question) => toItem("transfer", question))
  ];
  return {
    status: "ready",
    plan: {
      dateKey: input.dateKey,
      timezone: "Asia/Singapore",
      subject: input.subject,
      questionCount: input.questionCount,
      estimatedMinutes: Math.max(5, Math.round(input.questionCount * 1.25)),
      items
    }
  };
}

function childStable(child: ChildProfile, skillId: string): boolean {
  const evidence = child.evidence[skillId];
  return evidence ? ["likely-secure", "secure"].includes(classifyMastery(evidence)) : false;
}

export function createDailySession(child: ChildProfile, subject: Subject, plan: DailyPlan, now = new Date()): SessionRecord {
  const session = createAdaptiveSession(child, subject, now, { kind: "practice", length: plan.questionCount });
  return {
    ...session,
    plannedQuestionIds: plan.items.map((item) => item.questionId),
    dailyPlan: plan
  };
}
