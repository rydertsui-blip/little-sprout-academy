import { SKILLS } from "../content/catalog";
import { classifyMastery } from "./bkt";
import { recommendedNextSkills } from "./session";
import { singaporeDateKey } from "../rewards/rewardState";
import type { ChildProfile, Subject } from "../lib/types";

export interface SubjectProgressView {
  subject: Subject;
  currentSkillId: string;
  currentSkillTitle: string;
  stableCount: number;
  retainedCount: number;
  dueReviewCount: number;
  todaySessions: number;
  todayCompleted: boolean;
  weeklySessions: number;
  weeklyIndependentCorrect: number;
}

export function buildSubjectProgressView(child: ChildProfile, subject: Subject, now = new Date()): SubjectProgressView {
  const subjectSkills = SKILLS.filter((skill) => skill.subject === subject && child.settings.enabledSkills.includes(skill.id));
  const recommended = recommendedNextSkills(child, subject, now)[0]?.skill;
  const latestAttempt = child.attempts
    .filter((attempt) => attempt.subject === subject)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const currentSkill = recommended
    ?? subjectSkills.find((skill) => skill.id === latestAttempt?.skillId)
    ?? subjectSkills.find((skill) => child.evidence[skill.id]?.nEff > 0)
    ?? subjectSkills[0];
  if (!currentSkill) throw new Error(`No enabled skill for ${subject}`);

  const stableCount = subjectSkills.filter((skill) => ["likely-secure", "secure"].includes(classifyMastery(child.evidence[skill.id], now))).length;
  const retainedCount = subjectSkills.filter((skill) => {
    const evidence = child.evidence[skill.id];
    return evidence.delayedEvidence && ["likely-secure", "secure"].includes(classifyMastery(evidence, now));
  }).length;
  const dueReviewCount = subjectSkills.filter((skill) => {
    const evidence = child.evidence[skill.id];
    return evidence.nEff > 0 && evidence.dueAt && new Date(evidence.dueAt).getTime() <= now.getTime();
  }).length;

  const dateKey = singaporeDateKey(now);
  const todaySessions = child.sessions.filter((session) => session.subject === subject && session.dailyPlan?.dateKey === dateKey && session.completedAt !== null).length;
  const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const weeklySessions = child.sessions.filter((session) => {
    if (session.subject !== subject || !session.completedAt) return false;
    const completedAt = new Date(session.completedAt).getTime();
    return completedAt >= cutoff && completedAt <= now.getTime();
  });
  const weeklyIndependentCorrect = weeklySessions.reduce((total, session) => (
    total + session.attempts.filter((attempt) => attempt.correct && !attempt.hintUsed).length
  ), 0);

  return {
    subject,
    currentSkillId: currentSkill.id,
    currentSkillTitle: currentSkill.shortTitle,
    stableCount,
    retainedCount,
    dueReviewCount,
    todaySessions,
    todayCompleted: todaySessions > 0,
    weeklySessions: weeklySessions.length,
    weeklyIndependentCorrect
  };
}
