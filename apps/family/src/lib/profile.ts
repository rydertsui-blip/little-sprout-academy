import { SKILLS } from "../content/catalog";
import { createSkillEvidence } from "../engine/bkt";
import { createRewardState } from "../rewards/rewardState";
import { P2_SKILL_IDS, birthYearForAge, enabledSkillsForLevel, levelDateKey, recommendedLevelForAge } from "./levels";
import type { ChildProfile, LearningLevel } from "./types";

export function createChildProfile(
  name: string,
  avatar = "star",
  now = new Date(),
  ageYears?: number,
  gradeLevel?: LearningLevel
): ChildProfile {
  const id = `child-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  const evidence = Object.fromEntries(SKILLS.map((skill) => [skill.id, createSkillEvidence(skill.id, now)]));
  // Legacy callers/tests did not pass age. Keep their previous full scope; the
  // product UI always passes an age and a confirmed level.
  const effectiveAge = ageYears ?? 6;
  const effectiveLevel = gradeLevel ?? (ageYears === undefined ? "P2" : recommendedLevelForAge(effectiveAge));
  const enabledSkills = ageYears === undefined ? [...P2_SKILL_IDS] : enabledSkillsForLevel(effectiveLevel);
  return {
    id,
    name: name.trim(),
    avatar,
    ageYears: effectiveAge,
    birthYear: birthYearForAge(effectiveAge, now),
    gradeLevel: effectiveLevel,
    levelConfirmedOn: levelDateKey(now),
    createdAt: now.toISOString(),
    diagnostics: {},
    evidence,
    attempts: [],
    sessions: [],
    activeSessions: {},
    handwriting: {},
    rewards: createRewardState(),
    settings: {
      sessionLength: 8,
      enabledSkills,
      highContrast: false,
      largeText: false,
      rewardsEnabled: true,
      companionAnimationsEnabled: true
    }
  };
}
