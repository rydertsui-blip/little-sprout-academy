import { CONTENT_PACK } from "./release";
import { QUESTIONS } from "./catalog";
import { SKILLS } from "./skills";
import { OFFICIAL_ACTIVITIES, OFFICIAL_OUTCOMES, OFFICIAL_SOURCES } from "./officialSources";

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
      sourceDocument: skill.sourceDocument,
      provenanceScope: skill.provenanceScope,
      officialOutcomes: [...skill.officialOutcomes].sort((a, b) => a.outcomeId.localeCompare(b.outcomeId))
    }));
  const questions = [...QUESTIONS]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((question) => ({
      id: question.id,
      subject: question.subject,
      skillId: question.skillId,
      kind: question.kind,
      prompt: question.prompt,
      instruction: question.instruction,
      options: question.kind === "choice" ? question.options : null,
      correctAnswer: question.kind === "choice" ? question.correctAnswer : null,
      leftLabel: question.kind === "match" ? question.leftLabel : null,
      rightLabel: question.kind === "match" ? question.rightLabel : null,
      pairs: question.kind === "match"
        ? question.pairs.map((pair) => ({ id: pair.id, left: pair.left, right: pair.right, audioText: pair.audioText ?? null, audioLanguage: pair.audioLanguage ?? null }))
        : null,
      tokens: question.kind === "order" ? question.tokens : null,
      correctOrder: question.kind === "order" ? question.correctOrder : null,
      separator: question.kind === "order" ? (question.separator ?? null) : null,
      explanation: question.explanation,
      difficulty: question.difficulty,
      template: question.template,
      transferLevel: question.transferLevel,
      contextKey: question.contextKey,
      audit: question.audit,
      audioText: question.audioText ?? null,
      audioLanguage: question.audioLanguage ?? null,
      displayCharacter: question.displayCharacter ?? null,
      image: question.image ?? null,
      passage: question.passage ?? null
    }));
  const officialSources = [...OFFICIAL_SOURCES]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((source) => ({ ...source }));
  const officialOutcomes = [...OFFICIAL_OUTCOMES]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((outcome) => ({ ...outcome, levels: [...outcome.levels].sort(), quoteParts: outcome.quoteParts ? [...outcome.quoteParts] : undefined }));
  const officialActivities = [...OFFICIAL_ACTIVITIES]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((activity) => ({ ...activity, contentIds: [...activity.contentIds], outcomeMappings: [...activity.outcomeMappings].sort((a, b) => a.outcomeId.localeCompare(b.outcomeId)) }));
  return JSON.stringify({ pack: CONTENT_PACK, skills, questions, officialSources, officialOutcomes, officialActivities });
}
