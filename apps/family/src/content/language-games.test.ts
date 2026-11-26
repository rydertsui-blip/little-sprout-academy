import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getQuestionsForSubject, QUESTIONS } from "./catalog";
import { AUDIO_ASSETS } from "./audioAssets";
import { HANDWRITING_CHARACTERS, findHandwritingCharacterForQuestion } from "./handwriting";
import { SPEAKING_PROMPTS } from "./speaking";
import { evaluateSpokenTranscript } from "../screens/SpeakingScreen";
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

  it("offers expanded graded cards in each no-typing voice game with local audio", () => {
    expect(SPEAKING_PROMPTS).toHaveLength(68);
    for (const category of ["word", "organize", "read-aloud", "speaking-purpose"] as const) {
      expect(SPEAKING_PROMPTS.filter((prompt) => (prompt.category ?? "word") === category).length).toBeGreaterThanOrEqual(12);
    }
    for (const prompt of SPEAKING_PROMPTS) {
      const asset = AUDIO_ASSETS[prompt.text];
      expect(asset).toBeTruthy();
      expect(existsSync(resolve(process.cwd(), "public/assets/audio", `${asset}.m4a`))).toBe(true);
    }
  });

  it("bundles 100 graded handwriting characters with stroke data, audio, and Mandarin quiz interleaving", () => {
    expect(HANDWRITING_CHARACTERS).toHaveLength(100);
    for (const entry of HANDWRITING_CHARACTERS) {
      expect(existsSync(resolve(process.cwd(), "public/assets/hanzi", `${entry.character}.json`))).toBe(true);
      expect(AUDIO_ASSETS[entry.audioText]).toBeTruthy();
      expect(AUDIO_ASSETS[entry.introAudioText]).toBeTruthy();
      expect(existsSync(resolve(process.cwd(), "public/assets/audio", `${AUDIO_ASSETS[entry.audioText]}.m4a`))).toBe(true);
      expect(existsSync(resolve(process.cwd(), "public/assets/audio", `${AUDIO_ASSETS[entry.introAudioText]}.m4a`))).toBe(true);
    }
    const mandarinMatches = QUESTIONS.filter((q) => findHandwritingCharacterForQuestion(q) !== null);
    expect(mandarinMatches.length).toBeGreaterThanOrEqual(45);
  });

  it("evaluates spoken transcripts with pinyin-tolerant and keyword matching", () => {
    const zhPrompt = SPEAKING_PROMPTS.find((p) => p.id === "zh-read-because")!;
    expect(evaluateSpokenTranscript(zhPrompt, "因为外面下大雨，所以我们留在家里看书", true).grade).toBe("great");
    expect(evaluateSpokenTranscript(zhPrompt, "今天天气很好", false).grade).toBe("retry");

    const enPrompt = SPEAKING_PROMPTS.find((p) => p.id === "en-purpose-umbrella")!;
    expect(evaluateSpokenTranscript(enPrompt, "I took my umbrella because it was raining outside", true).grade).toBe("great");
    expect(evaluateSpokenTranscript(enPrompt, "", false).grade).toBe("retry");
  });
});
