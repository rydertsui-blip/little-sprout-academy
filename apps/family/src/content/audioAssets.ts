export const AUDIO_ASSETS: Record<string, string> = {
  "人，大人": "zh-ren",
  "口，开口": "zh-kou",
  "山，高山": "zh-shan",
  "手，小手": "zh-shou",
  "日，太阳": "zh-ri",
  "月，月亮": "zh-yue",
  "木，树木": "zh-mu",
  "水，喝水": "zh-shui",
  "火，火苗": "zh-huo",
  "田，田地": "zh-tian",
  "目，目光": "zh-mu",
  "足，足球": "zh-zu",
  "猫": "zh-mao",
  "狗": "zh-gou",
  "花": "zh-hua",
  "鸟": "zh-niao",
  "兔": "zh-tu",
  "雨": "zh-yu",
  apple: "en-apple",
  bear: "en-bear",
  cat: "en-cat",
  dog: "en-dog",
  fish: "en-fish",
  flower: "en-flower",
  moon: "en-moon",
  star: "en-star",
  sun: "en-sun",
  tree: "en-tree"
};

export function getAudioAsset(text: string): string | undefined {
  return AUDIO_ASSETS[text];
}
