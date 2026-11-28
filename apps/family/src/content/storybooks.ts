import type { LearningLevel } from "../lib/types";

export interface StorybookSentence {
  text: string;
  subtext?: string;
  audioText: string;
  audioLanguage: "zh-CN" | "en-US";
}

export interface StorybookKeyword {
  word: string;
  phonetic: string;
  meaning: string;
  audioText: string;
  audioLanguage: "zh-CN" | "en-US";
}

export interface StorybookPage {
  id: string;
  /** 静态插画（public/assets/images/<name>.png）；有图时优先显示，不再用 emoji 占位 */
  image?: string;
  sceneTheme: "forest-morning" | "rainy-leaf" | "rainbow-sky" | "lantern-river" | "moon-bridge" | "star-sleep" | "sun-garden" | "watering-pot" | "tall-sunflower" | "red-bus" | "school-gate" | "park-friends" | "kitchen-pot" | "sweet-apple" | "dinner-table" | "cloud-mountain" | "rain-river" | "blue-ocean";
  illustrationEmoji: string;
  sentences: StorybookSentence[];
  keywords: StorybookKeyword[];
}

export interface StorybookQuiz {
  prompt: string;
  audioText: string;
  audioLanguage: "zh-CN" | "en-US";
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface ReadAlongStorybook {
  id: string;
  /** 封面插画（public/assets/images/<name>.png）；有图时不再用 emoji 占位 */
  coverImage?: string;
  language: "zh" | "en";
  level: LearningLevel;
  title: string;
  subtitle: string;
  coverEmoji: string;
  coverAccent: string;
  introAudio: string;
  completionAudio: string;
  pages: StorybookPage[];
  quiz: StorybookQuiz;
}

export const READ_ALONG_STORYBOOKS: ReadAlongStorybook[] = [
  {
    id: "book-zh-rain-rainbow",
    coverImage: "story-cover-rain",
    language: "zh",
    level: "K2",
    title: "小雨点找朋友",
    subtitle: "华文注音绘本 · 自然与色彩",
    coverEmoji: "🌧️🌈",
    coverAccent: "#5cb896",
    introAudio: "欢迎来到小芽绘本馆！今天我们一起来读《小雨点找朋友》。点一点句子，老师会一句一句读给你听哦！",
    completionAudio: "太棒啦！你读完了《小雨点找朋友》，还答对了绘本小问答，奖励你一颗闪亮的成长星！",
    pages: [
      {
        id: "p1",
        image: "story-rain-p1",
        sceneTheme: "forest-morning",
        illustrationEmoji: "☁️🌧️🌿",
        sentences: [
          {
            text: "天空中飘来一朵灰云，小雨点从云里跳了下来。",
            subtext: "tiān kōng zhōng piāo lái yì duǒ huī yún ， xiǎo yǔ diǎn cóng yún lǐ tiào le xià lái 。",
            audioText: "天空中飘来一朵灰云，小雨点从云里跳了下来。",
            audioLanguage: "zh-CN"
          },
          {
            text: "滴答滴答，它落在绿油油的草地上。",
            subtext: "dī dā dī dā ， tā luò zài lǜ yóu yóu de cǎo dì shàng 。",
            audioText: "滴答滴答，它落在绿油油的草地上。",
            audioLanguage: "zh-CN"
          }
        ],
        keywords: [
          { word: "云", phonetic: "yún", meaning: "天空中的云朵 (cloud)", audioText: "云，天上的白云。", audioLanguage: "zh-CN" },
          { word: "雨", phonetic: "yǔ", meaning: "从云里落下的雨水 (rain)", audioText: "雨，下雨的雨。", audioLanguage: "zh-CN" },
          { word: "草", phonetic: "cǎo", meaning: "绿油油的小草 (grass)", audioText: "草，青草的草。", audioLanguage: "zh-CN" }
        ]
      },
      {
        id: "p2",
        image: "story-rain-p2",
        sceneTheme: "rainy-leaf",
        illustrationEmoji: "🌺🐸💧",
        sentences: [
          {
            text: "红花喝饱了雨水，开心地朝它点点头。",
            subtext: "hóng huā hē bǎo le yǔ shuǐ ， kāi xīn de cháo tā diǎn diǎn tóu 。",
            audioText: "红花喝饱了雨水，开心地朝它点点头。",
            audioLanguage: "zh-CN"
          },
          {
            text: "荷叶上的小青蛙呱呱叫，邀请小雨点一起唱歌。",
            subtext: "hé yè shàng de xiǎo qīng wā guā guā jiào ， yāo qǐng xiǎo yǔ diǎn yì qǐ chàng gē 。",
            audioText: "荷叶上的小青蛙呱呱叫，邀请小雨点一起唱歌。",
            audioLanguage: "zh-CN"
          }
        ],
        keywords: [
          { word: "花", phonetic: "huā", meaning: "美丽的花朵 (flower)", audioText: "花，红花的花。", audioLanguage: "zh-CN" },
          { word: "水", phonetic: "shuǐ", meaning: "清清的雨水 (water)", audioText: "水，喝水的水。", audioLanguage: "zh-CN" }
        ]
      },
      {
        id: "p3",
        image: "story-rain-p3",
        sceneTheme: "rainbow-sky",
        illustrationEmoji: "☀️🌈🐦",
        sentences: [
          {
            text: "雨停了，暖洋洋的太阳公公露出了笑脸。",
            subtext: "yǔ tíng le ， nuǎn yáng yáng de tài yáng gōng gong lù chū le xiào liǎn 。",
            audioText: "雨停了，暖洋洋的太阳公公露出了笑脸。",
            audioLanguage: "zh-CN"
          },
          {
            text: "小雨点和阳光手拉手，在天上架起了一座七色彩虹桥！",
            subtext: "xiǎo yǔ diǎn hé yáng guāng shǒu lā shǒu ， zài tiān shàng jià qǐ le yí zuò qī sè cái hóng qiáo ！",
            audioText: "小雨点和阳光手拉手，在天上架起了一座七色彩虹桥！",
            audioLanguage: "zh-CN"
          }
        ],
        keywords: [
          { word: "虹", phonetic: "hóng", meaning: "雨后天空的彩虹 (rainbow)", audioText: "虹，彩虹的虹。", audioLanguage: "zh-CN" },
          { word: "手", phonetic: "shǒu", meaning: "手拉手的小手 (hand)", audioText: "手，小手的手。", audioLanguage: "zh-CN" }
        ]
      }
    ],
    quiz: {
      prompt: "雨停了以后，小雨点和阳光手拉手变成了什么？",
      audioText: "雨停了以后，小雨点和阳光手拉手变成了什么？",
      audioLanguage: "zh-CN",
      options: ["七色彩虹桥", "小雪人", "纸飞机"],
      correctAnswer: "七色彩虹桥",
      explanation: "雨停后太阳出来，空气里的小水珠和阳光手拉手，就变成了美丽的七色彩虹桥！"
    }
  },
  {
    id: "book-zh-moon-boat",
    coverImage: "story-cover-moon",
    language: "zh",
    level: "P1",
    title: "月亮船去旅行",
    subtitle: "华文注音绘本 · 夜晚与想象",
    coverEmoji: "🌙⛵",
    coverAccent: "#5b7ec8",
    introAudio: "让我们翻开《月亮船去旅行》，看看弯弯的月亮在夜空里遇到了谁吧！",
    completionAudio: "哇，你把《月亮船去旅行》读得真好听！月亮船把成长星送给你啦！",
    pages: [
      {
        id: "p1",
        image: "story-moon-p1",
        sceneTheme: "lantern-river",
        illustrationEmoji: "🌙✨🌊",
        sentences: [
          {
            text: "天黑了，弯弯的月亮像一艘金色的小船。",
            subtext: "tiān hēi le ， wān wān de yuè liang xiàng yì sōu jīn sè de xiǎo chuán 。",
            audioText: "天黑了，弯弯的月亮像一艘金色的小船。",
            audioLanguage: "zh-CN"
          },
          {
            text: "它轻轻摇着船桨，在深蓝色的夜空里慢慢划行。",
            subtext: "tā qīng qīng yáo zhe chuán jiǎng ， zài shēn lán sè de yè kōng lǐ màn màn huá xíng 。",
            audioText: "它轻轻摇着船桨，在深蓝色的夜空里慢慢划行。",
            audioLanguage: "zh-CN"
          }
        ],
        keywords: [
          { word: "月", phonetic: "yuè", meaning: "天上的月亮 (moon)", audioText: "月，月亮的月。", audioLanguage: "zh-CN" },
          { word: "船", phonetic: "chuán", meaning: "水里或天上的小船 (boat)", audioText: "船，小船的船。", audioLanguage: "zh-CN" }
        ]
      },
      {
        id: "p2",
        image: "story-moon-p2",
        sceneTheme: "moon-bridge",
        illustrationEmoji: "⭐🦉🌲",
        sentences: [
          {
            text: "亮晶晶的小星星提着灯笼，跳上船头当小水手。",
            subtext: "liàng jīng jīng de xiǎo xīng xing tí zhe dēng long ， tiào shàng chuán tóu dāng xiǎo shuǐ shǒu 。",
            audioText: "亮晶晶的小星星提着灯笼，跳上船头当小水手。",
            audioLanguage: "zh-CN"
          },
          {
            text: "树枝上的猫头鹰眨眨大眼睛，向月亮船挥手问好。",
            subtext: "shù zhī shàng de māo tóu yīng zhǎ zhǎ dà yǎn jing ， xiàng yuè liang chuán huī shǒu wèn hǎo 。",
            audioText: "树枝上的猫头鹰眨眨大眼睛，向月亮船挥手问好。",
            audioLanguage: "zh-CN"
          }
        ],
        keywords: [
          { word: "星", phonetic: "xīng", meaning: "闪亮的星星 (star)", audioText: "星，星星的星。", audioLanguage: "zh-CN" },
          { word: "灯", phonetic: "dēng", meaning: "星星提的小灯笼 (lantern)", audioText: "灯，灯笼的灯。", audioLanguage: "zh-CN" }
        ]
      },
      {
        id: "p3",
        image: "story-moon-p3",
        sceneTheme: "star-sleep",
        illustrationEmoji: "🏡💤🌟",
        sentences: [
          {
            text: "夜风吹过窗台，月亮船把甜甜的美梦送进每个房间。",
            subtext: "yè fēng chuī guò chuāng tái ， yuè liang chuán bǎ tián tián de měi mèng sòng jìn měi gè fáng jiān 。",
            audioText: "夜风吹过窗台，月亮船把甜甜的美梦送进每个房间。",
            audioLanguage: "zh-CN"
          },
          {
            text: "小朋友盖好温暖的被子，在星光下安静地睡着了。",
            subtext: "xiǎo péng you gài hǎo wēn nuǎn de bèi zi ， zài xīng guāng xià ān jìng de shuì zháo le 。",
            audioText: "小朋友盖好温暖的被子，在星光下安静地睡着了。",
            audioLanguage: "zh-CN"
          }
        ],
        keywords: [
          { word: "风", phonetic: "fēng", meaning: "轻轻吹过的风 (wind)", audioText: "风，微风的风。", audioLanguage: "zh-CN" },
          { word: "安", phonetic: "ān", meaning: "安静、平安 (peaceful)", audioText: "安，安静的安。", audioLanguage: "zh-CN" }
        ]
      }
    ],
    quiz: {
      prompt: "在故事里，谁提着灯笼跳上月亮船当小水手？",
      audioText: "在故事里，谁提着灯笼跳上月亮船当小水手？",
      audioLanguage: "zh-CN",
      options: ["亮晶晶的小星星", "大白鹅", "小螃蟹"],
      correctAnswer: "亮晶晶的小星星",
      explanation: "亮晶晶的小星星提着灯笼跳上船头，陪月亮船一起在夜空航行！"
    }
  },
  {
    id: "book-zh-apple-share",
    coverImage: "story-cover-apple",
    language: "zh",
    level: "P2",
    title: "小松鼠的分果果",
    subtitle: "华文注音绘本 · 友谊与分享",
    coverEmoji: "🐿️🍎",
    coverAccent: "#e07a5f",
    introAudio: "一起来读《小松鼠的分果果》，看看森林里的小松鼠是怎么和好朋友分享礼物的！",
    completionAudio: "太棒了！学会分享的孩子最可爱，这颗属于你的成长星快收下吧！",
    pages: [
      {
        id: "p1",
        image: "story-apple-p1",
        sceneTheme: "kitchen-pot",
        illustrationEmoji: "🐿️🧺🍎",
        sentences: [
          {
            text: "秋天到了，小松鼠在树林里采了六个红彤彤的大苹果。",
            subtext: "qiū tiān dào le ， xiǎo sōng shǔ zài shù lín lǐ cǎi le liù gè hóng tōng tōng de dà píng guǒ 。",
            audioText: "秋天到了，小松鼠在树林里采了六个红彤彤的大苹果。",
            audioLanguage: "zh-CN"
          },
          {
            text: "它提着满满的竹篮子，想把果子分给森林里的好朋友。",
            subtext: "tā tí zhe mǎn mǎn de zhú lán zi ， xiǎng bǎ guǒ zi fēn gěi sēn lín lǐ de hǎo péng you 。",
            audioText: "它提着满满的竹篮子，想把果子分给森林里的好朋友。",
            audioLanguage: "zh-CN"
          }
        ],
        keywords: [
          { word: "果", phonetic: "guǒ", meaning: "香甜的苹果 (fruit)", audioText: "果，苹果的果。", audioLanguage: "zh-CN" },
          { word: "林", phonetic: "lín", meaning: "茂密的树林 (woods)", audioText: "林，树林的林。", audioLanguage: "zh-CN" }
        ]
      },
      {
        id: "p2",
        image: "story-apple-p2",
        sceneTheme: "sweet-apple",
        illustrationEmoji: "🐰🦔🍎",
        sentences: [
          {
            text: "路上遇到小兔子和小刺猬，它们刚帮熊奶奶扫完院子。",
            subtext: "lù shàng yù dào xiǎo tù zi hé xiǎo cì wei ， tā men gāng bāng xióng nǎi nai sǎo wán yuàn zi 。",
            audioText: "路上遇到小兔子和小刺猬，它们刚帮熊奶奶扫完院子。",
            audioLanguage: "zh-CN"
          },
          {
            text: "小松鼠把六个苹果平均分给三个人，每人拿到了两个甜苹果。",
            subtext: "xiǎo sōng shǔ bǎ liù gè píng guǒ píng jūn fēn gěi sān gè rén ， měi rén ná dào le liǎng gè tián píng guǒ 。",
            audioText: "小松鼠把六个苹果平均分给三个人，每人拿到了两个甜苹果。",
            audioLanguage: "zh-CN"
          }
        ],
        keywords: [
          { word: "果", phonetic: "guǒ", meaning: "红红的苹果 (fruit)", audioText: "果，苹果的果。", audioLanguage: "zh-CN" },
          { word: "分", phonetic: "fēn", meaning: "把东西分给大家 (share)", audioText: "分，分苹果的分。", audioLanguage: "zh-CN" },
        ]
      },
      {
        id: "p3",
        image: "story-apple-p3",
        sceneTheme: "dinner-table",
        illustrationEmoji: "🥧🍵🎶",
        sentences: [
          {
            text: "傍晚，小兔子和刺猬端来刚烤好的苹果派回请小松鼠。",
            subtext: "bàng wǎn ， xiǎo tù zi hé cì wei duān lái gāng kǎo hǎo de píng guǒ pài huí qǐng xiǎo sōng shǔ 。",
            audioText: "傍晚，小兔子和刺猬端来刚烤好的苹果派回请小松鼠。",
            audioLanguage: "zh-CN"
          },
          {
            text: "大家围坐在木桌旁一起品尝，欢笑声传遍了整片森林！",
            subtext: "dà jiā wéi zuò zài mù zhuō páng yì qǐ pǐn cháng ， huān xiào shēng chuán biàn le zhěng piàn sēn lín ！",
            audioText: "大家围坐在木桌旁一起品尝，欢笑声传遍了整片森林！",
            audioLanguage: "zh-CN"
          }
        ],
        keywords: [
          { word: "笑", phonetic: "xiào", meaning: "开心的欢笑 (smile/laugh)", audioText: "笑，笑脸的笑。", audioLanguage: "zh-CN" },
          { word: "家", phonetic: "jiā", meaning: "大家、温暖的家 (home/everyone)", audioText: "家，大家的家。", audioLanguage: "zh-CN" }
        ]
      }
    ],
    quiz: {
      prompt: "小松鼠把 6 个苹果平均分给 3 个好朋友，每个人分到了几个苹果？",
      audioText: "小松鼠把六个苹果平均分给三个好朋友，每个人分到了几个苹果？",
      audioLanguage: "zh-CN",
      options: ["2 个苹果", "4 个苹果", "1 个苹果"],
      correctAnswer: "2 个苹果",
      explanation: "6 个苹果平均分成 3 份，6 除以 3 等于 2，每人都能吃到 2 个红苹果！"
    }
  },
  {
    id: "book-en-little-seed",
    coverImage: "story-cover-seed",
    language: "en",
    level: "K2",
    title: "The Little Sun Seed",
    subtitle: "English Phonics Reader · Nature & Growth",
    coverEmoji: "🌱🌻",
    coverAccent: "#f4a261",
    introAudio: "Welcome to Sprout Storybooks! Today let's read The Little Sun Seed. Tap any sentence to hear it read aloud!",
    completionAudio: "Wonderful reading! You finished The Little Sun Seed and answered the story question!",
    pages: [
      {
        id: "p1",
        image: "story-seed-p1",
        sceneTheme: "sun-garden",
        illustrationEmoji: "🌱🤎🏡",
        sentences: [
          {
            text: "A little brown seed sleeps deep in the soft soil.",
            subtext: "Sight words: a, little, in, the",
            audioText: "A little brown seed sleeps deep in the soft soil.",
            audioLanguage: "en-US"
          },
          {
            text: "Pat, pat! Doudou gently tucks the seed into the garden bed.",
            subtext: "Phonics focus: /s/ seed, /p/ pat, /b/ bed",
            audioText: "Pat, pat! Doudou gently tucks the seed into the garden bed.",
            audioLanguage: "en-US"
          }
        ],
        keywords: [
          { word: "seed", phonetic: "/siːd/", meaning: "小种子", audioText: "Seed. A little brown seed.", audioLanguage: "en-US" },
          { word: "bed", phonetic: "/bed/", meaning: "花圃、小床", audioText: "Bed. Garden bed.", audioLanguage: "en-US" }
        ]
      },
      {
        id: "p2",
        image: "story-seed-p2",
        sceneTheme: "watering-pot",
        illustrationEmoji: "🚿💧☀️",
        sentences: [
          {
            text: "Drip, drop! Cool water falls from the blue watering can.",
            subtext: "Sight words: from, the, blue, can",
            audioText: "Drip, drop! Cool water falls from the blue watering can.",
            audioLanguage: "en-US"
          },
          {
            text: "The warm yellow sun shines down on the wet garden.",
            subtext: "Phonics focus: /s/ sun, /w/ wet",
            audioText: "The warm yellow sun shines down on the wet garden.",
            audioLanguage: "en-US"
          }
        ],
        keywords: [
          { word: "sun", phonetic: "/sʌn/", meaning: "太阳", audioText: "Sun. The warm yellow sun.", audioLanguage: "en-US" },
          { word: "water", phonetic: "/ˈwɔːtər/", meaning: "水、浇水", audioText: "Water. Cool water.", audioLanguage: "en-US" }
        ]
      },
      {
        id: "p3",
        image: "story-seed-p3",
        sceneTheme: "tall-sunflower",
        illustrationEmoji: "🌻🐝💛",
        sentences: [
          {
            text: "Pop! Two green leaves reach up to the bright sky.",
            subtext: "Sight words: two, up, to, the",
            audioText: "Pop! Two green leaves reach up to the bright sky.",
            audioLanguage: "en-US"
          },
          {
            text: "Now it is a tall golden sunflower smiling at the bees!",
            subtext: "Phonics focus: /g/ green, /t/ tall",
            audioText: "Now it is a tall golden sunflower smiling at the bees!",
            audioLanguage: "en-US"
          }
        ],
        keywords: [
          { word: "green", phonetic: "/ɡriːn/", meaning: "绿色的", audioText: "Green. Two green leaves.", audioLanguage: "en-US" },
          { word: "tall", phonetic: "/tɔːl/", meaning: "高高的", audioText: "Tall. A tall golden sunflower.", audioLanguage: "en-US" }
        ]
      }
    ],
    quiz: {
      prompt: "What two things helped the little seed grow into a tall sunflower?",
      audioText: "What two things helped the little seed grow into a tall sunflower?",
      audioLanguage: "en-US",
      options: ["Cool water and warm sun", "Ice cream and snow", "A paper kite"],
      correctAnswer: "Cool water and warm sun",
      explanation: "Seeds need cool water and warm sunlight to sprout green leaves and grow into flowers!"
    }
  },
  {
    id: "book-en-red-bus",
    coverImage: "story-cover-bus",
    language: "en",
    level: "P1",
    title: "The Red Bus to School",
    subtitle: "English Phonics Reader · CVC Words & Community",
    coverEmoji: "🚌🎒",
    coverAccent: "#e63946",
    introAudio: "All aboard! Let's read The Red Bus to School and practice our CVC phonics words together!",
    completionAudio: "Beep beep! You read The Red Bus to School like a superstar! Here is your growth star!",
    pages: [
      {
        id: "p1",
        image: "story-bus-p1",
        sceneTheme: "red-bus",
        illustrationEmoji: "🚌🐶🧢",
        sentences: [
          {
            text: "Beep, beep! The big red bus stops at the corner.",
            subtext: "CVC words: big, red, bus",
            audioText: "Beep, beep! The big red bus stops at the corner.",
            audioLanguage: "en-US"
          },
          {
            text: "Doudou puts on his blue cap and hops up the step.",
            subtext: "CVC words: cap, hop",
            audioText: "Doudou puts on his blue cap and hops up the step.",
            audioLanguage: "en-US"
          }
        ],
        keywords: [
          { word: "bus", phonetic: "/bʌs/", meaning: "公共汽车", audioText: "Bus. The big red bus.", audioLanguage: "en-US" },
          { word: "red", phonetic: "/red/", meaning: "红色的", audioText: "Red. Big red bus.", audioLanguage: "en-US" }
        ]
      },
      {
        id: "p2",
        image: "story-bus-p2",
        sceneTheme: "school-gate",
        illustrationEmoji: "🐱🐷🎒",
        sentences: [
          {
            text: "Little Cat and Pink Pig sit together by the window.",
            subtext: "CVC words: cat, pig, sit",
            audioText: "Little Cat and Pink Pig sit together by the window.",
            audioLanguage: "en-US"
          },
          {
            text: "They wave at the green trees as the wheels spin fast.",
            subtext: "Phonics focus: /w/ wave, /s/ spin",
            audioText: "They wave at the green trees as the wheels spin fast.",
            audioLanguage: "en-US"
          }
        ],
        keywords: [
          { word: "cat", phonetic: "/kæt/", meaning: "小猫", audioText: "Cat. Little Cat.", audioLanguage: "en-US" },
          { word: "pig", phonetic: "/pɪɡ/", meaning: "小猪", audioText: "Pig. Pink Pig.", audioLanguage: "en-US" }
        ]
      },
      {
        id: "p3",
        image: "story-bus-p3",
        sceneTheme: "park-friends",
        illustrationEmoji: "🏫🔔📚",
        sentences: [
          {
            text: "Ding-dong! The school bell rings in the sunny yard.",
            subtext: "Phonics focus: /b/ bell, /s/ sunny",
            audioText: "Ding-dong! The school bell rings in the sunny yard.",
            audioLanguage: "en-US"
          },
          {
            text: "Everyone says thank you to the driver and runs to class!",
            subtext: "Polite words: thank you",
            audioText: "Everyone says thank you to the driver and runs to class!",
            audioLanguage: "en-US"
          }
        ],
        keywords: [
          { word: "bell", phonetic: "/bel/", meaning: "铃声、钟", audioText: "Bell. The school bell rings.", audioLanguage: "en-US" },
          { word: "run", phonetic: "/rʌn/", meaning: "奔跑", audioText: "Run. Runs to class.", audioLanguage: "en-US" }
        ]
      }
    ],
    quiz: {
      prompt: "What polite words do the friends say to the bus driver before going to class?",
      audioText: "What polite words do the friends say to the bus driver before going to class?",
      audioLanguage: "en-US",
      options: ["Thank you", "Good night", "Happy birthday"],
      correctAnswer: "Thank you",
      explanation: "Saying 'Thank you' to the bus driver is kind and polite every morning!"
    }
  },
  {
    id: "book-en-cloud-journey",
    coverImage: "story-cover-cloud",
    language: "en",
    level: "P2",
    title: "Where Does the Rain Go?",
    subtitle: "English Science Reader · Water Cycle Adventure",
    coverEmoji: "⛅🌊",
    coverAccent: "#3a86ff",
    introAudio: "Let's explore nature in Where Does the Rain Go? Follow a little water drop from the ocean to the clouds!",
    completionAudio: "Fantastic science reader! You traced the whole water cycle and earned a growth star!",
    pages: [
      {
        id: "p1",
        image: "story-cloud-p1",
        sceneTheme: "blue-ocean",
        illustrationEmoji: "🌊☀️💨",
        sentences: [
          {
            text: "The bright sun warms the blue water in the wide ocean.",
            subtext: "Science concept: Evaporation (蒸发)",
            audioText: "The bright sun warms the blue water in the wide ocean.",
            audioLanguage: "en-US"
          },
          {
            text: "Tiny water drops turn into vapor and float high into the air.",
            subtext: "Vocabulary: vapor (水蒸气), float (漂浮)",
            audioText: "Tiny water drops turn into vapor and float high into the air.",
            audioLanguage: "en-US"
          }
        ],
        keywords: [
          { word: "ocean", phonetic: "/ˈoʊʃən/", meaning: "海洋", audioText: "Ocean. The wide blue ocean.", audioLanguage: "en-US" },
          { word: "float", phonetic: "/floʊt/", meaning: "漂浮、升起", audioText: "Float. Float high into the air.", audioLanguage: "en-US" }
        ]
      },
      {
        id: "p2",
        image: "story-cloud-p2",
        sceneTheme: "cloud-mountain",
        illustrationEmoji: "🏔️☁️❄️",
        sentences: [
          {
            text: "High up in the cool sky, millions of drops hug together.",
            subtext: "Science concept: Condensation (凝结成云)",
            audioText: "High up in the cool sky, millions of drops hug together.",
            audioLanguage: "en-US"
          },
          {
            text: "They form a fluffy white cloud drifting over the green mountains.",
            subtext: "Vocabulary: fluffy cloud (蓬松的云朵)",
            audioText: "They form a fluffy white cloud drifting over the green mountains.",
            audioLanguage: "en-US"
          }
        ],
        keywords: [
          { word: "cloud", phonetic: "/klaʊd/", meaning: "云朵", audioText: "Cloud. A fluffy white cloud.", audioLanguage: "en-US" },
          { word: "sky", phonetic: "/skaɪ/", meaning: "天空", audioText: "Sky. High up in the cool sky.", audioLanguage: "en-US" }
        ]
      },
      {
        id: "p3",
        image: "story-cloud-p3",
        sceneTheme: "rain-river",
        illustrationEmoji: "🌧️🏞️🌊",
        sentences: [
          {
            text: "When the cloud gets heavy, the drops fall back down as fresh rain.",
            subtext: "Science concept: Precipitation (降水)",
            audioText: "When the cloud gets heavy, the drops fall back down as fresh rain.",
            audioLanguage: "en-US"
          },
          {
            text: "The stream carries the water back to the sea to start the trip again!",
            subtext: "Vocabulary: stream (溪流), water cycle (水循环)",
            audioText: "The stream carries the water back to the sea to start the trip again!",
            audioLanguage: "en-US"
          }
        ],
        keywords: [
          { word: "rain", phonetic: "/reɪn/", meaning: "雨水", audioText: "Rain. Fresh rain falls down.", audioLanguage: "en-US" },
          { word: "stream", phonetic: "/striːm/", meaning: "小溪、河流", audioText: "Stream. The stream carries the water.", audioLanguage: "en-US" }
        ]
      }
    ],
    quiz: {
      prompt: "What happens when tiny water drops float high into the cool sky and hug together?",
      audioText: "What happens when tiny water drops float high into the cool sky and hug together?",
      audioLanguage: "en-US",
      options: ["They form a fluffy cloud", "They turn into rocks", "They become dry sand"],
      correctAnswer: "They form a fluffy cloud",
      explanation: "When water vapor cools high in the sky, the tiny drops gather to form clouds!"
    }
  }
];
