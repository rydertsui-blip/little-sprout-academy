import type { Subject } from "../lib/types";
import type { Locale } from "../content/copy";

export interface CompanionDefinition {
  id: string;
  name: string;
  nameEn: string;
  unlockAtStars: number;
  assetSetId: string;
  description: string;
  descriptionEn: string;
  subjectAffinity: Subject[];
  safeGreetingText: string;
  safeEncouragementText: string;
  touchVoiceZh: string;
  touchVoiceEn: string;
  themeTint: string;
}

export const COMPANIONS: CompanionDefinition[] = [
  {
    id: "gemini-doudou",
    name: "豆豆",
    nameEn: "Doudou",
    unlockAtStars: 10,
    assetSetId: "gemini-doudou",
    description: "好奇、温柔的小狗，会陪你听题和庆祝完成。",
    descriptionEn: "A curious, gentle puppy who listens with you and celebrates every finish.",
    subjectAffinity: ["math", "mandarin", "english"],
    safeGreetingText: "我先坐好，我们一起开始。",
    safeEncouragementText: "慢慢想，我会陪你再看一步。",
    touchVoiceZh: "汪汪！你摸得我好舒服呀，我们今天去哪个小岛玩？",
    touchVoiceEn: "Woof woof! That tickles! Which learning island should we visit today?",
    themeTint: "#e4f6f3"
  },
  {
    id: "pikachu-spark",
    name: "闪电皮卡丘",
    nameEn: "Pikachu Spark",
    unlockAtStars: 14,
    assetSetId: "pikachu-spark",
    description: "脸颊闪着金色电火花的可爱雷电小精灵，最爱陪你挑战数学与闯关！",
    descriptionEn: "A cheerful yellow electric sprite with sparkling rosy cheeks who loves cheering for your math quests!",
    subjectAffinity: ["math", "english"],
    safeGreetingText: "我先坐好，我们一起开始。",
    safeEncouragementText: "慢慢想，我会陪你再看一步。",
    touchVoiceZh: "系上阳光红领巾，今天也是活力满满的一天！",
    touchVoiceEn: "Wearing the Sunny Red Scarf, we are ready for a great day!",
    themeTint: "#fff3b8"
  },
  {
    id: "elsa-frost",
    name: "冰雪艾莎公主",
    nameEn: "Ice Princess Elsa",
    unlockAtStars: 18,
    assetSetId: "elsa-frost",
    description: "披着晶莹雪花纱篷的冰雪小女王，挥手就能变出冰晶魔法，陪你静心读绘本与练字。",
    descriptionEn: "A gentle snow princess in a sparkling frost cape who conjures crystal snowflakes while reading with you.",
    subjectAffinity: ["english", "mandarin"],
    safeGreetingText: "我先坐好，我们一起开始。",
    safeEncouragementText: "慢慢想，我会陪你再看一步。",
    touchVoiceZh: "星空魔法帽戴好啦，来看看今天要变出什么知识魔法！",
    touchVoiceEn: "Starry Wizard Hat on! Let's see what learning magic we make today!",
    themeTint: "#dff2ff"
  },
  {
    id: "wukong-sage",
    name: "齐天大圣孙悟空",
    nameEn: "Monkey King Wukong",
    unlockAtStars: 22,
    assetSetId: "wukong-sage",
    description: "头戴凤翅紫金冠、手持如意金箍棒、脚踏筋斗云的小美猴王，火眼金睛陪你攻克难题！",
    descriptionEn: "The brave little Monkey King riding a golden somersault cloud with his glowing magic staff!",
    subjectAffinity: ["mandarin", "math"],
    safeGreetingText: "我先坐好，我们一起开始。",
    safeEncouragementText: "慢慢想，我会陪你再看一步。",
    touchVoiceZh: "戴上星光小墨镜，再难的题目线索也逃不过我们的眼睛！",
    touchVoiceEn: "With Starlight Shades on, we can spot every tricky clue!",
    themeTint: "#ffe5c2"
  },
  {
    id: "spider-hero",
    name: "吐丝小蜘蛛侠",
    nameEn: "Web Hero Spidey",
    unlockAtStars: 26,
    assetSetId: "spider-hero",
    description: "身穿红蓝战衣、发射银色蛛丝的城市小英雄，给你满满的勇气与专注力！",
    descriptionEn: "A friendly red-and-blue web-slinging kid superhero who brings courage and focus to every puzzle!",
    subjectAffinity: ["math", "english"],
    safeGreetingText: "我先坐好，我们一起开始。",
    safeEncouragementText: "慢慢想，我会陪你再看一步。",
    touchVoiceZh: "金灿灿的小芽奖章挂在胸前，你和豆豆都是最棒的坚持小冠军！",
    touchVoiceEn: "Shining Sprout Gold Medal! You and Doudou are true champions!",
    themeTint: "#ffd9d4"
  },
  {
    id: "dora-pocket",
    name: "百宝叮当猫",
    nameEn: "Magic Pocket Dora",
    unlockAtStars: 30,
    assetSetId: "dora-pocket",
    description: "挂着金色铜铃、拥有四维百宝袋的蓝色机器猫，装满神奇道具陪你探索科学！",
    descriptionEn: "A round blue robot cat with a golden jingle bell and a magic gadget pocket for curious explorers!",
    subjectAffinity: ["math", "mandarin", "english"],
    safeGreetingText: "我先坐好，我们一起开始。",
    safeEncouragementText: "慢慢想，我会陪你再看一步。",
    touchVoiceZh: "竹蜻蜓转呀转，我们一起飞去知识小岛探险吧！",
    touchVoiceEn: "Spinning bamboo copter, let's fly to the learning islands!",
    themeTint: "#d8ebff"
  },
  {
    id: "stella-unicorn",
    name: "彩虹独角兽星宝",
    nameEn: "Stella Rainbow Unicorn",
    unlockAtStars: 36,
    assetSetId: "stella-unicorn",
    description: "长着金色螺旋角与七彩鬃毛的云端小飞马，会洒下璀璨星尘庆祝你的每一次突破！",
    descriptionEn: "A winged rainbow unicorn with a glowing golden horn who sprinkles starlight on every achievement!",
    subjectAffinity: ["english", "mandarin", "math"],
    safeGreetingText: "我先坐好，我们一起开始。",
    safeEncouragementText: "慢慢想，我会陪你再看一步。",
    touchVoiceZh: "我在认真听你读书写字呢，你刚才表现得超棒！",
    touchVoiceEn: "I love listening to you read and practice. You are doing great!",
    themeTint: "#f6e4ff"
  }
];

export function getCompanionById(id: string): CompanionDefinition | undefined {
  return COMPANIONS.find((companion) => companion.id === id);
}

export function localiseCompanionInfo(companion: CompanionDefinition, locale: Locale): { name: string; description: string } {
  if (locale === "en") {
    return {
      name: companion.nameEn,
      description: companion.descriptionEn
    };
  }
  return {
    name: companion.name,
    description: companion.description
  };
}
