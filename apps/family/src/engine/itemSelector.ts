import type { Question, ResponseMode, SkillEvidence } from "../lib/types";

export interface DiverseItemInput {
  candidates: Question[];
  evidence: SkillEvidence;
  recentFamilies: string[];
  recentModes: ResponseMode[];
  targetDifficulty: 1 | 2 | 3 | 4 | 5;
  predictedSuccess: number;
  tieKey: string;
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function transferBonus(level: Question["transferLevel"]): number {
  return level === "far-transfer" ? 4 : level === "near-transfer" ? 2 : 0;
}

function itemScore(input: DiverseItemInput, question: Question): number {
  const familySeen = input.evidence.diversity.templateFamilies[question.template] ?? 0;
  const modeSeen = input.evidence.diversity.responseModes[question.kind === "match" ? "tap-match" : "tap-choice"] ?? 0;
  const recentFamilyHits = input.recentFamilies.filter((family) => family === question.template).length;
  const mode = question.kind === "match" ? "tap-match" : "tap-choice";
  const recentModeHits = input.recentModes.filter((recentMode) => recentMode === mode).length;
  const contextSeen = input.evidence.diversity.contextKeys.includes(question.contextKey);
  return -familySeen * 3
    - modeSeen * 1.5
    - recentFamilyHits * 5
    - recentModeHits * 1.5
    + (contextSeen ? 0 : 1.5)
    + transferBonus(question.transferLevel)
    - Math.abs(question.difficulty - input.targetDifficulty) * 0.8
    - Math.abs(input.predictedSuccess - 0.8) * 0.4;
}

export function selectDiverseQuestion(input: DiverseItemInput): Question | null {
  return [...input.candidates]
    .sort((a, b) => itemScore(input, b) - itemScore(input, a)
      || stableHash(`${input.tieKey}:${a.id}`) - stableHash(`${input.tieKey}:${b.id}`))[0] ?? null;
}
