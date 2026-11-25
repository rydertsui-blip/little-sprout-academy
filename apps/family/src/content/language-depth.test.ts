import { describe, expect, it } from "vitest";
import { pinyin } from "pinyin-pro";
import { getQuestionsForSubject, SKILLS } from "./catalog";
import { AUDIO_ASSETS } from "./audioAssets";
import type { ChoiceQuestion, Question } from "../lib/types";

const isChoice = (question: Question): question is ChoiceQuestion => question.kind === "choice";
const stripTone = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
const toneFromMark = (value: string): string => {
  if ([...value].some((char) => "āēīōūǖ".includes(char))) return "第一声";
  if ([...value].some((char) => "áéíóúǘ".includes(char))) return "第二声";
  if ([...value].some((char) => "ǎěǐǒǔǚ".includes(char))) return "第三声";
  if ([...value].some((char) => "àèìòùǜ".includes(char))) return "第四声";
  throw new Error(`No tone mark in ${value}`);
};
const A_SKILLS = new Set(["mandarin-initials", "mandarin-tones", "mandarin-characters", "english-listening", "english-phonics", "english-sight-words"]);

describe("P1/P2 language depth", () => {
  for (const subject of ["mandarin", "english"] as const) {
    it(`meets target counts, template variety and response modes for every ${subject} skill`, () => {
      for (const skill of SKILLS.filter((item) => item.subject === subject)) {
        const questions = getQuestionsForSubject(subject).filter((question) => question.skillId === skill.id);
        const target = A_SKILLS.has(skill.id) ? 18 : 12;
        expect(questions.length, skill.id).toBeGreaterThanOrEqual(target);
        expect(new Set(questions.map((question) => question.template)).size, skill.id).toBeGreaterThanOrEqual(["english-listening", "english-a-an", "english-plural", "english-sentence-order", "english-spelling"].includes(skill.id) ? 2 : 3);
        expect(new Set(questions.map((question) => question.kind)).size, skill.id).toBeGreaterThanOrEqual(2);
      }
    });
  }

  it("recomputes every Mandarin initial, final, tone and syllable answer", () => {
    const questions = getQuestionsForSubject("mandarin").filter(isChoice);
    for (const question of questions.filter((item) => ["initial", "initial-family", "picture-initial"].includes(item.template))) {
      const character = question.displayCharacter;
      expect(character, question.id).toBeTruthy();
      expect(question.correctAnswer).toBe(stripTone(pinyin(character!, { pattern: "initial" })));
    }
    for (const question of questions.filter((item) => ["final", "final-family", "picture-final"].includes(item.template))) {
      const character = question.displayCharacter ?? question.prompt.match(/“(.+?)”/)?.[1];
      expect(character, question.id).toBeTruthy();
      expect(question.correctAnswer).toBe(stripTone(pinyin(character!, { pattern: "final" })));
    }
    for (const question of questions.filter((item) => ["tone", "tone-mark"].includes(item.template))) {
      const character = question.displayCharacter;
      expect(character, question.id).toBeTruthy();
      expect(question.correctAnswer).toBe(toneFromMark(pinyin(character!, { toneType: "symbol" })));
    }
    for (const question of questions.filter((item) => ["syllable", "complete-pinyin", "syllable-picture"].includes(item.template))) {
      const character = question.displayCharacter;
      expect(character, question.id).toBeTruthy();
      expect(question.correctAnswer).toBe(pinyin(character!, { toneType: "symbol" }));
    }
  });

  it("keeps English listening answers backed by bundled audio and three picture choices", () => {
    const questions = getQuestionsForSubject("english").filter((question): question is ChoiceQuestion => isChoice(question) && question.skillId === "english-listening");
    expect(questions.length).toBeGreaterThanOrEqual(18);
    for (const question of questions.filter((item) => item.template === "listen-find")) {
      expect(question.audioOnly).toBe(true);
      expect(question.audioText).toBeTruthy();
      expect(AUDIO_ASSETS[question.audioText!]).toBeTruthy();
      expect(question.options).toHaveLength(3);
      expect(Object.keys(question.optionImages ?? {})).toHaveLength(3);
      expect(question.options).toContain(question.correctAnswer);
    }
  });

  it("has exactly one correct spelling option and no duplicate answer choices", () => {
    for (const question of getQuestionsForSubject("english").filter(isChoice)) {
      expect(new Set(question.options).size, question.id).toBe(question.options.length);
      expect(question.options.filter((option) => option === question.correctAnswer), question.id).toHaveLength(1);
      if (question.template === "spelling") expect(question.correctAnswer).toBe(question.correctAnswer.toLowerCase());
    }
  });

  it("does not repeat the same prompt and answer shape inside a skill", () => {
    for (const skill of SKILLS.filter((item) => item.subject !== "math")) {
      const signatures = getQuestionsForSubject(skill.subject)
        .filter((question) => question.skillId === skill.id)
        .map((question) => question.kind === "choice"
          ? `${question.prompt}|${question.correctAnswer}|${[...question.options].sort().join("|")}`
          : question.kind === "match"
            ? `${question.prompt}|${question.pairs.map((pair) => `${pair.left}:${pair.right}`).sort().join("|")}`
            : `${question.prompt}|${question.correctOrder.join("|")}`);
      expect(new Set(signatures).size, skill.id).toBe(signatures.length);
    }
  });
});
