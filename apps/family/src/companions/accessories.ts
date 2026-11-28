import type { Locale } from "../content/copy";

export interface CompanionAccessory {
  id: string;
  slot: "hat" | "neck" | "eyes";
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  unlockAtStars: number;
  voiceZh: string;
  voiceEn: string;
}

export const COMPANION_ACCESSORIES: CompanionAccessory[] = [
  {
    id: "acc-sprout-crown",
    slot: "hat",
    nameZh: "嫩芽花冠",
    nameEn: "Sprout Flower Crown",
    descZh: "带着清晨露珠的小芽花环，完成第一次学习即可穿戴。",
    descEn: "A fresh sprout wreath with morning dewdrops, unlocked after your first session.",
    unlockAtStars: 2,
    voiceZh: "哇，戴上嫩芽花冠，豆豆变成森林小精灵啦！",
    voiceEn: "Wow, with the Sprout Flower Crown, Doudou looks like a forest sprite!"
  },
  {
    id: "acc-red-scarf",
    slot: "neck",
    nameZh: "阳光红领巾",
    nameEn: "Sunny Red Scarf",
    descZh: "暖洋洋的小领巾，陪你精神抖擞去上学。",
    descEn: "A warm sunny neckerchief ready for school days.",
    unlockAtStars: 4,
    voiceZh: "系上阳光红领巾，今天也是活力满满的一天！",
    voiceEn: "Wearing the Sunny Red Scarf, we are ready for a great day!"
  },
  {
    id: "acc-bamboo-copter",
    slot: "hat",
    nameZh: "飞天竹蜻蜓",
    nameEn: "Flying Bamboo Copter",
    descZh: "滴溜溜转的小竹蜻蜓，带你飞向数学和阅读小岛。",
    descEn: "A spinning bamboo copter ready to fly across the learning islands.",
    unlockAtStars: 6,
    voiceZh: "竹蜻蜓转呀转，我们一起飞去知识小岛探险吧！",
    voiceEn: "Spinning bamboo copter, let's fly to the learning islands!"
  },
  {
    id: "acc-star-glasses",
    slot: "eyes",
    nameZh: "星光小墨镜",
    nameEn: "Starlight Shades",
    descZh: "闪闪发光的星星眼镜，专门发现题目里的小线索。",
    descEn: "Sparkling star-shaped glasses for spotting clever clues.",
    unlockAtStars: 8,
    voiceZh: "戴上星光小墨镜，再难的题目线索也逃不过我们的眼睛！",
    voiceEn: "With Starlight Shades on, we can spot every tricky clue!"
  },
  {
    id: "acc-wizard-hat",
    slot: "hat",
    nameZh: "星空魔法帽",
    nameEn: "Starry Wizard Hat",
    descZh: "缀满金星的蓝色魔法帽，拼读和速算就像变魔术。",
    descEn: "A starry blue wizard hat that makes phonics and math feel like magic.",
    unlockAtStars: 12,
    voiceZh: "星空魔法帽戴好啦，来看看今天要变出什么知识魔法！",
    voiceEn: "Starry Wizard Hat on! Let's see what learning magic we make today!"
  },
  {
    id: "acc-gold-medal",
    slot: "neck",
    nameZh: "小芽金奖章",
    nameEn: "Sprout Gold Medal",
    descZh: "授予坚持打卡与闯关的小小探险家荣誉奖章。",
    descEn: "A shiny gold medal awarded to dedicated island explorers.",
    unlockAtStars: 16,
    voiceZh: "金灿灿的小芽奖章挂在胸前，你和豆豆都是最棒的坚持小冠军！",
    voiceEn: "Shining Sprout Gold Medal! You and Doudou are true champions!"
  }
];

export function getAccessoryById(id: string): CompanionAccessory | undefined {
  return COMPANION_ACCESSORIES.find((item) => item.id === id);
}

export function accessoryName(item: CompanionAccessory, locale: Locale): string {
  return locale === "en" ? item.nameEn : item.nameZh;
}

export function accessoryDescription(item: CompanionAccessory, locale: Locale): string {
  return locale === "en" ? item.descEn : item.descZh;
}

export const PET_TOUCH_VOICES_ZH = [
  "汪汪！你摸得我好舒服呀，我们今天去哪个小岛玩？",
  "嘿嘿，我的小尾巴摇起来啦！谢谢你来看我！",
  "我在认真听你读书写字呢，你刚才表现得超棒！"
] as const;

export const PET_TOUCH_VOICES_EN = [
  "Woof woof! That tickles! Which learning island should we visit today?",
  "Hehe, my tail is wagging so fast! Thanks for saying hi!",
  "I love listening to you read and practice. You are doing great!"
] as const;
