import type { Locale } from "./copy";
import type { Question } from "../lib/types";

const SKILL_HINTS: Record<string, string> = {
  "math-count-100": "先看有几整排十，再数剩下的几个一。",
  "math-place-value-1000": "从右往左数：个位、十位、百位。",
  "math-add-sub-100": "先算整十，再算个位；加法满十进一，减法不够向十位借一。",
  "math-add-sub-regroup": "个位相加满十，就把 10 个一换成 1 个十。",
  "math-add-sub-1000": "从个位开始，一位一位算，注意进位和退位。",
  "math-multiply-tables": "乘法就是几组相同的数相加。",
  "math-divide-tables": "想一想几个几合起来等于被除数。",
  "math-fractions": "分母是分成几份，分子是取了几份。",
  "math-fractions-add-sub": "分母相同，分子相加，分母不变。",
  "math-money": "$1 = 100 分，先把钱换成同样的单位。",
  "math-time": "分针走一大格是 5 分钟。",
  "math-shapes": "边是直的线，角是两条边相遇的地方。",
  "math-picture-graph": "先看每一行的图有几个，再比较多少。",
  "math-length-measure": "从 0 开始量，末端对着几就是几厘米。",
  "math-measurement-units": "想一想这个东西有多重、多大。",
  "mandarin-initials": "先慢慢读出这个字，注意开头的音。",
  "mandarin-finals": "把字读慢一点，后面的音就是韵母。",
  "mandarin-tones": "跟着老师的声调读一遍。",
  "mandarin-syllables": "把声母、韵母和声调合起来。",
  "mandarin-characters": "看这个字像什么，或者想想它常出现在哪里。",
  "mandarin-vocabulary": "把词放进句子里想一想。",
  "mandarin-reading": "先找出这句话在说谁、做什么。",
  "mandarin-classifiers": "想想我们平时怎么说：一只猫、一朵花。",
  "mandarin-word-order": "先找“谁”，再找“做什么”。",
  "english-letters": "想一想这个单词的第一个音。",
  "english-listening": "先听清单词的第一个音，再看图。",
  "english-phonics": "把声音和字母连起来。",
  "english-sight-words": "先读整句，再看哪个词最顺。",
  "english-vocabulary": "看图片，想一想它最常见的英文名字。",
  "english-a-an": "元音音素开头的词用 an。",
  "english-plural": "两个以上，名词后面通常加 -s。",
  "english-sentence-order": "先找“谁”，再找“做什么”。",
  "english-reading": "先读问题，再回到短文里找。",
  "english-spelling": "把单词拆成几个声音，再拼起来。"
};

const SKILL_HINTS_EN: Record<string, string> = {
  "math-count-100": "Look at the full rows of ten, then count the remaining ones.",
  "math-place-value-1000": "From right to left: ones, tens, hundreds.",
  "math-add-sub-100": "Add the tens first, then the ones. Carry when the ones make ten; borrow when there are not enough ones.",
  "math-add-sub-regroup": "When the ones make ten, exchange 10 ones for 1 ten.",
  "math-add-sub-1000": "Start from the ones and work one place at a time. Watch for carrying and borrowing.",
  "math-multiply-tables": "Multiplication is adding equal groups.",
  "math-divide-tables": "Think how many equal groups make the dividend.",
  "math-fractions": "The denominator shows the number of equal parts; the numerator shows how many parts are taken.",
  "math-fractions-add-sub": "The denominators are the same: add the numerators and keep the denominator.",
  "math-money": "$1 = 100 cents. Change the amounts to the same unit first.",
  "math-time": "Each big mark on the minute hand is 5 minutes.",
  "math-shapes": "A side is a straight line. An angle is where two sides meet.",
  "math-picture-graph": "Count the pictures in each row, then compare the rows.",
  "math-length-measure": "Start at 0. The number at the end is the length in centimetres.",
  "math-measurement-units": "Think about how heavy or how large the object is.",
  "english-letters": "Think about the first sound in the word.",
  "english-listening": "Listen for the first sound, then look at the pictures.",
  "english-phonics": "Join the sounds to the letters that spell them.",
  "english-sight-words": "Read the whole sentence, then choose the word that fits.",
  "english-vocabulary": "Look at the picture and think of its common English name.",
  "english-a-an": "Use 'an' before a word that starts with a vowel sound.",
  "english-plural": "For more than one, most nouns add -s.",
  "english-sentence-order": "Find who the sentence is about, then what they do.",
  "english-reading": "Read the question first, then go back to the passage.",
  "english-spelling": "Break the word into sounds, then spell each sound."
};

export interface SkillTeach {
  title: string;
  body: string;
  example?: string;
}

const SKILL_TEACH: Record<string, SkillTeach> = {
  "math-count-100": {
    title: "十位和个位",
    body: "10 个一是一排十。先看有几整排十，再数剩下的几个一。",
    example: "用手指着一整排十，十个十个地数。"
  },
  "math-place-value-1000": {
    title: "三位数的位置",
    body: "从右往左是个位、十位、百位。同一个数字站在不同位置，表示的大小不一样。",
    example: "从左到右，依次指着百位、十位和个位。"
  },
  "math-add-sub-100": {
    title: "先拆整十",
    body: "先把整十和整十加，再把个位和个位加，最后合起来。",
    example: "把十位对齐十位，个位对齐个位。"
  },
  "math-add-sub-regroup": {
    title: "满十换一排",
    body: "个位相加满十，就把 10 个一换成 1 个十；个位不够减，就向十位借 1 个十。",
    example: "先在个位圈出一个整十，再把它换到十位。"
  },
  "math-multiply-tables": {
    title: "乘法是几组一样多",
    body: "乘法就是几组相同的数相加。看到 2 × 4，就想 4 组 2。",
    example: "先画出一组，再一组一组地数。"
  },
  "math-divide-tables": {
    title: "除法是平均分",
    body: "除法就是把一些东西平均分。想一想几个几合起来等于被除数。",
    example: "每次给每个小组分一个，直到分完。"
  },
  "math-money": {
    title: "钱要先换单位",
    body: "$1 = 100 分。先把钱换成同样的单位，再比较或计算。",
    example: "把小数点向右移两位，再读成分。"
  },
  "math-time": {
    title: "时针和分针",
    body: "时针看小时，分针看分钟。分针走一大格是 5 分钟。",
    example: "用手指着分针，一大格一大格地数五下。"
  },
  "math-shapes": {
    title: "边和角",
    body: "边是直的线，角是两条边相遇的地方。数一数边，再数一数角。",
    example: "用手指沿着每条边慢慢描一遍。"
  },
  "math-picture-graph": {
    title: "先数每一行",
    body: "先看每一行的图有几个，再比较谁多谁少。",
    example: "把两行点子上下对齐，再比较多出来的部分。"
  },
  "math-length-measure": {
    title: "从 0 开始量",
    body: "把尺子的 0 对准起点，末端对着几就是几厘米。",
    example: "把物体的一端对准尺子的 0。"
  },
  "math-measurement-units": {
    title: "选合适的单位",
    body: "想一想这个东西有多重、多大，再选克、升或米。",
    example: "先和熟悉的东西比一比大小或轻重。"
  },
  "mandarin-tones": {
    title: "四声像唱歌",
    body: "一声平，二声升，三声拐弯，四声降。先听，再跟着读。",
    example: "bā / bá / bǎ / bà"
  },
  "english-phonics": {
    title: "声音和字母",
    body: "先把单词拆成几个声音，再看每个声音由哪些字母写出来。",
    example: "慢慢说出每个声音，再合起来读。"
  },
  "k2-math-count-20": {
    title: "一个一个数",
    body: "用手指点一点图里的圆点或星星，每点一个数一个数，不容易漏掉。",
    example: "1, 2, 3, 4, 5..."
  },
  "k2-math-add-within-10": {
    title: "合起来和拿走",
    body: "加法是把两堆合起来，减法是从里面拿走几个。",
    example: "可以用十格阵点一点来帮忙。"
  },
  "math-fractions": {
    title: "平均分成几份",
    body: "分数一定要每一份一样大。分母是总共分几份，分子是涂了或拿了几份。",
    example: "切成 4 份里的 1 份，就是 1/4。"
  },
  "math-fractions-add-sub": {
    title: "同分母加减",
    body: "下面（分母）一样大时，只要把上面（分子）加起来或减掉。",
    example: "2/6 + 3/6 = 5/6"
  },
  "math-two-step-problems": {
    title: "先算第一步，再算第二步",
    body: "两步应用题先把第一件事算清楚，再用算出的结果去算第二件事。",
    example: "看图里从左到右的两个变化。"
  },
  "mandarin-initials": {
    title: "声母在最前面",
    body: "每个拼音开头的声母，就像字词的第一个声音。",
    example: "猫 māo 的开头声母是 m。"
  },
  "mandarin-finals": {
    title: "韵母在后面",
    body: "把字慢慢拉长读，后面的响亮部分就是韵母。",
    example: "猫 māo 的韵母是 ao。"
  },
  "mandarin-syllables": {
    title: "声母 + 韵母 + 声调",
    body: "把开头的声母和后面的韵母合起来，再加上准确的声调。",
    example: "m + āo = māo"
  },
  "mandarin-characters": {
    title: "字形和意思",
    body: "很多汉字像画画一样，偏旁也能提示意思（比如“艹”常和花草有关）。",
    example: "日、月、山、水、火、木。"
  },
  "mandarin-classifiers": {
    title: "搭配对的量词",
    body: "不同的东西用不同的量词，大声念出来听听顺不顺口。",
    example: "一只猫、一朵花、一本书。"
  },
  "mandarin-word-order": {
    title: "谁 + 在做什么",
    body: "组句子时，先找“谁”，再找“做什么”或“在哪里”。",
    example: "我 + 喜欢 + 小猫。"
  }
};

const SKILL_TEACH_EN: Record<string, SkillTeach> = {
  "math-count-100": {
    title: "Tens and ones",
    body: "10 ones make one row of ten. Count the full rows of ten, then the remaining ones.",
    example: "Point to a full row of ten and count by tens."
  },
  "math-place-value-1000": {
    title: "Places in a 3-digit number",
    body: "From right to left: ones, tens, hundreds. The same digit means a different amount in a different place.",
    example: "Point to the hundreds, tens and ones columns from left to right."
  },
  "math-add-sub-100": {
    title: "Split the tens first",
    body: "Add the tens, then add the ones, then combine the two parts.",
    example: "Line up the tens and the ones before adding."
  },
  "math-add-sub-regroup": {
    title: "Make a new ten",
    body: "When the ones make ten, exchange 10 ones for 1 ten. When there are not enough ones to subtract, borrow 1 ten.",
    example: "Circle a full ten in the ones place before carrying."
  },
  "math-multiply-tables": {
    title: "Multiplication means equal groups",
    body: "Multiplication is repeated addition of equal groups. For 2 × 4, think of 4 groups of 2.",
    example: "Draw one group, then count group by group."
  },
  "math-divide-tables": {
    title: "Division means sharing equally",
    body: "Division shares an amount into equal groups. Think how many equal groups make the dividend.",
    example: "Give one to each group, then share again until all are used."
  },
  "math-money": {
    title: "Change to the same unit",
    body: "$1 = 100 cents. Change the amounts to the same unit before comparing or calculating.",
    example: "Move the decimal point two places to the right and read cents."
  },
  "math-time": {
    title: "Hour hand and minute hand",
    body: "The hour hand shows hours; the minute hand shows minutes. Each big mark is 5 minutes.",
    example: "Point to the minute hand and count each big mark by fives."
  },
  "math-shapes": {
    title: "Sides and angles",
    body: "A side is a straight line. An angle is where two sides meet. Count the sides, then the angles.",
    example: "Trace each side with your finger."
  },
  "math-picture-graph": {
    title: "Count each row first",
    body: "Count the pictures in each row, then compare which row has more or fewer.",
    example: "Line up both rows and compare the extra dots."
  },
  "math-length-measure": {
    title: "Start measuring at 0",
    body: "Line up the 0 on the ruler with the start. The number at the end is the length in centimetres.",
    example: "Put one end of the object at 0 on the ruler."
  },
  "math-measurement-units": {
    title: "Choose a suitable unit",
    body: "Think about how heavy or how large the object is, then choose grams, litres or metres.",
    example: "Compare it with something you already know."
  },
  "english-phonics": {
    title: "Sounds and letters",
    body: "Break the word into sounds, then look at the letters that spell each sound.",
    example: "Say each sound slowly, then blend them together."
  },
  "k2-math-count-20": {
    title: "Count one by one",
    body: "Tap each dot or star once as you count so you do not skip any.",
    example: "1, 2, 3, 4, 5..."
  },
  "k2-math-add-within-10": {
    title: "Put together and take away",
    body: "Adding puts two groups together; subtracting takes some away.",
    example: "Tap the ten-frame squares to see the numbers."
  },
  "math-fractions": {
    title: "Equal parts of a whole",
    body: "Fractions must have equal parts. The bottom number counts all parts; the top number counts the shaded parts.",
    example: "1 out of 4 equal parts is 1/4."
  },
  "math-fractions-add-sub": {
    title: "Same bottom number",
    body: "When the denominators match, add or subtract only the top numbers.",
    example: "2/6 + 3/6 = 5/6"
  },
  "math-two-step-problems": {
    title: "One step at a time",
    body: "Solve the first change first, then use that answer for the second change.",
    example: "Follow the arrows from left to right."
  },
  "english-letters": {
    title: "First letter sound",
    body: "Say the word out loud and listen to its very first sound.",
    example: "Apple starts with /a/ -> A."
  },
  "english-a-an": {
    title: "Using a and an",
    body: "Use 'an' before vowel sounds (a, e, i, o, u) and 'a' before consonant sounds.",
    example: "an apple, a cat"
  },
  "english-plural": {
    title: "More than one",
    body: "When there are two or more, add -s to most nouns.",
    example: "one cat -> two cats"
  },
  "english-sentence-order": {
    title: "Who + action",
    body: "Start with who the sentence is about, then add the action word.",
    example: "I + like + apples."
  },
  "english-spelling": {
    title: "Listen and match sounds",
    body: "Listen to the word carefully and match each sound to the right letters.",
    example: "c - a - t -> cat"
  }
};

const MATCH_HINT = "先配对最有把握的一对，再用剩下的排除。";
const ORDER_HINT = "先点最前面的一块，如果不对可以点一下上面退回。";
const FALLBACK_HINT = "先把题目读一遍，再排掉明显不对的选项。";
const MATCH_HINT_EN = "Match the pair you are most sure of first, then use the remaining cards to narrow it down.";
const ORDER_HINT_EN = "Tap the first piece in order. Tap any placed piece to send it back.";
const FALLBACK_HINT_EN = "Read the question once, then rule out the options that clearly do not fit.";

export function hintForQuestion(question: Question, locale: Locale = "zh"): string {
  if (question.kind === "match") return locale === "en" ? MATCH_HINT_EN : MATCH_HINT;
  if (question.kind === "order") return locale === "en" ? ORDER_HINT_EN : ORDER_HINT;
  const map = locale === "en" ? { ...SKILL_HINTS, ...SKILL_HINTS_EN } : SKILL_HINTS;
  return map[question.skillId] ?? (locale === "en" ? FALLBACK_HINT_EN : FALLBACK_HINT);
}

export function teachForQuestion(question: Question, locale: Locale = "zh"): SkillTeach | null {
  const map = locale === "en" ? SKILL_TEACH_EN : SKILL_TEACH;
  return map[question.skillId] ?? null;
}
