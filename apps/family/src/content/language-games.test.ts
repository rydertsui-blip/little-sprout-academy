import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getQuestionsForSubject } from "./catalog";
import { AUDIO_ASSETS } from "./audioAssets";
import { SPEAKING_PROMPTS } from "./speaking";
import type { ChoiceQuestion } from "../lib/types";

describe("tap and voice language games", () => {
  it("provides eighteen audio-only listening questions with three picture choices", () => {
    const questions = getQuestionsForSubject("english").filter((question): question is ChoiceQuestion => question.kind === "choice" && question.skillId === "english-listening" && question.template === "listen-find");
    expect(questions).toHaveLength(18);
    for (const question of questions) {
      expect(question.audioOnly).toBe(true);
      expect(question.audioText).toBeTruthy();
      expect(question.options).toHaveLength(3);
      expect(Object.keys(question.optionImages ?? {})).toHaveLength(3);
      expect(question.options).toContain(question.correctAnswer);
    }
  });

  it("bundles local audio for every audio-only listening prompt", () => {
    const questions = getQuestionsForSubject("english").filter((question): question is ChoiceQuestion => question.kind === "choice" && question.skillId === "english-listening" && question.template === "listen-find");
    for (const question of questions) {
      const asset = AUDIO_ASSETS[question.audioText!];
      expect(asset).toBeTruthy();
      expect(existsSync(resolve(process.cwd(), "public/assets/audio", `${asset}.m4a`))).toBe(true);
    }
  });

  it("offers six cards in each no-typing voice game", () => {
    for (const category of ["organize", "read-aloud", "speaking-purpose"] as const) {
      expect(SPEAKING_PROMPTS.filter((prompt) => prompt.category === category)).toHaveLength(6);
    }
    for (const prompt of SPEAKING_PROMPTS.filter((item) => item.category)) expect(AUDIO_ASSETS[prompt.text]).toBeTruthy();
  });
});

