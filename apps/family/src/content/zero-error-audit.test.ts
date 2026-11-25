import { describe, expect, it } from "vitest";
import { pinyin } from "pinyin-pro";
import { QUESTIONS, SKILLS } from "./catalog";
import { getAudioAsset } from "./audioAssets";
import type { ChoiceQuestion, Question } from "../lib/types";

const stripTone = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "");
const isChoice = (question: Question): question is ChoiceQuestion => question.kind === "choice";

const toneFromMark = (value: string): string => {
  if ([...value].some((char) => "āēīōūǖ".includes(char))) return "第一声";
  if ([...value].some((char) => "áéíóúǘ".includes(char))) return "第二声";
  if ([...value].some((char) => "ǎěǐǒǔǚ".includes(char))) return "第三声";
  if ([...value].some((char) => "àèìòùǜ".includes(char))) return "第四声";
  throw new Error(`No tone mark in ${value}`);
};

describe("zero-error content audit gate", () => {
  it("ensures all 817 questions have unique options (case-insensitive), no placeholders, and valid audio assets", () => {
    for (const q of QUESTIONS) {
      const texts = q.kind === "choice"
        ? [q.prompt, q.instruction, q.explanation, q.passage ?? "", ...q.options]
        : q.kind === "match"
          ? [q.prompt, q.instruction, q.explanation, ...q.pairs.flatMap((p) => [p.left, p.right])]
          : [q.prompt, q.instruction, q.explanation, ...q.tokens, ...q.correctOrder];
      const joined = texts.join(" ");
      expect(joined, `${q.id} contains placeholder`).not.toMatch(/\b(TODO|TBD|FIXME)\b|\?\?\?/);

      if (isChoice(q)) {
        const lower = new Set(q.options.map((opt) => opt.trim().toLowerCase()));
        expect(lower.size, `${q.id} has case-duplicate options`).toBe(q.options.length);
        expect(q.audioText, `${q.id} missing audioText`).toBeTruthy();
        expect(getAudioAsset(q.audioText!), `${q.id} missing packaged m4a for audioText`).toBeTruthy();
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

  it("verifies far-transfer Mandarin pinyin questions against pinyin-pro", () => {
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

  it("keeps far-transfer items out of the initial diagnostic pool", () => {
    const farDiagnostic = QUESTIONS.filter((q) => q.transferLevel === "far-transfer" && q.diagnostic);
    expect(farDiagnostic).toHaveLength(0);
    for (const subject of ["math", "mandarin", "english"] as const) {
      const diagCount = QUESTIONS.filter((q) => q.subject === subject && q.diagnostic).length;
      expect(diagCount).toBeGreaterThanOrEqual(8);
    }
    expect(SKILLS.length).toBe(46);
  });
});
