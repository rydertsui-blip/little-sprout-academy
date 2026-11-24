import { describe, expect, it } from "vitest";
import { SKILLS } from "./skills";
import { getDepthBlueprint, missingDepthBlueprints, SKILL_DEPTH_BLUEPRINTS } from "./depthBlueprint";

describe("skill depth blueprints", () => {
  it("covers every skill exactly once", () => {
    const ids = SKILL_DEPTH_BLUEPRINTS.map((item) => item.skillId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(SKILLS.map((skill) => skill.id)));
    expect(missingDepthBlueprints()).toEqual([]);
  });

  it("requires at least twelve questions and two response modes", () => {
    for (const skill of SKILLS) {
      const blueprint = getDepthBlueprint(skill.id);
      expect(blueprint.targetItemCount, skill.id).toBeGreaterThanOrEqual(12);
      expect(blueprint.minResponseModes, skill.id).toBe(2);
      expect(blueprint.minTemplateFamilies, skill.id).toBeGreaterThanOrEqual(1);
      expect(blueprint.requiredTemplateFamilies.length, skill.id).toBeGreaterThanOrEqual(1);
      expect(blueprint.subject).toBe(skill.subject);
    }
  });

  it("throws for an unknown skill", () => {
    expect(() => getDepthBlueprint("missing-skill")).toThrow("Unknown skill blueprint");
  });
});
