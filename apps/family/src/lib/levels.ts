import { SKILLS } from "../content/catalog";
import type { ChildProfile, LearningLevel } from "./types";

export const K2_SKILL_IDS = SKILLS.filter((skill) => skill.gradeBand === "K2").map((skill) => skill.id);
export const P1_SKILL_IDS = SKILLS.filter((skill) => skill.gradeBand === "P1" || skill.gradeBand === "P1-P2").map((skill) => skill.id);
export const P2_SKILL_IDS = SKILLS.filter((skill) => skill.gradeBand !== "K2").map((skill) => skill.id);
export const ALL_SKILL_IDS = SKILLS.map((skill) => skill.id);

/**
 * Age is only a recommendation. Singapore primary placement depends on birth
 * year, so the parent can confirm or override the suggested level.
 */
export function recommendedLevelForAge(ageYears: number): LearningLevel {
  if (ageYears <= 5) return "K2";
  if (ageYears === 6) return "P1";
  return "P2";
}

export function enabledSkillsForLevel(level: LearningLevel): string[] {
  // K2 is a focused readiness layer. P1 starts the primary core, and P2 never
  // falls back to K2 items.
  if (level === "K2") return [...K2_SKILL_IDS];
  if (level === "P2") return [...P2_SKILL_IDS];
  return [...P1_SKILL_IDS];
}

export function startingDifficultyForLevel(level: LearningLevel): 1 | 2 {
  return level === "P2" ? 2 : 1;
}

/** Stable local date key used for annual level confirmation. */
export function levelDateKey(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * Birth year is the stable input. Storing only an age snapshot means a child
 * stays six forever; deriving from birth year keeps the displayed age current.
 */
export function birthYearForAge(ageYears: number, now = new Date()): number {
  return now.getFullYear() - ageYears;
}

export function ageYearsForProfile(
  profile: Pick<ChildProfile, "ageYears" | "birthYear">,
  now = new Date()
): number {
  if (profile.birthYear === undefined) return profile.ageYears;
  return Math.min(8, Math.max(4, now.getFullYear() - profile.birthYear));
}

/**
 * A school year starts in January in Singapore. The review becomes due once the
 * calendar year changes, and stays due until a parent confirms keep or move up.
 */
export function hasAnnualLevelReviewDue(
  profile: Pick<ChildProfile, "levelConfirmedOn" | "createdAt">,
  now = new Date()
): boolean {
  const confirmed = profile.levelConfirmedOn ?? profile.createdAt.slice(0, 10);
  const confirmedYear = Number(confirmed.slice(0, 4));
  return Number.isInteger(confirmedYear) && now.getFullYear() > confirmedYear;
}

export function nextLearningLevel(level: LearningLevel): LearningLevel | null {
  if (level === "K2") return "P1";
  if (level === "P1") return "P2";
  return null;
}
