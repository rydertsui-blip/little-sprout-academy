import { CONTENT_PACK } from "./release";
import { QUESTIONS } from "./catalog";
import { SKILLS } from "./skills";

export function canonicalContentPayload(): string {
  const skills = [...SKILLS]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((skill) => ({
      id: skill.id,
      subject: skill.subject,
      title: skill.title,
      shortTitle: skill.shortTitle,
      gradeBand: skill.gradeBand,
      description: skill.description,
      prerequisites: [...skill.prerequisites].sort(),
      sourceDocument: skill.sourceDocument
    }));
  const questions = [...QUESTIONS]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((question) => ({
      id: question.id,
      subject: question.subject,
      skillId: question.skillId,
      prompt: question.prompt,
      instruction: question.instruction,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty,
      template: question.template,
      audit: question.audit,
      audioText: question.audioText ?? null,
      audioLanguage: question.audioLanguage ?? null,
      displayCharacter: question.displayCharacter ?? null,
      image: question.image ?? null,
      passage: question.passage ?? null
    }));
  return JSON.stringify({ pack: CONTENT_PACK, skills, questions });
}
