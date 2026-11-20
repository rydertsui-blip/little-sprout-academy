import type { Skill } from "../lib/types";

type SkillSeed = Omit<Skill, "officialOutcomes" | "provenanceScope">;

const M = "MOE 2021 Mathematics Syllabus (Primary 1 to 6)";
const C = "MOE 2024 Chinese Language (Primary) Syllabus";
const E = "MOE 2020 English Language (Primary) Syllabus";

const SKILL_SEEDS: SkillSeed[] = [
  { id: "math-count-100", subject: "math", title: "Numbers to 100", shortTitle: "数到100", gradeBand: "P1", description: "Counting, tens and ones, comparing numbers.", prerequisites: [], sourceDocument: M },
  { id: "math-place-value-1000", subject: "math", title: "Numbers to 1000", shortTitle: "三位数", gradeBand: "P2", description: "Hundreds, tens and ones up to 1000.", prerequisites: ["math-count-100"], sourceDocument: M },
  { id: "math-add-sub-100", subject: "math", title: "Add and subtract to 100", shortTitle: "100内加减", gradeBand: "P1", description: "Addition and subtraction within 100 without regrouping.", prerequisites: ["math-count-100"], sourceDocument: M },
  { id: "math-add-sub-regroup", subject: "math", title: "Renaming add and subtract", shortTitle: "进位退位", gradeBand: "P1-P2", description: "Addition and subtraction with carrying or borrowing.", prerequisites: ["math-add-sub-100"], sourceDocument: M },
  { id: "math-add-sub-1000", subject: "math", title: "Add and subtract to 1000", shortTitle: "三位数加减", gradeBand: "P2", description: "Three-digit addition and subtraction.", prerequisites: ["math-place-value-1000"], sourceDocument: M },
  { id: "math-multiply-tables", subject: "math", title: "Multiplication tables", shortTitle: "乘法表", gradeBand: "P1-P2", description: "Tables of 2, 3, 4, 5 and 10.", prerequisites: ["math-add-sub-100"], sourceDocument: M },
  { id: "math-divide-tables", subject: "math", title: "Division within tables", shortTitle: "表内除法", gradeBand: "P1-P2", description: "Division linked to multiplication tables.", prerequisites: ["math-multiply-tables"], sourceDocument: M },
  { id: "math-fractions", subject: "math", title: "Fractions of a whole", shortTitle: "分数", gradeBand: "P2", description: "Unit fractions, like fractions and one whole.", prerequisites: ["math-count-100"], sourceDocument: M },
  { id: "math-money", subject: "math", title: "Money", shortTitle: "钱币", gradeBand: "P1-P2", description: "Dollars, cents and simple amounts.", prerequisites: ["math-add-sub-100"], sourceDocument: M },
  { id: "math-time", subject: "math", title: "Time", shortTitle: "时间", gradeBand: "P1-P2", description: "Telling time and simple duration.", prerequisites: ["math-count-100"], sourceDocument: M },
  { id: "math-shapes", subject: "math", title: "Shapes", shortTitle: "图形", gradeBand: "P1-P2", description: "2D and 3D shape recognition and attributes.", prerequisites: [], sourceDocument: M },
  { id: "math-picture-graph", subject: "math", title: "Picture graphs", shortTitle: "统计图", gradeBand: "P1-P2", description: "Reading and comparing picture graph data.", prerequisites: ["math-count-100"], sourceDocument: M },
  { id: "math-length-measure", subject: "math", title: "Length in centimetres", shortTitle: "长度", gradeBand: "P1", description: "Measure, draw, compare and order lengths in centimetres.", prerequisites: ["math-count-100"], sourceDocument: M },
  { id: "math-fractions-add-sub", subject: "math", title: "Add and subtract like fractions", shortTitle: "同分母分数加减", gradeBand: "P2", description: "Add and subtract like fractions within one whole.", prerequisites: ["math-fractions"], sourceDocument: M },
  { id: "math-measurement-units", subject: "math", title: "Length, mass and volume units", shortTitle: "量与单位", gradeBand: "P2", description: "Use metres, kilograms, grams and litres to measure and compare.", prerequisites: ["math-count-100"], sourceDocument: M },

  { id: "mandarin-initials", subject: "mandarin", title: "Pinyin initials", shortTitle: "声母", gradeBand: "P1", description: "Recognise and identify Mandarin initials.", prerequisites: [], sourceDocument: C },
  { id: "mandarin-finals", subject: "mandarin", title: "Pinyin finals", shortTitle: "韵母", gradeBand: "P1", description: "Recognise and identify Mandarin finals.", prerequisites: ["mandarin-initials"], sourceDocument: C },
  { id: "mandarin-tones", subject: "mandarin", title: "Pinyin tones", shortTitle: "声调", gradeBand: "P1", description: "Hear and identify the four Mandarin tones.", prerequisites: ["mandarin-finals"], sourceDocument: C },
  { id: "mandarin-syllables", subject: "mandarin", title: "Pinyin syllables", shortTitle: "音节", gradeBand: "P1", description: "Match characters to complete Hanyu Pinyin.", prerequisites: ["mandarin-tones"], sourceDocument: C },
  { id: "mandarin-characters", subject: "mandarin", title: "Character recognition", shortTitle: "识字", gradeBand: "P1-P2", description: "Recognise high-frequency characters from the P1-P2 character list.", prerequisites: ["mandarin-syllables"], sourceDocument: C },
  { id: "mandarin-vocabulary", subject: "mandarin", title: "Word meaning", shortTitle: "词语", gradeBand: "P1-P2", description: "Understand common words in context.", prerequisites: ["mandarin-characters"], sourceDocument: C },
  { id: "mandarin-reading", subject: "mandarin", title: "Sentence reading", shortTitle: "读句子", gradeBand: "P1-P2", description: "Read short sentences and identify meaning.", prerequisites: ["mandarin-vocabulary"], sourceDocument: C },
  { id: "mandarin-classifiers", subject: "mandarin", title: "Classifiers", shortTitle: "量词", gradeBand: "P1-P2", description: "Use common classifiers such as 只, 朵 and 座.", prerequisites: ["mandarin-vocabulary"], sourceDocument: C },
  { id: "mandarin-word-order", subject: "mandarin", title: "Sentence order", shortTitle: "句子顺序", gradeBand: "P1-P2", description: "Choose complete and natural Mandarin sentences.", prerequisites: ["mandarin-reading"], sourceDocument: C },

  { id: "english-letters", subject: "english", title: "Letters and sounds", shortTitle: "字母音", gradeBand: "P1", description: "Letter names and beginning sounds.", prerequisites: [], sourceDocument: E },
  { id: "english-phonics", subject: "english", title: "Phonics", shortTitle: "拼读", gradeBand: "P1", description: "Sound-letter links and simple decoding.", prerequisites: ["english-letters"], sourceDocument: E },
  { id: "english-sight-words", subject: "english", title: "Sight words", shortTitle: "高频词", gradeBand: "P1-P2", description: "Read common words in short sentences.", prerequisites: ["english-letters"], sourceDocument: E },
  { id: "english-vocabulary", subject: "english", title: "Vocabulary", shortTitle: "词汇", gradeBand: "P1-P2", description: "Match common words to pictures and meaning.", prerequisites: ["english-letters"], sourceDocument: E },
  { id: "english-a-an", subject: "english", title: "A and an", shortTitle: "a / an", gradeBand: "P1", description: "Use a and an before singular nouns.", prerequisites: ["english-vocabulary"], sourceDocument: E },
  { id: "english-plural", subject: "english", title: "Simple plurals", shortTitle: "复数", gradeBand: "P1-P2", description: "Use simple plural forms with -s.", prerequisites: ["english-vocabulary"], sourceDocument: E },
  { id: "english-sentence-order", subject: "english", title: "Sentence order", shortTitle: "句子顺序", gradeBand: "P1-P2", description: "Choose a complete and grammatical sentence.", prerequisites: ["english-sight-words"], sourceDocument: E },
  { id: "english-reading", subject: "english", title: "Reading comprehension", shortTitle: "阅读理解", gradeBand: "P2", description: "Find literal information in a short text.", prerequisites: ["english-sight-words"], sourceDocument: E },
  { id: "english-spelling", subject: "english", title: "Basic spelling", shortTitle: "拼写", gradeBand: "P1-P2", description: "Choose correctly spelled high-frequency words.", prerequisites: ["english-phonics"], sourceDocument: E }
];

const OFFICIAL_OUTCOMES_BY_SKILL: Record<string, Skill["officialOutcomes"]> = {
  "math-count-100": [{ outcomeId: "MOE-MATH-P1-WN-NUM", mapping: "exact" }],
  "math-place-value-1000": [{ outcomeId: "MOE-MATH-P2-WN-NUM", mapping: "exact" }],
  "math-add-sub-100": [{ outcomeId: "MOE-MATH-P1-WN-AS", mapping: "exact" }],
  "math-add-sub-regroup": [{ outcomeId: "MOE-MATH-P1-WN-AS", mapping: "exact" }, { outcomeId: "MOE-MATH-P2-WN-AS", mapping: "exact" }],
  "math-add-sub-1000": [{ outcomeId: "MOE-MATH-P2-WN-AS", mapping: "exact" }],
  "math-multiply-tables": [{ outcomeId: "MOE-MATH-P1-WN-MD", mapping: "exact" }, { outcomeId: "MOE-MATH-P2-WN-MD", mapping: "exact" }],
  "math-divide-tables": [{ outcomeId: "MOE-MATH-P1-WN-MD", mapping: "exact" }, { outcomeId: "MOE-MATH-P2-WN-MD", mapping: "exact" }],
  "math-fractions": [{ outcomeId: "MOE-MATH-P2-FRAC-WHOLE", mapping: "exact" }],
  "math-money": [{ outcomeId: "MOE-MATH-P1-MONEY", mapping: "exact" }, { outcomeId: "MOE-MATH-P2-MONEY", mapping: "exact" }],
  "math-time": [{ outcomeId: "MOE-MATH-P1-TIME", mapping: "exact" }, { outcomeId: "MOE-MATH-P2-TIME", mapping: "exact" }],
  "math-shapes": [{ outcomeId: "MOE-MATH-P1-2D", mapping: "exact" }, { outcomeId: "MOE-MATH-P2-2D-PATTERN", mapping: "exact" }, { outcomeId: "MOE-MATH-P2-3D", mapping: "exact" }],
  "math-picture-graph": [{ outcomeId: "MOE-MATH-P1-PICGRAPH", mapping: "exact" }, { outcomeId: "MOE-MATH-P2-PICGRAPH", mapping: "exact" }],
  "math-length-measure": [{ outcomeId: "MOE-MATH-P1-LENGTH", mapping: "exact" }],
  "math-fractions-add-sub": [{ outcomeId: "MOE-MATH-P2-FRAC-AS", mapping: "exact" }],
  "math-measurement-units": [{ outcomeId: "MOE-MATH-P2-MEASURE", mapping: "exact" }],
  "mandarin-initials": [{ outcomeId: "MOE-CN-P1P2-SOUND", mapping: "exact" }],
  "mandarin-finals": [{ outcomeId: "MOE-CN-P1P2-SOUND", mapping: "exact" }],
  "mandarin-tones": [{ outcomeId: "MOE-CN-P1P2-SOUND", mapping: "exact" }],
  "mandarin-syllables": [{ outcomeId: "MOE-CN-P1P2-SOUND", mapping: "exact" }],
  "mandarin-characters": [{ outcomeId: "MOE-CN-P1P2-RECOGNITION", mapping: "exact" }, { outcomeId: "MOE-CN-P1P2-RADICALS", mapping: "exact" }],
  "mandarin-vocabulary": [{ outcomeId: "MOE-CN-P1P2-READ-UNDERSTAND", mapping: "broad" }, { outcomeId: "MOE-CN-P1P2-READ-INFER-WORD", mapping: "broad" }],
  "mandarin-reading": [{ outcomeId: "MOE-CN-P1P2-READ-DETAIL", mapping: "exact" }, { outcomeId: "MOE-CN-P1P2-READ-INFER-WORD", mapping: "broad" }],
  "mandarin-classifiers": [],
  "mandarin-word-order": [],
  "english-letters": [{ outcomeId: "MOE-EL-P1P2-READ-BEGIN", mapping: "broad" }],
  "english-phonics": [{ outcomeId: "MOE-EL-P1P2-LISTEN-SOUND", mapping: "exact" }],
  "english-sight-words": [{ outcomeId: "MOE-EL-P1P2-READ-BEGIN", mapping: "exact" }],
  "english-vocabulary": [{ outcomeId: "MOE-EL-P1P2-VOCAB-DEVELOP", mapping: "exact" }, { outcomeId: "MOE-EL-P1P2-VOCAB-USE", mapping: "exact" }],
  "english-a-an": [{ outcomeId: "MOE-EL-P1P2-GRAMMAR-WPS", mapping: "broad" }],
  "english-plural": [{ outcomeId: "MOE-EL-P1P2-GRAMMAR-WPS", mapping: "broad" }],
  "english-sentence-order": [{ outcomeId: "MOE-EL-P1P2-GRAMMAR-WPS", mapping: "broad" }],
  "english-reading": [{ outcomeId: "MOE-EL-P1P2-READ-LITERAL-INFERENTIAL", mapping: "exact" }],
  "english-spelling": [{ outcomeId: "MOE-EL-P1P2-WRITE-SPELLING", mapping: "exact" }]
};

export const SKILLS: Skill[] = SKILL_SEEDS.map((skill) => ({
  ...skill,
  officialOutcomes: OFFICIAL_OUTCOMES_BY_SKILL[skill.id] ?? [],
  provenanceScope: (OFFICIAL_OUTCOMES_BY_SKILL[skill.id]?.length ?? 0) > 0 ? "official-outcome" : "supplementary-practice"
}));
