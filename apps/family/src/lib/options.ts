import type { ChoiceQuestion } from "./types";

function hash(value: string): number {
  return Array.from(value).reduce((total, char) => total + char.charCodeAt(0), 0);
}

/**
 * Keep the correct answer at a stable, question-specific position while
 * shuffling the distractors around it. The previous implementation sorted the
 * whole option list by hash, which put most math answers in the middle.
 */
export function deterministicOptions(question: Pick<ChoiceQuestion, "id" | "options" | "correctAnswer">): string[] {
  const options = question.options.slice();
  if (options.length <= 1) return options;

  const correctIndex = hash(question.id) % options.length;
  const distractors = options
    .filter((option) => option !== question.correctAnswer)
    .sort((left, right) => hash(question.id + left) - hash(question.id + right));
  distractors.splice(correctIndex, 0, question.correctAnswer);
  return distractors;
}
