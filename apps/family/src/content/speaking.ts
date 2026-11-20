export interface SpeakingPrompt {
  id: string;
  text: string;
  display: string;
  language: "zh-CN" | "en-US";
  translation: string;
}

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  { id: "zh-ren", text: "人，大人", display: "人", language: "zh-CN", translation: "person" },
  { id: "zh-kou", text: "口，开口", display: "口", language: "zh-CN", translation: "mouth" },
  { id: "zh-shan", text: "山，高山", display: "山", language: "zh-CN", translation: "mountain" },
  { id: "zh-shou", text: "手，小手", display: "手", language: "zh-CN", translation: "hand" },
  { id: "zh-ri", text: "日，太阳", display: "日", language: "zh-CN", translation: "sun" },
  { id: "zh-yue", text: "月，月亮", display: "月", language: "zh-CN", translation: "moon" },
  { id: "zh-mu", text: "木，树木", display: "木", language: "zh-CN", translation: "tree" },
  { id: "zh-shui", text: "水，喝水", display: "水", language: "zh-CN", translation: "water" },
  { id: "zh-huo", text: "火，火苗", display: "火", language: "zh-CN", translation: "fire" },
  { id: "zh-tian", text: "田，田地", display: "田", language: "zh-CN", translation: "field" },
  { id: "zh-mu-eye", text: "目，目光", display: "目", language: "zh-CN", translation: "eye" },
  { id: "zh-zu", text: "足，足球", display: "足", language: "zh-CN", translation: "foot" },
  { id: "en-apple", text: "apple", display: "apple", language: "en-US", translation: "苹果" },
  { id: "en-bear", text: "bear", display: "bear", language: "en-US", translation: "熊" },
  { id: "en-cat", text: "cat", display: "cat", language: "en-US", translation: "猫" },
  { id: "en-dog", text: "dog", display: "dog", language: "en-US", translation: "狗" },
  { id: "en-fish", text: "fish", display: "fish", language: "en-US", translation: "鱼" },
  { id: "en-flower", text: "flower", display: "flower", language: "en-US", translation: "花" },
  { id: "en-moon", text: "moon", display: "moon", language: "en-US", translation: "月亮" },
  { id: "en-star", text: "star", display: "star", language: "en-US", translation: "星星" },
  { id: "en-sun", text: "sun", display: "sun", language: "en-US", translation: "太阳" },
  { id: "en-tree", text: "tree", display: "tree", language: "en-US", translation: "树" }
];
