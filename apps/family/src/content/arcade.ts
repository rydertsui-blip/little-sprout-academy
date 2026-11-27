export type ArcadeGameId = "memory-flip" | "sorting-basket" | "monster-feeder" | "story-quest";

export interface MemoryFlipPair {
  id: string;
  leftText: string;
  leftAudio: string;
  rightText: string;
  rightAudio: string;
  lang: "zh-CN" | "en-US";
}

export interface MemoryFlipDeck {
  id: string;
  title: string;
  subtitle: string;
  introAudio: string;
  pairs: MemoryFlipPair[];
}

export interface SortingItem {
  id: string;
  label: string;
  audioText: string;
  lang: "zh-CN" | "en-US";
  basket: "left" | "right";
  explain: string;
}

export interface SortingRound {
  id: string;
  title: string;
  introAudio: string;
  leftBasketTitle: string;
  leftBasketHint: string;
  rightBasketTitle: string;
  rightBasketHint: string;
  items: SortingItem[];
}

export interface MonsterFoodOption {
  id: string;
  label: string;
  audioText: string;
  isTarget: boolean;
}

export interface MonsterStage {
  id: string;
  title: string;
  cravingText: string;
  cravingAudio: string;
  lang: "zh-CN" | "en-US";
  foods: MonsterFoodOption[];
  successAudio: string;
}

export interface StoryScene {
  id: string;
  sceneTitle: string;
  storyText: string;
  storyAudio: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  hintText: string;
  successText: string;
  image: string;
}

export interface StoryQuest {
  id: string;
  title: string;
  subtitle: string;
  introAudio: string;
  completionAudio: string;
  scenes: StoryScene[];
}

export const MEMORY_FLIP_DECKS: MemoryFlipDeck[] = [
  {
    id: "pinyin-hanzi",
    title: "汉字拼音翻翻乐",
    subtitle: "翻出对应的汉字和它的拼音",
    introAudio: "欢迎来到翻牌记忆消消乐！翻开两张卡片，把汉字和它的拼音配成一对吧！",
    pairs: [
      { id: "m-shan", leftText: "山", leftAudio: "山", rightText: "shān", rightAudio: "山", lang: "zh-CN" },
      { id: "m-shui", leftText: "水", leftAudio: "水", rightText: "shuǐ", rightAudio: "水", lang: "zh-CN" },
      { id: "m-hua", leftText: "花", leftAudio: "花", rightText: "huā", rightAudio: "花", lang: "zh-CN" },
      { id: "m-niao", leftText: "鸟", leftAudio: "鸟", rightText: "niǎo", rightAudio: "鸟", lang: "zh-CN" },
      { id: "m-shu", leftText: "书", leftAudio: "书", rightText: "shū", rightAudio: "书", lang: "zh-CN" },
      { id: "m-ming", leftText: "明", leftAudio: "明，明天", rightText: "míng", rightAudio: "明，明天", lang: "zh-CN" }
    ]
  },
  {
    id: "math-mental",
    title: "趣味口算消消乐",
    subtitle: "找出算式和它对应的得数",
    introAudio: "算一算，翻一翻，把算式和正确的得数配成一对吧！",
    pairs: [
      { id: "m-add15", leftText: "7 + 8", leftAudio: "7加8", rightText: "15", rightAudio: "15", lang: "zh-CN" },
      { id: "m-mul12", leftText: "3 × 4", leftAudio: "3乘4", rightText: "12", rightAudio: "12", lang: "zh-CN" },
      { id: "m-sub14", leftText: "20 − 6", leftAudio: "20减6", rightText: "14", rightAudio: "14", lang: "zh-CN" },
      { id: "m-add18", leftText: "9 + 9", leftAudio: "9加9", rightText: "18", rightAudio: "18", lang: "zh-CN" },
      { id: "m-div4", leftText: "16 ÷ 4", leftAudio: "16除以4", rightText: "4", rightAudio: "4", lang: "zh-CN" },
      { id: "m-mul20", leftText: "4 × 5", leftAudio: "4乘5", rightText: "20", rightAudio: "20", lang: "zh-CN" }
    ]
  },
  {
    id: "chinese-antonyms",
    title: "反义词对对碰",
    subtitle: "找出意思相反的一对好朋友",
    introAudio: "找一找意思相反的词，把反义词卡片配成一对吧！",
    pairs: [
      { id: "m-daxiao", leftText: "大", leftAudio: "大，大小", rightText: "小", rightAudio: "小，小鸟", lang: "zh-CN" },
      { id: "m-shangxia", leftText: "上", leftAudio: "上，上下", rightText: "下", rightAudio: "下，下雨", lang: "zh-CN" },
      { id: "m-anjing", leftText: "安静", leftAudio: "安静", rightText: "热闹", rightAudio: "热闹", lang: "zh-CN" },
      { id: "m-yonggan", leftText: "勇敢", leftAudio: "勇敢", rightText: "胆小", rightAudio: "胆小", lang: "zh-CN" },
      { id: "m-heian", leftText: "黑暗", leftAudio: "黑暗", rightText: "明亮", rightAudio: "明亮", lang: "zh-CN" },
      { id: "m-zhengqi", leftText: "整齐", leftAudio: "整齐", rightText: "凌乱", rightAudio: "凌乱", lang: "zh-CN" }
    ]
  },
  {
    id: "english-tenses",
    title: "英语现在与过去消消乐",
    subtitle: "把英语动词和它的过去式配成一对",
    introAudio: "Match each English verb with its past tense partner!",
    pairs: [
      { id: "m-go", leftText: "go", leftAudio: "go", rightText: "went", rightAudio: "went", lang: "en-US" },
      { id: "m-see", leftText: "see", leftAudio: "see", rightText: "saw", rightAudio: "saw", lang: "en-US" },
      { id: "m-eat", leftText: "eat", leftAudio: "eat", rightText: "ate", rightAudio: "ate", lang: "en-US" },
      { id: "m-play", leftText: "play", leftAudio: "play", rightText: "played", rightAudio: "played", lang: "en-US" },
      { id: "m-help", leftText: "help", leftAudio: "help", rightText: "helped", rightAudio: "helped", lang: "en-US" },
      { id: "m-leave", leftText: "leave", leftAudio: "leave", rightText: "left", rightAudio: "left", lang: "en-US" }
    ]
  }
];

export const SORTING_ROUNDS: SortingRound[] = [
  {
    id: "odd-even-sort",
    title: "单数双数投篮赛",
    introAudio: "看清楚球上的数字！个位是1、3、5、7、9投进单数篮，个位是0、2、4、6、8投进双数篮！",
    leftBasketTitle: "单数（奇数）篮",
    leftBasketHint: "个位是 1, 3, 5, 7, 9",
    rightBasketTitle: "双数（偶数）篮",
    rightBasketHint: "个位是 0, 2, 4, 6, 8",
    items: [
      { id: "s-17", label: "17", audioText: "17", lang: "zh-CN", basket: "left", explain: "17 的个位是 7，属于单数！" },
      { id: "s-24", label: "24", audioText: "24", lang: "zh-CN", basket: "right", explain: "24 的个位是 4，能两个两个正好配对，属于双数！" },
      { id: "s-39", label: "39", audioText: "39", lang: "zh-CN", basket: "left", explain: "39 的个位是 9，属于单数！" },
      { id: "s-50", label: "50", audioText: "50", lang: "zh-CN", basket: "right", explain: "50 的个位是 0，属于双数！" },
      { id: "s-63", label: "63", audioText: "63", lang: "zh-CN", basket: "left", explain: "63 的个位是 3，属于单数！" },
      { id: "s-88", label: "88", audioText: "88", lang: "zh-CN", basket: "right", explain: "88 的个位是 8，属于双数！" }
    ]
  },
  {
    id: "radical-sort",
    title: "偏旁部首分类篮",
    introAudio: "看一看汉字的偏旁！和水有关的投进三点水篮，和树木有关的投进木字旁篮！",
    leftBasketTitle: "氵（三点水）篮",
    leftBasketHint: "与水、河流、清洗有关",
    rightBasketTitle: "木（木字旁）篮",
    rightBasketHint: "与树木、森林、木材有关",
    items: [
      { id: "s-he", label: "河（小河）", audioText: "河，小河", lang: "zh-CN", basket: "left", explain: "“河”左边是三点水，和水有关！" },
      { id: "s-lin", label: "林（树林）", audioText: "林，树林", lang: "zh-CN", basket: "right", explain: "“林”由两个木组成，是木字旁！" },
      { id: "s-hai", label: "海（大海）", audioText: "海，大海", lang: "zh-CN", basket: "left", explain: "“海”左边是三点水！" },
      { id: "s-shu", label: "树（大树）", audioText: "树，大树", lang: "zh-CN", basket: "right", explain: "“树”左边是木字旁！" },
      { id: "s-xi", label: "洗（洗手）", audioText: "洗，洗手", lang: "zh-CN", basket: "left", explain: "“洗”左边是三点水，用水洗手！" },
      { id: "s-xiao", label: "校（学校）", audioText: "校，学校", lang: "zh-CN", basket: "right", explain: "“校”左边是木字旁！" }
    ]
  },
  {
    id: "pinyin-flat-retroflex",
    title: "平翘舌音投篮赛",
    introAudio: "听一听汉字的读音！声母是 z、c、s 的投进平舌音篮，声母是 zh、ch、sh 的投进翘舌音篮！",
    leftBasketTitle: "平舌音（z / c / s）",
    leftBasketHint: "舌尖平平：三、草、足",
    rightBasketTitle: "翘舌音（zh / ch / sh）",
    rightBasketHint: "舌尖翘起：山、水、车",
    items: [
      { id: "s-shan", label: "山", audioText: "山", lang: "zh-CN", basket: "right", explain: "“山”读作 shān，声母是翘舌音 sh！" },
      { id: "s-cao", label: "草", audioText: "草，小草", lang: "zh-CN", basket: "left", explain: "“草”读作 cǎo，声母是平舌音 c！" },
      { id: "s-shui", label: "水", audioText: "水", lang: "zh-CN", basket: "right", explain: "“水”读作 shuǐ，声母是翘舌音 sh！" },
      { id: "s-san", label: "三", audioText: "三", lang: "zh-CN", basket: "left", explain: "“三”读作 sān，声母是平舌音 s！" },
      { id: "s-che", label: "车", audioText: "车，汽车", lang: "zh-CN", basket: "right", explain: "“车”读作 chē，声母是翘舌音 ch！" },
      { id: "s-zu", label: "足", audioText: "足，足球", lang: "zh-CN", basket: "left", explain: "“足”读作 zú，声母是平舌音 z！" }
    ]
  },
  {
    id: "english-noun-verb",
    title: "英语名词动词投篮赛",
    introAudio: "Sort each English word into the Noun basket or the Action Verb basket!",
    leftBasketTitle: "Nouns（物品与动物）",
    leftBasketHint: "apple, rabbit, pencil",
    rightBasketTitle: "Verbs（动作词）",
    rightBasketHint: "jump, clap, read",
    items: [
      { id: "s-apple", label: "apple", audioText: "apple", lang: "en-US", basket: "left", explain: "Apple is a fruit noun!" },
      { id: "s-jump", label: "jump", audioText: "jump", lang: "en-US", basket: "right", explain: "Jump is an action verb!" },
      { id: "s-rabbit", label: "rabbit", audioText: "rabbit", lang: "en-US", basket: "left", explain: "Rabbit is an animal noun!" },
      { id: "s-clap", label: "clap", audioText: "clap", lang: "en-US", basket: "right", explain: "Clap is an action verb!" },
      { id: "s-pencil", label: "pencil", audioText: "pencil", lang: "en-US", basket: "left", explain: "Pencil is a thing (noun)!" },
      { id: "s-went", label: "went", audioText: "went", lang: "en-US", basket: "right", explain: "Went is the past tense action verb of go!" }
    ]
  }
];

export const MONSTER_STAGES: MonsterStage[] = [
  {
    id: "monster-math-12",
    title: "第一关：得数是 12 的能量饼干",
    cravingText: "呼噜呼噜～我肚子好饿！快喂我吃 3 块「得数等于 12」的算式饼干！",
    cravingAudio: "我肚子好饿！快喂我吃三块得数等于12的算式饼干！",
    lang: "zh-CN",
    successAudio: "阿姆阿姆，真好吃！12 的算式全找对啦！",
    foods: [
      { id: "f-1", label: "6 + 6", audioText: "6加6", isTarget: true },
      { id: "f-2", label: "3 × 4", audioText: "3乘4", isTarget: true },
      { id: "f-3", label: "15 − 3", audioText: "15减3", isTarget: true },
      { id: "f-4", label: "5 + 6", audioText: "5加6", isTarget: false },
      { id: "f-5", label: "2 × 5", audioText: "2乘5", isTarget: false },
      { id: "f-6", label: "18 − 4", audioText: "18减4", isTarget: false }
    ]
  },
  {
    id: "monster-grass-radical",
    title: "第二关：草字头（艹）脆脆果",
    cravingText: "我想吃 3 个带有「草字头（艹）」、和植物有关的汉字果子！",
    cravingAudio: "我想吃三个带有草字头、和植物有关的汉字果子！",
    lang: "zh-CN",
    successAudio: "太香啦！花、草、苗都有草字头，你真厉害！",
    foods: [
      { id: "f-hua", label: "花", audioText: "花，花朵", isTarget: true },
      { id: "f-cao", label: "草", audioText: "草，小草", isTarget: true },
      { id: "f-miao", label: "苗", audioText: "苗，禾苗", isTarget: true },
      { id: "f-he", label: "河", audioText: "河，小河", isTarget: false },
      { id: "f-tie", label: "听", audioText: "听，听话", isTarget: false },
      { id: "f-ming", label: "明", audioText: "明，明天", isTarget: false }
    ]
  },
  {
    id: "monster-math-20",
    title: "第三关：得数是 20 的超级汉堡",
    cravingText: "我还要长高！快喂我吃 3 个「得数等于 20」的算式汉堡吧！",
    cravingAudio: "快喂我吃三个得数等于20的算式汉堡吧！",
    lang: "zh-CN",
    successAudio: "哇，饱饱的！你的口算又快又准！",
    foods: [
      { id: "f-20a", label: "12 + 8", audioText: "12加8", isTarget: true },
      { id: "f-20b", label: "4 × 5", audioText: "4乘5", isTarget: true },
      { id: "f-20c", label: "25 − 5", audioText: "25减5", isTarget: true },
      { id: "f-20d", label: "11 + 8", audioText: "11加8", isTarget: false },
      { id: "f-20e", label: "3 × 6", audioText: "3乘6", isTarget: false },
      { id: "f-20f", label: "24 − 6", audioText: "24减6", isTarget: false }
    ]
  },
  {
    id: "monster-english-past",
    title: "第四关：英语过去时糖果（Past Tense）",
    cravingText: "Yummy! Please feed me 3 English PAST TENSE verbs (表示过去发生动作的词)!",
    cravingAudio: "Please feed me three English past tense verbs!",
    lang: "en-US",
    successAudio: "Yummy! Went, saw, and played are all past tense verbs!",
    foods: [
      { id: "f-went", label: "went", audioText: "went", isTarget: true },
      { id: "f-saw", label: "saw", audioText: "saw", isTarget: true },
      { id: "f-played", label: "played", audioText: "played", isTarget: true },
      { id: "f-apple", label: "apple", audioText: "apple", isTarget: false },
      { id: "f-blue", label: "blue", audioText: "blue", isTarget: false },
      { id: "f-three", label: "three", audioText: "three", isTarget: false }
    ]
  }
];

export const STORY_QUESTS: StoryQuest[] = [
  {
    id: "quest-rainbow-river",
    title: "第一册：《小芽修木桥过彩虹河》",
    subtitle: "融合思维代换、汉字字谜与英语交际的 3 幕闯关故事",
    introAudio: "欢迎来到互动绘本闯关！今天我们要帮小芽解开三个机关，修好彩虹河上的木桥！",
    completionAudio: "太棒啦！你用聪明才智解开了所有机关，帮小芽顺利走过了彩虹河！",
    scenes: [
      {
        id: "scene-1",
        sceneTitle: "第一幕：木匠爷爷的天平谜题",
        storyText: "小芽来到彩虹河边，发现木桥少了一块木板。木匠爷爷指着天平说：“1 块大木板的重量等于 2 块中木板，1 块中木板又等于 3 块小木块。那 1 块大木板等于几块小木块呢？”",
        storyAudio: "1块大木板的重量等于2块中木板，1块中木板又等于3块小木块。那1块大木板等于几块小木块呢？",
        questionText: "帮小芽算一算：1 块大木板 = 几块小木块？",
        options: ["6 块", "5 块", "4 块"],
        correctAnswer: "6 块",
        hintText: "1 块中木板是 3 块小木块，2 块中木板就是 3 + 3（或者 2 × 3）哦！",
        successText: "算对啦！2 × 3 = 6 块！木匠爷爷把木板递给了小芽。",
        image: "tree"
      },
      {
        id: "scene-2",
        sceneTitle: "第二幕：桥头石碑上的汉字字谜",
        storyText: "拿到了木板，桥头的石碑突然亮起一道字谜锁：“左边太阳照，右边月亮笑，合在一起亮堂堂，明天早上见分晓。”",
        storyAudio: "左边太阳照，右边月亮笑，合在一起亮堂堂，明天早上见分晓。猜猜是哪一个字？",
        questionText: "“日”和“月”合在一起，是哪一个汉字？",
        options: ["明", "林", "草"],
        correctAnswer: "明",
        hintText: "左边是太阳的“日”，右边是月亮的“月”，合起来就是明天的“明”！",
        successText: "太聪明啦！日 + 月 = 明！石碑的大门打开了！",
        image: "sun"
      },
      {
        id: "scene-3",
        sceneTitle: "第三幕：礼貌借工具修好木桥",
        storyText: "小芽要把木板钉好，需要向河对岸的熊大叔借一把锤子。小芽应该用哪句礼貌的英语向熊大叔开口呢？",
        storyAudio: "小芽想礼貌地向熊大叔请求帮忙，应该用哪句英语呢？",
        questionText: "选出最礼貌的英语求助句：",
        options: ["Can you help me, please?", "Go away now!", "This is a red apple."],
        correctAnswer: "Can you help me, please?",
        hintText: "礼貌请求别人帮忙时，要带上 please（请）哦！",
        successText: "说得真有礼貌！熊大叔开心借出工具，彩虹木桥修好啦！",
        image: "bear"
      }
    ]
  },
  {
    id: "quest-star-forest",
    title: "第二册：《森林成语与星空寻宝记》",
    subtitle: "融合成语智慧、自然科普与倍数规律的奇幻冒险",
    introAudio: "第二册故事开始啦！让我们跟着小芽走进星星森林，解开成语和自然界的小秘密！",
    completionAudio: "哇，星星宝箱打开啦！你不仅懂成语、懂科学，还会算倍数规律，真了不起！",
    scenes: [
      {
        id: "scene-2-1",
        sceneTitle: "第一幕：古井里的小青蛙（成语故事）",
        storyText: "森林入口有一口古井，一只小青蛙坐在井底看着头顶小小的天空说：“天空只有井口那么大！”小鸟飞过来说：“你跳出井口看看，天空其实无边无际呢！”",
        storyAudio: "小青蛙坐在井底，以为天空只有井口那么大。这个成语故事叫什么名字呢？",
        questionText: "这个著名的华文成语故事叫什么？",
        options: ["井底之蛙", "守株待兔", "画龙点睛"],
        correctAnswer: "井底之蛙",
        hintText: "坐在“井底”的“青蛙”，四个字连起来就是答案啦！",
        successText: "答对啦！《井底之蛙》告诉我们看世界要站得更高、看得更远！",
        image: "water"
      },
      {
        id: "scene-2-2",
        sceneTitle: "第二幕：花丛里的蝴蝶成长秘密（自然科普）",
        storyText: "走出古井，小芽在花丛里看到一只美丽的蝴蝶。蝴蝶姐姐问：“你知道我小的时候、还没长出翅膀之前是什么样子的吗？”",
        storyAudio: "美丽的蝴蝶在长出翅膀之前，是由什么变来的呢？",
        questionText: "毛毛虫吐丝结蛹后，会变成什么？",
        options: ["美丽的蝴蝶（Butterfly）", "游水的小鱼（Fish）", "天上的月亮（Moon）"],
        correctAnswer: "美丽的蝴蝶（Butterfly）",
        hintText: "卵 → 毛毛虫（caterpillar）→ 蛹（pupa）→ 蝴蝶（butterfly）！",
        successText: "完全正确！毛毛虫破茧成蝶，这就是大自然的生命奇迹！",
        image: "flower"
      },
      {
        id: "scene-2-3",
        sceneTitle: "第三幕：星空宝箱的跳数密码",
        storyText: "夜晚降临，星空宝箱上亮起了一串发光的星星数字：4、8、12、16、___。只要填对下一个数字，宝箱就会打开！",
        storyAudio: "宝箱上的数字是4、8、12、16，按规律下一个数字是多少呢？",
        questionText: "4，8，12，16，___ 下一个数字是？",
        options: ["20", "18", "24"],
        correctAnswer: "20",
        hintText: "每次都往后加 4（4 的乘法口诀：4×1=4，4×2=8，4×3=12，4×4=16，4×5=？）",
        successText: "叮咚！16 + 4 = 20！星空宝箱打开，里面飞出了满满的成长星！",
        image: "star"
      }
    ]
  }
];
