import type { LearningLevel, Question } from "../lib/types";

export interface HandwritingCharacter {
  character: string;
  pinyin: string;
  word: string;
  english: string;
  tip: string;
  audioText: string;
  introAudioText: string;
  level: LearningLevel;
  structure: "独体字" | "上下结构" | "左右结构" | "半包围结构";
}

const HANDWRITING_SEED: Array<Omit<HandwritingCharacter, "introAudioText">> = [
  // Original 12 core characters (indices 0..11 preserved for backward compatibility)
  { character: "人", pinyin: "rén", word: "大人", english: "person", tip: "先撇后捺，一撇一捺像两条腿稳稳站住。", audioText: "人，大人", level: "K2", structure: "独体字" },
  { character: "口", pinyin: "kǒu", word: "开口", english: "mouth", tip: "先写左竖，再写横折，最后底横封口。", audioText: "口，开口", level: "K2", structure: "独体字" },
  { character: "山", pinyin: "shān", word: "高山", english: "mountain", tip: "先写中间长竖，再写竖折和右边短竖。", audioText: "山，高山", level: "K2", structure: "独体字" },
  { character: "手", pinyin: "shǒu", word: "小手", english: "hand", tip: "第一笔是平撇，再写两横，最后竖钩在正中。", audioText: "手，小手", level: "K2", structure: "独体字" },
  { character: "日", pinyin: "rì", word: "太阳", english: "sun", tip: "先外后里再封口，里面短横在中间。", audioText: "日，太阳", level: "K2", structure: "独体字" },
  { character: "月", pinyin: "yuè", word: "月亮", english: "moon", tip: "先写竖撇，再写横折钩，里面两短横。", audioText: "月，月亮", level: "K2", structure: "独体字" },
  { character: "木", pinyin: "mù", word: "树木", english: "tree", tip: "先横后竖，再写左撇右捺像伸开的树枝。", audioText: "木，树木", level: "K2", structure: "独体字" },
  { character: "水", pinyin: "shuǐ", word: "喝水", english: "water", tip: "先写中间竖钩，再写左边横撇，最后右边撇捺。", audioText: "水，喝水", level: "K2", structure: "独体字" },
  { character: "火", pinyin: "huǒ", word: "火苗", english: "fire", tip: "先写两边点和短撇，再写中间长撇和捺。", audioText: "火，火苗", level: "K2", structure: "独体字" },
  { character: "田", pinyin: "tián", word: "田地", english: "field", tip: "先写外框，再写里面横竖，最后底横封口。", audioText: "田，田地", level: "P1", structure: "独体字" },
  { character: "目", pinyin: "mù", word: "目光", english: "eye", tip: "外框窄长，里面两短横，最后底横封口。", audioText: "目，目光", level: "P1", structure: "独体字" },
  { character: "足", pinyin: "zú", word: "足球", english: "foot", tip: "上面是口，下面先竖后横，再写左撇右捺。", audioText: "足，足球", level: "P1", structure: "上下结构" },

  // K2 Basic Strokes, Numbers & Nature (21 characters -> total 30 K2)
  { character: "一", pinyin: "yī", word: "一个", english: "one", tip: "从左到右平稳写一横，轻轻起笔慢慢收。", audioText: "一，一个", level: "K2", structure: "独体字" },
  { character: "二", pinyin: "èr", word: "二月", english: "two", tip: "上横短，下横长，两横平行留空当。", audioText: "二，二月", level: "K2", structure: "独体字" },
  { character: "三", pinyin: "sān", word: "三个", english: "three", tip: "三横从上到下，中间最短，底横最长。", audioText: "三，三个", level: "K2", structure: "独体字" },
  { character: "四", pinyin: "sì", word: "四个", english: "four", tip: "先写外框，再写里面撇和竖弯，最后底横封口。", audioText: "四，四个", level: "K2", structure: "独体字" },
  { character: "五", pinyin: "wǔ", word: "五个", english: "five", tip: "先写顶横，再写中间竖和横折，最后长横托底。", audioText: "五，五个", level: "K2", structure: "独体字" },
  { character: "六", pinyin: "liù", word: "六月", english: "six", tip: "上面一点一横，下面左撇右点要对称。", audioText: "六，六月", level: "K2", structure: "上下结构" },
  { character: "七", pinyin: "qī", word: "七天", english: "seven", tip: "先写横，再写竖弯钩，拐弯圆润钩朝上。", audioText: "七，七天", level: "K2", structure: "独体字" },
  { character: "八", pinyin: "bā", word: "八个", english: "eight", tip: "左撇低，右捺高，上面留出小口子不相连。", audioText: "八，八个", level: "K2", structure: "独体字" },
  { character: "九", pinyin: "jiǔ", word: "九月", english: "nine", tip: "先写撇，再写横折弯钩，稳稳立在田字格。", audioText: "九，九月", level: "K2", structure: "独体字" },
  { character: "十", pinyin: "shí", word: "十个", english: "ten", tip: "先横后竖，竖画直直穿过横的中间。", audioText: "十，十个", level: "K2", structure: "独体字" },
  { character: "大", pinyin: "dà", word: "大小", english: "big", tip: "先写一横，再写竖撇和捺，像人张开双臂。", audioText: "大，大小", level: "K2", structure: "独体字" },
  { character: "小", pinyin: "xiǎo", word: "小鸟", english: "small", tip: "先中间后两边：先写竖钩，再写左点右点。", audioText: "小，小鸟", level: "K2", structure: "独体字" },
  { character: "上", pinyin: "shàng", word: "上下", english: "up", tip: "先写竖和短横，最后写长长的底横。", audioText: "上，上下", level: "K2", structure: "独体字" },
  { character: "下", pinyin: "xià", word: "下雨", english: "down", tip: "先写顶上长横，再写中间竖，最后写右点。", audioText: "下，下雨", level: "K2", structure: "独体字" },
  { character: "云", pinyin: "yún", word: "白云", english: "cloud", tip: "上面两横上短下长，下面撇折加一点。", audioText: "云，白云", level: "K2", structure: "上下结构" },
  { character: "雨", pinyin: "yǔ", word: "雨天", english: "rain", tip: "先写横、左竖和横折钩，再写中间竖和四颗小雨点。", audioText: "雨，雨天", level: "K2", structure: "独体字" },
  { character: "风", pinyin: "fēng", word: "大风", english: "wind", tip: "先写外面风字框，再写里面撇和长点。", audioText: "风，大风", level: "K2", structure: "半包围结构" },
  { character: "石", pinyin: "shí", word: "石头", english: "stone", tip: "先写长横和左撇，再在下面写端正的口字。", audioText: "石，石头", level: "K2", structure: "半包围结构" },

  // P1 Core Textbook Characters (32 more characters -> total 35 P1)
  { character: "天", pinyin: "tiān", word: "天空", english: "sky", tip: "上面两横上短下长，下面一撇一捺要舒展。", audioText: "天，天空", level: "P1", structure: "独体字" },
  { character: "土", pinyin: "tǔ", word: "土地", english: "earth", tip: "先写短横，再写中间竖，最后写长底横。", audioText: "土，土地", level: "P1", structure: "独体字" },
  { character: "女", pinyin: "nǚ", word: "女儿", english: "female", tip: "先写撇点，再写撇，最后长横穿过中间。", audioText: "女，女儿", level: "P1", structure: "独体字" },
  { character: "子", pinyin: "zǐ", word: "孩子", english: "child", tip: "先写横撇，再写弯钩，最后写中间长横。", audioText: "子，孩子", level: "P1", structure: "独体字" },
  { character: "心", pinyin: "xīn", word: "开心", english: "heart", tip: "左点、卧钩，再写中间点和右边点。", audioText: "心，开心", level: "P1", structure: "独体字" },
  { character: "马", pinyin: "mǎ", word: "小马", english: "horse", tip: "先写横折，再写竖折折钩，最后写底下一横。", audioText: "马，小马", level: "P1", structure: "独体字" },
  { character: "鸟", pinyin: "niǎo", word: "飞鸟", english: "bird", tip: "注意里面的点像小鸟的眼睛，不要漏掉。", audioText: "鸟，飞鸟", level: "P1", structure: "独体字" },
  { character: "鱼", pinyin: "yú", word: "小鱼", english: "fish", tip: "上面像鱼头，中间是田字鱼身，底下长横像鱼尾。", audioText: "鱼，小鱼", level: "P1", structure: "上下结构" },
  { character: "牛", pinyin: "niú", word: "水牛", english: "cow", tip: "第一笔短撇，再写两横，最后长竖穿到底。", audioText: "牛，水牛", level: "P1", structure: "独体字" },
  { character: "羊", pinyin: "yáng", word: "山羊", english: "sheep", tip: "上面两点像羊角，三横平行，悬针竖在正中。", audioText: "羊，山羊", level: "P1", structure: "独体字" },
  { character: "门", pinyin: "mén", word: "大门", english: "door", tip: "先写左上点，再写左竖，最后写右边横折钩。", audioText: "门，大门", level: "P1", structure: "半包围结构" },
  { character: "白", pinyin: "bái", word: "白云", english: "white", tip: "顶上先写一短撇，下面写日字要端正。", audioText: "白，白云", level: "P1", structure: "独体字" },
  { character: "本", pinyin: "běn", word: "书本", english: "notebook", tip: "先写木字，最后在竖画下端加一短横。", audioText: "本，书本", level: "P1", structure: "独体字" },
  { character: "立", pinyin: "lì", word: "立正", english: "stand", tip: "上面一点一横，中间左点右撇，底下长横托住。", audioText: "立，立正", level: "P1", structure: "独体字" },
  { character: "正", pinyin: "zhèng", word: "正在", english: "upright", tip: "先写顶横，再写中间竖和短横，最后左竖和长底横。", audioText: "正，正在", level: "P1", structure: "独体字" },
  { character: "生", pinyin: "shēng", word: "学生", english: "student / life", tip: "第一笔短撇，三横平行，长竖稳稳立中间。", audioText: "生，学生", level: "P1", structure: "独体字" },
  { character: "车", pinyin: "chē", word: "汽车", english: "car", tip: "先写横和撇折，再写长横，最后写中间长竖。", audioText: "车，汽车", level: "P1", structure: "独体字" },
  { character: "尺", pinyin: "chǐ", word: "尺子", english: "ruler", tip: "上面是扁扁的尸字头，下面一捺要舒展。", audioText: "尺，尺子", level: "P1", structure: "独体字" },
  { character: "刀", pinyin: "dāo", word: "小刀", english: "knife", tip: "先写横折钩，再写中间撇，两笔紧凑有力。", audioText: "刀，小刀", level: "P1", structure: "独体字" },
  { character: "力", pinyin: "lì", word: "力气", english: "strength", tip: "先写横折钩，再写长撇穿过横画中间。", audioText: "力，力气", level: "P1", structure: "独体字" },
  { character: "禾", pinyin: "hé", word: "禾苗", english: "grain", tip: "顶上第一笔是平撇，下面写木字要舒展。", audioText: "禾，禾苗", level: "P1", structure: "独体字" },
  { character: "虫", pinyin: "chóng", word: "小虫", english: "insect", tip: "上面扁口，中间一竖穿下来，底下提画加一点。", audioText: "虫，小虫", level: "P1", structure: "独体字" },
  { character: "果", pinyin: "guǒ", word: "水果", english: "fruit", tip: "上面是田字，下面横、竖、撇、捺像树枝托住果实。", audioText: "果，水果", level: "P1", structure: "上下结构" },
  { character: "中", pinyin: "zhōng", word: "中间", english: "middle", tip: "先写扁扁的口字，最后写长竖正正穿过中间。", audioText: "中，中间", level: "P1", structure: "独体字" },
  { character: "王", pinyin: "wáng", word: "大王", english: "king", tip: "先写两横，再写中间竖，最后写长底横。", audioText: "王，大王", level: "P1", structure: "独体字" },
  { character: "工", pinyin: "gōng", word: "工人", english: "work", tip: "上横短，中间竖直，底横长长托稳当。", audioText: "工，工人", level: "P1", structure: "独体字" },
  { character: "耳", pinyin: "ěr", word: "耳朵", english: "ear", tip: "先写顶横和左竖，再写右竖和里面两短横，最后长横。", audioText: "耳，耳朵", level: "P1", structure: "独体字" },
  { character: "米", pinyin: "mǐ", word: "大米", english: "rice", tip: "上面左点右撇，下面写木字，笔画对称。", audioText: "米，大米", level: "P1", structure: "独体字" },
  { character: "竹", pinyin: "zhú", word: "竹子", english: "bamboo", tip: "左右两个竹字单肩并肩，右边最后一笔带小钩。", audioText: "竹，竹子", level: "P1", structure: "左右结构" },
  { character: "牙", pinyin: "yá", word: "牙齿", english: "tooth", tip: "先写短横和竖折，再写竖钩和斜撇。", audioText: "牙，牙齿", level: "P1", structure: "独体字" },
  { character: "走", pinyin: "zǒu", word: "走路", english: "walk", tip: "上面是土字，下面先竖后短横，再写左撇右捺。", audioText: "走，走路", level: "P1", structure: "上下结构" },
  { character: "见", pinyin: "jiàn", word: "看见", english: "see", tip: "上面是没封口的框，下面是撇和竖弯钩。", audioText: "见，看见", level: "P1", structure: "上下结构" },
  { character: "开", pinyin: "kāi", word: "开门", english: "open", tip: "两横上短下长，下面左面是竖撇、右面是直竖。", audioText: "开，开门", level: "P1", structure: "独体字" },
  { character: "关", pinyin: "guān", word: "关心", english: "close / care", tip: "上面左点右撇，下面写天字，撇捺舒展。", audioText: "关，关心", level: "P1", structure: "上下结构" },
  { character: "去", pinyin: "qù", word: "回去", english: "go", tip: "上面是土字，下面是撇折和一点。", audioText: "去，回去", level: "P1", structure: "上下结构" },

  // P2 Compound & Radical-Rich Textbook Characters (35 characters -> total 35 P2)
  { character: "早", pinyin: "zǎo", word: "早上", english: "morning", tip: "从上到下，上面是扁扁的日，下面是十。", audioText: "早，早上", level: "P2", structure: "上下结构" },
  { character: "明", pinyin: "míng", word: "明天", english: "bright / tomorrow", tip: "从左到右，左边日字窄，右边月字宽。", audioText: "明，明天", level: "P2", structure: "左右结构" },
  { character: "林", pinyin: "lín", word: "树林", english: "woods", tip: "两个木字肩并肩，左边木字捺变点。", audioText: "林，树林", level: "P2", structure: "左右结构" },
  { character: "花", pinyin: "huā", word: "花朵", english: "flower", tip: "上面草字头（艹），下面左边单人旁、右边匕。", audioText: "花，花朵", level: "P2", structure: "上下结构" },
  { character: "草", pinyin: "cǎo", word: "小草", english: "grass", tip: "上面是草字头，下面是早上的早。", audioText: "草，小草", level: "P2", structure: "上下结构" },
  { character: "妈", pinyin: "mā", word: "妈妈", english: "mother", tip: "左窄右宽，左边女字旁横不出头，右边是马。", audioText: "妈，妈妈", level: "P2", structure: "左右结构" },
  { character: "好", pinyin: "hǎo", word: "好人", english: "good", tip: "左边女字旁，右边子字，左右紧凑。", audioText: "好，好人", level: "P2", structure: "左右结构" },
  { character: "学", pinyin: "xué", word: "学校", english: "learn / school", tip: "上面三点加秃宝盖，下面是孩子的子。", audioText: "学，学校", level: "P2", structure: "上下结构" },
  { character: "书", pinyin: "shū", word: "看书", english: "book", tip: "两层横折错落有致，长竖穿过中间，右上有一点。", audioText: "书，看书", level: "P2", structure: "独体字" },
  { character: "画", pinyin: "huà", word: "画画", english: "draw / picture", tip: "先写顶横和中间由字，最后写底下竖折和右竖包住它。", audioText: "画，画画", level: "P2", structure: "半包围结构" },
  { character: "爸", pinyin: "bà", word: "爸爸", english: "father", tip: "上面是父字头，下面是巴字，竖弯钩要舒展。", audioText: "爸，爸爸", level: "P2", structure: "上下结构" },
  { character: "哥", pinyin: "gē", word: "哥哥", english: "elder brother", tip: "上下两个可字叠一起，上面没钩下面带竖钩。", audioText: "哥，哥哥", level: "P2", structure: "上下结构" },
  { character: "姐", pinyin: "jiě", word: "姐姐", english: "elder sister", tip: "左边女字旁，右边且字里面两短横。", audioText: "姐，姐姐", level: "P2", structure: "左右结构" },
  { character: "弟", pinyin: "dì", word: "弟弟", english: "younger brother", tip: "上面左点右撇，中间弓字框，长竖和斜撇穿下来。", audioText: "弟，弟弟", level: "P2", structure: "上下结构" },
  { character: "妹", pinyin: "mèi", word: "妹妹", english: "younger sister", tip: "左边女字旁，右边未字上横短下横长。", audioText: "妹，妹妹", level: "P2", structure: "左右结构" },
  { character: "朋", pinyin: "péng", word: "朋友", english: "friend", tip: "两个月字并排站，左窄右宽要匀称。", audioText: "朋，朋友", level: "P2", structure: "左右结构" },
  { character: "友", pinyin: "yǒu", word: "友好", english: "friendly", tip: "先写横和长撇，再在下面写又字。", audioText: "友，友好", level: "P2", structure: "半包围结构" },
  { character: "河", pinyin: "hé", word: "小河", english: "river", tip: "左边三点水呈弧形，右边写可字。", audioText: "河，小河", level: "P2", structure: "左右结构" },
  { character: "海", pinyin: "hǎi", word: "大海", english: "sea", tip: "左边三点水，右边每字从上到下写端正。", audioText: "海，大海", level: "P2", structure: "左右结构" },
  { character: "洗", pinyin: "xǐ", word: "洗手", english: "wash", tip: "左边三点水，右边先字下面撇和竖弯钩。", audioText: "洗，洗手", level: "P2", structure: "左右结构" },
  { character: "吃", pinyin: "chī", word: "吃饭", english: "eat", tip: "左边口字旁偏上，右边乞字横折弯钩要稳。", audioText: "吃，吃饭", level: "P2", structure: "左右结构" },
  { character: "叫", pinyin: "jiào", word: "叫声", english: "call", tip: "左边口字旁，右边竖提加一长竖。", audioText: "叫，叫声", level: "P2", structure: "左右结构" },
  { character: "听", pinyin: "tīng", word: "听话", english: "listen", tip: "左边口字旁，右边斤字先写平撇和竖撇。", audioText: "听，听话", level: "P2", structure: "左右结构" },
  { character: "唱", pinyin: "chàng", word: "唱歌", english: "sing", tip: "左边口字旁，右边昌字上日小、下日宽。", audioText: "唱，唱歌", level: "P2", structure: "左右结构" },
  { character: "看", pinyin: "kàn", word: "看见", english: "look", tip: "上面是变形的手字头，下面是眼睛的目字。", audioText: "看，看见", level: "P2", structure: "上下结构" },
  { character: "写", pinyin: "xiě", word: "写字", english: "write", tip: "上面秃宝盖，下面与字竖折折钩要稳。", audioText: "写，写字", level: "P2", structure: "上下结构" },
  { character: "字", pinyin: "zì", word: "汉字", english: "character", tip: "上面宝盖头，下面写孩子的子字。", audioText: "字，汉字", level: "P2", structure: "上下结构" },
  { character: "读", pinyin: "dú", word: "读书", english: "read", tip: "左边言字旁，右边卖字上面十、下面买。", audioText: "读，读书", level: "P2", structure: "左右结构" },
  { character: "说", pinyin: "shuō", word: "说话", english: "speak", tip: "左边言字旁，右边兑字上面两点加口和儿。", audioText: "说，说话", level: "P2", structure: "左右结构" },
  { character: "话", pinyin: "huà", word: "听话", english: "words", tip: "左边言字旁，右边舌字先写平撇、十和口。", audioText: "话，听话", level: "P2", structure: "左右结构" },
  { character: "校", pinyin: "xiào", word: "学校", english: "school", tip: "左边木字旁捺变点，右边交字一点一横加父。", audioText: "校，学校", level: "P2", structure: "左右结构" },
  { character: "树", pinyin: "shù", word: "大树", english: "tree", tip: "左中右紧凑：左边木、中间又、右边寸。", audioText: "树，大树", level: "P2", structure: "左右结构" },
  { character: "叶", pinyin: "yè", word: "树叶", english: "leaf", tip: "左边口字旁，右边十字长竖穿中间。", audioText: "叶，树叶", level: "P2", structure: "左右结构" },
  { character: "苗", pinyin: "miáo", word: "禾苗", english: "sprout", tip: "上面是草字头，下面是田地的田字。", audioText: "苗，禾苗", level: "P2", structure: "上下结构" },
  { character: "星", pinyin: "xīng", word: "星星", english: "star", tip: "上面是日字，下面是生长的生字。", audioText: "星，星星", level: "P2", structure: "上下结构" }
];

export const HANDWRITING_CHARACTERS: HandwritingCharacter[] = HANDWRITING_SEED.map((entry) => ({
  ...entry,
  introAudioText: `${entry.character}。先看老师怎样写。`
}));

const HANDWRITING_BY_CHAR = new Map(HANDWRITING_CHARACTERS.map((entry) => [entry.character, entry]));

/**
 * Finds a relevant handwriting character from a Mandarin question so that after
 * the child answers the question, we can interleave a quick stroke-order trace.
 */
export function findHandwritingCharacterForQuestion(question: Question): HandwritingCharacter | null {
  if (question.subject !== "mandarin") return null;
  if (question.kind === "choice" && question.displayCharacter && HANDWRITING_BY_CHAR.has(question.displayCharacter)) {
    return HANDWRITING_BY_CHAR.get(question.displayCharacter)!;
  }
  const textToScan = question.kind === "choice"
    ? `${question.correctAnswer}${question.displayCharacter ?? ""}${question.prompt}`
    : question.kind === "order"
      ? question.correctOrder.join("")
      : question.pairs.map((p) => `${p.left}${p.right}`).join("");
  for (const ch of textToScan) {
    const match = HANDWRITING_BY_CHAR.get(ch);
    if (match) return match;
  }
  return null;
}
