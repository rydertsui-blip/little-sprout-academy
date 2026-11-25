import { createContentAudit } from "./audit";
import { SKILLS } from "./skills";
import type { ChoiceQuestion, Subject, TransferLevel } from "../lib/types";

interface FarTransferRow {
  skillId: string;
  prompt: string;
  instruction: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  template: string;
  contextKey: string;
  displayCharacter?: string;
  passage?: string;
  audioText?: string;
  audioLanguage?: "zh-CN" | "en-US";
  audioOnly?: boolean;
}

const FAR_TRANSFER_ROWS: FarTransferRow[] = [
  {
    skillId: "math-two-step-problems",
    prompt: "A shop has 63 pencils. It sells 27, then gets 18 more. How many pencils are there now?",
    instruction: "Tap the final number of pencils.",
    options: ["54", "44", "108"],
    correctAnswer: "54",
    explanation: "63 − 27 = 36, then 36 + 18 = 54.",
    template: "real-world-two-step",
    contextKey: "shop-pencils"
  },
  {
    skillId: "mandarin-listening",
    prompt: "先做什么？",
    instruction: "听一听，点出答案。",
    options: ["放书", "穿鞋", "出门"],
    correctAnswer: "放书",
    explanation: "妈妈说：先把书放进书包，再穿鞋。",
    template: "real-world-listen-sequence",
    contextKey: "home-routine",
    passage: "妈妈说：先把书放进书包，再穿鞋。",
    audioText: "妈妈说：先把书放进书包，再穿鞋。",
    audioLanguage: "zh-CN",
    audioOnly: true
  },
  {
    skillId: "english-reading-inference",
    prompt: "The sky is dark and Lina hears thunder. What will she do?",
    instruction: "Tap the best answer.",
    options: ["go indoors", "go swimming", "plant flowers"],
    correctAnswer: "go indoors",
    explanation: "Dark sky and thunder suggest a storm, so Lina will go indoors.",
    template: "real-world-inference",
    contextKey: "storm",
    passage: "The sky is dark and Lina hears thunder.",
    audioText: "The sky is dark and Lina hears thunder.",
    audioLanguage: "en-US"
  },
  {
    skillId: "math-time-duration",
    prompt: "A baking class starts at 10:00 and ends at 11:30. How many minutes is the class?",
    instruction: "Tap the number of minutes.",
    options: ["60", "90", "120"],
    correctAnswer: "90",
    explanation: "From 10:00 to 11:30 is 1 hour 30 minutes, or 90 minutes.",
    template: "real-world-time-duration",
    contextKey: "baking-class"
  },
  {
    skillId: "english-listening-comprehension",
    prompt: "Why does Mia go to the sink?",
    instruction: "Listen first, then tap the answer.",
    options: ["to wash her hands", "to eat lunch", "to play outside"],
    correctAnswer: "to wash her hands",
    explanation: "Mia's hands are dirty after playing, so she goes to the sink to wash them.",
    template: "real-world-listen-inference",
    contextKey: "dirty-hands",
    passage: "Mia's hands are dirty after playing. She goes to the sink.",
    audioText: "Mia's hands are dirty after playing. She goes to the sink.",
    audioLanguage: "en-US"
  },
  {
    skillId: "mandarin-reading-inference",
    prompt: "爸爸说“外面冷”。孩子应该怎么做？",
    instruction: "读一读，选择正确答案。",
    options: ["穿上外套", "开风扇", "脱掉鞋子"],
    correctAnswer: "穿上外套",
    explanation: "外面冷，爸爸提醒孩子穿上外套。",
    template: "real-world-inference",
    contextKey: "cold-weather",
    passage: "爸爸说“外面冷”。",
    audioText: "爸爸说“外面冷”。",
    audioLanguage: "zh-CN"
  },
  {
    skillId: "k2-math-add-within-10",
    prompt: "Lina has 4 red stickers and 3 blue stickers. How many stickers does she have?",
    instruction: "Tap the total number of stickers.",
    options: ["7", "6", "8"],
    correctAnswer: "7",
    explanation: "4 + 3 = 7 stickers.",
    template: "real-world-k2-add",
    contextKey: "stickers"
  },
  {
    skillId: "k2-english-letters",
    prompt: "Lina sees the word “moon” on a sign. Which letter should she look for first?",
    instruction: "Tap the beginning letter.",
    options: ["M", "N", "O"],
    correctAnswer: "M",
    explanation: "Moon starts with M, so Lina should look for M first.",
    template: "real-world-k2-letter",
    contextKey: "sign-moon",
    audioText: "Lina sees the word moon on a sign.",
    audioLanguage: "en-US"
  },
  {
    skillId: "k2-mandarin-vocabulary",
    prompt: "妈妈说：把苹果放进书包。苹果是什么？",
    instruction: "读一读，点出答案。",
    options: ["水果", "文具", "动物"],
    correctAnswer: "水果",
    explanation: "苹果是水果。",
    template: "real-world-k2-category",
    contextKey: "pack-apple",
    passage: "妈妈说：把苹果放进书包。",
    audioText: "妈妈说：把苹果放进书包。",
    audioLanguage: "zh-CN"
  },
  {
    skillId: "k2-math-count-20",
    prompt: "A basket has 8 red balls and 5 blue balls. How many balls are there?",
    instruction: "Tap the total number of balls.",
    options: ["12", "13", "14"],
    correctAnswer: "13",
    explanation: "8 + 5 = 13 balls.",
    template: "real-world-k2-count",
    contextKey: "ball-basket"
  },
  {
    skillId: "k2-mandarin-listen",
    prompt: "苹果要放在哪里？",
    instruction: "听一听，点出答案。",
    options: ["桌上", "地上", "包里"],
    correctAnswer: "桌上",
    explanation: "妈妈说：把苹果放在桌上。",
    template: "real-world-k2-listen",
    contextKey: "home-instruction",
    passage: "妈妈说：把苹果放在桌上。",
    audioText: "妈妈说：把苹果放在桌上。",
    audioLanguage: "zh-CN",
    audioOnly: true
  },
  {
    skillId: "k2-english-listen",
    prompt: "What colour is Lina's bag?",
    instruction: "Listen first, then tap the answer.",
    options: ["red", "blue", "green"],
    correctAnswer: "red",
    explanation: "The text says Lina has a red bag.",
    template: "real-world-k2-colour",
    contextKey: "school-bag",
    passage: "Lina has a red bag. She puts two books in it.",
    audioText: "Lina has a red bag. She puts two books in it.",
    audioLanguage: "en-US",
    audioOnly: true
  },
  {
    skillId: "math-count-100",
    prompt: "A box holds 10 pencils. Four boxes and 7 loose pencils are on the table. How many pencils are there?",
    instruction: "Tap the total number of pencils.",
    options: ["47", "417", "37"],
    correctAnswer: "47",
    explanation: "Four boxes contain 40 pencils. 40 + 7 = 47.",
    template: "real-world-quantity",
    contextKey: "classroom-supplies"
  },
  {
    skillId: "math-place-value-1000",
    prompt: "A library shelf has 5 hundreds, 3 tens and 6 ones books. How many books are there?",
    instruction: "Tap the number that represents the books.",
    options: ["536", "563", "530"],
    correctAnswer: "536",
    explanation: "5 hundreds + 3 tens + 6 ones = 536.",
    template: "real-world-place-value",
    contextKey: "library-inventory"
  },
  {
    skillId: "math-add-sub-100",
    prompt: "A shop has 64 apples. It sells 28, then receives 15 more. How many apples are there now?",
    instruction: "Tap the final number of apples.",
    options: ["51", "41", "79"],
    correctAnswer: "51",
    explanation: "64 − 28 = 36, then 36 + 15 = 51.",
    template: "multi-step-story",
    contextKey: "shop-stock"
  },
  {
    skillId: "math-add-sub-regroup",
    prompt: "A jar has 53 marbles. 28 are added, then 17 are removed. How many marbles remain?",
    instruction: "Tap the final number of marbles.",
    options: ["64", "44", "98"],
    correctAnswer: "64",
    explanation: "53 + 28 = 81, then 81 − 17 = 64.",
    template: "multi-step-regroup",
    contextKey: "game-marbles"
  },
  {
    skillId: "math-add-sub-1000",
    prompt: "A town has 620 trees. It plants 195 more, then 140 trees are removed. How many trees are there now?",
    instruction: "Tap the final number of trees.",
    options: ["675", "465", "815"],
    correctAnswer: "675",
    explanation: "620 + 195 = 815, then 815 − 140 = 675.",
    template: "real-world-three-digit-change",
    contextKey: "town-trees"
  },
  {
    skillId: "math-multiply-tables",
    prompt: "There are 4 tables with 6 chairs at each table, plus 3 extra chairs. How many chairs are there?",
    instruction: "Tap the total number of chairs.",
    options: ["27", "24", "18"],
    correctAnswer: "27",
    explanation: "4 × 6 = 24, then 24 + 3 = 27.",
    template: "real-world-multiplicative",
    contextKey: "party-seating"
  },
  {
    skillId: "math-divide-tables",
    prompt: "24 cookies are shared equally into 4 boxes. Then 2 cookies are eaten from one box. How many cookies are left in that box?",
    instruction: "Tap the number of cookies left in one box.",
    options: ["4", "6", "2"],
    correctAnswer: "4",
    explanation: "24 ÷ 4 = 6. Then 6 − 2 = 4.",
    template: "multi-step-sharing",
    contextKey: "baking-boxes"
  },
  {
    skillId: "math-fractions",
    prompt: "A pizza is cut into 8 equal slices. 2 slices are eaten. What fraction of the pizza remains?",
    instruction: "Tap the fraction that remains.",
    options: ["6/8", "2/8", "8/6"],
    correctAnswer: "6/8",
    explanation: "6 of the 8 equal slices remain, so the fraction is 6/8.",
    template: "real-world-fraction",
    contextKey: "pizza-slices"
  },
  {
    skillId: "math-time",
    prompt: "A film starts at 2:35 and lasts 50 minutes. After a 10-minute break, at what minute after 3 o'clock does it finish?",
    instruction: "Tap the minute after 3 o'clock.",
    options: ["35", "25", "45"],
    correctAnswer: "35",
    explanation: "2:35 + 50 minutes = 3:25. Then 10 more minutes = 3:35.",
    template: "real-world-time-sequence",
    contextKey: "cinema-schedule"
  },
  {
    skillId: "math-shapes",
    prompt: "A box has 6 square faces. Which 3D shape is it?",
    instruction: "Tap the matching 3D shape.",
    options: ["cube", "cylinder", "sphere"],
    correctAnswer: "cube",
    explanation: "A cube has six square faces.",
    template: "real-world-shape",
    contextKey: "box-shape"
  },
  {
    skillId: "mandarin-initials",
    prompt: "“明天”的“明”读作 míng。它的声母是哪一个？",
    instruction: "选择声母。",
    options: ["m", "n", "b"],
    correctAnswer: "m",
    explanation: "明读作 míng，声母是 m。",
    template: "far-initial",
    contextKey: "new-word-tomorrow",
    displayCharacter: "明"
  },
  {
    skillId: "mandarin-finals",
    prompt: "“风”读作 fēng。它的韵母是哪一个？",
    instruction: "选择韵母。",
    options: ["eng", "en", "ong"],
    correctAnswer: "eng",
    explanation: "风读作 fēng，韵母是 eng。",
    template: "far-final",
    contextKey: "new-word-wind",
    displayCharacter: "风"
  },
  {
    skillId: "mandarin-tones",
    prompt: "“请”读作 qǐng。它是第几声？",
    instruction: "选择声调。",
    options: ["第三声", "第一声", "第四声"],
    correctAnswer: "第三声",
    explanation: "qǐng 的声调是第三声。",
    template: "far-tone",
    contextKey: "new-word-please",
    displayCharacter: "请"
  },
  {
    skillId: "mandarin-syllables",
    prompt: "“雪”读作什么？",
    instruction: "选择完整拼音。",
    options: ["xuě", "xuē", "xuè"],
    correctAnswer: "xuě",
    explanation: "雪读作 xuě。",
    template: "far-syllable",
    contextKey: "new-word-snow",
    displayCharacter: "雪"
  },
  {
    skillId: "mandarin-characters",
    prompt: "小朋友上课和读书的地方是什么？",
    instruction: "选择词语。",
    options: ["学校", "月亮", "花朵"],
    correctAnswer: "学校",
    explanation: "上课和读书的地方是学校。",
    template: "far-character-context",
    contextKey: "place-school"
  },
  {
    skillId: "mandarin-vocabulary",
    prompt: "“大”的相反词是哪一个？",
    instruction: "选择相反意思。",
    options: ["小", "多", "高"],
    correctAnswer: "小",
    explanation: "“大”和“小”是相反词。",
    template: "opposite-context",
    contextKey: "opposites"
  },
  {
    skillId: "mandarin-classifiers",
    prompt: "桌上有两 ___ 饭。",
    instruction: "选择正确量词。",
    options: ["碗", "只", "棵"],
    correctAnswer: "碗",
    explanation: "两碗饭用“碗”作量词。",
    template: "far-classifier-context",
    contextKey: "meal-table"
  },
  {
    skillId: "mandarin-word-order",
    prompt: "别人问：“你想吃什么？”哪一句回答最自然？",
    instruction: "选择完整自然的回答。",
    options: ["我想吃面。", "面想吃我。", "吃我面想。"],
    correctAnswer: "我想吃面。",
    explanation: "“我想吃面”语序完整自然。",
    template: "far-conversation-order",
    contextKey: "meal-conversation"
  },
  {
    skillId: "english-letters",
    prompt: "Which letter starts the word “ship”?",
    instruction: "Tap the beginning letter.",
    options: ["S", "H", "P"],
    correctAnswer: "S",
    explanation: "Ship starts with S.",
    template: "far-beginning-letter",
    contextKey: "transport-word",
    audioText: "ship",
    audioLanguage: "en-US"
  },
  {
    skillId: "english-listening",
    prompt: "Listen to the sentence. Which animal was in it?",
    instruction: "Tap the animal you heard in the sentence.",
    options: ["cat", "dog", "fish"],
    correctAnswer: "cat",
    explanation: "The sentence mentions a cat.",
    template: "sentence-comprehension",
    contextKey: "sentence-cat-on-mat",
    audioText: "A child says: The cat is on the mat.",
    audioLanguage: "en-US",
    audioOnly: true
  },
  {
    skillId: "english-phonics",
    prompt: "Which pair of words rhymes?",
    instruction: "Tap the rhyming pair.",
    options: ["cat and hat", "dog and sun", "fish and tree"],
    correctAnswer: "cat and hat",
    explanation: "Cat and hat both end with -at.",
    template: "rhyme-pair-transfer",
    contextKey: "rhyme-pair"
  },
  {
    skillId: "english-sight-words",
    prompt: "The sun is very ___. Which word completes the sentence?",
    instruction: "Tap the missing word.",
    options: ["hot", "hop", "house"],
    correctAnswer: "hot",
    explanation: "The sun is very hot.",
    template: "sentence-context-cloze",
    contextKey: "sun-temperature"
  },
  {
    skillId: "english-vocabulary",
    prompt: "You are thirsty. What should you drink?",
    instruction: "Tap the best answer.",
    options: ["water", "books", "flowers"],
    correctAnswer: "water",
    explanation: "Water is a drink, so drink water when you are thirsty.",
    template: "daily-context-choice",
    contextKey: "thirsty-drink"
  },
  {
    skillId: "english-a-an",
    prompt: "Choose the correct phrase: I saw ___ old owl.",
    instruction: "Tap the correct article phrase.",
    options: ["an old owl", "a old owl", "two old owl"],
    correctAnswer: "an old owl",
    explanation: "Old begins with a vowel sound, so use an.",
    template: "sentence-article",
    contextKey: "forest-animal"
  },
  {
    skillId: "english-plural",
    prompt: "There are three ___ on the desk. Choose the correct word.",
    instruction: "Tap the word that fits the sentence.",
    options: ["books", "book", "bags"],
    correctAnswer: "books",
    explanation: "Three means more than one, so use books.",
    template: "sentence-plural",
    contextKey: "desk-objects"
  },
  {
    skillId: "english-spelling",
    prompt: "The ___ shines in the sky. Which spelling is correct?",
    instruction: "Tap the correctly spelled word.",
    options: ["sun", "son", "sum"],
    correctAnswer: "sun",
    explanation: "The correctly spelled word is sun.",
    template: "sentence-spelling",
    contextKey: "sky-sun"
  }
];

function subjectFor(skillId: string): Subject {
  const skill = SKILLS.find((item) => item.id === skillId);
  if (!skill) throw new Error(`Unknown far-transfer skill: ${skillId}`);
  return skill.subject;
}

export function buildFarTransferQuestions(): ChoiceQuestion[] {
  return FAR_TRANSFER_ROWS.map((row) => {
    const skill = SKILLS.find((item) => item.id === row.skillId);
    if (!skill) throw new Error(`Unknown far-transfer skill: ${row.skillId}`);
    return {
      id: `q-far-${skill.id}`,
      subject: subjectFor(skill.id),
      skillId: skill.id,
      kind: "choice",
      prompt: row.prompt,
      instruction: row.instruction,
      options: row.options,
      correctAnswer: row.correctAnswer,
      explanation: row.explanation,
      difficulty: 5,
      template: row.template,
      transferLevel: "far-transfer" as TransferLevel,
      contextKey: row.contextKey,
      diagnostic: false,
      reviewStatus: "verified",
      audit: createContentAudit(skill),
      audioText: row.audioText ?? row.prompt,
      audioLanguage: row.audioLanguage ?? (skill.subject === "mandarin" ? "zh-CN" : "en-US"),
      audioOnly: row.audioOnly,
      displayCharacter: row.displayCharacter,
      passage: row.passage
    };
  });
}

export const FAR_TRANSFER_COUNT = FAR_TRANSFER_ROWS.length;
