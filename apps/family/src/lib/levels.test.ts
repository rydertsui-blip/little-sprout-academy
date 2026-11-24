import { describe, expect, it } from "vitest";
import { SKILLS } from "../content/catalog";
import { ageYearsForProfile, birthYearForAge, enabledSkillsForLevel, hasAnnualLevelReviewDue, nextLearningLevel, recommendedLevelForAge, startingDifficultyForLevel } from "./levels";

describe("age and level policy", () => {
  it("recommends a level without treating age as a confirmed grade", () => {
    expect(recommendedLevelForAge(4)).toBe("K2");
    expect(recommendedLevelForAge(5)).toBe("K2");
    expect(recommendedLevelForAge(6)).toBe("P1");
    expect(recommendedLevelForAge(7)).toBe("P2");
    expect(recommendedLevelForAge(8)).toBe("P2");
  });

  it("gives K2 a focused readiness layer, keeps K2 out of P1 and P2, and opens P1-P2 for P2", () => {
    const k2Skills = SKILLS.filter((skill) => skill.gradeBand === "K2").map((skill) => skill.id);
    const p2Only = SKILLS.filter((skill) => skill.gradeBand === "P2").map((skill) => skill.id);
    expect(enabledSkillsForLevel("K2")).toEqual(k2Skills);
    for (const level of ["P1", "P2"] as const) {
      const enabled = enabledSkillsForLevel(level);
      expect(enabled.some((skillId) => k2Skills.includes(skillId))).toBe(false);
    }
    for (const level of ["K2", "P1"] as const) {
      const enabled = enabledSkillsForLevel(level);
      expect(enabled.some((skillId) => p2Only.includes(skillId))).toBe(false);
    }
    expect(enabledSkillsForLevel("P2")).toEqual(SKILLS.filter((skill) => skill.gradeBand !== "K2").map((skill) => skill.id));
  });

  it("starts P2 at a higher first-item difficulty while keeping P1 at the foundation", () => {
    expect(startingDifficultyForLevel("K2")).toBe(1);
    expect(startingDifficultyForLevel("P1")).toBe(1);
    expect(startingDifficultyForLevel("P2")).toBe(2);
  });

  it("derives a current age from birth year instead of freezing the original age", () => {
    expect(birthYearForAge(6, new Date(2026, 10, 24))).toBe(2020);
    expect(ageYearsForProfile({ ageYears: 6, birthYear: 2020 }, new Date(2026, 10, 24))).toBe(6);
    expect(ageYearsForProfile({ ageYears: 6, birthYear: 2020 }, new Date(2027, 0, 2))).toBe(7);
  });

  it("makes the level review due in a new school year, not on a birthday", () => {
    const profile = { createdAt: "2026-01-05T00:00:00.000Z", levelConfirmedOn: "2026-01-05" };
    expect(hasAnnualLevelReviewDue(profile, new Date(2026, 11, 31))).toBe(false);
    expect(hasAnnualLevelReviewDue(profile, new Date(2027, 0, 1))).toBe(true);
  });

  it("moves up only one level and stops at P2", () => {
    expect(nextLearningLevel("K2")).toBe("P1");
    expect(nextLearningLevel("P1")).toBe("P2");
    expect(nextLearningLevel("P2")).toBeNull();
  });
});
