export type PinyinGroup = "initials" | "finals" | "whole";

export interface PinyinUnit {
  symbol: string;
  group: PinyinGroup;
  audioKey: string;
  subgroup?: string;
}

/**
 * 23 standard Mandarin initials (声母) mapped to unambiguous single-pronunciation
 * characters for natural neural TTS synthesis (standard primary school呼读音).
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

const PINYIN_AUDIO_LOOKUP = new Map<string, string>(
  ALL_PINYIN_UNITS.map((unit) => [unit.symbol, unit.audioKey])
);

export function getPinyinAudioKey(symbol: string): string | undefined {
  return PINYIN_AUDIO_LOOKUP.get(symbol.trim().toLowerCase());
}
