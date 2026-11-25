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
