export interface SpeakingPrompt {
  id: string;
  text: string;
  display: string;
  language: "zh-CN" | "en-US";
  translation: string;
  category?: "word" | "organize" | "read-aloud" | "speaking-purpose";
  task?: string;
  image?: string;
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
  { id: "en-tree", text: "tree", display: "tree", language: "en-US", translation: "树" },
  { id: "zh-org-apple", text: "苹果，红色，甜甜的。", display: "苹果", language: "zh-CN", translation: "先说这是什么，再说颜色和味道。", category: "organize", task: "先说这是什么，再说颜色和味道。", image: "apple" },
  { id: "zh-org-dog", text: "小狗，棕色，它会跑。", display: "小狗", language: "zh-CN", translation: "先说这是什么，再说它会做什么。", category: "organize", task: "先说这是什么，再说它会做什么。", image: "dog" },
  { id: "zh-org-rain", text: "下雨了，我带了雨伞。", display: "雨天", language: "zh-CN", translation: "先说什么天气，再说你带了什么。", category: "organize", task: "先说什么天气，再说你带了什么。", image: "rain" },
  { id: "zh-org-tree", text: "公园里有一棵大树。", display: "大树", language: "zh-CN", translation: "先说在哪里，再说有什么。", category: "organize", task: "先说在哪里，再说有什么。", image: "tree" },
  { id: "zh-org-sun", text: "太阳出来了，天气很热。", display: "太阳", language: "zh-CN", translation: "先说看到什么，再说天气怎样。", category: "organize", task: "先说看到什么，再说天气怎样。", image: "sun" },
  { id: "zh-org-books", text: "桌上有三本书。", display: "三本书", language: "zh-CN", translation: "先说在哪里，再说有几本书。", category: "organize", task: "先说在哪里，再说有几本书。", image: "books" },
  { id: "zh-read-mum", text: "我爱妈妈。", display: "我爱妈妈。", language: "zh-CN", translation: "大声读一读，每个字读清楚。", category: "read-aloud", task: "大声读一读，每个字读清楚。" },
  { id: "zh-read-book", text: "这是我的书。", display: "这是我的书。", language: "zh-CN", translation: "先听示范，再清楚读一次。", category: "read-aloud", task: "先听示范，再清楚读一次。" },
  { id: "zh-read-sleep", text: "弟弟在睡觉。", display: "弟弟在睡觉。", language: "zh-CN", translation: "慢慢读，不要漏字。", category: "read-aloud", task: "慢慢读，不要漏字。" },
  { id: "zh-read-bird", text: "小鸟在天上飞。", display: "小鸟在天上飞。", language: "zh-CN", translation: "读出完整的句子。", category: "read-aloud", task: "读出完整的句子。" },
  { id: "zh-read-rain", text: "今天下雨了。", display: "今天下雨了。", language: "zh-CN", translation: "试着读得自然一点。", category: "read-aloud", task: "试着读得自然一点。" },
  { id: "zh-read-park", text: "我们一起去公园。", display: "我们一起去公园。", language: "zh-CN", translation: "先听一次，再完整读出来。", category: "read-aloud", task: "先听一次，再完整读出来。" },
  { id: "en-purpose-greet", text: "Hello! How are you?", display: "Hello! How are you?", language: "en-US", translation: "向朋友打招呼。", category: "speaking-purpose", task: "向朋友打招呼。" },
  { id: "en-purpose-friend", text: "This is my friend.", display: "This is my friend.", language: "en-US", translation: "介绍一位朋友。", category: "speaking-purpose", task: "介绍一位朋友。" },
  { id: "en-purpose-water", text: "May I have some water, please?", display: "May I have some water, please?", language: "en-US", translation: "礼貌地请别人给你水。", category: "speaking-purpose", task: "礼貌地请别人给你水。" },
  { id: "en-purpose-thanks", text: "Thank you for your help.", display: "Thank you for your help.", language: "en-US", translation: "向帮助你的人道谢。", category: "speaking-purpose", task: "向帮助你的人道谢。" },
  { id: "en-purpose-play", text: "Let's play together.", display: "Let's play together.", language: "en-US", translation: "邀请朋友一起玩。", category: "speaking-purpose", task: "邀请朋友一起玩。" },
  { id: "en-purpose-help", text: "Can you help me, please?", display: "Can you help me, please?", language: "en-US", translation: "礼貌地请别人帮忙。", category: "speaking-purpose", task: "礼貌地请别人帮忙。" }
];
