import { describe, expect, it } from "vitest";
import type { ChoiceQuestion } from "./types";
import { QUESTIONS } from "../content/catalog";
import { preAnswerAudio, speechRevealsAnswer } from "./questionAudio";

function sampleChoice(): ChoiceQuestion {
  const sample = QUESTIONS.find((item) => item.kind === "choice" && item.subject === "english" && !item.audioOnly);
  if (!sample || sample.kind !== "choice") throw new Error("missing choice sample");
  return sample;
}

describe("pre-answer audio safety", () => {
  it("replaces an answer-revealing recording with a neutral instruction", () => {
    const sample = sampleChoice();
    const question: ChoiceQuestion = { ...sample, audioText: sample.correctAnswer };
    expect(speechRevealsAnswer(question, question.audioText!)).toBe(true);
    expect(preAnswerAudio(question)).toBe(question.instruction);
  });

  it("does not read a reading passage that contains the answer before the child answers", () => {
    const sample = sampleChoice();
    const question: ChoiceQuestion = {
      ...sample,
      passage: `Read this: ${sample.correctAnswer}.`,
      audioText: `Read this: ${sample.correctAnswer}.`
    };
    expect(speechRevealsAnswer(question, question.audioText!)).toBe(true);
    expect(preAnswerAudio(question)).not.toBe(question.audioText);
  });

  it("keeps audio-only listening prompts intact", () => {
    const question = QUESTIONS.find((item) => item.audioOnly);
    expect(question).toBeDefined();
    if (!question) return;
    expect(preAnswerAudio(question)).toBe(question.audioText ?? question.prompt);
  });

  it("never lets a pre-answer voice line repeat or contain a language answer", () => {
    for (const question of QUESTIONS) {
      if (question.kind !== "choice" || question.audioOnly || question.subject === "math") continue;
      const spoken = preAnswerAudio(question);
      expect(speechRevealsAnswer(question, spoken), question.id).toBe(false);
    }
  });
});
