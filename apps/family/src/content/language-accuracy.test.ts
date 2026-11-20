import { describe, expect, it } from "vitest";
import { pinyin } from "pinyin-pro";
import { getQuestionsForSubject } from "./catalog";
import type { ChoiceQuestion, Question } from "../lib/types";

const isChoiceQuestion = (question: Question): question is ChoiceQuestion => question.kind === "choice";

const stripTone = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "");

const toneFromMark = (value: string): string => {
  if ([...value].some((char) => "āēīōūǖ".includes(char))) return "第一声";
  if ([...value].some((char) => "áéíóúǘ".includes(char))) return "第二声";
  if ([...value].some((char) => "ǎěǐǒǔǚ".includes(char))) return "第三声";
  if ([...value].some((char) => "àèìòùǜ".includes(char))) return "第四声";
  throw new Error(`No tone mark in ${value}`);
};

describe("Mandarin metadata accuracy", () => {
  it("matches every completed-syllable answer against pinyin-pro", () => {
    const syllableQuestions = getQuestionsForSubject("mandarin").filter(isChoiceQuestion).filter((question) => question.template === "syllable");
    expect(syllableQuestions).toHaveLength(6);
    for (const question of syllableQuestions) {
      expect(question.correctAnswer).toBe(pinyin(question.displayCharacter!, { toneType: "symbol" }));
    }
  });

  it("matches every tone answer against the official tone mark on the character pinyin", () => {
    const toneQuestions = getQuestionsForSubject("mandarin").filter(isChoiceQuestion).filter((question) => question.template === "tone");
    expect(toneQuestions).toHaveLength(6);
    for (const question of toneQuestions) {
      expect(question.correctAnswer).toBe(toneFromMark(pinyin(question.displayCharacter!, { toneType: "symbol" })));
      expect(question.explanation).toMatch(/第[一二三四]声/);
      expect(question.explanation).not.toContain("声调记号");
    }
  });

  it("matches initials and finals against pinyin-pro after removing tone marks", () => {
    for (const question of getQuestionsForSubject("mandarin").filter(isChoiceQuestion).filter((item) => item.template === "initial" || item.template === "final")) {
      const char = question.displayCharacter ?? question.prompt.match(/“(.+)”/)?.[1];
      expect(char).toBeTruthy();
      const pattern = question.template === "initial" ? "initial" : "final";
      const expected = stripTone(pinyin(char!, { pattern }));
      expect(question.correctAnswer).toBe(expected);
    }
  });
});
