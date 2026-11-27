import { createContentAudit } from "./audit";
import { SKILLS } from "./skills";
import type { OrderQuestion, Skill, TransferLevel } from "../lib/types";

interface OrderSeed {
  id: string;
  skillId: string;
  prompt: string;
  instruction: string;
  tokens: string[];
  correctOrder: string[];
  separator?: string;
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  template: string;
  transferLevel: TransferLevel;
  contextKey: string;
  audioText?: string;
  audioLanguage?: "zh-CN" | "en-US";
  audioOnly?: boolean;
}

function makeOrderQuestion(skill: Skill, seed: OrderSeed): OrderQuestion {
  return {
    id: seed.id,
    subject: skill.subject,
    skillId: skill.id,
    kind: "order",
    prompt: seed.prompt,
    instruction: seed.instruction,
    tokens: seed.tokens,
    correctOrder: seed.correctOrder,
    separator: seed.separator,
    explanation: seed.explanation,
    difficulty: seed.difficulty,
    template: seed.template,
    transferLevel: seed.transferLevel,
    contextKey: seed.contextKey,
    diagnostic: true,
    reviewStatus: "verified",
    audit: createContentAudit(skill),
    audioText: seed.audioText ?? seed.prompt,
    audioLanguage: seed.audioLanguage ?? (skill.subject === "mandarin" ? "zh-CN" : "en-US"),
    audioOnly: seed.audioOnly
  };
}

const ORDER_SEEDS: OrderSeed[] = [
  {
    id: "q-order-mandarin-1",
    skillId: "mandarin-word-order",
    prompt: "按顺序点词语，排成一句通顺的话。",
    instruction: "依次点下面的词语，把句子拼起来。",
    tokens: ["小猫。", "我", "喜欢"],
    correctOrder: ["我", "喜欢", "小猫。"],
    separator: "",
    explanation: "正确的句子是“我喜欢小猫。”",
    difficulty: 1,
    template: "tap-order-sentence",
    transferLevel: "same-context",
    contextKey: "zh-order-cat"
  },
  {
    id: "q-order-mandarin-2",
    skillId: "mandarin-word-order",
    prompt: "按顺序点词语，排成一句通顺的话。",
    instruction: "依次点下面的词语，把句子拼起来。",
    tokens: ["学校。", "弟弟", "去"],
    correctOrder: ["弟弟", "去", "学校。"],
    separator: "",
    explanation: "正确的句子是“弟弟去学校。”",
    difficulty: 1,
    template: "tap-order-sentence",
    transferLevel: "same-context",
    contextKey: "zh-order-school"
  },
  {
    id: "q-order-mandarin-3",
    skillId: "mandarin-word-order",
    prompt: "按顺序点词语，排成一句通顺的话。",
    instruction: "依次点下面的词语，把句子拼起来。",
    tokens: ["煮饭。", "在", "妈妈", "厨房"],
    correctOrder: ["妈妈", "在", "厨房", "煮饭。"],
    separator: "",
    explanation: "正确的句子是“妈妈在厨房煮饭。”",
    difficulty: 2,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "zh-order-kitchen"
  },
  {
    id: "q-order-mandarin-4",
    skillId: "mandarin-word-order",
    prompt: "按顺序点词语，排成一句通顺的话。",
    instruction: "依次点下面的词语，把句子拼起来。",
    tokens: ["飞。", "天上", "小鸟", "在"],
    correctOrder: ["小鸟", "在", "天上", "飞。"],
    separator: "",
    explanation: "正确的句子是“小鸟在天上飞。”",
    difficulty: 2,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "zh-order-bird"
  },
  {
    id: "q-order-mandarin-5",
    skillId: "mandarin-word-order",
    prompt: "按顺序点词语，排成一句通顺的话。",
    instruction: "依次点下面的词语，把句子拼起来。",
    tokens: ["公园。", "去", "我们", "一起"],
    correctOrder: ["我们", "一起", "去", "公园。"],
    separator: "",
    explanation: "正确的句子是“我们一起去公园。”",
    difficulty: 3,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "zh-order-park"
  },
  {
    id: "q-order-english-sentence-1",
    skillId: "english-sentence-order",
    prompt: "Tap the words in order to make a sentence.",
    instruction: "Tap each word block in the right order.",
    tokens: ["apples.", "I", "like"],
    correctOrder: ["I", "like", "apples."],
    separator: " ",
    explanation: "The correct sentence is “I like apples.”",
    difficulty: 1,
    template: "tap-order-sentence",
    transferLevel: "same-context",
    contextKey: "en-order-apples"
  },
  {
    id: "q-order-english-sentence-2",
    skillId: "english-sentence-order",
    prompt: "Tap the words in order to make a sentence.",
    instruction: "Tap each word block in the right order.",
    tokens: ["small.", "cat", "The", "is"],
    correctOrder: ["The", "cat", "is", "small."],
    separator: " ",
    explanation: "The correct sentence is “The cat is small.”",
    difficulty: 2,
    template: "tap-order-sentence",
    transferLevel: "same-context",
    contextKey: "en-order-cat"
  },
  {
    id: "q-order-english-sentence-3",
    skillId: "english-sentence-order",
    prompt: "Tap the words in order to make a sentence.",
    instruction: "Tap each word block in the right order.",
    tokens: ["school.", "go", "We", "to"],
    correctOrder: ["We", "go", "to", "school."],
    separator: " ",
    explanation: "The correct sentence is “We go to school.”",
    difficulty: 2,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "en-order-school"
  },
  {
    id: "q-order-english-sentence-4",
    skillId: "english-sentence-order",
    prompt: "Tap the words in order to make a sentence.",
    instruction: "Tap each word block in the right order.",
    tokens: ["can", "bird", "fly.", "The"],
    correctOrder: ["The", "bird", "can", "fly."],
    separator: " ",
    explanation: "The correct sentence is “The bird can fly.”",
    difficulty: 2,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "en-order-bird"
  },
  {
    id: "q-order-english-sentence-5",
    skillId: "english-sentence-order",
    prompt: "Tap the words in order to make a sentence.",
    instruction: "Tap each word block in the right order.",
    tokens: ["bag.", "has", "She", "red", "a"],
    correctOrder: ["She", "has", "a", "red", "bag."],
    separator: " ",
    explanation: "The correct sentence is “She has a red bag.”",
    difficulty: 3,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "en-order-bag"
  },
  {
    id: "q-order-english-spelling-1",
    skillId: "english-spelling",
    prompt: "Listen and tap the letters to spell the word.",
    instruction: "Listen first, then tap the letters in order.",
    tokens: ["t", "c", "a", "b"],
    correctOrder: ["c", "a", "t"],
    separator: "",
    explanation: "cat is spelled c-a-t.",
    difficulty: 1,
    template: "tap-order-spell",
    transferLevel: "same-context",
    contextKey: "spell-cat",
    audioText: "cat",
    audioLanguage: "en-US",
    audioOnly: true
  },
  {
    id: "q-order-english-spelling-2",
    skillId: "english-spelling",
    prompt: "Listen and tap the letters to spell the word.",
    instruction: "Listen first, then tap the letters in order.",
    tokens: ["g", "d", "o", "p"],
    correctOrder: ["d", "o", "g"],
    separator: "",
    explanation: "dog is spelled d-o-g.",
    difficulty: 1,
    template: "tap-order-spell",
    transferLevel: "same-context",
    contextKey: "spell-dog",
    audioText: "dog",
    audioLanguage: "en-US",
    audioOnly: true
  },
  {
    id: "q-order-english-spelling-3",
    skillId: "english-spelling",
    prompt: "Listen and tap the letters to spell the word.",
    instruction: "Listen first, then tap the letters in order.",
    tokens: ["n", "s", "u", "m"],
    correctOrder: ["s", "u", "n"],
    separator: "",
    explanation: "sun is spelled s-u-n.",
    difficulty: 2,
    template: "tap-order-spell",
    transferLevel: "same-context",
    contextKey: "spell-sun",
    audioText: "sun",
    audioLanguage: "en-US",
    audioOnly: true
  },
  {
    id: "q-order-english-spelling-4",
    skillId: "english-spelling",
    prompt: "Listen and tap the letters to spell the word.",
    instruction: "Listen first, then tap the letters in order.",
    tokens: ["t", "h", "a", "r"],
    correctOrder: ["h", "a", "t"],
    separator: "",
    explanation: "hat is spelled h-a-t.",
    difficulty: 2,
    template: "tap-order-spell",
    transferLevel: "near-transfer",
    contextKey: "spell-hat",
    audioText: "hat",
    audioLanguage: "en-US",
    audioOnly: true
  },
  {
    id: "q-order-math-k2-1",
    skillId: "k2-math-count-20",
    prompt: "Tap the numbers from smallest to largest.",
    instruction: "Tap the smallest number first.",
    tokens: ["12", "3", "7"],
    correctOrder: ["3", "7", "12"],
    separator: ", ",
    explanation: "From smallest to largest: 3, 7, 12.",
    difficulty: 1,
    template: "tap-order-numbers",
    transferLevel: "same-context",
    contextKey: "order-k2-1"
  },
  {
    id: "q-order-math-k2-2",
    skillId: "k2-math-count-20",
    prompt: "Tap the numbers from smallest to largest.",
    instruction: "Tap the smallest number first.",
    tokens: ["19", "8", "15"],
    correctOrder: ["8", "15", "19"],
    separator: ", ",
    explanation: "From smallest to largest: 8, 15, 19.",
    difficulty: 2,
    template: "tap-order-numbers",
    transferLevel: "near-transfer",
    contextKey: "order-k2-2"
  },
  {
    id: "q-order-math-100-1",
    skillId: "math-count-100",
    prompt: "Tap the numbers from smallest to largest.",
    instruction: "Tap the smallest number first.",
    tokens: ["58", "24", "42"],
    correctOrder: ["24", "42", "58"],
    separator: ", ",
    explanation: "From smallest to largest: 24, 42, 58.",
    difficulty: 2,
    template: "tap-order-numbers",
    transferLevel: "same-context",
    contextKey: "order-100-1"
  },
  {
    id: "q-order-math-100-2",
    skillId: "math-count-100",
    prompt: "Tap the numbers from smallest to largest.",
    instruction: "Tap the smallest number first.",
    tokens: ["85", "39", "61"],
    correctOrder: ["39", "61", "85"],
    separator: ", ",
    explanation: "From smallest to largest: 39, 61, 85.",
    difficulty: 3,
    template: "tap-order-numbers",
    transferLevel: "near-transfer",
    contextKey: "order-100-2"
  },
  {
    id: "q-order-math-pattern-1000-1",
    skillId: "math-number-patterns-1000",
    prompt: "Tap the numbers in pattern order, counting on by 50s.",
    instruction: "Tap the smallest number first to build the pattern.",
    tokens: ["450", "350", "400", "500"],
    correctOrder: ["350", "400", "450", "500"],
    separator: ", ",
    explanation: "Counting on by 50s gives: 350, 400, 450, 500.",
    difficulty: 3,
    template: "tap-order-numbers",
    transferLevel: "near-transfer",
    contextKey: "order-pattern-1000-1"
  },
  {
    id: "q-order-mandarin-complex-1",
    skillId: "mandarin-conjunctions-complex",
    prompt: "按顺序点词块，排成一句通顺的因果复句。",
    instruction: "依次点下面的词块，把复句拼起来。",
    tokens: ["我们留在室内。", "因为下雨了，", "所以"],
    correctOrder: ["因为下雨了，", "所以", "我们留在室内。"],
    separator: "",
    explanation: "正确的因果复句是“因为下雨了，所以我们留在室内。”",
    difficulty: 3,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "zh-order-complex-rain"
  },
  {
    id: "q-order-english-connector-1",
    skillId: "english-prepositions-connectors",
    prompt: "Tap the chunks in order to make a connected sentence.",
    instruction: "Tap each block in the right order.",
    tokens: ["it was raining.", "inside", "We stayed", "because"],
    correctOrder: ["We stayed", "inside", "because", "it was raining."],
    separator: " ",
    explanation: "The correct sentence is “We stayed inside because it was raining.”",
    difficulty: 3,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "en-order-connector-rain"
  },
  {
    id: "q-order-math-olympiad-1",
    skillId: "math-olympiad-reasoning",
    prompt: "Tap the numbers to complete the growing step pattern (+2, +3, +4).",
    instruction: "Tap the numbers from smallest to largest in the pattern.",
    tokens: ["10", "3", "6", "1"],
    correctOrder: ["1", "3", "6", "10"],
    separator: ", ",
    explanation: "1 + 2 = 3, 3 + 3 = 6, and 6 + 4 = 10.",
    difficulty: 3,
    template: "tap-order-numbers",
    transferLevel: "near-transfer",
    contextKey: "order-olympiad-steps"
  },
  {
    id: "q-order-mandarin-poem-1",
    skillId: "mandarin-idioms-classics",
    prompt: "按顺序点古诗词块，拼出《静夜思》里的名句。",
    instruction: "依次点下面的词块，排成完整的两句古诗。",
    tokens: ["低头思故乡。", "举头", "望明月，"],
    correctOrder: ["举头", "望明月，", "低头思故乡。"],
    separator: "",
    explanation: "《静夜思》后两句是“举头望明月，低头思故乡。”",
    difficulty: 3,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "zh-order-poem-moon"
  },
  {
    id: "q-order-english-science-1",
    skillId: "english-science-nature",
    prompt: "Tap the stages in order to show the life cycle of a butterfly.",
    instruction: "Start from the tiny egg on a leaf.",
    tokens: ["butterfly", "egg", "pupa", "caterpillar"],
    correctOrder: ["egg", "caterpillar", "pupa", "butterfly"],
    separator: " → ",
    explanation: "A butterfly grows in order: egg → caterpillar → pupa → butterfly.",
    difficulty: 3,
    template: "tap-order-sentence",
    transferLevel: "near-transfer",
    contextKey: "en-order-butterfly-cycle"
  }
];

export function buildOrderQuestions(): OrderQuestion[] {
  const skillById = new Map(SKILLS.map((skill) => [skill.id, skill]));
  return ORDER_SEEDS.map((seed) => {
    const skill = skillById.get(seed.skillId);
    if (!skill) throw new Error(`Unknown order skill: ${seed.skillId}`);
    return makeOrderQuestion(skill, seed);
  });
}
