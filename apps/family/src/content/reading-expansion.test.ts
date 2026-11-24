import { describe, expect, it } from "vitest";
import { AUDIO_ASSETS } from "./audioAssets";
import { QUESTIONS } from "./catalog";
import { SKILLS } from "./skills";
import type { ChoiceQuestion } from "../lib/types";

const NEW_READING_IDS = [
  ...Array.from({ length: 12 }, (_, index) => `q-english-reading-${19 + index}`),
  ...Array.from({ length: 12 }, (_, index) => `q-english-reading-inference-${13 + index}`)
];

const newQuestions = QUESTIONS
  .filter((question) => NEW_READING_IDS.includes(question.id))
  .filter((question): question is ChoiceQuestion => question.kind === "choice");
const newPassages = [...new Set(newQuestions.map((question) => question.passage ?? ""))];

describe("English reading expansion", () => {
  it("adds 24 questions across 8 new passages, three questions per passage", () => {
    expect(newQuestions).toHaveLength(24);
    expect(newPassages).toHaveLength(8);
    for (const passage of newPassages) {
      expect(newQuestions.filter((question) => question.passage === passage)).toHaveLength(3);
    }
  });

  it("keeps every new question choice-based and short enough for one phone screen", () => {
    for (const question of newQuestions) {
      expect(question.subject).toBe("english");
      expect(question.kind).toBe("choice");
      expect(question.options).toHaveLength(3);
      expect(question.options).toContain(question.correctAnswer);
      expect(question.passage?.split(/\s+/).length).toBeLessThanOrEqual(60);
      expect(question.instruction).toMatch(/^Read /);
    }
  });

  it("reads the question prompt, not the passage, so the answer is not spoken", () => {
    for (const question of newQuestions) {
      expect(question.audioText).toBe(question.prompt);
      expect(question.audioLanguage).toBe("en-US");
      expect(AUDIO_ASSETS[question.audioText ?? ""]).toBeDefined();
    }
  });

  it("uses passages that do not repeat any existing reading text", () => {
    const allPassages = QUESTIONS
      .filter((question) => !NEW_READING_IDS.includes(question.id))
      .map((question) => question.passage)
      .filter((passage): passage is string => Boolean(passage));
    for (const passage of newPassages) {
      expect(allPassages).not.toContain(passage);
    }
  });

  it("keeps the two reading skills at their expanded targets", () => {
    expect(SKILLS.find((skill) => skill.id === "english-reading")?.gradeBand).toBe("P2");
    expect(SKILLS.find((skill) => skill.id === "english-reading-inference")?.gradeBand).toBe("P2");
    expect(QUESTIONS.filter((question) => question.skillId === "english-reading")).toHaveLength(31);
    expect(QUESTIONS.filter((question) => question.skillId === "english-reading-inference")).toHaveLength(26);
  });
});
