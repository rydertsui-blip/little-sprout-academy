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
    skillId: "math-two-step-problems",
    prompt: "Match each two-step expression with its answer.",
    instruction: "Tap an expression on the left, then its answer on the right.",
    explanation: "24 + 9 − 5 = 28, 4 × 6 + 3 = 27, and $2 plus 50 cents is 250 cents.",
    template: "match-two-step",
    leftLabel: "Expression",
    rightLabel: "Answer",
    pairs: [
      { left: "24 + 9 − 5", right: "28" },
      { left: "4 × 6 + 3", right: "27" },
      { left: "$2 + 50 cents", right: "250 cents" }
    ]
  },
  {
    skillId: "mandarin-listening",
    prompt: "听一听词语，再连到正确的意思。",
    instruction: "先点左边听词语，再点右边它表示的是人物、地方还是动作。",
    explanation: "“小明”是一个人的名字（人物），“厨房”是一个地方，“看书”是一个动作。",
    template: "match-listen-wh",
    leftLabel: "听到的词语",
    rightLabel: "表示什么",
    pairs: [
      { left: "小明", right: "人物（谁）", audioText: "小明", audioLanguage: "zh-CN" },
      { left: "厨房", right: "地方（哪里）", audioText: "厨房", audioLanguage: "zh-CN" },
      { left: "看书", right: "动作（做什么）", audioText: "看书", audioLanguage: "zh-CN" }
    ]
  },
  {
    skillId: "english-reading-inference",
    prompt: "Match each clue with the action it suggests.",
    instruction: "Tap a clue on the left, then the matching action on the right.",
    explanation: "Dark clouds suggest taking an umbrella, an empty cup suggests getting water, and dirty hands suggest washing hands.",
    template: "match-inference",
    leftLabel: "Clue",
    rightLabel: "Action",
    pairs: [
      { left: "dark clouds", right: "take an umbrella" },
      { left: "empty cup", right: "get water" },
      { left: "dirty hands", right: "wash hands" }
    ]
  },
  {
    skillId: "k2-math-count-20",
    prompt: "Match each number with the same number of dots.",
    instruction: "Tap a number on the left, then its dots on the right.",
    explanation: "3 matches 3 dots, 5 matches 5 dots, and 7 matches 7 dots.",
    template: "match-k2-number",
    leftLabel: "Number",
    rightLabel: "Dots",
    pairs: [
      { left: "3", right: "3 dots" },
      { left: "5", right: "5 dots" },
      { left: "7", right: "7 dots" }
    ]
  },
  {
    skillId: "k2-mandarin-listen",
    prompt: "把听到的词语和对应的图片词语连起来。",
    instruction: "先听左边的词语，再点右边对应的图片词语。",
    explanation: "猫、狗、鸟和它们的图片配对。",
    template: "match-listen-word",
    leftLabel: "听到的词语",
    rightLabel: "图片词语",
    pairs: [
      { left: "猫", right: "猫", audioText: "猫", audioLanguage: "zh-CN", rightImage: "cat" },
      { left: "狗", right: "狗", audioText: "狗", audioLanguage: "zh-CN", rightImage: "dog" },
      { left: "鸟", right: "鸟", audioText: "鸟", audioLanguage: "zh-CN", rightImage: "bird" }
    ]
  },
  {
    skillId: "k2-english-listen",
    prompt: "Match each word with its beginning letter.",
    instruction: "Tap a word on the left, then its beginning letter on the right.",
    explanation: "Cat starts with C, sun starts with S, and moon starts with M.",
    template: "match-k2-letter",
    leftLabel: "Word",
    rightLabel: "Beginning letter",
    pairs: [
      { left: "cat", right: "C" },
      { left: "sun", right: "S" },
      { left: "moon", right: "M" }
    ]
  },
  {
    skillId: "k2-math-add-within-10",
    prompt: "Match each number sentence with its answer.",
    instruction: "Tap a number sentence on the left, then its answer on the right.",
    explanation: "3 + 2 = 5, 6 − 2 = 4, and 4 + 4 = 8.",
    template: "match-k2-add-sub",
    leftLabel: "Number sentence",
    rightLabel: "Answer",
    pairs: [
      { left: "3 + 2", right: "5" },
      { left: "6 − 2", right: "4" },
      { left: "4 + 4", right: "8" }
    ]
  },
  {
    skillId: "k2-english-letters",
    prompt: "Match each capital letter with its small letter.",
    instruction: "Tap a capital letter on the left, then its small letter on the right.",
    explanation: "A matches a, D matches d, and S matches s.",
    template: "match-k2-letter-case",
    leftLabel: "Capital letter",
    rightLabel: "Small letter",
    pairs: [
      { left: "A", right: "a" },
      { left: "D", right: "d" },
      { left: "S", right: "s" }
    ]
  },
  {
    skillId: "k2-mandarin-vocabulary",
    prompt: "把词语和类别连起来。",
    instruction: "先点左边的词语，再点右边对应的类别。",
    explanation: "苹果是水果，铅笔是文具，小狗是动物。",
    template: "match-k2-category",
    leftLabel: "词语",
    rightLabel: "类别",
    pairs: [
      { left: "苹果", right: "水果" },
      { left: "铅笔", right: "文具" },
      { left: "小狗", right: "动物" }
    ]
  },
  {
    skillId: "math-time-duration",
    prompt: "Match each duration with the number of minutes.",
    instruction: "Tap a duration on the left, then its number of minutes on the right.",
    explanation: "1 hour is 60 minutes, half an hour is 30 minutes, and a quarter of an hour is 15 minutes.",
    template: "match-time-duration",
    leftLabel: "Duration",
    rightLabel: "Minutes",
    pairs: [
      { left: "1 hour", right: "60 minutes" },
      { left: "half an hour", right: "30 minutes" },
      { left: "a quarter of an hour", right: "15 minutes" }
    ]
  },
  {
    skillId: "english-listening-comprehension",
    prompt: "Match each question word with what it asks about.",
    instruction: "Tap a question word on the left, then what it asks about on the right.",
    explanation: "Who asks about a person, where asks about a place, and when asks about a time.",
    template: "match-listen-wh-english",
    leftLabel: "Question word",
    rightLabel: "What it asks about",
    pairs: [
      { left: "who", right: "a person" },
      { left: "where", right: "a place" },
      { left: "when", right: "a time" }
    ]
  },
  {
    skillId: "mandarin-reading-inference",
    prompt: "把心情和原因连起来。",
    instruction: "先点左边的句子，再点右边对应的原因。",
    explanation: "哥哥愿意一起玩，小华想帮忙，小丽找不到书包所以着急。",
    template: "match-inference-reason",
    leftLabel: "句子",
    rightLabel: "原因",
    pairs: [
      { left: "哥哥说没关系", right: "他愿意一起玩" },
      { left: "小华扶同学", right: "他想帮忙" },
      { left: "小丽很着急", right: "她找不到书包" }
    ]
  },
  {
    skillId: "math-count-100",
    prompt: "Match each number with its tens and ones.",
    instruction: "Tap a number on the left, then its tens and ones on the right.",
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
    instruction: "Tap a number, then its hundreds, tens and ones.",
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
    instruction: "Tap a number sentence, then its answer.",
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
    instruction: "Tap a number sentence, then its answer.",
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
    instruction: "Tap a number sentence, then its answer.",
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
    instruction: "Tap a multiplication, then its product.",
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
    instruction: "Tap a division, then its answer.",
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
    instruction: "Tap a fraction, then how you read it.",
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
    instruction: "Tap an amount, then its value in cents.",
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
    instruction: "Tap a shape, then a true property.",
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
    explanation: "猫 māo 的韵母是 ao，山 shān 的韵母是 an，书 shū 的韵母是 u。",
    template: "match-final",
    leftLabel: "汉字",
    rightLabel: "韵母",
    pairs: [
      { left: "猫", right: "ao", audioText: "猫" },
      { left: "山", right: "an", audioText: "山" },
      { left: "书", right: "u", audioText: "书" }
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
    prompt: "把词语和它的类别配成一对。",
    instruction: "先点词语，再点类别。",
    explanation: "苹果是水果，书是学习用品，水是饮品。",
    template: "match-word-category",
    leftLabel: "词语",
    rightLabel: "类别",
    pairs: [
      { left: "苹果", right: "水果" },
      { left: "书", right: "学习用品" },
      { left: "水", right: "饮品" }
    ]
  },
  {
    skillId: "mandarin-reading",
    prompt: "把句子和它能回答的问题配成一对。",
    instruction: "先读句子，再点它回答的问题。",
    explanation: "“我爱妈妈”回答“你爱谁？”；“这是我的书”回答“这是谁的书？”；“弟弟在睡觉”回答“弟弟在做什么？”。",
    template: "match-sentence-question",
    leftLabel: "句子",
    rightLabel: "问题",
    pairs: [
      { left: "我爱妈妈。", right: "你爱谁？" },
      { left: "这是我的书。", right: "这是谁的书？" },
      { left: "弟弟在睡觉。", right: "弟弟在做什么？" }
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
    prompt: "把动物和它的本领配成一对。",
    instruction: "先点动物，再点它的本领。",
    explanation: "猫会捉老鼠，狗会看家，鸟会飞。",
    template: "match-animal-ability",
    leftLabel: "动物",
    rightLabel: "本领",
    pairs: [
      { left: "猫", right: "会捉老鼠" },
      { left: "狗", right: "会看家" },
      { left: "鸟", right: "会飞" }
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
    prompt: "Match each word with the sentence where it fits.",
    instruction: "Tap a word, then the sentence that uses it.",
    explanation: "I like apples. You are my friend. We go to school.",
    template: "match-sight-word-sentence",
    leftLabel: "Word",
    rightLabel: "Sentence",
    pairs: [
      { left: "I", right: "___ like apples.", audioText: "I", audioLanguage: "en-US" },
      { left: "you", right: "___ are my friend.", audioText: "you", audioLanguage: "en-US" },
      { left: "we", right: "___ go to school.", audioText: "we", audioLanguage: "en-US" }
    ]
  },
  {
    skillId: "english-vocabulary",
    prompt: "Match each word with its meaning.",
    instruction: "Tap a word, then the meaning that fits.",
    explanation: "An apple is a fruit, a bear is a big furry animal, and a fish swims in water.",
    template: "match-word-definition",
    leftLabel: "Word",
    rightLabel: "Meaning",
    pairs: [
      { left: "apple", right: "a fruit", audioText: "apple", audioLanguage: "en-US" },
      { left: "bear", right: "a big furry animal", audioText: "bear", audioLanguage: "en-US" },
      { left: "fish", right: "an animal that swims", audioText: "fish", audioLanguage: "en-US" }
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
    prompt: "Match each word with the letters that complete it.",
    instruction: "Tap the word with a gap, then the letters that complete it.",
    explanation: "app + le = apple, b + ea + r = bear, and f + is + h = fish.",
    template: "match-spelling-parts",
    leftLabel: "Word with a gap",
    rightLabel: "Missing letters",
    pairs: [
      { left: "app__", right: "le" },
      { left: "b__r", right: "ea" },
      { left: "f__h", right: "is" }
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
  },
  {
    skillId: "math-time",
    prompt: "Match each digital time with the minutes after the hour.",
    instruction: "Tap a time, then the minutes after the hour.",
    explanation: "8:20 is 20 minutes after 8, 9:45 is 45 minutes after 9, and 2:05 is 5 minutes after 2.",
    template: "match-time-minutes",
    leftLabel: "Time",
    rightLabel: "Minutes after the hour",
    pairs: [
      { left: "8:20", right: "20 minutes" },
      { left: "9:45", right: "45 minutes" },
      { left: "2:05", right: "5 minutes" }
    ]
  },
  {
    skillId: "math-picture-graph",
    prompt: "Match each graph comparison with its answer.",
    instruction: "Tap a comparison, then the correct difference.",
    explanation: "8 apples and 5 pears means 3 more apples. 10 cars and 7 bicycles means 3 fewer bicycles. 6 stars and 2 moons means 4 more stars.",
    template: "match-graph-difference",
    leftLabel: "Graph comparison",
    rightLabel: "Difference",
    pairs: [
      { left: "8 apples, 5 pears", right: "3 more apples" },
      { left: "10 cars, 7 bicycles", right: "3 fewer bicycles" },
      { left: "6 stars, 2 moons", right: "4 more stars" }
    ]
  },
  {
    skillId: "math-length-measure",
    prompt: "Match each length change with its new length.",
    instruction: "Tap a length change, then the new length.",
    explanation: "6 cm + 2 cm = 8 cm, 12 cm − 3 cm = 9 cm, and 9 cm − 3 cm = 6 cm.",
    template: "match-length-change",
    leftLabel: "Length change",
    rightLabel: "New length",
    pairs: [
      { left: "6 cm + 2 cm", right: "8 cm" },
      { left: "12 cm − 3 cm", right: "9 cm" },
      { left: "9 cm − 3 cm", right: "6 cm" }
    ]
  },
  {
    skillId: "math-fractions-add-sub",
    prompt: "Match each like-fraction calculation with its answer.",
    instruction: "Tap a fraction calculation, then its answer.",
    explanation: "2/6 + 3/6 = 5/6, 7/10 − 2/10 = 5/10, and 1/5 + 2/5 = 3/5.",
    template: "match-fraction-add-sub",
    leftLabel: "Fraction calculation",
    rightLabel: "Answer",
    pairs: [
      { left: "2/6 + 3/6", right: "5/6" },
      { left: "7/10 − 2/10", right: "5/10" },
      { left: "1/5 + 2/5", right: "3/5" }
    ]
  },
  {
    skillId: "math-measurement-units",
    prompt: "Match each measurement with an equal measurement.",
    instruction: "Tap a measurement, then an equal measurement.",
    explanation: "2 kg = 2000 g, 3 m = 300 cm, and 7 L + 4 L = 11 L.",
    template: "match-equal-measurement",
    leftLabel: "Measurement",
    rightLabel: "Equal measurement",
    pairs: [
      { left: "2 kg", right: "2000 g" },
      { left: "3 m", right: "300 cm" },
      { left: "7 L + 4 L", right: "11 L" }
    ]
  },
  {
    skillId: "english-listening",
    prompt: "Match each spoken word with the picture word.",
    instruction: "Listen first, then tap the matching picture word.",
    explanation: "apple, bear and fish are matched with their picture words.",
    template: "match-listen-word",
    leftLabel: "Spoken word",
    rightLabel: "Picture word",
    pairs: [
      { left: "apple", right: "apple", audioText: "apple", audioLanguage: "en-US", rightImage: "apple" },
      { left: "bear", right: "bear", audioText: "bear", audioLanguage: "en-US", rightImage: "bear" },
      { left: "fish", right: "fish", audioText: "fish", audioLanguage: "en-US", rightImage: "fish" }
    ]
  },
  {
    skillId: "math-scaled-picture-graph",
    prompt: "In a graph where each star stands for 5 books, match each row with its total number of books.",
    instruction: "Tap a star count on the left, then its total books on the right.",
    explanation: "2 stars = 10 books, 4 stars = 20 books, and 6 stars = 30 books.",
    template: "match-scaled-graph",
    leftLabel: "Stars (each = 5)",
    rightLabel: "Total books",
    pairs: [
      { left: "2 stars", right: "10 books" },
      { left: "4 stars", right: "20 books" },
      { left: "6 stars", right: "30 books" }
    ]
  },
  {
    skillId: "math-number-patterns-1000",
    prompt: "Match each number pattern or expression with its missing value.",
    instruction: "Tap a pattern on the left, then its matching number on the right.",
    explanation: "340 + 20 = 360, 500 − 50 = 450, and 4 × 5 + 3 = 23.",
    template: "match-pattern-1000",
    leftLabel: "Pattern or expression",
    rightLabel: "Value",
    pairs: [
      { left: "320, 340, __", right: "360" },
      { left: "550, 500, __", right: "450" },
      { left: "4 × 5 + 3", right: "23" }
    ]
  },
  {
    skillId: "mandarin-radicals-homographs",
    prompt: "把形近字和最合适的词语配成一对。",
    instruction: "先点左边的汉字，再点右边能和它组成的词语。",
    explanation: "“清”配“清水”，“晴”配“晴天”，“睛”配“眼睛”。",
    template: "match-radical-homograph",
    leftLabel: "形近字",
    rightLabel: "词语",
    pairs: [
      { left: "清（三点水）", right: "河里的 ___ 水" },
      { left: "晴（日字旁）", right: "出太阳的 ___ 天" },
      { left: "睛（目字旁）", right: "亮晶晶的眼 ___" }
    ]
  },
  {
    skillId: "mandarin-synonyms-collocations",
    prompt: "把每组近义词配成一对。",
    instruction: "先点左边的词语，再点右边意思相近的词语。",
    explanation: "“高兴”和“快乐”意思相近，“仔细”和“认真”意思相近，“立刻”和“马上”意思相近。",
    template: "match-synonym-pair",
    leftLabel: "词语",
    rightLabel: "近义词",
    pairs: [
      { left: "高兴", right: "快乐" },
      { left: "仔细", right: "认真" },
      { left: "立刻", right: "马上" }
    ]
  },
  {
    skillId: "mandarin-conjunctions-complex",
    prompt: "把前半句和最通顺的后半句配成一对。",
    instruction: "先读前半句，再点右边意思连贯的后半句。",
    explanation: "因为下大雨，所以改在室内上课；虽然山路很远，但是大家没有放弃；我先洗手，再吃晚饭。",
    template: "match-complex-clause",
    leftLabel: "前半句",
    rightLabel: "后半句",
    pairs: [
      { left: "因为外面下大雨，", right: "所以体育课改在室内。" },
      { left: "虽然这道题有点难，", right: "但是我还是认真想出来了。" },
      { left: "放学回家后，我先洗手，", right: "再坐下来吃晚饭。" }
    ]
  },
  {
    skillId: "mandarin-passage-comprehension",
    prompt: "把故事里的做法和它带来的好结果配成一对。",
    instruction: "先点左边的做法，再点右边对应的结果。",
    explanation: "每天按时浇水让小苗长高，把玩具分类收好让房间整洁，主动分享雨伞让同学不淋湿。",
    template: "match-passage-cause",
    leftLabel: "故事里的做法",
    rightLabel: "带来的结果",
    pairs: [
      { left: "每天按时给种子浇水晒太阳", right: "花盆里长出了嫩绿的小苗" },
      { left: "把积木和绘本分类放回架子", right: "房间变得整洁又好找东西" },
      { left: "和没带伞的同学共撑一把伞", right: "两个人都能干干净净回家" }
    ]
  },
  {
    skillId: "english-tenses-agreement",
    prompt: "Match each time clue and subject with the correct verb form.",
    instruction: "Tap the sentence start on the left, then the matching verb phrase on the right.",
    explanation: "Every day + He uses walks; Right now + They uses are playing; Yesterday + She uses visited.",
    template: "match-tense-clue",
    leftLabel: "Time clue and subject",
    rightLabel: "Verb phrase",
    pairs: [
      { left: "Every day, Ben", right: "walks to school." },
      { left: "Right now, the children", right: "are playing in the hall." },
      { left: "Yesterday, Lily", right: "visited her aunt." }
    ]
  },
  {
    skillId: "english-prepositions-connectors",
    prompt: "Match each sentence beginning with the connector and ending that make sense.",
    instruction: "Tap a beginning on the left, then its matching ending on the right.",
    explanation: "Use because for a reason, but for a contrast, and so for a result.",
    template: "match-connector-clause",
    leftLabel: "Sentence beginning",
    rightLabel: "Connected ending",
    pairs: [
      { left: "Tom wore a jacket", right: "because the wind was cold." },
      { left: "The box was small", right: "but it was very heavy." },
      { left: "The library was closed,", right: "so we read at home." }
    ]
  },
  {
    skillId: "english-pronouns-questions",
    prompt: "Match each question with the answer that fits the question word.",
    instruction: "Tap a question on the left, then its matching answer on the right.",
    explanation: "Whose asks about ownership, When asks about time, and Why asks for a reason.",
    template: "match-wh-answer",
    leftLabel: "Question",
    rightLabel: "Answer",
    pairs: [
      { left: "Whose water bottle is this?", right: "It is his water bottle." },
      { left: "When does the concert start?", right: "It starts at three o'clock." },
      { left: "Why are you smiling?", right: "Because our team won the game." }
    ]
  },
  {
    skillId: "english-cloze-passage",
    prompt: "Match each short context with the best word to complete the blank.",
    instruction: "Tap a sentence on the left, then the word that fits the context.",
    explanation: "A library needs quiet voices, a rainy walk needs an umbrella, and a hungry puppy eats eagerly.",
    template: "match-cloze-context",
    leftLabel: "Context sentence",
    rightLabel: "Best word",
    pairs: [
      { left: "The baby was asleep, so we spoke ___.", right: "softly" },
      { left: "Dark clouds filled the sky, so we carried an ___.", right: "umbrella" },
      { left: "Ana practised the piano every day and played ___.", right: "well" }
    ]
  },
  {
    skillId: "math-olympiad-reasoning",
    prompt: "Match each logic puzzle clue with its correct number.",
    instruction: "Tap a logic clue on the left, then its matching value on the right.",
    explanation: "If ★ + ★ = 10 then ★ = 5; 4th from front and 4th from back is 4 + 4 − 1 = 7; a number minus 4 equals 6 starts at 10.",
    template: "match-olympiad",
    leftLabel: "Logic clue",
    rightLabel: "Answer",
    pairs: [
      { left: "★ + ★ = 10, find ★", right: "5" },
      { left: "4th from front and 4th from back", right: "7" },
      { left: "Number − 4 = 6, find the number", right: "10" }
    ]
  },
  {
    skillId: "mandarin-idioms-classics",
    prompt: "把成语或诗句和它表达的意思配成一对。",
    instruction: "先点左边的成语或诗句，再点右边对应的意思。",
    explanation: "井底之蛙比喻见识短浅，亡羊补牢比喻及时改正错误，粒粒皆辛苦劝告爱惜粮食。",
    template: "match-idiom-meaning",
    leftLabel: "成语或诗句",
    rightLabel: "意思与道理",
    pairs: [
      { left: "井底之蛙", right: "眼界狭窄、见识短浅" },
      { left: "亡羊补牢", right: "做错事及时补救还不晚" },
      { left: "谁知盘中餐，粒粒皆辛苦", right: "爱惜粮食，不浪费米饭" }
    ]
  },
  {
    skillId: "english-science-nature",
    prompt: "Match each nature clue with the correct science word.",
    instruction: "Tap a clue on the left, then its matching science word on the right.",
    explanation: "Roots take in water from soil, a tadpole grows into a frog, and solid ice forms when water freezes.",
    template: "match-science-fact",
    leftLabel: "Nature clue",
    rightLabel: "Science word",
    pairs: [
      { left: "Takes in water under the soil", right: "roots" },
      { left: "A baby frog swimming in water", right: "tadpole" },
      { left: "Water frozen in a cold freezer", right: "solid ice" }
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
  const farTransferTemplates = new Set([
    "match-money",
    "match-graph-difference",
    "match-length-change",
    "match-fraction-add-sub",
    "match-equal-measurement",
    "match-sentence-meaning",
    "match-sentence-question",
    "match-literal-detail",
    "match-sentence-ending"
  ]);
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
    transferLevel: farTransferTemplates.has(seed.template) ? "far-transfer" : "near-transfer",
    contextKey: seed.template,
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

