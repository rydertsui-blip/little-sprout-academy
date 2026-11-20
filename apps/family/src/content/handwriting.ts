export interface HandwritingCharacter {
  character: string;
  pinyin: string;
  word: string;
  english: string;
  tip: string;
  audioText: string;
}

export const HANDWRITING_CHARACTERS: HandwritingCharacter[] = [
  { character: "人", pinyin: "rén", word: "大人", english: "person", tip: "一撇一捺，像两条腿稳稳站住。", audioText: "人，大人" },
  { character: "口", pinyin: "kǒu", word: "开口", english: "mouth", tip: "方方的口，像张开的嘴巴。", audioText: "口，开口" },
  { character: "山", pinyin: "shān", word: "高山", english: "mountain", tip: "三座高低不同的山峰。", audioText: "山，高山" },
  { character: "手", pinyin: "shǒu", word: "小手", english: "hand", tip: "伸开五指，就是一只手。", audioText: "手，小手" },
  { character: "日", pinyin: "rì", word: "太阳", english: "sun", tip: "方方的日字里面有一横，像暖暖的阳光。", audioText: "日，太阳" },
  { character: "月", pinyin: "yuè", word: "月亮", english: "moon", tip: "弯弯的月字，像挂在天上的月亮。", audioText: "月，月亮" },
  { character: "木", pinyin: "mù", word: "树木", english: "tree", tip: "一竖像树干，一横像伸开的树枝。", audioText: "木，树木" },
  { character: "水", pinyin: "shuǐ", word: "喝水", english: "water", tip: "中间壮，两边轻，像流动的水。", audioText: "水，喝水" },
  { character: "火", pinyin: "huǒ", word: "火苗", english: "fire", tip: "两边像火星，中间是向上跳的火苗。", audioText: "火，火苗" },
  { character: "田", pinyin: "tián", word: "田地", english: "field", tip: "方方的田字，像一块一块农田。", audioText: "田，田地" },
  { character: "目", pinyin: "mù", word: "目光", english: "eye", tip: "目字像竖起来的眼睛。", audioText: "目，目光" },
  { character: "足", pinyin: "zú", word: "足球", english: "foot", tip: "下面的足字，像迈开的脚步。", audioText: "足，足球" }
];
