import type { MatchPair, MatchQuestion, Skill } from "../lib/types";
import { createContentAudit } from "./audit";
import { SKILLS } from "./skills";

type PairSeed = Omit<MatchPair, "id">;

interface MatchSeed {
  skillId: string;
  prompt: string;
  instruction: string;
  explanation: string;
  template: string;
  leftLabel: string;
  rightLabel: string;
  pairs: PairSeed[];
}

const SPECS: MatchSeed[] = [
  {
    skillId: "math-count-100",
    prompt: "Match each number with its tens and ones.",
    instruction: "先点一个数字，再点对应的十位和个位。",
    explanation: "24 is 20 + 4, 38 is 30 + 8, and 67 is 60 + 7.",
    template: "match-number-parts",
    leftLabel: "Number",
    rightLabel: "Tens and ones",
    pairs: [
      { left: "24", right: "20 + 4" },
      { left: "38", right: "30 + 8" },
      { left: "67", right: "60 + 7" }
    ]
  },
  {
    skillId: "math-place-value-1000",
    prompt: "Match each number with its hundreds, tens and ones.",
    instruction: "先点数字，再点对应的位值。",
    explanation: "472 has 4 hundreds, 7 tens and 2 ones. 506 has 5 hundreds, 0 tens and 6 ones. 830 has 8 hundreds, 3 tens and 0 ones.",
    template: "match-place-value",
    leftLabel: "Number",
    rightLabel: "Place value",
    pairs: [
      { left: "472", right: "4 hundreds, 7 tens and 2 ones" },
      { left: "506", right: "5 hundreds, 0 tens and 6 ones" },
      { left: "830", right: "8 hundreds, 3 tens and 0 ones" }
    ]
  },
  {
    skillId: "math-add-sub-100",
    prompt: "Match each number sentence with its answer.",
    instruction: "先点算式，再点答案。",
    explanation: "23 + 14 = 37, 67 − 32 = 35, and 52 + 31 = 83.",
    template: "match-add-sub-100",
    leftLabel: "Number sentence",
    rightLabel: "Answer",
    pairs: [
      { left: "23 + 14", right: "37" },
      { left: "67 − 32", right: "35" },
      { left: "52 + 31", right: "83" }
    ]
  },
  {
    skillId: "math-add-sub-regroup",
    prompt: "Match each number sentence with its answer after regrouping.",
    instruction: "先点算式，再点答案。",
    explanation: "28 + 17 = 45, 52 − 27 = 25, and 43 + 29 = 72.",
    template: "match-regrouping",
    leftLabel: "Number sentence",
    rightLabel: "Answer",
    pairs: [
      { left: "28 + 17", right: "45" },
      { left: "52 − 27", right: "25" },
      { left: "43 + 29", right: "72" }
    ]
  },
  {
    skillId: "math-add-sub-1000",
    prompt: "Match each three-digit number sentence with its answer.",
    instruction: "先点算式，再点答案。",
    explanation: "238 + 341 = 579, 846 − 312 = 534, and 903 − 468 = 435.",
    template: "match-three-digit",
    leftLabel: "Number sentence",
    rightLabel: "Answer",
    pairs: [
      { left: "238 + 341", right: "579" },
      { left: "846 − 312", right: "534" },
      { left: "903 − 468", right: "435" }
    ]
  },
  {
    skillId: "math-multiply-tables",
    prompt: "Match each multiplication with its product.",
    instruction: "先点乘法，再点积。",
    explanation: "2 × 4 = 8, 4 × 3 = 12, and 5 × 6 = 30.",
    template: "match-multiplication",
    leftLabel: "Multiplication",
    rightLabel: "Product",
    pairs: [
      { left: "2 × 4", right: "8" },
      { left: "4 × 3", right: "12" },
      { left: "5 × 6", right: "30" }
    ]
  },
  {
    skillId: "math-divide-tables",
    prompt: "Match each division with its answer.",
    instruction: "先点除法，再点答案。",
    explanation: "8 ÷ 2 = 4, 15 ÷ 3 = 5, and 20 ÷ 10 = 2.",
    template: "match-division",
    leftLabel: "Division",
    rightLabel: "Answer",
    pairs: [
      { left: "8 ÷ 2", right: "4" },
      { left: "15 ÷ 3", right: "5" },
      { left: "20 ÷ 10", right: "2" }
    ]
  },
  {
    skillId: "math-fractions",
    prompt: "Match each unit fraction with its words.",
    instruction: "先点分数，再点读法。",
    explanation: "1/2 is one half, 1/4 is one quarter, and 1/3 is one third.",
    template: "match-unit-fraction",
    leftLabel: "Fraction",
    rightLabel: "Words",
    pairs: [
      { left: "1/2", right: "one half" },
      { left: "1/4", right: "one quarter" },
      { left: "1/3", right: "one third" }
    ]
  },
  {
    skillId: "math-money",
    prompt: "Match each amount of money with the same value in cents.",
    instruction: "先点金额，再点相同价值的分（cents）。",
    explanation: "$3.50 is 350 cents, $2.20 is 220 cents, and $5.05 is 505 cents.",
    template: "match-money",
    leftLabel: "Dollars",
    rightLabel: "Cents",
    pairs: [
      { left: "$3.50", right: "350 cents" },
      { left: "$2.20", right: "220 cents" },
      { left: "$5.05", right: "505 cents" }
    ]
  },
  {
    skillId: "math-shapes",
    prompt: "Match each shape with a true property.",
    instruction: "先点图形，再点它的特点。",
    explanation: "A triangle has 3 sides, a square has 4 equal sides, and a circle has no straight sides.",
    template: "match-shape-property",
    leftLabel: "Shape",
    rightLabel: "Property",
    pairs: [
      { left: "triangle", right: "3 sides" },
      { left: "square", right: "4 equal sides" },
      { left: "circle", right: "no straight sides" }
    ]
  },
  {
    skillId: "mandarin-initials",
    prompt: "把汉字和正确的声母配成一对。",
    instruction: "先点汉字，再点声母。",
    explanation: "猫 māo 的声母是 m，狗 gǒu 的声母是 g，山 shān 的声母是 sh。",
    template: "match-initial",
    leftLabel: "汉字",
    rightLabel: "声母",
    pairs: [
      { left: "猫", right: "m", audioText: "猫" },
      { left: "狗", right: "g", audioText: "狗" },
      { left: "山", right: "sh", audioText: "山" }
    ]
  },
  {
    skillId: "mandarin-finals",
    prompt: "把汉字和正确的韵母配成一对。",
    instruction: "先点汉字，再点韵母。",
    explanation: "猫 māo 的韵母是 ao，山 shān 的韵母是 an，鸟 niǎo 的韵母是 iao。",
    template: "match-final",
    leftLabel: "汉字",
    rightLabel: "韵母",
    pairs: [
      { left: "猫", right: "ao", audioText: "猫" },
      { left: "山", right: "an", audioText: "山" },
      { left: "鸟", right: "iao", audioText: "鸟" }
    ]
  },
  {
    skillId: "mandarin-tones",
    prompt: "把带声调的拼音和声调名称配成一对。",
    instruction: "先点拼音，再点声调。",
    explanation: "mā 是第一声，má 是第二声，mǎ 是第三声。",
    template: "match-tone",
    leftLabel: "拼音",
    rightLabel: "声调",
    pairs: [
      { left: "mā", right: "第一声" },
      { left: "má", right: "第二声" },
      { left: "mǎ", right: "第三声" }
    ]
  },
  {
    skillId: "mandarin-syllables",
    prompt: "把汉字和完整的拼音配成一对。",
    instruction: "先点汉字，再点拼音。",
    explanation: "人读 rén，口读 kǒu，山读 shān。",
    template: "match-syllable",
    leftLabel: "汉字",
    rightLabel: "拼音",
    pairs: [
      { left: "人", right: "rén", audioText: "人" },
      { left: "口", right: "kǒu", audioText: "口" },
      { left: "山", right: "shān", audioText: "山" }
    ]
  },
  {
    skillId: "mandarin-characters",
    prompt: "把意思相反的汉字配成一对。",
    instruction: "先点一个汉字，再点意思相反的汉字。",
    explanation: "大和小相反，上和下相反，多和少相反。",
    template: "match-opposites",
    leftLabel: "汉字",
    rightLabel: "相反意思",
    pairs: [
      { left: "大", right: "小", audioText: "大小" },
      { left: "上", right: "下", audioText: "上下" },
      { left: "多", right: "少", audioText: "多少" }
    ]
  },
  {
    skillId: "mandarin-vocabulary",
    prompt: "把词语和英文意思配成一对。",
    instruction: "先点词语，再点英文。",
    explanation: "苹果是 apple，书是 book，水是 water。",
    template: "match-word-meaning",
    leftLabel: "词语",
    rightLabel: "English",
    pairs: [
      { left: "苹果", right: "apple", audioText: "apple", audioLanguage: "en-US" },
      { left: "书", right: "book", audioText: "book", audioLanguage: "en-US" },
      { left: "水", right: "water", audioText: "water", audioLanguage: "en-US" }
    ]
  },
  {
    skillId: "mandarin-reading",
    prompt: "把华文句子和英文意思配成一对。",
    instruction: "先读华文句子，再点英文意思。",
    explanation: "我爱妈妈。是 I love Mum.；这是我的书。是 This is my book.；弟弟在睡觉。是 My younger brother is sleeping.",
    template: "match-sentence-meaning",
    leftLabel: "华文句子",
    rightLabel: "English",
    pairs: [
      { left: "我爱妈妈。", right: "I love Mum.", audioText: "我爱妈妈。" },
      { left: "这是我的书。", right: "This is my book.", audioText: "这是我的书。" },
      { left: "弟弟在睡觉。", right: "My younger brother is sleeping.", audioText: "弟弟在睡觉。" }
    ]
  },
  {
    skillId: "mandarin-classifiers",
    prompt: "把词语和合适的量词配成一对。",
    instruction: "先点词语，再点量词。",
    explanation: "一只猫、一朵花、一座山。",
    template: "match-classifier",
    leftLabel: "词语",
    rightLabel: "量词",
    pairs: [
      { left: "猫", right: "只", audioText: "一只猫" },
      { left: "花", right: "朵", audioText: "一朵花" },
      { left: "山", right: "座", audioText: "一座山" }
    ]
  },
  {
    skillId: "mandarin-word-order",
    prompt: "把句子和合适的词语配成一对。",
    instruction: "先点缺少词语的句子，再点合适的词。",
    explanation: "我每天去学校，妈妈在厨房煮饭，小鸟在天上飞。",
    template: "match-missing-word",
    leftLabel: "句子",
    rightLabel: "词语",
    pairs: [
      { left: "我每天 ___ 学校。", right: "去", audioText: "我每天去学校。" },
      { left: "妈妈在厨房 ___ 饭。", right: "煮", audioText: "妈妈在厨房煮饭。" },
      { left: "小鸟在天上 ___。", right: "飞", audioText: "小鸟在天上飞。" }
    ]
  },
  {
    skillId: "mandarin-vocabulary",
    prompt: "把动物词语和英文意思配成一对。",
    instruction: "先点词语，再点英文。",
    explanation: "猫是 cat，狗是 dog，鸟是 bird。",
    template: "match-animal-word",
    leftLabel: "词语",
    rightLabel: "English",
    pairs: [
      { left: "猫", right: "cat", audioText: "cat", audioLanguage: "en-US" },
      { left: "狗", right: "dog", audioText: "dog", audioLanguage: "en-US" },
      { left: "鸟", right: "bird", audioText: "bird", audioLanguage: "en-US" }
    ]
  },
  {
    skillId: "english-letters",
    prompt: "Match each capital letter with its lowercase letter.",
    instruction: "Tap a capital letter, then its lowercase partner.",
    explanation: "A matches a, B matches b, and C matches c.",
    template: "match-letter-case",
    leftLabel: "Capital",
    rightLabel: "Lowercase",
    pairs: [
      { left: "A", right: "a", audioText: "A, a", audioLanguage: "en-US" },
      { left: "B", right: "b", audioText: "B, b", audioLanguage: "en-US" },
      { left: "C", right: "c", audioText: "C, c", audioLanguage: "en-US" }
    ]
  },
  {
    skillId: "english-phonics",
    prompt: "Match each word with its beginning letter.",
    instruction: "Tap a word, then its beginning letter.",
    explanation: "Apple begins with a, ball begins with b, and cat begins with c.",
    template: "match-beginning-sound",
    leftLabel: "Word",
    rightLabel: "Beginning letter",
    pairs: [
      { left: "apple", right: "a", audioText: "apple", audioLanguage: "en-US" },
      { left: "ball", right: "b", audioText: "ball", audioLanguage: "en-US" },
      { left: "cat", right: "c", audioText: "cat", audioLanguage: "en-US" }
    ]
  },
  {
    skillId: "english-sight-words",
    prompt: "Match each word with its Chinese meaning.",
    instruction: "Tap an English word, then its Chinese meaning.",
    explanation: "I means 我, you means 你, and we means 我们.",
    template: "match-pronoun",
    leftLabel: "English",
    rightLabel: "中文",
    pairs: [
      { left: "I", right: "我", audioText: "I", audioLanguage: "en-US" },
      { left: "you", right: "你", audioText: "you", audioLanguage: "en-US" },
      { left: "we", right: "我们", audioText: "we", audioLanguage: "en-US" }
    ]
  },
  {
    skillId: "english-vocabulary",
    prompt: "Match each word with its Chinese meaning.",
    instruction: "Tap an English word, then its Chinese meaning.",
    explanation: "Apple is 苹果, bear is 熊, and fish is 鱼.",
    template: "match-word-picture",
    leftLabel: "English",
    rightLabel: "中文",
    pairs: [
      { left: "apple", right: "苹果", audioText: "apple", audioLanguage: "en-US" },
      { left: "bear", right: "熊", audioText: "bear", audioLanguage: "en-US" },
      { left: "fish", right: "鱼", audioText: "fish", audioLanguage: "en-US" }
    ]
  },
  {
    skillId: "english-a-an",
    prompt: "Match each noun with the correct article phrase.",
    instruction: "Tap a noun, then the phrase that uses a or an.",
    explanation: "Use an apple, a cat, and an elephant.",
    template: "match-article",
    leftLabel: "Noun",
    rightLabel: "Article phrase",
    pairs: [
      { left: "apple", right: "an apple" },
      { left: "cat", right: "a cat" },
      { left: "elephant", right: "an elephant" }
    ]
  },
  {
    skillId: "english-plural",
    prompt: "Match each singular noun with its plural.",
    instruction: "Tap one noun, then its plural.",
    explanation: "Cat becomes cats, dog becomes dogs, and book becomes books.",
    template: "match-plural",
    leftLabel: "One",
    rightLabel: "More than one",
    pairs: [
      { left: "cat", right: "cats" },
      { left: "dog", right: "dogs" },
      { left: "book", right: "books" }
    ]
  },
  {
    skillId: "english-sentence-order",
    prompt: "Match each subject with a correct ending.",
    instruction: "Tap a subject, then the ending that makes a correct sentence.",
    explanation: "The cat is sleeping, the boy is running, and the girls are reading.",
    template: "match-sentence-ending",
    leftLabel: "Subject",
    rightLabel: "Correct ending",
    pairs: [
      { left: "The cat", right: "is sleeping." },
      { left: "The boy", right: "is running." },
      { left: "The girls", right: "are reading." }
    ]
  },
  {
    skillId: "english-reading",
    prompt: "Match each sentence with the detail it gives.",
    instruction: "Read the sentence, then tap the matching detail.",
    explanation: "Tom has a red ball, the cat is on the mat, and Mia likes apples.",
    template: "match-literal-detail",
    leftLabel: "Sentence",
    rightLabel: "Detail",
    pairs: [
      { left: "Tom has a red ball.", right: "red" },
      { left: "The cat is on the mat.", right: "on the mat" },
      { left: "Mia likes apples.", right: "apples" }
    ]
  },
  {
    skillId: "english-spelling",
    prompt: "Match each Chinese word with its English spelling.",
    instruction: "Tap the Chinese word, then the correctly spelled English word.",
    explanation: "苹果 is apple, 熊 is bear, and 鱼 is fish.",
    template: "match-spelling-meaning",
    leftLabel: "中文",
    rightLabel: "English spelling",
    pairs: [
      { left: "苹果", right: "apple" },
      { left: "熊", right: "bear" },
      { left: "鱼", right: "fish" }
    ]
  },
  {
    skillId: "english-vocabulary",
    prompt: "Match each number word with its numeral.",
    instruction: "Tap the number word, then the matching numeral.",
    explanation: "One is 1, two is 2, and three is 3.",
    template: "match-number-word",
    leftLabel: "Number word",
    rightLabel: "Numeral",
    pairs: [
      { left: "one", right: "1", audioText: "one", audioLanguage: "en-US" },
      { left: "two", right: "2", audioText: "two", audioLanguage: "en-US" },
      { left: "three", right: "3", audioText: "three", audioLanguage: "en-US" }
    ]
  }
];

function createMatchQuestion(seed: MatchSeed, index: number, skills: Skill[]): MatchQuestion {
  const skill = skills.find((item) => item.id === seed.skillId);
  if (!skill) throw new Error(`Matching content references unknown skill: ${seed.skillId}`);
  const subjectIndex = SPECS.slice(0, index + 1).filter((item) => {
    const itemSkill = skills.find((candidate) => candidate.id === item.skillId);
    return itemSkill?.subject === skill.subject;
  }).length;
  return {
    id: `q-match-${skill.subject}-${subjectIndex}`,
    subject: skill.subject,
    skillId: skill.id,
    kind: "match",
    prompt: seed.prompt,
    instruction: seed.instruction,
    explanation: seed.explanation,
    difficulty: subjectIndex <= 4 ? 1 : subjectIndex <= 7 ? 2 : 3,
    template: seed.template,
    diagnostic: false,
    reviewStatus: "verified",
    audit: createContentAudit(skill),
    audioText: seed.prompt,
    audioLanguage: skill.subject === "mandarin" ? "zh-CN" : "en-US",
    leftLabel: seed.leftLabel,
    rightLabel: seed.rightLabel,
    pairs: seed.pairs.map((pair, pairIndex) => ({ ...pair, id: `q-match-${skill.subject}-${subjectIndex}-p${pairIndex + 1}` }))
  };
}

export function buildMatchingQuestions(): MatchQuestion[] {
  return SPECS.map((seed, index) => createMatchQuestion(seed, index, SKILLS));
}

