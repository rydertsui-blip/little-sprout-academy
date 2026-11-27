import type { LearningLevel } from "../lib/types";

export interface StrokePoint {
  x: number;
  y: number;
}

export interface EnglishHandwritingItem {
  id: string;
  character: string; // Used as unified key in child.handwriting[item.character]
  display: string;
  kind: "letter" | "word";
  level: LearningLevel;
  phonics: string;
  word: string;
  chinese: string;
  tip: string;
  introAudioText: string;
  audioText: string;
  guideText: string;
  strokes: StrokePoint[][];
}

// 4-line canvas coordinate system: width 320, height 220
// Line 1 (Sky Line): y = 40
// Line 2 (Dashed Grass Line): y = 95
// Line 3 (Red Baseline): y = 150
// Line 4 (Bottom Root Line): y = 195
function letterStrokes(upperKind: "tall" | "round" | "diag", lowerTail = false): StrokePoint[][] {
  if (upperKind === "round") {
    return [
      [{ x: 115, y: 50 }, { x: 75, y: 70 }, { x: 75, y: 130 }, { x: 115, y: 150 }, { x: 135, y: 125 }],
      [{ x: 215, y: 105 }, { x: 185, y: 100 }, { x: 180, y: 145 }, { x: 215, y: 150 }],
      [{ x: 218, y: 95 }, { x: 218, y: lowerTail ? 190 : 150 }]
    ];
  }
  if (upperKind === "diag") {
    return [
      [{ x: 95, y: 40 }, { x: 65, y: 150 }],
      [{ x: 95, y: 40 }, { x: 125, y: 150 }],
      [{ x: 75, y: 110 }, { x: 115, y: 110 }],
      [{ x: 185, y: 95 }, { x: 215, y: 150 }],
      [{ x: 215, y: 95 }, { x: 180, y: lowerTail ? 190 : 150 }]
    ];
  }
  return [
    [{ x: 75, y: 40 }, { x: 75, y: 150 }],
    [{ x: 75, y: 45 }, { x: 125, y: 70 }, { x: 75, y: 95 }],
    [{ x: 185, y: 45 }, { x: 185, y: lowerTail ? 190 : 150 }],
    [{ x: 185, y: 102 }, { x: 222, y: 122 }, { x: 185, y: 150 }]
  ];
}

function wordStrokes(): StrokePoint[][] {
  return [
    [{ x: 75, y: 100 }, { x: 52, y: 125 }, { x: 78, y: 150 }],
    [{ x: 145, y: 100 }, { x: 122, y: 128 }, { x: 148, y: 150 }, { x: 152, y: 98 }, { x: 152, y: 150 }],
    [{ x: 225, y: 55 }, { x: 225, y: 150 }],
    [{ x: 205, y: 95 }, { x: 245, y: 95 }]
  ];
}

const LETTER_SEEDS: Array<{
  upper: string;
  lower: string;
  level: LearningLevel;
  phonics: string;
  word: string;
  chinese: string;
  tip: string;
  style: "tall" | "round" | "diag";
  tail?: boolean;
}> = [
  { upper: "A", lower: "a", level: "K2", phonics: "/æ/", word: "apple", chinese: "苹果", tip: "大写 A 占上中两格三笔写成；小写 a 占中间格，先画圆肚皮再写短竖。", style: "diag" },
  { upper: "B", lower: "b", level: "K2", phonics: "/b/", word: "bear", chinese: "小熊", tip: "大写 B 先写长竖再写两个右半圆；小写 b 长竖从顶格写到红基线，右下半圆在中间格。", style: "tall" },
  { upper: "C", lower: "c", level: "K2", phonics: "/k/", word: "cat", chinese: "小猫", tip: "大小写 C c 都是一笔写成的左半圆，小写 c 稳稳坐在中间格里。", style: "round" },
  { upper: "D", lower: "d", level: "K2", phonics: "/d/", word: "dog", chinese: "小狗", tip: "大写 D 长竖配大右弯；小写 d 先在中间格画左半圆，再从顶线写长竖（注意和 b 区分）。", style: "tall" },
  { upper: "E", lower: "e", level: "K2", phonics: "/e/", word: "egg", chinese: "鸡蛋", tip: "大写 E 一竖三横占上中格；小写 e 从中间横线起笔，向上绕一圈一笔完成。", style: "tall" },
  { upper: "F", lower: "f", level: "K2", phonics: "/f/", word: "fish", chinese: "小鱼", tip: "大写 F 一竖两横；小写 f 顶部带小弯钩，短横正好压在第二条虚线上。", style: "tall" },
  { upper: "G", lower: "g", level: "K2", phonics: "/ɡ/", word: "goat", chinese: "山羊", tip: "大写 G 占上中两格；小写 g 占中下两格，小尾巴向下伸到第四条底线再弯起。", style: "round", tail: true },
  { upper: "H", lower: "h", level: "K2", phonics: "/h/", word: "hat", chinese: "帽子", tip: "大写 H 两竖夹一横；小写 h 从顶线向下写长竖，再从虚线拱起写右脚。", style: "tall" },
  { upper: "I", lower: "i", level: "K2", phonics: "/ɪ/", word: "igloo", chinese: "冰屋", tip: "大写 I 上下两短横夹一竖；小写 i 短竖在中间格，最后在上方点圆点。", style: "tall" },
  { upper: "J", lower: "j", level: "K2", phonics: "/dʒ/", word: "jam", chinese: "果酱", tip: "大写 J 占上中格向下左弯；小写 j 占中下两格，弯钩伸到底格，上方点圆点。", style: "tall", tail: true },
  { upper: "K", lower: "k", level: "K2", phonics: "/k/", word: "kite", chinese: "风筝", tip: "大写 K 长竖配右上斜与右下斜；小写 k 的斜折小嘴巴收在中间格内。", style: "diag" },
  { upper: "L", lower: "l", level: "K2", phonics: "/l/", word: "lion", chinese: "狮子", tip: "大写 L 先竖后横一笔或两笔完成；小写 l 是从顶线直达红基线的一条挺拔长竖。", style: "tall" },
  { upper: "M", lower: "m", level: "K2", phonics: "/m/", word: "moon", chinese: "月亮", tip: "大写 M 像两座并排的山峰占上中格；小写 m 在中间格先写短竖再连两个圆拱门。", style: "diag" },
  { upper: "N", lower: "n", level: "P1", phonics: "/n/", word: "nest", chinese: "鸟巢", tip: "大写 N 两竖中间连斜线；小写 n 在中间格里一竖加一个圆拱门。", style: "diag" },
  { upper: "O", lower: "o", level: "P1", phonics: "/ɒ/", word: "orange", chinese: "橙子", tip: "大小写 O o 都是从上方逆时针一笔写成的饱满椭圆。", style: "round" },
  { upper: "P", lower: "p", level: "P1", phonics: "/p/", word: "pig", chinese: "小猪", tip: "大写 P 占上中格；小写 p 的长竖向下伸入底格，右上圆肚皮贴在中间格。", style: "tall", tail: true },
  { upper: "Q", lower: "q", level: "P1", phonics: "/kw/", word: "queen", chinese: "女王", tip: "大写 Q 在大圆右下角加短斜尾巴；小写 q 占中下格，注意圆肚皮朝左（与 p 相反）。", style: "round", tail: true },
  { upper: "R", lower: "r", level: "P1", phonics: "/r/", word: "rabbit", chinese: "兔子", tip: "大写 R 先写 P 再加右下斜腿；小写 r 在中间格写短竖，顶端向右挑小弯。", style: "tall" },
  { upper: "S", lower: "s", level: "P1", phonics: "/s/", word: "sun", chinese: "太阳", tip: "大小写 S s 像弯曲的小蛇，一笔流畅写成，上下弯度均匀。", style: "round" },
  { upper: "T", lower: "t", level: "P1", phonics: "/t/", word: "tree", chinese: "大树", tip: "大写 T 先写顶线横再写中间竖；小写 t 从上格中部起竖，短横压在第二条虚线上。", style: "tall" },
  { upper: "U", lower: "u", level: "P1", phonics: "/ʌ/", word: "umbrella", chinese: "雨伞", tip: "大写 U 底部圆润占上中格；小写 u 在中间格写成，最后向下带小短竖。", style: "round" },
  { upper: "V", lower: "v", level: "P1", phonics: "/v/", word: "van", chinese: "面包车", tip: "大小写 V v 都是左上斜下再向右上斜起，尖角稳稳落在红色基线上。", style: "diag" },
  { upper: "W", lower: "w", level: "P1", phonics: "/w/", word: "water", chinese: "水", tip: "大小写 W w 像两个相连的 V，折角整齐对称。", style: "diag" },
  { upper: "X", lower: "x", level: "P1", phonics: "/ks/", word: "box", chinese: "盒子", tip: "大小写 X x 由两条交叉斜线组成，先写左上到右下，再写右上到左下。", style: "diag" },
  { upper: "Y", lower: "y", level: "P1", phonics: "/j/", word: "yo-yo", chinese: "溜溜球", tip: "大写 Y 上方分叉下方一竖；小写 y 占中下两格，长斜线伸到底线。", style: "diag", tail: true },
  { upper: "Z", lower: "z", level: "P1", phonics: "/z/", word: "zoo", chinese: "动物园", tip: "大小写 Z z 横—斜—横一笔写成，上下两横保持平行。", style: "diag" }
];

const WORD_SEEDS: Array<{
  word: string;
  phonics: string;
  chinese: string;
  tip: string;
}> = [
  { word: "cat", phonics: "c - a - t", chinese: "小猫", tip: "三个小写字母 c、a 占中间格，t 向上伸入第一格，字母间距均匀。" },
  { word: "dog", phonics: "d - o - g", chinese: "小狗", tip: "d 向上顶格，o 在中间格，g 的弯尾巴向下伸进底格。" },
  { word: "sun", phonics: "s - u - n", chinese: "太阳", tip: "s、u、n 全部稳稳写在第二条虚线与第三条红基线之间的中间格。" },
  { word: "pig", phonics: "p - i - g", chinese: "小猪", tip: "p 和 g 的竖笔向下伸到底格，中间的 i 短竖加圆点。" },
  { word: "bed", phonics: "b - e - d", chinese: "小床", tip: "左边 b 肚皮朝右、右边 d 肚皮朝左，就像一张两边有床头的小床！" },
  { word: "cup", phonics: "c - u - p", chinese: "杯子", tip: "c 和 u 在中间格，p 的竖笔向下伸入第四格。" },
  { word: "bus", phonics: "b - u - s", chinese: "公交车", tip: "b 从顶格向下写，u 和 s 紧跟在中间格里。" },
  { word: "hat", phonics: "h - a - t", chinese: "帽子", tip: "h 和 t 向上伸入第一格，中间的 a 写得圆润饱满。" },
  { word: "red", phonics: "r - e - d", chinese: "红色", tip: "r 和 e 在中间格，d 的长竖从顶线垂直落到红基线。" },
  { word: "pen", phonics: "p - e - n", chinese: "钢笔", tip: "p 向下伸入底格，e 和 n 保持同样高度坐在红基线上。" }
];

export const ENGLISH_HANDWRITING_ITEMS: EnglishHandwritingItem[] = [
  ...LETTER_SEEDS.map((seed) => ({
    id: `en-${seed.upper}`,
    character: `en-${seed.upper}`,
    display: `${seed.upper}${seed.lower}`,
    kind: "letter" as const,
    level: seed.level,
    phonics: seed.phonics,
    word: seed.word,
    chinese: seed.chinese,
    tip: seed.tip,
    introAudioText: `Letter ${seed.upper}. ${seed.word}.`,
    audioText: `${seed.upper}, ${seed.lower}, ${seed.word}.`,
    guideText: `${seed.upper} ${seed.lower}`,
    strokes: letterStrokes(seed.style, seed.tail)
  })),
  ...WORD_SEEDS.map((seed) => ({
    id: `en-word-${seed.word}`,
    character: `en-word-${seed.word}`,
    display: seed.word,
    kind: "word" as const,
    level: "P2" as const,
    phonics: seed.phonics,
    word: seed.word,
    chinese: seed.chinese,
    tip: seed.tip,
    introAudioText: `Let's trace the word ${seed.word}.`,
    audioText: `${seed.word.split("").join(", ")}, ${seed.word}.`,
    guideText: seed.word,
    strokes: wordStrokes()
  }))
];
