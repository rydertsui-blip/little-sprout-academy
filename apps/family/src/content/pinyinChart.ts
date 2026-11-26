import { pinyin } from "pinyin-pro";

export type PinyinGroup = "initials" | "finals" | "whole";

export interface PinyinUnit {
  symbol: string;
  group: PinyinGroup;
  audioKey: string;
  subgroup?: string;
}

export interface PinyinDecomposition {
  char: string;
  syllable: string;
  tone: 1 | 2 | 3 | 4;
  isWholeSyllable: boolean;
  initial: string;
  initialAudio: string;
  medial?: string;
  medialAudio?: string;
  final: string;
  baseFinal: string;
  finalAudio: string;
  syllableAudio: string;
}

/**
 * 23 standard Mandarin initials (声母) mapped to unambiguous single-pronunciation
 * characters for natural neural TTS synthesis (standard primary school 呼读音).
 */
export const PINYIN_INITIALS: readonly PinyinUnit[] = [
  { symbol: "b", group: "initials", audioKey: "波" },
  { symbol: "p", group: "initials", audioKey: "坡" },
  { symbol: "m", group: "initials", audioKey: "摸" },
  { symbol: "f", group: "initials", audioKey: "佛" },
  { symbol: "d", group: "initials", audioKey: "德" },
  { symbol: "t", group: "initials", audioKey: "特" },
  { symbol: "n", group: "initials", audioKey: "讷" },
  { symbol: "l", group: "initials", audioKey: "勒" },
  { symbol: "g", group: "initials", audioKey: "哥" },
  { symbol: "k", group: "initials", audioKey: "科" },
  { symbol: "h", group: "initials", audioKey: "喝" },
  { symbol: "j", group: "initials", audioKey: "鸡" },
  { symbol: "q", group: "initials", audioKey: "七" },
  { symbol: "x", group: "initials", audioKey: "西" },
  { symbol: "zh", group: "initials", audioKey: "知" },
  { symbol: "ch", group: "initials", audioKey: "吃" },
  { symbol: "sh", group: "initials", audioKey: "诗" },
  { symbol: "r", group: "initials", audioKey: "日" },
  { symbol: "z", group: "initials", audioKey: "资" },
  { symbol: "c", group: "initials", audioKey: "疵" },
  { symbol: "s", group: "initials", audioKey: "丝" },
  { symbol: "y", group: "initials", audioKey: "衣" },
  { symbol: "w", group: "initials", audioKey: "屋" },
];

/**
 * 24 standard Mandarin finals (韵母):
 * 6 single finals + 9 compound finals + 5 front nasal + 4 back nasal.
 */
export const PINYIN_FINALS: readonly PinyinUnit[] = [
  { symbol: "a", group: "finals", subgroup: "单韵母", audioKey: "阿" },
  { symbol: "o", group: "finals", subgroup: "单韵母", audioKey: "喔" },
  { symbol: "e", group: "finals", subgroup: "单韵母", audioKey: "婀" },
  { symbol: "i", group: "finals", subgroup: "单韵母", audioKey: "衣" },
  { symbol: "u", group: "finals", subgroup: "单韵母", audioKey: "屋" },
  { symbol: "ü", group: "finals", subgroup: "单韵母", audioKey: "迂" },
  { symbol: "ai", group: "finals", subgroup: "复韵母", audioKey: "哀" },
  { symbol: "ei", group: "finals", subgroup: "复韵母", audioKey: "诶" },
  { symbol: "ui", group: "finals", subgroup: "复韵母", audioKey: "威" },
  { symbol: "ao", group: "finals", subgroup: "复韵母", audioKey: "凹" },
  { symbol: "ou", group: "finals", subgroup: "复韵母", audioKey: "欧" },
  { symbol: "iu", group: "finals", subgroup: "复韵母", audioKey: "优" },
  { symbol: "ie", group: "finals", subgroup: "复韵母", audioKey: "耶" },
  { symbol: "üe", group: "finals", subgroup: "复韵母", audioKey: "约" },
  { symbol: "er", group: "finals", subgroup: "复韵母", audioKey: "儿" },
  { symbol: "an", group: "finals", subgroup: "前鼻韵母", audioKey: "安" },
  { symbol: "en", group: "finals", subgroup: "前鼻韵母", audioKey: "恩" },
  { symbol: "in", group: "finals", subgroup: "前鼻韵母", audioKey: "音" },
  { symbol: "un", group: "finals", subgroup: "前鼻韵母", audioKey: "温" },
  { symbol: "ün", group: "finals", subgroup: "前鼻韵母", audioKey: "晕" },
  { symbol: "ang", group: "finals", subgroup: "后鼻韵母", audioKey: "肮" },
  { symbol: "eng", group: "finals", subgroup: "后鼻韵母", audioKey: "鞥" },
  { symbol: "ing", group: "finals", subgroup: "后鼻韵母", audioKey: "英" },
  { symbol: "ong", group: "finals", subgroup: "后鼻韵母", audioKey: "嗡" },
];

/**
 * 16 standard Mandarin whole-reading syllables (整体认读音节).
 */
export const PINYIN_WHOLE_SYLLABLES: readonly PinyinUnit[] = [
  { symbol: "zhi", group: "whole", audioKey: "知" },
  { symbol: "chi", group: "whole", audioKey: "吃" },
  { symbol: "shi", group: "whole", audioKey: "诗" },
  { symbol: "ri", group: "whole", audioKey: "日" },
  { symbol: "zi", group: "whole", audioKey: "资" },
  { symbol: "ci", group: "whole", audioKey: "疵" },
  { symbol: "si", group: "whole", audioKey: "丝" },
  { symbol: "yi", group: "whole", audioKey: "衣" },
  { symbol: "wu", group: "whole", audioKey: "屋" },
  { symbol: "yu", group: "whole", audioKey: "迂" },
  { symbol: "ye", group: "whole", audioKey: "耶" },
  { symbol: "yue", group: "whole", audioKey: "约" },
  { symbol: "yuan", group: "whole", audioKey: "冤" },
  { symbol: "yin", group: "whole", audioKey: "音" },
  { symbol: "yun", group: "whole", audioKey: "晕" },
  { symbol: "ying", group: "whole", audioKey: "英" },
];

export const ALL_PINYIN_UNITS: readonly PinyinUnit[] = [
  ...PINYIN_INITIALS,
  ...PINYIN_FINALS,
  ...PINYIN_WHOLE_SYLLABLES,
];

const WHOLE_SYLLABLE_SET = new Set(PINYIN_WHOLE_SYLLABLES.map((u) => u.symbol));
const ATOMIC_FINAL_SET = new Set(PINYIN_FINALS.map((u) => u.symbol));

const PINYIN_AUDIO_LOOKUP = new Map<string, string>(
  ALL_PINYIN_UNITS.map((unit) => [unit.symbol, unit.audioKey])
);

/**
 * Strips the 4 Mandarin tone marks (macron \u0304, acute \u0301, caron \u030c, grave \u0300)
 * while preserving the umlaut diaeresis (\u0308) on ü!
 */
export function stripPinyinToneMarks(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300\u0301\u0304\u030c]/g, "")
    .normalize("NFC")
    .replace(/v/g, "ü")
    .toLowerCase()
    .trim();
}

export function getPinyinAudioKey(symbol: string): string | undefined {
  const raw = symbol.trim().toLowerCase();
  if (PINYIN_AUDIO_LOOKUP.has(raw)) return PINYIN_AUDIO_LOOKUP.get(raw);
  const stripped = stripPinyinToneMarks(raw);
  return PINYIN_AUDIO_LOOKUP.get(stripped);
}

/**
 * Preferred canonical pronunciations for characters that have multiple readings
 * when used in primary school single-character context.
 */
const PREFERRED_CHAR_PINYIN: Record<string, { syllable: string; initial: string; final: string; tone: 1 | 2 | 3 | 4 }> = {
  "大": { syllable: "dà", initial: "d", final: "à", tone: 4 },
  "长": { syllable: "cháng", initial: "ch", final: "áng", tone: 2 },
  "乐": { syllable: "lè", initial: "l", final: "è", tone: 4 },
  "好": { syllable: "hǎo", initial: "h", final: "ǎo", tone: 3 },
  "看": { syllable: "kàn", initial: "k", final: "àn", tone: 4 },
  "空": { syllable: "kōng", initial: "k", final: "ōng", tone: 1 },
  "正": { syllable: "zhèng", initial: "zh", final: "èng", tone: 4 },
  "中": { syllable: "zhōng", initial: "zh", final: "ōng", tone: 1 },
  "只": { syllable: "zhī", initial: "zh", final: "ī", tone: 1 },
  "发": { syllable: "fā", initial: "f", final: "ā", tone: 1 },
  "地": { syllable: "dì", initial: "d", final: "ì", tone: 4 },
  "少": { syllable: "shǎo", initial: "sh", final: "ǎo", tone: 3 },
};

/**
 * Dynamically decomposes any Chinese character into its initial (声母),
 * optional medial (介母 for 三拼音节 like h-u-ā -> huā), final (韵母),
 * complete syllable, and standard teacher phonetic audio keys.
 */
export function decomposeCharacterPinyin(rawChar: string): PinyinDecomposition {
  const char = Array.from(rawChar.trim()).find((c) => /[\u4e00-\u9fff]/.test(c)) ?? "爸";
  const preferred = PREFERRED_CHAR_PINYIN[char];
  const info = pinyin(char, { type: "all" })[0];

  const syllable = preferred?.syllable ?? info?.pinyin ?? "bà";
  const rawTone = preferred?.tone ?? (info?.num && info.num >= 1 && info.num <= 4 ? (info.num as 1 | 2 | 3 | 4) : 4);
  const tone: 1 | 2 | 3 | 4 = rawTone;
  const tonelessSyllable = stripPinyinToneMarks(syllable);
  const isWholeSyllable = WHOLE_SYLLABLE_SET.has(tonelessSyllable);

  let initial = preferred?.initial ?? info?.initial ?? "";
  let rawFinal = preferred?.final ?? info?.final ?? syllable;

  // Syllables starting with y or w in Hanyu Pinyin orthography
  if (!initial && (tonelessSyllable.startsWith("y") || tonelessSyllable.startsWith("w"))) {
    initial = tonelessSyllable[0];
    rawFinal = syllable.slice(1);
  }

  // Restore ü when preceded by j, q, x, y (ü 见 j q x y 去掉两点)
  const tonelessRawFinal = stripPinyinToneMarks(rawFinal);
  if (["j", "q", "x", "y"].includes(initial)) {
    if (tonelessRawFinal === "u") {
      rawFinal = rawFinal.replace(/u/i, "ü").replace(/ū/g, "ǖ").replace(/ú/g, "ǘ").replace(/ǔ/g, "ǚ").replace(/ù/g, "ǜ");
    } else if (tonelessRawFinal === "ue") {
      rawFinal = `ü${rawFinal.slice(1)}`;
    } else if (tonelessRawFinal === "un") {
      rawFinal = `ü${rawFinal.slice(1)}`;
    } else if (tonelessRawFinal === "uan") {
      rawFinal = `ü${rawFinal.slice(1)}`;
    }
  }

  const normalizedFinal = stripPinyinToneMarks(rawFinal);
  let medial: string | undefined;
  let medialAudio: string | undefined;
  let displayFinal = rawFinal;
  let baseFinal = normalizedFinal;

  // Check if it is a 3-part blend (三拼音节: e.g. huā -> h + u + ā, tián -> t + i + án, niǎo -> n + i + ǎo)
  if (!isWholeSyllable && !ATOMIC_FINAL_SET.has(normalizedFinal) && normalizedFinal.length >= 2) {
    const firstChar = normalizedFinal[0];
    const restToneless = normalizedFinal.slice(1);
    if ((firstChar === "i" || firstChar === "u" || firstChar === "ü") && ATOMIC_FINAL_SET.has(restToneless)) {
      medial = firstChar;
      medialAudio = getPinyinAudioKey(firstChar) ?? "屋";
      displayFinal = rawFinal.slice(1);
      baseFinal = restToneless;
    } else if (normalizedFinal === "iong") {
      medial = "i";
      medialAudio = "衣";
      displayFinal = rawFinal.slice(1);
      baseFinal = "ong";
    }
  }

  const initialAudio = initial ? (getPinyinAudioKey(initial) ?? "波") : (getPinyinAudioKey(baseFinal) ?? "阿");
  const finalAudio = getPinyinAudioKey(baseFinal) ?? "阿";

  return {
    char,
    syllable,
    tone,
    isWholeSyllable,
    initial,
    initialAudio,
    ...(medial ? { medial, medialAudio } : {}),
    final: displayFinal,
    baseFinal,
    finalAudio,
    syllableAudio: char,
  };
}
