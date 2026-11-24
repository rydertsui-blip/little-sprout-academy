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
    prompt: "把问题和听到的答案连起来。",
    instruction: "先点左边的问题，再点右边对应的答案。",
    explanation: "谁对应小明，哪里对应厨房，做什么对应看书。",
    template: "match-listen-wh",
    leftLabel: "问题",
    rightLabel: "答案",
    pairs: [
      { left: "谁", right: "小明" },
      { left: "哪里", right: "厨房" },
      { left: "做什么", right: "看书" }
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
    instruction: "先点左边的词语，再点右边对应的图片词语。",
    explanation: "猫配小猫，狗配小狗，鸟配小鸟。",
    template: "match-k2-word",
    leftLabel: "词语",
    rightLabel: "图片词语",
    pairs: [
      { left: "猫", right: "小猫" },
      { left: "狗", right: "小狗" },
      { left: "鸟", right: "小鸟" }
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
    prompt: "Match each picture story with the total.",
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
      { left: "apple", right: "apple", audioText: "apple", audioLanguage: "en-US" },
      { left: "bear", right: "bear", audioText: "bear", audioLanguage: "en-US" },
      { left: "fish", right: "fish", audioText: "fish", audioLanguage: "en-US" }
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

