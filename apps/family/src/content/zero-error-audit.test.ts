import { describe, expect, it } from "vitest";
import { pinyin } from "pinyin-pro";
import { QUESTIONS, SKILLS, validateContentCatalog } from "./catalog";
import { subjectLocale } from "./copy";
import { hintForQuestion, teachForQuestion } from "./hints";
import { getAudioAsset } from "./audioAssets";
import { PINYIN_FINALS } from "./pinyinChart";
import type { ChoiceQuestion, Question } from "../lib/types";

const stripTone = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
const isChoice = (question: Question): question is ChoiceQuestion => question.kind === "choice";
const STANDARD_FINALS = new Set(PINYIN_FINALS.map((u) => u.symbol));

const toneFromMark = (value: string): string => {
  if ([...value].some((char) => "āēīōūǖ".includes(char))) return "第一声";
  if ([...value].some((char) => "áéíóúǘ".includes(char))) return "第二声";
  if ([...value].some((char) => "ǎěǐǒǔǚ".includes(char))) return "第三声";
  if ([...value].some((char) => "àèìòùǜ".includes(char))) return "第四声";
  throw new Error(`No tone mark in ${value}`);
};

describe("zero-error content audit gate", () => {
  it("ensures all 1052 questions have unique options (case-insensitive), explicit audioLanguage, no visual leaks, no placeholders, and valid audio assets for prompts, hints, teach cards, and explanations", () => {
    expect(QUESTIONS).toHaveLength(1052);
    expect(validateContentCatalog()).toEqual([]);

    for (const q of QUESTIONS) {
      expect(q.audioLanguage, `${q.id} missing audioLanguage`).toBeDefined();

      const texts = q.kind === "choice"
        ? [q.prompt, q.instruction, q.explanation, q.passage ?? "", ...q.options]
        : q.kind === "match"
          ? [q.prompt, q.instruction, q.explanation, ...q.pairs.flatMap((p) => [p.left, p.right])]
          : [q.prompt, q.instruction, q.explanation, ...q.tokens, ...q.correctOrder];
      const joined = texts.join(" ");
      expect(joined, `${q.id} contains placeholder`).not.toMatch(/\b(TODO|TBD|FIXME)\b|\?\?\?/);

      const locale = subjectLocale(q.subject);
      const hint = hintForQuestion(q, locale);
      expect(getAudioAsset(hint), `${q.id} missing packaged m4a for hint "${hint}"`).toBeTruthy();
      expect(getAudioAsset(q.explanation), `${q.id} missing packaged m4a for explanation "${q.explanation}"`).toBeTruthy();

      const teach = teachForQuestion(q, locale);
      expect(teach, `${q.id} missing teach card for skill ${q.skillId}`).not.toBeNull();
      if (teach) {
        const sep = locale === "en" ? ". " : "。";
        const teachText = `${teach.title}${sep}${teach.body}${teach.example ? `${sep}${teach.example}` : ""}`;
        expect(getAudioAsset(teachText), `${q.id} missing packaged m4a for teach card`).toBeTruthy();
      }

      if (isChoice(q)) {
        const lower = new Set(q.options.map((opt) => opt.trim().toLowerCase()));
        expect(lower.size, `${q.id} has case-duplicate options`).toBe(q.options.length);
        if (q.displayCharacter) {
          expect(q.displayCharacter.trim(), `${q.id} displayCharacter leaks answer`).not.toBe(q.correctAnswer.trim());
        }
        expect(q.audioText, `${q.id} missing audioText`).toBeTruthy();
        expect(getAudioAsset(q.audioText!), `${q.id} missing packaged m4a for audioText "${q.audioText}"`).toBeTruthy();
      } else if (q.kind === "match") {
        for (const pair of q.pairs) {
          if (pair.audioText) {
            expect(getAudioAsset(pair.audioText), `${q.id} pair ${pair.id} missing m4a`).toBeTruthy();
          }
        }
      } else {
        expect(q.audioText, `${q.id} missing audioText`).toBeTruthy();
        expect(getAudioAsset(q.audioText!), `${q.id} missing packaged m4a for audioText`).toBeTruthy();
      }
    }
  });

  it("verifies Mandarin pinyin finals belong to the 24 standard finals chart and far-transfer pinyin matches pinyin-pro", () => {
    for (const q of QUESTIONS) {
      if (isChoice(q) && q.skillId === "mandarin-finals" && ["final", "final-family", "picture-final", "far-final"].includes(q.template)) {
        expect(STANDARD_FINALS.has(q.correctAnswer), `${q.id} final ${q.correctAnswer} not in 24-final chart`).toBe(true);
      }
      if (q.kind === "match" && q.template === "match-final") {
        for (const pair of q.pairs) {
          expect(STANDARD_FINALS.has(pair.right), `${q.id} pair ${pair.right} not in 24-final chart`).toBe(true);
        }
      }
    }

    const farMandarin = QUESTIONS.filter(isChoice).filter((q) => q.transferLevel === "far-transfer" && q.subject === "mandarin");
    for (const q of farMandarin) {
      if (q.template === "far-initial" && q.displayCharacter) {
        expect(q.correctAnswer).toBe(stripTone(pinyin(q.displayCharacter, { pattern: "initial" })));
      } else if (q.template === "far-final" && q.displayCharacter) {
        expect(q.correctAnswer).toBe(stripTone(pinyin(q.displayCharacter, { pattern: "final" })));
      } else if (q.template === "far-tone" && q.displayCharacter) {
        expect(q.correctAnswer).toBe(toneFromMark(pinyin(q.displayCharacter, { toneType: "symbol" })));
      } else if (q.template === "far-syllable" && q.displayCharacter) {
        expect(q.correctAnswer).toBe(pinyin(q.displayCharacter, { toneType: "symbol" }));
      }
    }
  });

  it("keeps far-transfer and difficulty-5 items out of the initial diagnostic pool", () => {
    const farDiagnostic = QUESTIONS.filter((q) => (q.transferLevel === "far-transfer" || q.difficulty >= 5) && q.diagnostic);
    expect(farDiagnostic).toHaveLength(0);
    for (const subject of ["math", "mandarin", "english"] as const) {
      const diagCount = QUESTIONS.filter((q) => q.subject === subject && q.diagnostic).length;
      expect(diagCount).toBeGreaterThanOrEqual(8);
    }
    expect(SKILLS.length).toBe(59);
  });
});
