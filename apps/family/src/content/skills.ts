import type { Skill } from "../lib/types";

const M = "MOE 2021 Mathematics Syllabus (Primary 1 to 6)";
const C = "MOE 2024 Chinese Language (Primary) Syllabus";
const E = "MOE 2020 English Language (Primary) Syllabus";

export const SKILLS: Skill[] = [
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
