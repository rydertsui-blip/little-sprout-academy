import { SKILLS } from "../content/catalog";
import { classifyMastery } from "./bkt";
import { recommendedNextSkills, type RecommendationReason } from "./session";
import type { ChildProfile, Subject } from "../lib/types";

export interface SubjectInsight {
  subject: Subject;
  nextSkillId: string;
  nextSkillTitle: string;
  reason: RecommendationReason;
  reasonText: string;
  dueCount: number;
  weakCount: number;
  likelyCount: number;
  secureCount: number;
  weeklyAttempts: number;
  weeklyCorrect: number;
  weeklyHinted: number;
}

const REASON_TEXT: Record<RecommendationReason, string> = {
  "review-due": "到了复习时间",
  "prerequisite-gap": "先补先修概念",
  "weak-skill": "这一项还需要再练",
  "new-skill": "可以开始新内容"
};

export function buildSubjectInsight(child: ChildProfile, subject: Subject, now = new Date()): SubjectInsight {
  const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const subjectEvidence = SKILLS
    .filter((skill) => skill.subject === subject)
    .map((skill) => child.evidence[skill.id])
    .filter(Boolean);
  const next = recommendedNextSkills(child, subject, now)[0];
  const weekly = child.attempts.filter((attempt) => attempt.subject === subject && new Date(attempt.createdAt).getTime() >= weekStart);
  return {
    subject,
    nextSkillId: next.skill.id,
    nextSkillTitle: next.skill.shortTitle,
    reason: next.reason,
    reasonText: REASON_TEXT[next.reason],
    dueCount: subjectEvidence.filter((evidence) => evidence.dueAt && new Date(evidence.dueAt).getTime() <= now.getTime() && evidence.nEff > 0).length,
    weakCount: subjectEvidence.filter((evidence) => evidence.nEff > 0 && evidence.pKnown < 0.7).length,
    likelyCount: subjectEvidence.filter((evidence) => classifyMastery(evidence, now) === "likely-secure").length,
    secureCount: subjectEvidence.filter((evidence) => classifyMastery(evidence, now) === "secure").length,
    weeklyAttempts: weekly.length,
    weeklyCorrect: weekly.filter((attempt) => attempt.correct).length,
    weeklyHinted: weekly.filter((attempt) => attempt.hintUsed).length
  };
}

export function buildChildInsights(child: ChildProfile, now = new Date()): SubjectInsight[] {
  return (["math", "mandarin", "english"] as const).map((subject) => buildSubjectInsight(child, subject, now));
}
