import type { Locale } from "./copy";
import type { Question } from "../lib/types";

const SKILL_HINTS: Record<string, string> = {
  "k2-math-count-20": "点一左边的【圆点/数字规律教具】，用手指每点一个数一个数。",
  "k2-math-add-within-10": "看左边的【圆点或分合图教具】：加法把两边合起来数，减法拿走后面那组。",
  "math-count-100": "看左边的【十位与个位积木】：1 根绿条是 1 个十（10），1 个黄块是 1 个一（1）。",
  "math-place-value-1000": "看左边的【数位表教具】：从左到右依次是百位（×100）、十位（×10）、个位（×1）。",
  "math-add-sub-100": "看左边的【数轴或条形图教具】：先算十位和十位，再算个位和个位。",
  "math-two-step-problems": "看左边的【两步流程图教具】：沿着箭头先算第一步的变化，再用得数算第二步。",
  "math-add-sub-regroup": "看左边的【跳数轴教具】：从起点数字出发，个位满十进一，不够减就向十位退一。",
  "math-add-sub-1000": "看左边的【跳数轴教具】：百位、十位、个位对齐，从个位开始一位一位算。",
  "math-multiply-tables": "看左边的【点阵教具（Array）】：数一数有几行、每行有几个圆点。",
  "math-divide-tables": "看左边的【平均分教具（Equal groups）】：看看每个框里平均分到了几个圆点。",
  "math-fractions": "看左边的【分数条教具】：总共平均分成的份数是分母，涂色的一份是分子。",
  "math-fractions-add-sub": "看左边的【双分数条教具】：分母相同不变，只需要把涂色格子的分子相加或相减。",
  "math-money": "看左边的【钱币算式教具】：$1 = 100 cents，先把元换成分再算。",
  "math-time": "看左边的【钟面教具】：短针看小时，红长针看分钟，每走一大格是 5 分钟。",
  "math-time-duration": "看左边的【时间轴教具】：1 小时 = 60 分钟，用结束时间减去开始时间。",
  "math-shapes": "点一左边【图形教具】里的每一个图形，看看它有几条直边、几个角、几个平面或能不能滚动。",
  "math-picture-graph": "看左边的【象形统计图】：1 个圆点代表 1 个，先数每行有几个再比较。",
  "math-length-measure": "看左边的【厘米尺教具】：用末端刻度减去起点刻度，就是物体的长度。",
  "math-measurement-units": "看左边的【单位卡片教具】：长短用 cm/m，轻重用 g/kg（1 kg = 1000 g），液体用 L。",
  "math-scaled-picture-graph": "看左边的【比例统计图教具】：先看图例里 1 个图标代表几个（×2、×5 或 ×10），再用图标数乘比例。",
  "math-number-patterns-1000": "看左边的【奇偶与规律教具】：奇偶看个位（0/2/4/6/8 是偶数，1/3/5/7/9 是奇数）；找规律看相邻两数相差多少。",
  "k2-mandarin-listen": "点左上角的黄色耳机按钮再听一次发音，对照图片或词语选出来。",
  "k2-mandarin-vocabulary": "在心里把这个词读出来，想一想它平时是用在什么地方的。",
  "mandarin-initials": "教具已切到【全部拼音表 · 声母 (23)】，点一点声母按键听发音，比一比哪个和这个字开头的音一样。",
  "mandarin-finals": "教具已切到【全部拼音表 · 韵母 (24)】，点一点韵母按键听发音，把字音尾音拉长比一比。",
  "mandarin-tones": "点上面【声调过山车】的 4 张卡片听四声：第一声平平走，第二声往上爬，第三声先下再上，第四声往下滑。",
  "mandarin-syllables": "用上面的【拼读积木台】先听声母、再听韵母，注意核对声调是第几声。",
  "mandarin-characters": "仔细看这个汉字的偏旁部首（比如“艹”和植物有关、“木”和树木有关、“女”和女性家人有关）。",
  "mandarin-vocabulary": "把三个选项分别放进这句话的情境里读一读，看哪一个最合理。",
  "mandarin-reading": "回到上面的【阅读卡片】里找关键词，看看句子里是怎么写的。",
  "mandarin-reading-inference": "先看【阅读卡片】里的线索，想一想发生这件事的原因或接下来会做什么。",
  "mandarin-listening": "点左上角的耳机按钮再听一遍句子，重点听“谁”、“在哪里”和“做什么”。",
  "mandarin-classifiers": "把数字、“一”和选项里的量词连起来读一读（比如一只猫、一朵花、一本书、一座山、一双手）。",
  "mandarin-word-order": "用左边的【造句词块】按“谁 + 在哪里/做什么”排一排，再选一模一样的句子。",
  "mandarin-radicals-homographs": "看汉字左边的偏旁部首表意：三点水“氵”跟水有关，日字旁“日”跟太阳晴天有关，目字旁“目”跟眼睛有关，言字旁“讠”跟礼貌说话有关。",
  "mandarin-synonyms-collocations": "近义词找意思最像的词，反义词找完全相对的词；词语搭配可以放进短语里默读一遍看顺不顺口。",
  "mandarin-conjunctions-complex": "先看前后两半句的关系：讲原因结果用“因为…所以…”，讲转折用“虽然…但是…”，更进一层用“不但…而且…”，按顺序做用“先…再…”。",
  "mandarin-passage-comprehension": "先读【阅读卡片】里的整段小故事，找出主角做了什么、结果怎样，再想故事要告诉我们什么道理。",
  "k2-english-listen": "点左上角耳机按钮再听一次单词发音，听清楚开头的声音。",
  "k2-english-letters": "按字母表 A B C D E F... 的顺序想一想，或大声读出单词听第一个音。",
  "english-letters": "慢慢读出这个单词，听它最开头的第一个发音对应哪个字母。",
  "english-listening": "点左上角大耳机按钮再听一次单词，再对照三张图片选出正确的图。",
  "english-listening-comprehension": "点左上角耳机再听一遍，注意听人物做了什么动作或要去哪里。",
  "english-phonics": "问开头音（starts with）就听第一个音；问押韵（rhymes with）就找结尾发音相同的词。",
  "english-sight-words": "把选项放进横线里读整句话：I 用 am/have/go，he/she/单数用 is/has，we/you/复数用 are/go。",
  "english-vocabulary": "看图或读题干描述，想一想它在日常生活里对应的英文单词。",
  "english-a-an": "看横线后面紧挨着的词：以 a, e, i, o, u 元音音素开头且表示“一个”时用 an，辅音音素开头用 a。",
  "english-plural": "表示两个或更多（two, three, four...）时，普通名词后面要加 -s。",
  "english-sentence-order": "先用左边的【Word tiles】从主角（Who）开始点词块拼出通顺句子，再选匹配的选项。",
  "english-reading": "先看问题问的是颜色（What colour）、地点（Where）、人物（Who）还是数量（How many），再回【Read】短文框里找原词。",
  "english-reading-inference": "读一读【Read】短文框里的线索，想一想人物为什么这样做或接下来会发生什么。",
  "english-spelling": "点左上角耳机听清单词的开头音、中间元音和结尾音，再核对字母拼写。",
  "english-tenses-agreement": "先找句子里的时间线索词：every day 看主语单复数（单数加 -s），now/Look! 用 am/is/are + -ing，yesterday/last night 用过去式。",
  "english-prepositions-connectors": "表示在两个物体中间用 between，时间点前用 at、星期几前用 on；讲原因用 because、讲转折用 but、讲结果用 so。",
  "english-pronouns-questions": "动词前面做主语用 He/She/We/They，动词或介词后面用 him/her/us/them，名词前面表示“谁的”用 his/her/their；问所属用 Whose。",
  "english-cloze-passage": "先读【Read】框里的前后两句话，圈出时间词（如 Yesterday / right now）和因果线索，再选最符合语境的词。"
};

const SKILL_HINTS_EN: Record<string, string> = {
  "k2-math-count-20": "Use the visual tool on the left: tap each dot or star one by one as you count, or follow the pattern chips.",
  "k2-math-add-within-10": "Look at the visual tool on the left: put both groups together to add, or take away the second group to subtract.",
  "math-count-100": "Look at the Place value tool on the left: each green rod is 1 ten (10) and each yellow cube is 1 one (1).",
  "math-place-value-1000": "Look at the Place value chart on the left: Hundreds (×100), Tens (×10), Ones (×1).",
  "math-add-sub-100": "Look at the visual tool on the left: add or subtract the tens first, then the ones.",
  "math-two-step-problems": "Follow the arrows in the Two-step tool on the left: solve the first change, then apply the second change.",
  "math-add-sub-regroup": "Follow the red jump arrow on the Number line tool: regroup 10 ones as 1 ten when adding, or borrow 1 ten when subtracting.",
  "math-add-sub-1000": "Follow the red jump arrow on the Number line tool: work from ones to tens to hundreds.",
  "math-multiply-tables": "Look at the Array tool on the left: count the equal rows and how many dots are in each row.",
  "math-divide-tables": "Look at the Equal groups tool on the left: count how many dots are shared into each group.",
  "math-fractions": "Look at the Fraction model tool on the left: count all equal parts for the denominator, and the shaded parts for the numerator.",
  "math-fractions-add-sub": "Look at the Fraction bars tool on the left: the denominators are the same, so add or subtract the numerators only.",
  "math-money": "Look at the Money tool on the left: $1 = 100 cents. Convert dollars to cents first, then calculate.",
  "math-time": "Look at the Clock tool on the left: each number on the clock is 5 minutes for the red minute hand.",
  "math-time-duration": "Look at the Timeline tool on the left: 1 hour = 60 minutes. Count the time from Start to End.",
  "math-shapes": "Tap each shape in the Shapes tool on the left to inspect its straight sides, corners, flat faces, or whether it can roll.",
  "math-picture-graph": "Look at the Picture graph tool on the left: each dot stands for 1. Count each row and compare.",
  "math-length-measure": "Look at the Centimetre ruler or Length bars tool on the left: subtract the start mark from the end mark.",
  "math-measurement-units": "Look at the Unit reference tool on the left: use cm/m for length, g/kg for mass (1 kg = 1000 g), and L for volume.",
  "math-scaled-picture-graph": "Look at the Scaled picture graph tool on the left: check the key first (each dot stands for 2, 5, or 10), then multiply the symbol count by the scale.",
  "math-number-patterns-1000": "Look at the tool on the left: for odd/even, check the ones digit (0, 2, 4, 6, 8 are even; 1, 3, 5, 7, 9 are odd); for patterns, find the step between neighbours.",
  "k2-english-listen": "Tap the yellow headphones button at the top right to listen again, then match the word you heard.",
  "k2-english-letters": "Say the alphabet in order (A, B, C, D...) or say the word out loud and listen for its first sound.",
  "english-letters": "Say the word slowly and listen to the very first sound at the beginning of the word.",
  "english-listening": "Tap the big headphones button to listen again, then tap the picture that matches the word.",
  "english-listening-comprehension": "Tap the headphones button to listen again and focus on who is speaking, where they are, and what they do.",
  "english-phonics": "For beginning sounds, listen to the first sound; for rhyming words, look for the same ending sound.",
  "english-sight-words": "Read the whole sentence with each choice: use am/have/go with I, is/has with he/she/one thing, and are/go with we/you/they.",
  "english-vocabulary": "Look at the picture or clue and think of the everyday English word that names it.",
  "english-a-an": "Look at the word right after the blank: use 'an' before a vowel sound (a, e, i, o, u) and 'a' before a consonant sound.",
  "english-plural": "When there are two or more, add -s to the singular noun.",
  "english-sentence-order": "Use the Word tiles tool on the left: tap the words in order starting with who the sentence is about, then pick the matching sentence.",
  "english-reading": "Check whether the question asks What colour, Where, Who, or How many, then find that detail in the Read box above.",
  "english-reading-inference": "Read the clues in the Read box above and think about why it happened or what the character will do next.",
  "english-spelling": "Tap the headphones button to hear the word again, then check the beginning, middle vowel, and ending letters.",
  "english-tenses-agreement": "Spot the time clue first: 'every day' needs -s for he/she/it; 'right now / Look!' needs am/is/are + -ing; 'yesterday / last night' needs past tense.",
  "english-prepositions-connectors": "Check position or time: use 'between' for two things, 'at' for clock times, 'on' for days; use 'because' for reason, 'but' for contrast, and 'so' for result.",
  "english-pronouns-questions": "Use He/She/We/They before a verb, him/her/us/them after a verb or preposition, and his/her/their before a noun; use Whose to ask about ownership.",
  "english-cloze-passage": "Read the whole passage in the Read box above: check the time words and context clues in both sentences before choosing the word."
};

export interface SkillTeach {
  title: string;
  body: string;
  example?: string;
}

const SKILL_TEACH: Record<string, SkillTeach> = {
  "k2-math-count-20": {
    title: "一个一个点着数",
    body: "用手指点一点左边的圆点或星星，每点一个数一个数；找规律时看数字每次加几。",
    example: "1, 2, 3, 4, 5..."
  },
  "k2-math-add-within-10": {
    title: "合起来和拿走",
    body: "加法是把两堆合起来数总数，减法是从总数里拿走一部分。",
    example: "点一点十格阵里的格子帮忙数。"
  },
  "math-count-100": {
    title: "十位和个位",
    body: "10 个一是一根绿色的十条。先数有几根十条（几个十），再数剩下的黄色小方块（几个一）。",
    example: "3 根十条和 7 个一是 37。"
  },
  "math-place-value-1000": {
    title: "三位数的位置",
    body: "从左到右是百位、十位、个位。百位上的数字表示几个 100，十位表示几个 10，个位表示几个 1。",
    example: "472 = 400 + 70 + 2"
  },
  "math-add-sub-100": {
    title: "十位对十位，个位对个位",
    body: "不进位不退位加减法：先把十位相加减，再把个位相加减，最后合起来。",
    example: "23 + 14：20 + 10 = 30，3 + 4 = 7，合起来是 37。"
  },
  "math-two-step-problems": {
    title: "一步一步按顺序算",
    body: "看左边流程图里的两个箭头：先把第一步算出来，再用第一步的得数接着算第二步。",
    example: "先算第一个箭头，再算第二个箭头。"
  },
  "math-add-sub-regroup": {
    title: "满十进一，不够借十",
    body: "个位相加满 10，就把 10 个一换成 1 个十；个位不够减，就从十位退 1 个十变成 10 个一再减。",
    example: "看左边跳数轴上的红色箭头。"
  },
  "math-add-sub-1000": {
    title: "三位数对齐计算",
    body: "把百位、十位、个位对齐，从个位开始算起，满十向高一位进一，不够减向高一位借一。",
    example: "238 + 341 = 579"
  },
  "math-multiply-tables": {
    title: "乘法是几组一样多",
    body: "看左边的点阵教具：有几行、每行有几个，就是几个几相加。",
    example: "3 行、每行 5 个：3 × 5 = 15"
  },
  "math-divide-tables": {
    title: "除法是平均分",
    body: "看左边的平均分教具：把总数平均放进几个框里，数一数每个框里有几个。",
    example: "12 平均分成 3 组，每组 4 个：12 ÷ 3 = 4"
  },
  "math-fractions": {
    title: "平均分成几等份",
    body: "分数每一份必须一样大。总共分成几份是分母（下面），取了其中几份是分子（上面）。",
    example: "4 等份中的 1 份是 1/4（one quarter）。"
  },
  "math-fractions-add-sub": {
    title: "同分母分数加减",
    body: "分母（下面的数）相同时，分母保持不变，只把分子（上面的数）相加或相减。",
    example: "2/6 + 3/6 = 5/6"
  },
  "math-money": {
    title: "元和分的换算",
    body: "$1 等于 100 cents（100 分）。先把元换成分，再比较大小或算找零。",
    example: "$3.50 = 350 cents"
  },
  "math-time": {
    title: "看时针和分针",
    body: "短针是时针，红长针是分针。分针每走一大格是 5 分钟。",
    example: "7:35 就是 7 点过 35 分钟。"
  },
  "math-time-duration": {
    title: "经过了多少时间",
    body: "1 小时 = 60 分钟。看左边的时间轴：开始时间 + 经过时间 = 结束时间。",
    example: "1 小时 30 分钟 = 90 分钟"
  },
  "math-shapes": {
    title: "认图形的边、角和面",
    body: "点一点左边教具里的图形：平面图形看有几条直边和几个角，立体图形看有几个平面、能不能滚动。",
    example: "三角形有 3 条边，正方体有 6 个正方形的面。"
  },
  "math-picture-graph": {
    title: "看象形统计图",
    body: "先数左边统计图每一行有几个圆点，求“一共”用加法，求“多几个/少几个”用减法。",
    example: "上下两行对齐比一比多出几个。"
  },
  "math-length-measure": {
    title: "用厘米尺量长度",
    body: "看左边的尺子：从 0 刻度开始量，终点对着几就是几 cm；不是从 0 开始时，用终点减起点。",
    example: "从 3 cm 到 11 cm：11 − 3 = 8 cm"
  },
  "math-measurement-units": {
    title: "选合适的测量单位",
    body: "长度用厘米（cm）或米（m，1 m = 100 cm）；质量用克（g）或千克（kg，1 kg = 1000 g）；液体容量用升（L）。",
    example: "1 kg = 1000 g，1 m = 100 cm"
  },
  "math-scaled-picture-graph": {
    title: "先看比例图例（1 个代表几）",
    body: "比例统计图里，1 个图标不再只代表 1，而是代表 2、5 或 10。先数有几个图标，再乘每个图标代表的数量。",
    example: "每个图标代表 5，4 个图标就是 4 × 5 = 20。"
  },
  "math-number-patterns-1000": {
    title: "看个位辨奇偶，看差值找规律",
    body: "个位是 0, 2, 4, 6, 8 的数是偶数（even），个位是 1, 3, 5, 7, 9 的数是奇数（odd）。数列先算相邻两数加几或减几。",
    example: "248 个位是 8 → 偶数；320, 330, 340 → 每次 +10。"
  },
  "k2-mandarin-listen": {
    title: "仔细听，选对图和词",
    body: "先点耳机听清楚老师读的词语，再在右边点对应的图片或汉字。",
    example: "猫、狗、鸟、红色、蓝色"
  },
  "k2-mandarin-vocabulary": {
    title: "给常见词语分分类",
    body: "想一想这个词语在生活里是什么类别（水果、文具、动物、颜色或动作）。",
    example: "苹果是水果，铅笔是文具，小狗是动物。"
  },
  "mandarin-initials": {
    title: "声母在最前面",
    body: "声母是拼音开头的辅音。可以用左边的【拼读积木台】或【全部拼音表 · 声母】点一点听发音。",
    example: "猫 māo 的声母是 m。"
  },
  "mandarin-finals": {
    title: "韵母在声母后面",
    body: "把字音拉长，后面的响亮部分就是韵母。可以在【全部拼音表 · 韵母】里点一点听标准读音。",
    example: "猫 māo 的韵母是 ao，书 shū 的韵母是 u。"
  },
  "mandarin-tones": {
    title: "四声过山车",
    body: "一声平平走，二声往上爬，三声先下再上，四声往下滑。点左边的【声调过山车】先听再选。",
    example: "mā（第一声）/ má（第二声）/ mǎ（第三声）/ mà（第四声）"
  },
  "mandarin-syllables": {
    title: "声母 + 韵母 + 声调",
    body: "完整音节要把声母、韵母和声调合在一起。用左边的【拼读积木台】点“拼一拼”听完整读音。",
    example: "m + āo = māo"
  },
  "mandarin-characters": {
    title: "看偏旁，认汉字",
    body: "很多汉字的形状和偏旁能提示意思：比如“艹”常和花草有关，“木”和树木有关，“女”和女性家人有关。",
    example: "日、月、山、水、火、木、花、树、妈"
  },
  "mandarin-vocabulary": {
    title: "结合生活情境选词语",
    body: "读一读题目描述的生活场景，想一想平时这时候我们会用什么东西或做什么动作。",
    example: "口渴要喝水，写字用铅笔。"
  },
  "mandarin-reading": {
    title: "在句子里找答案",
    body: "先读【阅读卡片】里的句子，再看问题问的是“谁”、“什么东西”还是“先做什么”。",
    example: "句子说“小猫轻轻走”，主角就是“小猫”。"
  },
  "mandarin-reading-inference": {
    title: "抓线索，想原因",
    body: "读一读句子里的线索（如天气变化、人物动作），推想人物的心情、原因或下一步会做什么。",
    example: "看到乌云密布、风变大 → 接下来可能会下雨。"
  },
  "mandarin-listening": {
    title: "听句子抓关键信息",
    body: "点耳机听句子时，重点听清“谁”、“在哪里”、“做什么”，再选对应的答案。",
    example: "“妈妈在厨房煮饭” → 妈妈在厨房。"
  },
  "mandarin-classifiers": {
    title: "搭配顺口的量词",
    body: "不同的事物有固定的量词搭配，连起来读一读听听顺不顺口。",
    example: "一只猫、一朵花、一座山、一棵树、一本书、一双手。"
  },
  "mandarin-word-order": {
    title: "谁 + 做什么 / 在哪里",
    body: "华文句子通常先说“谁”，再说“在哪里”或“做什么”。可以用左边的【造句词块】先排一排。",
    example: "我 + 喜欢 + 小猫。"
  },
  "mandarin-radicals-homographs": {
    title: "形声字：形旁表意，声旁表音",
    body: "长得像的形近字，看偏旁就能分清意思：三点水“清”和清水有关，日字旁“晴”和晴天太阳有关，目字旁“睛”和眼睛有关，言字旁“请”和礼貌说话有关。",
    example: "清水（氵）/ 晴天（日）/ 眼睛（目）/ 请进（讠）"
  },
  "mandarin-synonyms-collocations": {
    title: "近义词、反义词与好词搭配",
    body: "意思相近的是近义词（高兴—快乐、仔细—认真），意思相反的是反义词（安静—热闹、整齐—凌乱），再学会把形容词、动词和合适的名词搭配起来。",
    example: "温暖的阳光、绿油油的小草、整理房间、朗读课文。"
  },
  "mandarin-conjunctions-complex": {
    title: "用关联词把两句话连起来",
    body: "原因和结果用“因为……所以……”，意思转折用“虽然……但是……”，更进一步用“不但……而且……”，连续动作按顺序用“先……再……最后……”。",
    example: "因为外面下大雨，所以我们在室内上课。"
  },
  "mandarin-passage-comprehension": {
    title: "读懂小故事的起因、经过和道理",
    body: "读三四句话的小故事时，先看主角遇到了什么事、他是怎么做的、结果怎样，最后想一想故事告诉我们什么好习惯或道理。",
    example: "谁 → 遇到什么事 → 怎么做 → 明白什么道理。"
  },
  "k2-english-listen": {
    title: "Listen and match",
    body: "Tap the headphones button to hear the word, then tap the matching picture or word.",
    example: "cat, dog, fish, red, blue"
  },
  "k2-english-letters": {
    title: "Capital and small letters",
    body: "Every letter has a capital form (A, B, C) and a small form (a, b, c) in alphabetical order.",
    example: "A ↔ a, B ↔ b, C → D → E"
  },
  "english-letters": {
    title: "First letter sound",
    body: "Say the word out loud and listen to its very first sound.",
    example: "Apple starts with /a/ → A."
  },
  "english-listening": {
    title: "Listen and find the picture",
    body: "Tap the headphones button to hear the word, then tap the picture that shows it.",
    example: "Listen carefully to the whole word before tapping."
  },
  "english-listening-comprehension": {
    title: "Listen for clues in the story",
    body: "Listen to the whole sentence and notice who the person is, where they are, and what happens.",
    example: "Ask yourself: Who? Where? What happened?"
  },
  "english-phonics": {
    title: "Sounds and rhyming words",
    body: "Beginning sound questions ask for the first sound; rhyming questions ask for words with the same ending sound.",
    example: "cat and hat rhyme (-at); dog and log rhyme (-og)."
  },
  "english-sight-words": {
    title: "Choose the sight word that fits",
    body: "Read the whole sentence with each word to see which one makes a correct sentence.",
    example: "I have / I am, She is / He has, We go / They are."
  },
  "english-vocabulary": {
    title: "Everyday words and meanings",
    body: "Look at the picture or clue and match it with its everyday English name.",
    example: "apple (fruit), water (drink), bird (can fly)."
  },
  "english-a-an": {
    title: "Using a and an",
    body: "Use 'an' before a singular word starting with a vowel sound (a, e, i, o, u) and 'a' before a consonant sound.",
    example: "an apple, an egg, an old owl; a cat, a book."
  },
  "english-plural": {
    title: "One and more than one",
    body: "When there are two or more, add -s to the end of most nouns.",
    example: "one cat → two cats; one book → three books."
  },
  "english-sentence-order": {
    title: "Who + action",
    body: "Start with who the sentence is about, then add the action word. Use the Word tiles tool on the left to build it first.",
    example: "The boy + is riding + a bike."
  },
  "english-reading": {
    title: "Find the detail in the text",
    body: "Read the question first, then look for the exact word in the Read box above.",
    example: "Who = person, Where = place, What colour = colour word."
  },
  "english-reading-inference": {
    title: "Use story clues to infer",
    body: "Look at the clues in the Read box and think about how the character feels or what will happen next.",
    example: "Dark clouds + umbrella → it may rain."
  },
  "english-spelling": {
    title: "Listen and spell each sound",
    body: "Listen to the word from beginning to end and match each sound to its letters.",
    example: "s - u - n → sun"
  },
  "english-tenses-agreement": {
    title: "Match the verb to the time and subject",
    body: "Look for time clues: 'every day' uses -s for he/she/it; 'now / Look!' uses am/is/are + -ing; 'yesterday / last night' uses past tense.",
    example: "He walks every day. / He is walking now. / He walked yesterday."
  },
  "english-prepositions-connectors": {
    title: "Position words and sentence connectors",
    body: "Use between, behind, in front of, under for places, and at (clock time), on (days), in (months). Join ideas with because (reason), but (contrast), and so (result).",
    example: "We stayed inside because it was raining."
  },
  "english-pronouns-questions": {
    title: "Pronouns and Wh- question words",
    body: "Use He/She/We/They as subjects, him/her/us/them after verbs, and his/her/their before nouns. Use Who, Where, When, Why, Whose, and How many to ask questions.",
    example: "Whose bag is this? It is her bag. Please give it to her."
  },
  "english-cloze-passage": {
    title: "Use clues across sentences",
    body: "Read both sentences in the passage before choosing. Check time clues for grammar blanks and meaning clues for vocabulary blanks.",
    example: "The baby was sleeping, so we spoke quietly."
  }
};

const SKILL_TEACH_EN: Record<string, SkillTeach> = {
  ...SKILL_TEACH,
  "k2-math-count-20": {
    title: "Tap and count one by one",
    body: "Tap each dot or star in the visual tool on the left as you count so you do not skip any.",
    example: "1, 2, 3, 4, 5..."
  },
  "k2-math-add-within-10": {
    title: "Put together and take away",
    body: "Adding puts two groups together; subtracting takes some away. Use the dots or ten-frame on the left.",
    example: "3 dots + 2 dots = 5 dots."
  },
  "math-count-100": {
    title: "Tens and ones",
    body: "10 ones make 1 green ten rod. Count the green ten rods first, then count the yellow ones cubes.",
    example: "3 tens (30) and 7 ones (7) make 37."
  },
  "math-place-value-1000": {
    title: "Places in a 3-digit number",
    body: "From left to right: Hundreds (×100), Tens (×10), and Ones (×1).",
    example: "800 + 30 + 7 = 837"
  },
  "math-add-sub-100": {
    title: "Split tens and ones",
    body: "Work with the tens first, then the ones, using the Jump number line or Bar model on the left.",
    example: "23 + 14: 20 + 10 = 30 and 3 + 4 = 7 → 37."
  },
  "math-two-step-problems": {
    title: "One step at a time",
    body: "Follow the two arrows in the Two-step tool on the left: solve the first change, then apply the second change.",
    example: "Start → Change 1 → Change 2 → Answer."
  },
  "math-add-sub-regroup": {
    title: "Regroup tens and ones",
    body: "When the ones make 10 or more, trade 10 ones for 1 ten. When subtracting, borrow 1 ten (10 ones) if needed.",
    example: "Follow the red jump arrow on the Number line."
  },
  "math-add-sub-1000": {
    title: "Three-digit addition and subtraction",
    body: "Align hundreds, tens, and ones, and work from right to left using the Jump number line.",
    example: "367 + 245 = 612"
  },
  "math-multiply-tables": {
    title: "Multiplication means equal groups",
    body: "Look at the Array tool on the left: count the rows and the number of dots in each row.",
    example: "2 groups of 6 = 12"
  },
  "math-divide-tables": {
    title: "Division means sharing equally",
    body: "Look at the Equal groups tool on the left: see how many dots are in each equal group.",
    example: "12 shared into 3 equal groups = 4 in each group."
  },
  "math-fractions": {
    title: "Equal parts of a whole",
    body: "Fractions must have equal parts. The bottom number counts all equal parts; the top number counts the shaded parts.",
    example: "1 out of 4 equal parts is 1/4 (one quarter)."
  },
  "math-fractions-add-sub": {
    title: "Same bottom number",
    body: "When the denominators match, keep the denominator and add or subtract only the numerators.",
    example: "2/6 + 3/6 = 5/6"
  },
  "math-money": {
    title: "Change to the same unit",
    body: "$1 = 100 cents. Change dollars and cents to cents before comparing or finding change.",
    example: "$3.50 = 350 cents"
  },
  "math-time": {
    title: "Hour hand and minute hand",
    body: "The short hand shows the hour; the red long hand shows the minutes. Count each clock number by 5s.",
    example: "7:35 is 35 minutes after 7 o'clock."
  },
  "math-time-duration": {
    title: "How long does it last?",
    body: "1 hour = 60 minutes. Use the Timeline tool on the left to connect Start time, Duration, and End time.",
    example: "1 hour 30 minutes = 90 minutes"
  },
  "math-shapes": {
    title: "Sides, corners and faces",
    body: "Tap any shape in the Shapes tool on the left to see its sides, corners, faces, and whether it rolls.",
    example: "A triangle has 3 sides; a cube has 6 square faces."
  },
  "math-picture-graph": {
    title: "Count each row first",
    body: "In the Picture graph tool on the left, each dot is 1. Count each row, then add for 'altogether' or subtract for 'how many more/fewer'.",
    example: "Compare the two rows of dots."
  },
  "math-length-measure": {
    title: "Measure on the centimetre ruler",
    body: "Read where the object starts and ends on the ruler, then subtract the start mark from the end mark.",
    example: "From 5 cm to 12 cm is 12 − 5 = 7 cm."
  },
  "math-measurement-units": {
    title: "Choose a suitable unit",
    body: "Use cm or m for length (1 m = 100 cm), g or kg for mass (1 kg = 1000 g), and L for liquid volume.",
    example: "1 kg = 1000 g, 1 m = 100 cm"
  },
  "math-scaled-picture-graph": {
    title: "Check the scale key first",
    body: "In a scaled picture graph, each symbol stands for 2, 5, or 10 items. Count the symbols in the row, then multiply by the scale.",
    example: "4 symbols × 5 items each = 20 items."
  },
  "math-number-patterns-1000": {
    title: "Odd, even, and number steps",
    body: "Check the ones digit for even (0, 2, 4, 6, 8) or odd (1, 3, 5, 7, 9). For patterns, find how much is added or subtracted each step.",
    example: "248 ends in 8 (even); 320, 330, 340 adds 10 each step."
  }
};

const MATCH_HINT = "先配对最有把握的一对，左边选好后再点右边亮起的卡片。";
const ORDER_HINT = "按顺序点下面的词块放进上方格子里；点放好的词块可以退回重排。";
const FALLBACK_HINT = "先听一听题目，再借助左边的教具排掉明显不对的选项。";
const MATCH_HINT_EN = "Match the pair you are most sure of first: tap a card on the left, then tap its partner on the right.";
const ORDER_HINT_EN = "Tap the word blocks in order to fill the top slots. Tap any placed block to send it back.";
const FALLBACK_HINT_EN = "Listen to the question, use the visual tool on the left, and rule out choices that do not fit.";

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
