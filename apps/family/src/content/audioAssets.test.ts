import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { AUDIO_ASSETS } from "./audioAssets";
import { QUESTIONS } from "./catalog";
import { SPEAKING_PROMPTS } from "./speaking";

describe("bundled audio assets", () => {
  it("maps every recorded prompt to an available offline audio file", () => {
    for (const asset of Object.values(AUDIO_ASSETS)) {
      expect(existsSync(resolve(process.cwd(), "public/assets/audio", `${asset}.m4a`))).toBe(true);
    }
  });

  it("gives every question a bundled recording", () => {
    for (const question of QUESTIONS) {
      expect(AUDIO_ASSETS[question.audioText ?? question.prompt], question.id).toBeTruthy();
    }
  });

  it("gives every audio-only question a bundled recording", () => {
    const audioOnly = QUESTIONS.filter((question) => question.audioOnly);
    expect(audioOnly.length).toBeGreaterThan(0);
    for (const question of audioOnly) {
      expect(AUDIO_ASSETS[question.audioText ?? question.prompt], question.id).toBeTruthy();
    }
  });

  it("covers every handwriting character with reviewed audio", () => {
    const expected = ["人，大人", "口，开口", "山，高山", "手，小手", "日，太阳", "月，月亮", "木，树木", "水，喝水", "火，火苗", "田，田地", "目，目光", "足，足球"];
    for (const text of expected) expect(AUDIO_ASSETS[text]).toBeTruthy();
  });

  it("covers every speaking prompt with reviewed offline audio", () => {
    for (const prompt of SPEAKING_PROMPTS) expect(AUDIO_ASSETS[prompt.text]).toBeTruthy();
  });
});
