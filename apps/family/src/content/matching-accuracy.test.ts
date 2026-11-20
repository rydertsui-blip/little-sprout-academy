import { describe, expect, it } from "vitest";
import { pinyin } from "pinyin-pro";
import { getQuestionsForSubject } from "./catalog";
import type { MatchQuestion } from "../lib/types";

const stripTone = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "");

function matchingQuestions(template: string): MatchQuestion[] {
  const questions = ["math", "mandarin", "english"].flatMap((subject) => getQuestionsForSubject(subject as "math" | "mandarin" | "english")).filter((question) => question.kind === "match" && question.template === template);
  expect(questions.length).toBeGreaterThan(0);
  return questions as MatchQuestion[];
}

function calculate(left: string): number {
  const match = left.match(/^(\d+)\s*([+−×÷])\s*(\d+)$/);
  if (!match) throw new Error(`Unsupported arithmetic expression: ${left}`);
  const first = Number(match[1]);
  const second = Number(match[3]);
  if (match[2] === "+") return first + second;
  if (match[2] === "−") return first - second;
  if (match[2] === "×") return first * second;
  return first / second;
}

function toneName(value: string): string {
  const toneMarks = [["āēīōūǖ", "第一声"], ["áéíóúǘ", "第二声"], ["ǎěǐǒǔǚ", "第三声"], ["àèìòùǜ", "第四声"]] as const;
  for (const [marks, name] of toneMarks) if ([...value].some((char) => marks.includes(char))) return name;
  throw new Error(`No tone mark in ${value}`);
}

function expectPairs(template: string, expected: Record<string, string>) {
  for (const question of matchingQuestions(template)) {
    for (const pair of question.pairs) expect(pair.right).toBe(expected[pair.left]);
  }
}

describe("matching question content accuracy", () => {
  it("recalculates number parts, arithmetic, multiplication and division pairs", () => {
    for (const question of matchingQuestions("match-number-parts")) {
      for (const pair of question.pairs) expect(calculate(pair.right)).toBe(Number(pair.left));
    }
    for (const template of ["match-add-sub-100", "match-regrouping", "match-three-digit", "match-multiplication", "match-division"]) {
      for (const question of matchingQuestions(template)) {
        for (const pair of question.pairs) expect(calculate(pair.left)).toBe(Number(pair.right));
      }
    }
  });

  it("checks place value, fractions, money and shape properties independently", () => {
    for (const question of matchingQuestions("match-place-value")) {
      for (const pair of question.pairs) {
        const digits = pair.left.padStart(3, "0").split("").map(Number);
        expect(pair.right).toBe(`${digits[0]} hundreds, ${digits[1]} tens and ${digits[2]} ones`);
      }
    }
    expectPairs("match-unit-fraction", { "1/2": "one half", "1/4": "one quarter", "1/3": "one third" });
    for (const question of matchingQuestions("match-money")) {
      for (const pair of question.pairs) {
        const amount = pair.left.replace("$", "").split(".");
        expect(Number(amount[0]) * 100 + Number(amount[1])).toBe(Number(pair.right.split(" ")[0]));
      }
    }
    expectPairs("match-shape-property", { triangle: "3 sides", square: "4 equal sides", circle: "no straight sides" });
  });

  it("checks every Mandarin matching answer against pinyin-pro or an explicit reviewed map", () => {
    for (const question of matchingQuestions("match-initial")) {
      for (const pair of question.pairs) expect(pair.right).toBe(stripTone(pinyin(pair.left, { pattern: "initial" })));
    }
    for (const question of matchingQuestions("match-final")) {
      for (const pair of question.pairs) expect(pair.right).toBe(stripTone(pinyin(pair.left, { pattern: "final" })));
    }
    for (const question of matchingQuestions("match-syllable")) {
      for (const pair of question.pairs) expect(pair.right).toBe(pinyin(pair.left, { toneType: "symbol" }));
    }
    for (const question of matchingQuestions("match-tone")) {
      for (const pair of question.pairs) expect(pair.right).toBe(toneName(pair.left));
    }
    expectPairs("match-opposites", { 大: "小", 上: "下", 多: "少" });
    expectPairs("match-word-meaning", { 苹果: "apple", 书: "book", 水: "water" });
    expectPairs("match-sentence-meaning", { "我爱妈妈。": "I love Mum.", "这是我的书。": "This is my book.", "弟弟在睡觉。": "My younger brother is sleeping." });
    expectPairs("match-classifier", { 猫: "只", 花: "朵", 山: "座" });
    expectPairs("match-missing-word", { "我每天 ___ 学校。": "去", "妈妈在厨房 ___ 饭。": "煮", "小鸟在天上 ___。": "飞" });
    expectPairs("match-animal-word", { 猫: "cat", 狗: "dog", 鸟: "bird" });
  });

  it("checks the reviewed English matching maps", () => {
    expectPairs("match-letter-case", { A: "a", B: "b", C: "c" });
    expectPairs("match-beginning-sound", { apple: "a", ball: "b", cat: "c" });
    expectPairs("match-pronoun", { I: "我", you: "你", we: "我们" });
    expectPairs("match-word-picture", { apple: "苹果", bear: "熊", fish: "鱼" });
    expectPairs("match-article", { apple: "an apple", cat: "a cat", elephant: "an elephant" });
    expectPairs("match-plural", { cat: "cats", dog: "dogs", book: "books" });
    expectPairs("match-sentence-ending", { "The cat": "is sleeping.", "The boy": "is running.", "The girls": "are reading." });
    expectPairs("match-literal-detail", { "Tom has a red ball.": "red", "The cat is on the mat.": "on the mat", "Mia likes apples.": "apples" });
    expectPairs("match-spelling-meaning", { 苹果: "apple", 熊: "bear", 鱼: "fish" });
    expectPairs("match-number-word", { one: "1", two: "2", three: "3" });
  });
});

