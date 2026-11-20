import { HANDWRITING_CHARACTERS, type HandwritingCharacter } from "../content/handwriting";
import { createSkillEvidence, updateBktEvidence } from "./bkt";
import type { Attempt, ChildProfile } from "../lib/types";

export function recordHandwritingPractice(
  child: ChildProfile,
  entry: HandwritingCharacter,
  mistakes: number,
  at = new Date()
): ChildProfile {
  const skillId = "mandarin-characters";
  const questionId = `trace-${entry.character}`;
  const correct = mistakes <= 1;
  const attempt: Attempt = {
    id: `handwriting-${at.getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    childId: child.id,
    questionId,
    skillId,
    subject: "mandarin",
    correct,
    hintUsed: false,
    createdAt: at.toISOString(),
    sessionId: "handwriting-practice"
  };
  child.evidence[skillId] ??= createSkillEvidence(skillId, at);
  child.evidence[skillId] = updateBktEvidence(child.evidence[skillId], {
    correct,
    hintUsed: false,
    template: "handwriting-trace",
    questionId,
    at
  });
  child.attempts.push(attempt);
  const previous = child.handwriting[entry.character];
  child.handwriting[entry.character] = {
    character: entry.character,
    lastCompletedAt: at.toISOString(),
    bestMistakes: previous ? Math.min(previous.bestMistakes, mistakes) : mistakes,
    attempts: (previous?.attempts ?? 0) + 1
  };
  return child;
}

export function getHandwritingEntry(character: string): HandwritingCharacter | undefined {
  return HANDWRITING_CHARACTERS.find((entry) => entry.character === character);
}
