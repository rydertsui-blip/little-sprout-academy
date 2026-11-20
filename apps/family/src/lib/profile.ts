import { SKILLS } from "../content/catalog";
import { createSkillEvidence } from "../engine/bkt";
import type { ChildProfile } from "./types";

export function createChildProfile(name: string, avatar = "star", now = new Date()): ChildProfile {
  const id = `child-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
  const evidence = Object.fromEntries(SKILLS.map((skill) => [skill.id, createSkillEvidence(skill.id, now)]));
  return {
    id,
    name: name.trim(),
    avatar,
    createdAt: now.toISOString(),
    diagnostics: {},
    evidence,
    attempts: [],
    sessions: [],
    activeSessions: {},
    settings: {
      sessionLength: 8,
      enabledSkills: SKILLS.map((skill) => skill.id)
    }
  };
}
