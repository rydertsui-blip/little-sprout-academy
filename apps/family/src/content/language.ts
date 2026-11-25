import type { ChoiceQuestion, Skill, Subject, TransferLevel } from "../lib/types";
import { createContentAudit } from "./audit";

type LanguageDepthSeed = Pick<ChoiceQuestion, "prompt" | "instruction" | "options" | "correctAnswer" | "explanation" | "template"> & Partial<ChoiceQuestion>;

const LANGUAGE_DEPTH_TARGETS: Record<string, number> = {
  "k2-mandarin-listen": 12,
  "k2-mandarin-vocabulary": 12,
  "k2-english-listen": 12,
  "k2-english-letters": 12,
  "mandarin-initials": 18,
  "mandarin-finals": 12,
  "mandarin-tones": 18,
  "mandarin-syllables": 12,
  "mandarin-characters": 18,
  "mandarin-vocabulary": 12,
  "mandarin-reading": 18,
  "mandarin-reading-inference": 16,
  "mandarin-listening": 12,
  "mandarin-classifiers": 12,
  "mandarin-word-order": 12,
  "english-letters": 12,
  "english-listening": 18,
  "english-listening-comprehension": 16,
  "english-phonics": 18,
  "english-sight-words": 18,
  "english-vocabulary": 12,
  "english-a-an": 12,
  "english-plural": 12,
  "english-sentence-order": 17,
  "english-reading": 30,
  "english-reading-inference": 24,
  "english-spelling": 12
};

function orderedOptions(answer: string, options: string[]): string[] {
  const unique = new Set([answer, ...options]);
  return Array.from(unique).slice(0, 3);
}

function makeLanguageQuestion(
  skill: Skill,
  index: number,
  input: Pick<ChoiceQuestion, "prompt" | "instruction" | "options" | "correctAnswer" | "explanation" | "template"> & Partial<ChoiceQuestion>
): ChoiceQuestion {
  const transferLevel: TransferLevel = /story|context|sequence|inference|conversation|sentence|category/.test(input.template) ? "near-transfer" : "same-context";
  return {
    id: `q-${skill.id}-${index + 1}`,
    subject: skill.subject,
    skillId: skill.id,
    kind: "choice",
    difficulty: index < 2 ? 1 : index < 4 ? 2 : 3,
    diagnostic: false,
    reviewStatus: "verified",
    audit: createContentAudit(skill),
    ...input,
    options: orderedOptions(input.correctAnswer, input.options),
    transferLevel: input.transferLevel ?? transferLevel,
    contextKey: input.contextKey ?? input.template
  };
}

function buildMandarinQuestions(skill: Skill): ChoiceQuestion[] {
  const build = (rows: Array<Pick<ChoiceQuestion, "prompt" | "instruction" | "options" | "correctAnswer" | "explanation" | "template"> & Partial<ChoiceQuestion>>) => rows.map((row, index) => makeLanguageQuestion(skill, index, row));
  switch (skill.id) {
    case "k2-mandarin-listen":
      return build([
        { prompt: "听一听，点出你听到的动物。", instruction: "先听，再点出正确的图片。", correctAnswer: "猫", options: ["猫", "狗", "鸟"], explanation: "你听到的是“猫”。", template: "listen-animal", audioText: "猫", audioLanguage: "zh-CN", audioOnly: true, optionImages: { 猫: "cat", 狗: "dog", 鸟: "bird" } },
        { prompt: "听一听，点出你听到的动物。", instruction: "先听，再点出正确的图片。", correctAnswer: "狗", options: ["狗", "猫", "鱼"], explanation: "你听到的是“狗”。", template: "listen-animal", audioText: "狗", audioLanguage: "zh-CN", audioOnly: true, optionImages: { 狗: "dog", 猫: "cat", 鱼: "fish" } },
        { prompt: "听一听，点出你听到的动物。", instruction: "先听，再点出正确的图片。", correctAnswer: "鸟", options: ["鸟", "鱼", "猫"], explanation: "你听到的是“鸟”。", template: "listen-animal", audioText: "鸟", audioLanguage: "zh-CN", audioOnly: true, optionImages: { 鸟: "bird", 鱼: "fish", 猫: "cat" } },
        { prompt: "听一听，点出你听到的颜色。", instruction: "先听，再点出正确的颜色。", correctAnswer: "红色", options: ["红色", "蓝色", "绿色"], explanation: "你听到的是“红色”。", template: "listen-color", audioText: "红色", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "听一听，点出你听到的颜色。", instruction: "先听，再点出正确的颜色。", correctAnswer: "蓝色", options: ["蓝色", "红色", "黄色"], explanation: "你听到的是“蓝色”。", template: "listen-color", audioText: "蓝色", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "听一听，点出你听到的数字。", instruction: "先听，再点出正确的数字。", correctAnswer: "三", options: ["三", "五", "七"], explanation: "你听到的是“三”。", template: "listen-number", audioText: "三", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "听一听，点出你听到的数字。", instruction: "先听，再点出正确的数字。", correctAnswer: "五", options: ["五", "三", "六"], explanation: "你听到的是“五”。", template: "listen-number", audioText: "五", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "听一听，点出你听到的动作。", instruction: "先听，再点出正确的动作。", correctAnswer: "拍手", options: ["拍手", "跳", "跑"], explanation: "你听到的是“拍手”。", template: "listen-action", audioText: "拍手", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "听一听，点出你听到的动作。", instruction: "先听，再点出正确的动作。", correctAnswer: "跳", options: ["跳", "拍手", "坐"], explanation: "你听到的是“跳”。", template: "listen-action", audioText: "跳", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "听一听，点出你听到的家人。", instruction: "先听，再点出正确的家人。", correctAnswer: "妈妈", options: ["妈妈", "爸爸", "姐姐"], explanation: "你听到的是“妈妈”。", template: "listen-family", audioText: "妈妈", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "听一听，点出你听到的家人。", instruction: "先听，再点出正确的家人。", correctAnswer: "爸爸", options: ["爸爸", "妈妈", "哥哥"], explanation: "你听到的是“爸爸”。", template: "listen-family", audioText: "爸爸", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "听一听，点出你听到的水果。", instruction: "先听，再点出正确的水果。", correctAnswer: "苹果", options: ["苹果", "香蕉", "橘子"], explanation: "你听到的是“苹果”。", template: "listen-fruit", audioText: "苹果", audioLanguage: "zh-CN", audioOnly: true }
      ]);
    case "k2-mandarin-vocabulary":
      return build([
        { prompt: "“苹果”是哪一类？", instruction: "选择正确的类别。", correctAnswer: "水果", options: ["水果", "文具", "动物"], explanation: "苹果是水果。", template: "category-word", audioText: "苹果", audioLanguage: "zh-CN" },
        { prompt: "“铅笔”是哪一类？", instruction: "选择正确的类别。", correctAnswer: "文具", options: ["文具", "水果", "动物"], explanation: "铅笔是文具。", template: "category-word", audioText: "铅笔", audioLanguage: "zh-CN" },
        { prompt: "“小狗”是哪一类？", instruction: "选择正确的类别。", correctAnswer: "动物", options: ["动物", "水果", "文具"], explanation: "小狗是动物。", template: "category-word", audioText: "小狗", audioLanguage: "zh-CN" },
        { prompt: "“跑步”是什么？", instruction: "选择正确的类别。", correctAnswer: "动作", options: ["动作", "水果", "文具"], explanation: "跑步是一个动作。", template: "context-word", audioText: "跑步", audioLanguage: "zh-CN" },
        { prompt: "“红色”是什么？", instruction: "选择正确的类别。", correctAnswer: "颜色", options: ["颜色", "动作", "文具"], explanation: "红色是一种颜色。", template: "context-word", audioText: "红色", audioLanguage: "zh-CN" },
        { prompt: "“书包”是用来做什么的？", instruction: "选择正确的用途。", correctAnswer: "装书本", options: ["装书本", "喝水", "洗脸"], explanation: "书包可以用来装书本。", template: "meaning", audioText: "书包", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-initials":
      return build([
        { prompt: "“猫”的声母是哪一个？", instruction: "选择正确的声母。", correctAnswer: "m", options: ["m", "n", "h"], explanation: "猫的拼音是 māo，声母是 m。", template: "initial", displayCharacter: "猫", audioText: "猫", audioLanguage: "zh-CN" },
        { prompt: "“狗”的声母是哪一个？", instruction: "选择正确的声母。", correctAnswer: "g", options: ["g", "k", "h"], explanation: "狗的拼音是 gǒu，声母是 g。", template: "initial", displayCharacter: "狗", audioText: "狗", audioLanguage: "zh-CN" },
        { prompt: "“花”的声母是哪一个？", instruction: "选择正确的声母。", correctAnswer: "h", options: ["f", "h", "m"], explanation: "花的拼音是 huā，声母是 h。", template: "initial", displayCharacter: "花", audioText: "花", audioLanguage: "zh-CN" },
        { prompt: "“山”的声母是哪一个？", instruction: "选择正确的声母。", correctAnswer: "sh", options: ["s", "sh", "ch"], explanation: "山的拼音是 shān，声母是 sh。", template: "initial", displayCharacter: "山", audioText: "山", audioLanguage: "zh-CN" },
        { prompt: "“水”的声母是哪一个？", instruction: "选择正确的声母。", correctAnswer: "sh", options: ["sh", "s", "zh"], explanation: "水的拼音是 shuǐ，声母是 sh。", template: "initial", displayCharacter: "水", audioText: "水", audioLanguage: "zh-CN" },
        { prompt: "“鸟”的声母是哪一个？", instruction: "选择正确的声母。", correctAnswer: "n", options: ["n", "l", "m"], explanation: "鸟的拼音是 niǎo，声母是 n。", template: "initial", displayCharacter: "鸟", audioText: "鸟", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-finals":
      return build([
        { prompt: "“猫” (māo) 的韵母是哪一个？", instruction: "看拼音，选韵母。", correctAnswer: "ao", options: ["ao", "ou", "an"], explanation: "māo 的声母是 m，韵母是 ao。", template: "final", audioText: "猫，māo", audioLanguage: "zh-CN" },
        { prompt: "“狗” (gǒu) 的韵母是哪一个？", instruction: "看拼音，选韵母。", correctAnswer: "ou", options: ["ao", "ou", "iu"], explanation: "gǒu 的声母是 g，韵母是 ou。", template: "final", audioText: "狗，gǒu", audioLanguage: "zh-CN" },
        { prompt: "“山” (shān) 的韵母是哪一个？", instruction: "看拼音，选韵母。", correctAnswer: "an", options: ["an", "ang", "en"], explanation: "shān 的声母是 sh，韵母是 an。", template: "final", audioText: "山，shān", audioLanguage: "zh-CN" },
        { prompt: "“水” (shuǐ) 的韵母是哪一个？", instruction: "看拼音，选韵母。", correctAnswer: "ui", options: ["ui", "iu", "ei"], explanation: "shuǐ 的声母是 sh，韵母是 ui。", template: "final", audioText: "水，shuǐ", audioLanguage: "zh-CN" },
        { prompt: "“鸟” (niǎo) 的韵母是哪一个？", instruction: "看拼音，选韵母。", correctAnswer: "iao", options: ["iao", "ao", "iao", "iu"], explanation: "niǎo 的声母是 n，韵母是 iao。", template: "final", audioText: "鸟，niǎo", audioLanguage: "zh-CN" },
        { prompt: "“花” (huā) 的韵母是哪一个？", instruction: "看拼音，选韵母。", correctAnswer: "ua", options: ["ua", "uo", "a"], explanation: "huā 的声母是 h，韵母是 ua。", template: "final", audioText: "花，huā", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-tones":
      return build([
        { prompt: "“猫” (māo) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第一声", options: ["第一声", "第二声", "第三声"], explanation: "māo 的声调是第一声。", template: "tone", displayCharacter: "猫", audioText: "猫", audioLanguage: "zh-CN" },
        { prompt: "“人” (rén) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第二声", options: ["第二声", "第三声", "第四声"], explanation: "rén 的声调是第二声。", template: "tone", displayCharacter: "人", audioText: "人", audioLanguage: "zh-CN" },
        { prompt: "“狗” (gǒu) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第三声", options: ["第一声", "第三声", "第四声"], explanation: "gǒu 的声调是第三声。", template: "tone", displayCharacter: "狗", audioText: "狗", audioLanguage: "zh-CN" },
        { prompt: "“兔” (tù) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第四声", options: ["第二声", "第三声", "第四声"], explanation: "tù 的声调是第四声。", template: "tone", displayCharacter: "兔", audioText: "兔", audioLanguage: "zh-CN" },
        { prompt: "“雨” (yǔ) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第三声", options: ["第二声", "第三声", "第四声"], explanation: "yǔ 的声调是第三声。", template: "tone", displayCharacter: "雨", audioText: "雨", audioLanguage: "zh-CN" },
        { prompt: "“月” (yuè) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第四声", options: ["第一声", "第二声", "第四声"], explanation: "yuè 的声调是第四声。", template: "tone", displayCharacter: "月", audioText: "月", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-syllables":
      return build([
        { prompt: "“猫”的正确拼音是哪一个？", instruction: "选择完整拼音。", correctAnswer: "māo", options: ["māo", "máo", "mǎo"], explanation: "猫读作 māo。", template: "syllable", displayCharacter: "猫", audioText: "猫", audioLanguage: "zh-CN" },
        { prompt: "“狗”的正确拼音是哪一个？", instruction: "选择完整拼音。", correctAnswer: "gǒu", options: ["gōu", "gǒu", "gòu"], explanation: "狗读作 gǒu。", template: "syllable", displayCharacter: "狗", audioText: "狗", audioLanguage: "zh-CN" },
        { prompt: "“山”的正确拼音是哪一个？", instruction: "选择完整拼音。", correctAnswer: "shān", options: ["shān", "shán", "shàn"], explanation: "山读作 shān。", template: "syllable", displayCharacter: "山", audioText: "山", audioLanguage: "zh-CN" },
        { prompt: "“水”的正确拼音是哪一个？", instruction: "选择完整拼音。", correctAnswer: "shuǐ", options: ["shuī", "shuǐ", "shuì"], explanation: "水读作 shuǐ。", template: "syllable", displayCharacter: "水", audioText: "水", audioLanguage: "zh-CN" },
        { prompt: "“兔”的正确拼音是哪一个？", instruction: "选择完整拼音。", correctAnswer: "tù", options: ["tū", "tú", "tù"], explanation: "兔读作 tù。", template: "syllable", displayCharacter: "兔", audioText: "兔", audioLanguage: "zh-CN" },
        { prompt: "“月”的正确拼音是哪一个？", instruction: "选择完整拼音。", correctAnswer: "yuè", options: ["yuē", "yué", "yuè"], explanation: "月读作 yuè。", template: "syllable", displayCharacter: "月", audioText: "月", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-characters":
      return build([
        { prompt: "哪一种东西可以喝，也会流动？", instruction: "选择正确的汉字。", correctAnswer: "水", options: ["水", "火", "木"], explanation: "水可以喝，也会流动。", template: "meaning-character", audioText: "水", audioLanguage: "zh-CN" },
        { prompt: "哪一个字表示白天发光的天体？", instruction: "选择正确的汉字。", correctAnswer: "日", options: ["日", "月", "山"], explanation: "日表示太阳。", template: "meaning-character", audioText: "日", audioLanguage: "zh-CN" },
        { prompt: "哪一个字表示夜晚常见的天体？", instruction: "选择正确的汉字。", correctAnswer: "月", options: ["月", "日", "雨"], explanation: "月表示月亮。", template: "meaning-character", audioText: "月", audioLanguage: "zh-CN" },
        { prompt: "哪一个字表示高高的地面？", instruction: "选择正确的汉字。", correctAnswer: "山", options: ["山", "水", "田"], explanation: "山是高高隆起的陆地。", template: "meaning-character", audioText: "山", audioLanguage: "zh-CN" },
        { prompt: "哪一个字表示燃烧的东西？", instruction: "选择正确的汉字。", correctAnswer: "火", options: ["火", "木", "水"], explanation: "火会燃烧。", template: "meaning-character", audioText: "火", audioLanguage: "zh-CN" },
        { prompt: "哪一个字表示树木？", instruction: "选择正确的汉字。", correctAnswer: "木", options: ["木", "火", "口"], explanation: "木表示树木。", template: "meaning-character", audioText: "木", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-vocabulary":
      return build([
        { prompt: "夜晚天上圆圆发亮的是什么？", instruction: "选择正确答案。", correctAnswer: "月亮", options: ["月亮", "太阳", "星星"], explanation: "夜晚天上圆圆发亮的是月亮。", template: "meaning", audioText: "选择正确答案。", audioLanguage: "zh-CN" },
        { prompt: "口渴时，我们是在做什么？", instruction: "选择正确答案。", correctAnswer: "喝水", options: ["喝水", "吃饭", "洗手"], explanation: "口渴时要喝水。", template: "meaning", audioText: "选择正确答案。", audioLanguage: "zh-CN" },
        { prompt: "哪一种动物会飞、会唱歌？", instruction: "选择正确答案。", correctAnswer: "小鸟", options: ["小鸟", "兔子", "猫"], explanation: "小鸟会飞，也会唱歌。", template: "meaning", audioText: "选择正确答案。", audioLanguage: "zh-CN" },
        { prompt: "植物上开放、颜色鲜艳的部分是什么？", instruction: "选择正确答案。", correctAnswer: "花朵", options: ["花朵", "树木", "小草"], explanation: "花朵是植物上开放的部分。", template: "meaning", audioText: "选择正确答案。", audioLanguage: "zh-CN" },
        { prompt: "哪一种球可以踢？", instruction: "选择正确答案。", correctAnswer: "足球", options: ["足球", "篮球", "鞋子"], explanation: "足球可以用脚踢。", template: "meaning", audioText: "选择正确答案。", audioLanguage: "zh-CN" },
        { prompt: "又高又大的山地叫什么？", instruction: "选择正确答案。", correctAnswer: "高山", options: ["高山", "河流", "房子"], explanation: "又高又大的山地叫高山。", template: "meaning", audioText: "选择正确答案。", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-reading":
      return build([
        { prompt: "“小猫轻轻走。”这句话说的是谁？", instruction: "读句子后回答问题。", correctAnswer: "小猫", options: ["小猫", "小狗", "小鸟"], explanation: "句子开头说“小猫”，所以主角是小猫。", template: "who", passage: "小猫轻轻走。", audioText: "小猫轻轻走。", audioLanguage: "zh-CN" },
        { prompt: "“下雨了，记得带雨伞。”应该带什么？", instruction: "读句子后回答问题。", correctAnswer: "雨伞", options: ["雨伞", "水杯", "书本"], explanation: "句子说“带雨伞”。", template: "object", passage: "下雨了，记得带雨伞。", audioText: "下雨了，记得带雨伞。", audioLanguage: "zh-CN" },
        { prompt: "“小鸟会唱歌。”谁在唱歌？", instruction: "读句子后回答问题。", correctAnswer: "小鸟", options: ["小鸟", "小兔", "小猫"], explanation: "句子说小鸟会唱歌。", template: "who", passage: "小鸟会唱歌。", audioText: "小鸟会唱歌。", audioLanguage: "zh-CN" },
        { prompt: "“小兔爱吃萝卜。”小兔爱吃什么？", instruction: "读句子后回答问题。", correctAnswer: "萝卜", options: ["萝卜", "苹果", "米饭"], explanation: "句子说小兔爱吃萝卜。", template: "object", passage: "小兔爱吃萝卜。", audioText: "小兔爱吃萝卜。", audioLanguage: "zh-CN" },
        { prompt: "“花儿开了，香香的。”什么开了？", instruction: "读句子后回答问题。", correctAnswer: "花儿", options: ["花儿", "树叶", "果子"], explanation: "句子说花儿开了。", template: "who", passage: "花儿开了，香香的。", audioText: "花儿开了，香香的。", audioLanguage: "zh-CN" },
        { prompt: "“我和弟弟一起去公园。”谁和谁一起去？", instruction: "读句子后回答问题。", correctAnswer: "我和弟弟", options: ["我和弟弟", "我和老师", "弟弟和爸爸"], explanation: "句子说的是“我和弟弟”。", template: "who", passage: "我和弟弟一起去公园。", audioText: "我和弟弟一起去公园。", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-reading-inference":
      return build([
        { prompt: "小明怎么样？", instruction: "读一读，选择正确答案。", correctAnswer: "关心妹妹", options: ["关心妹妹", "很生气", "不想吃"], explanation: "小明把蛋糕留给妹妹，说明他关心妹妹。", template: "feeling", passage: "小明把最后一块蛋糕留给妹妹。", audioText: "小明把最后一块蛋糕留给妹妹。", audioLanguage: "zh-CN" },
        { prompt: "她为什么发愁？", instruction: "读一读，选择正确答案。", correctAnswer: "她没有伞", options: ["她没有伞", "她不喜欢雨", "她想睡觉"], explanation: "小红没带伞，所以下雨时发愁。", template: "why", passage: "下雨了，小红没有带伞，她看着天空发愁。", audioText: "下雨了，小红没有带伞，她看着天空发愁。", audioLanguage: "zh-CN" },
        { prompt: "小猫为什么躲起来？", instruction: "读一读，选择正确答案。", correctAnswer: "它怕被责怪", options: ["它怕被责怪", "它想睡觉", "它饿了"], explanation: "小猫碰倒花瓶后躲起来，说明它怕被责怪。", template: "why", passage: "小猫把花瓶碰倒了，马上躲到桌子下面。", audioText: "小猫把花瓶碰倒了，马上躲到桌子下面。", audioLanguage: "zh-CN" },
        { prompt: "接下来孩子应该怎么做？", instruction: "读一读，选择正确答案。", correctAnswer: "等汤凉一点", options: ["等汤凉一点", "马上喝一大口", "用手摸汤"], explanation: "汤很烫，孩子应该等它凉一点。", template: "next", passage: "妈妈把热汤放在桌上，说“小心烫”。", audioText: "妈妈把热汤放在桌上，说“小心烫”。", audioLanguage: "zh-CN" },
        { prompt: "他们最可能去做什么？", instruction: "读一读，选择正确答案。", correctAnswer: "课间休息", options: ["课间休息", "回家睡觉", "继续上课"], explanation: "下课铃响后，同学们最可能去课间休息。", template: "next", passage: "下课铃响了，同学们收好书本，排队走出教室。", audioText: "下课铃响了，同学们收好书本，排队走出教室。", audioLanguage: "zh-CN" },
        { prompt: "爷爷想做什么？", instruction: "读一读，选择正确答案。", correctAnswer: "看报纸", options: ["看报纸", "做饭", "洗衣服"], explanation: "爷爷拿起报纸，说明他想看报纸。", template: "action", passage: "爷爷戴上眼镜，拿起报纸，坐在窗边。", audioText: "爷爷戴上眼镜，拿起报纸，坐在窗边。", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-listening":
      return build([
        { prompt: "小明在做什么？", instruction: "听一听，再点出答案。", correctAnswer: "跑步", options: ["跑步", "看书", "画画"], explanation: "你听到“小明在操场上跑步”。", template: "listen-action", passage: "小明在操场上跑步。", audioText: "小明在操场上跑步。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "妈妈在哪里？", instruction: "听一听，再点出答案。", correctAnswer: "厨房", options: ["厨房", "花园", "教室"], explanation: "你听到“妈妈在厨房煮饭”。", template: "listen-where", passage: "妈妈在厨房煮饭。", audioText: "妈妈在厨房煮饭。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "小红抱着什么？", instruction: "听一听，再点出答案。", correctAnswer: "小猫", options: ["小猫", "小狗", "小鸟"], explanation: "你听到“小红抱着小猫”。", template: "listen-object", passage: "小红抱着小猫。", audioText: "小红抱着小猫。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "爸爸在做什么？", instruction: "听一听，再点出答案。", correctAnswer: "看书", options: ["看书", "煮饭", "浇花"], explanation: "你听到“爸爸在客厅看书”。", template: "listen-action", passage: "爸爸在客厅看书。", audioText: "爸爸在客厅看书。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "苹果在哪里？", instruction: "听一听，再点出答案。", correctAnswer: "书包里", options: ["书包里", "桌上", "冰箱里"], explanation: "你听到“弟弟把苹果放进书包”。", template: "listen-where", passage: "弟弟把苹果放进书包。", audioText: "弟弟把苹果放进书包。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "奶奶在做什么？", instruction: "听一听，再点出答案。", correctAnswer: "浇花", options: ["浇花", "看书", "骑车"], explanation: "你听到“奶奶在花园浇花”。", template: "listen-action", passage: "奶奶在花园浇花。", audioText: "奶奶在花园浇花。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "小华先做什么？", instruction: "听一听，再点出答案。", correctAnswer: "洗手", options: ["洗手", "吃饭", "睡觉"], explanation: "你听到“小华先洗手，再吃饭”。", template: "listen-sequence", passage: "小华先洗手，再吃饭。", audioText: "小华先洗手，再吃饭。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "姐姐带什么出门？", instruction: "听一听，再点出答案。", correctAnswer: "伞", options: ["伞", "水杯", "书包"], explanation: "你听到“下雨了，姐姐带伞出门”。", template: "listen-object", passage: "下雨了，姐姐带伞出门。", audioText: "下雨了，姐姐带伞出门。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "谁在唱歌？", instruction: "听一听，再点出答案。", correctAnswer: "小鸟", options: ["小鸟", "小猫", "妹妹"], explanation: "你听到“小鸟在树上唱歌”。", template: "listen-who", passage: "小鸟在树上唱歌。", audioText: "小鸟在树上唱歌。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "水杯在哪里？", instruction: "听一听，再点出答案。", correctAnswer: "桌上", options: ["桌上", "地上", "椅子上"], explanation: "你听到“妹妹把水杯放在桌上”。", template: "listen-where", passage: "妹妹把水杯放在桌上。", audioText: "妹妹把水杯放在桌上。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "哥哥在哪里骑车？", instruction: "听一听，再点出答案。", correctAnswer: "公园", options: ["公园", "学校", "家里"], explanation: "你听到“哥哥在公园骑车”。", template: "listen-where", passage: "哥哥在公园骑车。", audioText: "哥哥在公园骑车。", audioLanguage: "zh-CN", audioOnly: true },
        { prompt: "妈妈买了几个苹果？", instruction: "听一听，再点出答案。", correctAnswer: "三个", options: ["三个", "两个", "四个"], explanation: "你听到“妈妈买了三个苹果”。", template: "listen-number", passage: "妈妈买了三个苹果。", audioText: "妈妈买了三个苹果。", audioLanguage: "zh-CN", audioOnly: true }
      ]);
    case "mandarin-classifiers":
      return build([
        { prompt: "一 ___ 猫", instruction: "选择正确的量词。", correctAnswer: "只", options: ["只", "朵", "座"], explanation: "我们说“一只猫”。", template: "classifier", displayCharacter: "猫", audioText: "一只猫", audioLanguage: "zh-CN" },
        { prompt: "一 ___ 花", instruction: "选择正确的量词。", correctAnswer: "朵", options: ["朵", "只", "本"], explanation: "我们说“一朵花”。", template: "classifier", displayCharacter: "花", audioText: "一朵花", audioLanguage: "zh-CN" },
        { prompt: "一 ___ 山", instruction: "选择正确的量词。", correctAnswer: "座", options: ["座", "棵", "双"], explanation: "我们说“一座山”。", template: "classifier", displayCharacter: "山", audioText: "一座山", audioLanguage: "zh-CN" },
        { prompt: "一 ___ 树", instruction: "选择正确的量词。", correctAnswer: "棵", options: ["棵", "朵", "只"], explanation: "我们说“一棵树”。", template: "classifier", displayCharacter: "树", audioText: "一棵树", audioLanguage: "zh-CN" },
        { prompt: "一 ___ 书", instruction: "选择正确的量词。", correctAnswer: "本", options: ["本", "只", "座"], explanation: "我们说“一本书”。", template: "classifier", displayCharacter: "书", audioText: "一本书", audioLanguage: "zh-CN" },
        { prompt: "一 ___ 鞋", instruction: "选择正确的量词。", correctAnswer: "双", options: ["双", "朵", "棵"], explanation: "我们说“一双鞋”。", template: "classifier", displayCharacter: "鞋", audioText: "一双鞋", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-word-order":
      return build([
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "我喜欢小猫。", options: ["我喜欢小猫。", "我小猫喜欢。", "喜欢我小猫。"], explanation: "“我喜欢小猫。”语序完整自然。", template: "sentence-order", audioText: "我喜欢小猫。", audioLanguage: "zh-CN" },
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "弟弟去学校。", options: ["弟弟去学校。", "去弟弟学校。", "学校去弟弟。"], explanation: "“弟弟去学校。”语序正确。", template: "sentence-order", audioText: "弟弟去学校。", audioLanguage: "zh-CN" },
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "妈妈在厨房。", options: ["妈妈在厨房。", "在妈妈厨房。", "厨房妈妈在。"], explanation: "“妈妈在厨房。”语序正确。", template: "sentence-order", audioText: "妈妈在厨房。", audioLanguage: "zh-CN" },
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "小鸟在天空中飞。", options: ["小鸟在天空中飞。", "天空飞在小鸟。", "飞小鸟在天空。"], explanation: "“小鸟在天空中飞。”语序完整自然。", template: "sentence-order", audioText: "选择完整、自然的句子。", audioLanguage: "zh-CN" },
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "我们一起去公园。", options: ["我们一起去公园。", "一起去我们公园。", "公园去我们一起。"], explanation: "“我们一起去公园。”语序正确。", template: "sentence-order", audioText: "我们一起去公园。", audioLanguage: "zh-CN" },
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "爸爸喜欢喝茶。", options: ["爸爸喜欢喝茶。", "喝茶喜欢爸爸。", "喜欢爸爸喝茶。"], explanation: "“爸爸喜欢喝茶。”语序正确。", template: "sentence-order", audioText: "爸爸喜欢喝茶。", audioLanguage: "zh-CN" }
      ]);
    default:
      return [];
  }
}

function buildEnglishQuestions(skill: Skill): ChoiceQuestion[] {
  const build = (rows: Array<Pick<ChoiceQuestion, "prompt" | "instruction" | "options" | "correctAnswer" | "explanation" | "template"> & Partial<ChoiceQuestion>>) => rows.map((row, index) => makeLanguageQuestion(skill, index, row));
  switch (skill.id) {
    case "k2-english-listen":
      return build([
        { prompt: "Listen and tap the animal you hear.", instruction: "Listen first, then tap the matching picture.", correctAnswer: "cat", options: ["cat", "dog", "fish"], explanation: "You heard cat.", template: "listen-animal", audioText: "cat", audioLanguage: "en-US", audioOnly: true, optionImages: { cat: "cat", dog: "dog", fish: "fish" } },
        { prompt: "Listen and tap the animal you hear.", instruction: "Listen first, then tap the matching picture.", correctAnswer: "dog", options: ["dog", "cat", "bear"], explanation: "You heard dog.", template: "listen-animal", audioText: "dog", audioLanguage: "en-US", audioOnly: true, optionImages: { dog: "dog", cat: "cat", bear: "bear" } },
        { prompt: "Listen and tap the animal you hear.", instruction: "Listen first, then tap the matching picture.", correctAnswer: "fish", options: ["fish", "tree", "apple"], explanation: "You heard fish.", template: "listen-animal", audioText: "fish", audioLanguage: "en-US", audioOnly: true, optionImages: { fish: "fish", tree: "tree", apple: "apple" } },
        { prompt: "Listen and tap the colour you hear.", instruction: "Listen first, then tap the correct colour.", correctAnswer: "red", options: ["red", "blue", "green"], explanation: "You heard red.", template: "listen-color", audioText: "red", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the colour you hear.", instruction: "Listen first, then tap the correct colour.", correctAnswer: "blue", options: ["blue", "red", "yellow"], explanation: "You heard blue.", template: "listen-color", audioText: "blue", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the number you hear.", instruction: "Listen first, then tap the correct number.", correctAnswer: "three", options: ["three", "five", "seven"], explanation: "You heard three.", template: "listen-number", audioText: "three", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the number you hear.", instruction: "Listen first, then tap the correct number.", correctAnswer: "five", options: ["five", "three", "six"], explanation: "You heard five.", template: "listen-number", audioText: "five", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the action you hear.", instruction: "Listen first, then tap the correct action.", correctAnswer: "jump", options: ["jump", "run", "sit"], explanation: "You heard jump.", template: "listen-action", audioText: "jump", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the action you hear.", instruction: "Listen first, then tap the correct action.", correctAnswer: "clap", options: ["clap", "jump", "run"], explanation: "You heard clap.", template: "listen-action", audioText: "clap", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the family word you hear.", instruction: "Listen first, then tap the correct family word.", correctAnswer: "mother", options: ["mother", "father", "sister"], explanation: "You heard mother.", template: "listen-family", audioText: "mother", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the family word you hear.", instruction: "Listen first, then tap the correct family word.", correctAnswer: "father", options: ["father", "mother", "brother"], explanation: "You heard father.", template: "listen-family", audioText: "father", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the fruit you hear.", instruction: "Listen first, then tap the correct fruit.", correctAnswer: "apple", options: ["apple", "banana", "orange"], explanation: "You heard apple.", template: "listen-fruit", audioText: "apple", audioLanguage: "en-US", audioOnly: true }
      ]);
    case "k2-english-letters":
      return build([
        { prompt: "Which capital letter matches the small letter a?", instruction: "Tap the matching capital letter.", correctAnswer: "A", options: ["A", "B", "D"], explanation: "The small letter a matches the capital letter A.", template: "letter-case" },
        { prompt: "Which small letter matches the capital letter D?", instruction: "Tap the matching small letter.", correctAnswer: "d", options: ["d", "b", "p"], explanation: "The capital letter D matches the small letter d.", template: "letter-case" },
        { prompt: "Which letter comes just after C?", instruction: "Tap the next letter.", correctAnswer: "D", options: ["D", "B", "E"], explanation: "The alphabet goes C, D, E, so D comes just after C.", template: "alphabet-order" },
        { prompt: "Which letter comes just before F?", instruction: "Tap the letter before F.", correctAnswer: "E", options: ["E", "G", "C"], explanation: "The alphabet goes E, F, G, so E comes just before F.", template: "alphabet-order" },
        { prompt: "Which letter starts the word “sun”?", instruction: "Tap the beginning letter.", correctAnswer: "S", options: ["S", "N", "U"], explanation: "Sun starts with S.", template: "beginning-letter", audioText: "sun", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “moon”?", instruction: "Tap the beginning letter.", correctAnswer: "M", options: ["M", "N", "O"], explanation: "Moon starts with M.", template: "beginning-letter", audioText: "moon", audioLanguage: "en-US" }
      ]);
    case "english-letters":
      return build([
        { prompt: "Which letter starts the word “apple”?", instruction: "Tap the beginning letter.", correctAnswer: "A", options: ["A", "B", "P"], explanation: "Apple starts with A.", template: "beginning-letter", audioText: "apple", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “bear”?", instruction: "Tap the beginning letter.", correctAnswer: "B", options: ["B", "D", "R"], explanation: "Bear starts with B.", template: "beginning-letter", audioText: "bear", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “cat”?", instruction: "Tap the beginning letter.", correctAnswer: "C", options: ["C", "K", "T"], explanation: "Cat starts with C.", template: "beginning-letter", audioText: "cat", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “dog”?", instruction: "Tap the beginning letter.", correctAnswer: "D", options: ["D", "B", "G"], explanation: "Dog starts with D.", template: "beginning-letter", audioText: "dog", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “fish”?", instruction: "Tap the beginning letter.", correctAnswer: "F", options: ["F", "S", "H"], explanation: "Fish starts with F.", template: "beginning-letter", audioText: "fish", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “sun”?", instruction: "Tap the beginning letter.", correctAnswer: "S", options: ["S", "N", "U"], explanation: "Sun starts with S.", template: "beginning-letter", audioText: "sun", audioLanguage: "en-US" }
      ]);
    case "english-listening":
      return build([
        { prompt: "Listen and tap the picture you hear.", instruction: "Listen first, then tap the matching picture.", correctAnswer: "apple", options: ["apple", "bear", "fish"], explanation: "You heard apple.", template: "listen-find", audioText: "apple", audioLanguage: "en-US", audioOnly: true, optionImages: { apple: "apple", bear: "bear", fish: "fish" } },
        { prompt: "Listen and tap the picture you hear.", instruction: "Listen first, then tap the matching picture.", correctAnswer: "bear", options: ["bear", "cat", "tree"], explanation: "You heard bear.", template: "listen-find", audioText: "bear", audioLanguage: "en-US", audioOnly: true, optionImages: { bear: "bear", cat: "cat", tree: "tree" } },
        { prompt: "Listen and tap the picture you hear.", instruction: "Listen first, then tap the matching picture.", correctAnswer: "cat", options: ["cat", "dog", "moon"], explanation: "You heard cat.", template: "listen-find", audioText: "cat", audioLanguage: "en-US", audioOnly: true, optionImages: { cat: "cat", dog: "dog", moon: "moon" } },
        { prompt: "Listen and tap the picture you hear.", instruction: "Listen first, then tap the matching picture.", correctAnswer: "dog", options: ["dog", "sun", "star"], explanation: "You heard dog.", template: "listen-find", audioText: "dog", audioLanguage: "en-US", audioOnly: true, optionImages: { dog: "dog", sun: "sun", star: "star" } },
        { prompt: "Listen and tap the picture you hear.", instruction: "Listen first, then tap the matching picture.", correctAnswer: "fish", options: ["fish", "flower", "tree"], explanation: "You heard fish.", template: "listen-find", audioText: "fish", audioLanguage: "en-US", audioOnly: true, optionImages: { fish: "fish", flower: "flower", tree: "tree" } },
        { prompt: "Listen and tap the picture you hear.", instruction: "Listen first, then tap the matching picture.", correctAnswer: "tree", options: ["tree", "moon", "apple"], explanation: "You heard tree.", template: "listen-find", audioText: "tree", audioLanguage: "en-US", audioOnly: true, optionImages: { tree: "tree", moon: "moon", apple: "apple" } }
      ]);
    case "english-listening-comprehension":
      return build([
        { prompt: "What does Lina put in her bag?", instruction: "Listen first, then tap the answer.", correctAnswer: "a red bottle", options: ["a red bottle", "a red book", "a blue bag"], explanation: "Lina puts a red bottle in her bag.", template: "listen-detail", passage: "Lina puts her red bottle in her bag.", audioText: "Lina puts her red bottle in her bag.", audioLanguage: "en-US", audioOnly: true },
        { prompt: "What does Ben do before going to school?", instruction: "Listen first, then tap the answer.", correctAnswer: "eat breakfast", options: ["eat breakfast", "go to school", "sleep"], explanation: "Ben eats breakfast before he goes to school.", template: "listen-sequence", passage: "Ben wakes up at 7 o'clock. He eats breakfast, then goes to school.", audioText: "Ben wakes up at 7 o'clock. He eats breakfast, then goes to school.", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Why does Mia close the window?", instruction: "Listen first, then tap the answer.", correctAnswer: "it is raining", options: ["it is raining", "it is hot", "she is hungry"], explanation: "Mia hears thunder, so it is raining and she closes the window.", template: "listen-inference", passage: "Mia hears thunder. She closes the window.", audioText: "Mia hears thunder. She closes the window.", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Where do the apples go?", instruction: "Listen first, then tap the answer.", correctAnswer: "on the table", options: ["on the table", "in the bag", "under the chair"], explanation: "Dad asks for the apples to go on the table.", template: "listen-where", passage: "Dad says: Please put the apples on the table.", audioText: "Dad says: Please put the apples on the table.", audioLanguage: "en-US", audioOnly: true },
        { prompt: "What should the children bring?", instruction: "Listen first, then tap the answer.", correctAnswer: "a reading book", options: ["a reading book", "a football", "a water bottle"], explanation: "The teacher asks the children to bring a reading book.", template: "listen-object", passage: "Teacher says: We are going to the library. Bring your reading book.", audioText: "Teacher says: We are going to the library. Bring your reading book.", audioLanguage: "en-US", audioOnly: true },
        { prompt: "What should Tom do?", instruction: "Listen first, then tap the answer.", correctAnswer: "wash his hands", options: ["wash his hands", "eat lunch", "run outside"], explanation: "Tom's hands are dirty, so he should wash his hands before lunch.", template: "listen-action", passage: "Tom's hands are dirty before lunch.", audioText: "Tom's hands are dirty before lunch.", audioLanguage: "en-US", audioOnly: true }
      ]);
    case "english-phonics":
      return build([
        { prompt: "Which word starts with the /k/ sound?", instruction: "Tap the word.", correctAnswer: "cat", options: ["cat", "dog", "sun"], explanation: "Cat starts with the /k/ sound.", template: "initial-sound", audioText: "cat, dog, sun", audioLanguage: "en-US" },
        { prompt: "Which word starts with the /b/ sound?", instruction: "Tap the word.", correctAnswer: "bear", options: ["bear", "fish", "moon"], explanation: "Bear starts with the /b/ sound.", template: "initial-sound", audioText: "bear, fish, moon", audioLanguage: "en-US" },
        { prompt: "Which word starts with the /f/ sound?", instruction: "Tap the word.", correctAnswer: "fish", options: ["fish", "tree", "cat"], explanation: "Fish starts with the /f/ sound.", template: "initial-sound", audioText: "fish, tree, cat", audioLanguage: "en-US" },
        { prompt: "Which word rhymes with “cat”?", instruction: "Tap the rhyming word.", correctAnswer: "hat", options: ["hat", "dog", "sun"], explanation: "Cat and hat rhyme because they end with -at.", template: "rhyme", audioText: "cat, hat", audioLanguage: "en-US" },
        { prompt: "Which word rhymes with “moon”?", instruction: "Tap the rhyming word.", correctAnswer: "spoon", options: ["spoon", "star", "tree"], explanation: "Moon and spoon rhyme.", template: "rhyme", audioText: "moon, spoon", audioLanguage: "en-US" },
        { prompt: "Which word ends with -un?", instruction: "Tap the correct word.", correctAnswer: "sun", options: ["sun", "sit", "map"], explanation: "Sun ends with -un.", template: "word-family", audioText: "sun", audioLanguage: "en-US" }
      ]);
    case "english-sight-words":
      return build([
        { prompt: "I ___ a cat.", instruction: "Choose the missing word.", correctAnswer: "have", options: ["have", "has", "is"], explanation: "The complete sentence is “I have a cat.”", template: "cloze", audioText: "I have a cat.", audioLanguage: "en-US" },
        { prompt: "The cat ___ small.", instruction: "Choose the missing word.", correctAnswer: "is", options: ["is", "are", "am"], explanation: "Use “is” with one cat.", template: "cloze", audioText: "The cat is small.", audioLanguage: "en-US" },
        { prompt: "I can ___ the ball.", instruction: "Choose the missing word.", correctAnswer: "see", options: ["see", "sea", "say"], explanation: "“I can see the ball” uses see.", template: "cloze", audioText: "I can see the ball.", audioLanguage: "en-US" },
        { prompt: "We ___ to school.", instruction: "Choose the missing word.", correctAnswer: "go", options: ["go", "goes", "going"], explanation: "With “we”, use go.", template: "cloze", audioText: "We go to school.", audioLanguage: "en-US" },
        { prompt: "Look ___ the bird.", instruction: "Choose the missing word.", correctAnswer: "at", options: ["at", "on", "in"], explanation: "“Look at the bird” is correct.", template: "cloze", audioText: "Look at the bird.", audioLanguage: "en-US" },
        { prompt: "She ___ my friend.", instruction: "Choose the missing word.", correctAnswer: "is", options: ["is", "are", "am"], explanation: "Use “is” with she.", template: "cloze", audioText: "She is my friend.", audioLanguage: "en-US" }
      ]);
    case "english-vocabulary":
      return build([
        { prompt: "What is this?", instruction: "Tap the matching word.", correctAnswer: "apple", options: ["apple", "bear", "star"], explanation: "The picture shows an apple.", template: "picture-word", image: "apple", audioText: "apple", audioLanguage: "en-US" },
        { prompt: "What is this?", instruction: "Tap the matching word.", correctAnswer: "bear", options: ["bear", "cat", "fish"], explanation: "The picture shows a bear.", template: "picture-word", image: "bear", audioText: "bear", audioLanguage: "en-US" },
        { prompt: "What is this?", instruction: "Tap the matching word.", correctAnswer: "fish", options: ["fish", "bird", "tree"], explanation: "The picture shows a fish.", template: "picture-word", image: "fish", audioText: "fish", audioLanguage: "en-US" },
        { prompt: "What is this?", instruction: "Tap the matching word.", correctAnswer: "flower", options: ["flower", "tree", "sun"], explanation: "The picture shows a flower.", template: "picture-word", image: "flower", audioText: "flower", audioLanguage: "en-US" },
        { prompt: "What is this?", instruction: "Tap the matching word.", correctAnswer: "moon", options: ["moon", "sun", "star"], explanation: "The picture shows the moon.", template: "picture-word", image: "moon", audioText: "moon", audioLanguage: "en-US" },
        { prompt: "What is this?", instruction: "Tap the matching word.", correctAnswer: "tree", options: ["tree", "flower", "house"], explanation: "The picture shows a tree.", template: "picture-word", image: "tree", audioText: "tree", audioLanguage: "en-US" }
      ]);
    case "english-a-an":
      return build([
        { prompt: "Choose the correct phrase: ___ apple", instruction: "Tap a or an.", correctAnswer: "an apple", options: ["an apple", "a apple", "two apple"], explanation: "Apple begins with a vowel sound, so use an.", template: "article", audioText: "an apple", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ cat", instruction: "Tap a or an.", correctAnswer: "a cat", options: ["a cat", "an cat", "two cat"], explanation: "Cat begins with a consonant sound, so use a.", template: "article", audioText: "a cat", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ elephant", instruction: "Tap a or an.", correctAnswer: "an elephant", options: ["an elephant", "a elephant", "two elephant"], explanation: "Elephant begins with a vowel sound, so use an.", template: "article", audioText: "an elephant", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ orange", instruction: "Tap a or an.", correctAnswer: "an orange", options: ["an orange", "a orange", "two orange"], explanation: "Orange begins with a vowel sound, so use an.", template: "article", audioText: "an orange", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ book", instruction: "Tap a or an.", correctAnswer: "a book", options: ["a book", "an book", "two book"], explanation: "Book begins with a consonant sound, so use a.", template: "article", audioText: "a book", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ dog", instruction: "Tap a or an.", correctAnswer: "a dog", options: ["a dog", "an dog", "two dog"], explanation: "Dog begins with a consonant sound, so use a.", template: "article", audioText: "a dog", audioLanguage: "en-US" }
      ]);
    case "english-plural":
      return build([
        { prompt: "One cat, two ___.", instruction: "Choose the plural word.", correctAnswer: "cats", options: ["cats", "cat", "dogs"], explanation: "Add -s to make cats.", template: "plural", audioText: "one cat, two cats", audioLanguage: "en-US" },
        { prompt: "One dog, two ___.", instruction: "Choose the plural word.", correctAnswer: "dogs", options: ["dogs", "dog", "cats"], explanation: "Add -s to make dogs.", template: "plural", audioText: "one dog, two dogs", audioLanguage: "en-US" },
        { prompt: "One book, three ___.", instruction: "Choose the plural word.", correctAnswer: "books", options: ["books", "book", "pens"], explanation: "Add -s to make books.", template: "plural", audioText: "one book, three books", audioLanguage: "en-US" },
        { prompt: "One star, four ___.", instruction: "Choose the plural word.", correctAnswer: "stars", options: ["stars", "star", "moons"], explanation: "Add -s to make stars.", template: "plural", audioText: "one star, four stars", audioLanguage: "en-US" },
        { prompt: "One tree, five ___.", instruction: "Choose the plural word.", correctAnswer: "trees", options: ["trees", "tree", "birds"], explanation: "Add -s to make trees.", template: "plural", audioText: "one tree, five trees", audioLanguage: "en-US" },
        { prompt: "One bird, six ___.", instruction: "Choose the plural word.", correctAnswer: "birds", options: ["birds", "bird", "trees"], explanation: "Add -s to make birds.", template: "plural", audioText: "one bird, six birds", audioLanguage: "en-US" }
      ]);
    case "english-sentence-order":
      return build([
        { prompt: "Which sentence is correct?", instruction: "Tap the correct sentence.", correctAnswer: "The cat is small.", options: ["The cat is small.", "Cat the is small.", "Small is the cat."], explanation: "“The cat is small.” uses correct English order.", template: "sentence-order", audioText: "The cat is small.", audioLanguage: "en-US" },
        { prompt: "Which sentence is correct?", instruction: "Tap the correct sentence.", correctAnswer: "I like apples.", options: ["I like apples.", "Apples like I.", "Like I apples."], explanation: "“I like apples.” is a complete sentence.", template: "sentence-order", audioText: "I like apples.", audioLanguage: "en-US" },
        { prompt: "Which sentence is correct?", instruction: "Tap the correct sentence.", correctAnswer: "We go to school.", options: ["We go to school.", "Go we school to.", "School go we to."], explanation: "“We go to school.” is correct.", template: "sentence-order", audioText: "We go to school.", audioLanguage: "en-US" },
        { prompt: "Which sentence is correct?", instruction: "Tap the correct sentence.", correctAnswer: "She has a red bag.", options: ["She has a red bag.", "Has she red a bag.", "A red bag she has?"], explanation: "“She has a red bag.” is correct.", template: "sentence-order", audioText: "She has a red bag.", audioLanguage: "en-US" },
        { prompt: "Which sentence is correct?", instruction: "Tap the correct sentence.", correctAnswer: "The bird can fly.", options: ["The bird can fly.", "Can fly the bird.", "Bird the fly can."], explanation: "“The bird can fly.” is correct.", template: "sentence-order", audioText: "The bird can fly.", audioLanguage: "en-US" },
        { prompt: "Which sentence is correct?", instruction: "Tap the correct sentence.", correctAnswer: "My brother likes fish.", options: ["My brother likes fish.", "Likes my fish brother.", "Fish likes my brother."], explanation: "“My brother likes fish.” is correct.", template: "sentence-order", audioText: "My brother likes fish.", audioLanguage: "en-US" }
      ]);
    case "english-reading":
      return build([
        { prompt: "What colour is the ball?", instruction: "Read and choose the answer.", correctAnswer: "red", options: ["red", "blue", "green"], explanation: "The text says Tom has a red ball.", template: "literal", passage: "Tom has a red ball.", audioText: "Tom has a red ball.", audioLanguage: "en-US" },
        { prompt: "Where is the cat?", instruction: "Read and choose the answer.", correctAnswer: "on the mat", options: ["on the mat", "in the box", "under the tree"], explanation: "The text says the cat is on the mat.", template: "literal", passage: "The cat is on the mat.", audioText: "The cat is on the mat.", audioLanguage: "en-US" },
        { prompt: "What does Mia like?", instruction: "Read and choose the answer.", correctAnswer: "apples", options: ["apples", "fish", "books"], explanation: "The text says Mia likes apples.", template: "literal", passage: "Mia likes apples.", audioText: "Mia likes apples.", audioLanguage: "en-US" },
        { prompt: "How many stars are there?", instruction: "Read and choose the answer.", correctAnswer: "three", options: ["three", "two", "four"], explanation: "The text says there are three stars.", template: "literal", passage: "There are three stars in the sky.", audioText: "There are three stars in the sky.", audioLanguage: "en-US" },
        { prompt: "What is Ben doing?", instruction: "Read and choose the answer.", correctAnswer: "reading", options: ["reading", "sleeping", "running"], explanation: "The text says Ben is reading.", template: "literal", passage: "Ben is reading a book.", audioText: "Ben is reading a book.", audioLanguage: "en-US" },
        { prompt: "Who has a kite?", instruction: "Read and choose the answer.", correctAnswer: "Lily", options: ["Lily", "Tom", "Ben"], explanation: "The text says Lily has a kite.", template: "literal", passage: "Lily has a kite.", audioText: "Lily has a kite.", audioLanguage: "en-US" }
      ]);
    case "english-reading-inference":
      return build([
        { prompt: "Why does Tom take an umbrella?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "it may rain", options: ["it may rain", "it is hot", "it is snowing"], explanation: "Tom sees dark clouds, so it may rain.", template: "inference", passage: "Tom sees dark clouds. He takes an umbrella.", audioText: "Tom sees dark clouds. He takes an umbrella.", audioLanguage: "en-US" },
        { prompt: "What will Mia do next?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "get water", options: ["get water", "eat a cake", "go to sleep"], explanation: "Mia's cup is empty, so she will get water.", template: "sequence", passage: "Mia's cup is empty. She goes to the kitchen.", audioText: "Mia's cup is empty. She goes to the kitchen.", audioLanguage: "en-US" },
        { prompt: "Why are Ben's shoes wet?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "it is raining", options: ["it is raining", "he is cooking", "he is drawing"], explanation: "Ben's shoes are wet because it is raining outside.", template: "why", passage: "Ben's shoes are wet. He puts them near the door. It is raining outside.", audioText: "Ben's shoes are wet. He puts them near the door. It is raining outside.", audioLanguage: "en-US" },
        { prompt: "How does Ana feel?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "worried", options: ["worried", "happy", "sleepy"], explanation: "Ana wakes up late and runs to school, so she feels worried.", template: "inference", passage: "Ana wakes up late. She runs to school.", audioText: "Ana wakes up late. She runs to school.", audioLanguage: "en-US" },
        { prompt: "What are Sam and his friends doing?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "celebrating a birthday", options: ["celebrating a birthday", "going to bed", "doing homework"], explanation: "There are candles and singing, so they are celebrating a birthday.", template: "inference", passage: "Sam's cake has candles. His friends sing to him.", audioText: "Sam's cake has candles. His friends sing to him.", audioLanguage: "en-US" },
        { prompt: "Where is Lily going?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "school", options: ["school", "the beach", "the zoo"], explanation: "Lily looks at the clock at 7:00 and picks up her bag, so she is going to school.", template: "inference", passage: "Lily looks at the clock. It is 7:00. She picks up her bag.", audioText: "Lily looks at the clock. It is 7:00. She picks up her bag.", audioLanguage: "en-US" },
        { prompt: "What does the cat want?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "to go out", options: ["to go out", "to eat a book", "to sleep in a cup"], explanation: "The cat is by the door and meows, so it wants to go out.", template: "inference", passage: "The cat is by the door and meows.", audioText: "The cat is by the door and meows.", audioLanguage: "en-US" },
        { prompt: "What does the plant need?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "water", options: ["water", "a new book", "a coat"], explanation: "The leaves are yellow and it has not rained, so the plant needs water.", template: "why", passage: "The plant's leaves are yellow. It has not rained.", audioText: "The plant's leaves are yellow. It has not rained.", audioLanguage: "en-US" },
        { prompt: "What will Ben do next?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "play outside", options: ["play outside", "do his homework", "go to sleep"], explanation: "Ben finishes his homework and puts on his boots, so he will play outside.", template: "sequence", passage: "Ben finishes his homework, then puts on his boots.", audioText: "Ben finishes his homework, then puts on his boots.", audioLanguage: "en-US" },
        { prompt: "Why should Mia be quiet?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "people are reading", options: ["people are reading", "people are sleeping", "people are singing"], explanation: "The library sign asks for quiet because people are reading.", template: "why", passage: "Mia sees a sign: “Library — Quiet Please.”", audioText: "Mia sees a sign: Library. Quiet please.", audioLanguage: "en-US" },
        { prompt: "What will Sam do?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "wash his hands", options: ["wash his hands", "eat a snack", "read a book"], explanation: "Sam's hands are dirty and he goes to the sink, so he will wash his hands.", template: "sequence", passage: "Sam's hands are dirty. He goes to the sink.", audioText: "Sam's hands are dirty. He goes to the sink.", audioLanguage: "en-US" },
        { prompt: "Why does Ana turn on the light?", instruction: "Read the clues, then tap the best answer.", correctAnswer: "it is getting dark", options: ["it is getting dark", "it is getting hot", "she is hungry"], explanation: "The sun sets, so it is getting dark and Ana turns on the light.", template: "why", passage: "The sun sets. Ana turns on the light.", audioText: "The sun sets. Ana turns on the light.", audioLanguage: "en-US" }
      ]);
    case "english-spelling":
      return build([
        { prompt: "Listen and tap the correct word.", instruction: "Listen, then tap the matching spelling.", correctAnswer: "apple", options: ["apple", "apply", "ankle"], explanation: "The correct spelling is apple.", template: "spelling", audioText: "apple", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the correct word.", instruction: "Listen, then tap the matching spelling.", correctAnswer: "bear", options: ["bear", "pear", "bean"], explanation: "The correct spelling is bear.", template: "spelling", audioText: "bear", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the correct word.", instruction: "Listen, then tap the matching spelling.", correctAnswer: "fish", options: ["fish", "dish", "wish"], explanation: "The correct spelling is fish.", template: "spelling", audioText: "fish", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the correct word.", instruction: "Listen, then tap the matching spelling.", correctAnswer: "moon", options: ["moon", "soon", "noon"], explanation: "The correct spelling is moon.", template: "spelling", audioText: "moon", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the correct word.", instruction: "Listen, then tap the matching spelling.", correctAnswer: "tree", options: ["tree", "free", "three"], explanation: "The correct spelling is tree.", template: "spelling", audioText: "tree", audioLanguage: "en-US", audioOnly: true },
        { prompt: "Listen and tap the correct word.", instruction: "Listen, then tap the matching spelling.", correctAnswer: "water", options: ["water", "later", "paper"], explanation: "The correct spelling is water.", template: "spelling", audioText: "water", audioLanguage: "en-US", audioOnly: true }
      ]);
    default:
      return [];
  }
}

export function buildLanguageQuestions(skill: Skill): ChoiceQuestion[] {
  const base = skill.subject === "mandarin"
    ? buildMandarinQuestions(skill)
    : skill.subject === "english"
      ? buildEnglishQuestions(skill)
      : [];
  const target = LANGUAGE_DEPTH_TARGETS[skill.id];
  if (target === undefined) return base;
  const seeds = buildLanguageDepthSeeds(skill.id);
  const result = [
    ...base,
    ...seeds.map((seed, offset) => makeLanguageQuestion(skill, base.length + offset, seed))
  ];
  if (result.length !== target) throw new Error(`${skill.id} has ${result.length} choice questions; expected ${target}`);
  return result;
}

function buildLanguageDepthSeeds(skillId: string): LanguageDepthSeed[] {
  const zh = (prompt: string, answer: string, options: string[], explanation: string, template: string, displayCharacter?: string, difficulty: 1 | 2 | 3 | 4 | 5 = 2): LanguageDepthSeed => ({
    prompt,
    instruction: "选择正确答案。",
    options,
    correctAnswer: answer,
    explanation,
    template,
    difficulty,
    ...(displayCharacter ? { displayCharacter, audioText: displayCharacter, audioLanguage: "zh-CN" as const } : {})
  });
  const en = (prompt: string, answer: string, options: string[], explanation: string, template: string, difficulty: 1 | 2 | 3 | 4 | 5 = 2, passage?: string): LanguageDepthSeed => ({
    prompt,
    instruction: "Tap the correct answer.",
    options,
    correctAnswer: answer,
    explanation,
    template,
    difficulty,
    ...(passage ? { passage, audioText: passage, audioLanguage: "en-US" as const } : {})
  });
  const read = (prompt: string, answer: string, options: string[], explanation: string, template: string, difficulty: 1 | 2 | 3 | 4 | 5, passage: string, instruction = "Read and choose the answer."): LanguageDepthSeed => ({
    prompt,
    instruction,
    options,
    correctAnswer: answer,
    explanation,
    template,
    difficulty,
    passage,
    audioText: prompt,
    audioLanguage: "en-US" as const,
    transferLevel: /sequence|inference|why|feeling/i.test(template) ? "near-transfer" : "same-context"
  });

  switch (skillId) {
    case "k2-mandarin-vocabulary":
      return [
        zh("“眼睛”用来做什么？", "看东西", ["看东西", "听声音", "吃东西"], "眼睛可以用来看东西。", "body-use", "眼睛"),
        zh("“耳朵”用来做什么？", "听声音", ["看东西", "闻气味", "吃东西"], "耳朵可以用来听声音。", "body-use", "耳朵"),
        zh("下雨时要带什么？", "雨伞", ["雨伞", "水杯", "书本"], "下雨时带雨伞可以挡雨。", "context-word"),
        zh("“高兴”是什么意思？", "开心", ["开心", "生气", "害怕"], "高兴就是开心。", "meaning", "高兴"),
        zh("“大”的反义词是什么？", "小", ["小", "高", "多"], "大的反义词是小。", "opposite", "大"),
        zh("“早上”的反义词是什么？", "晚上", ["晚上", "中午", "下午"], "早上的反义词是晚上。", "opposite", "早上")
      ];
    case "mandarin-initials":
      return [
        zh("“妈”的声母和哪一个一样？", "m", ["m", "n", "h"], "妈读作 mā，声母是 m。", "initial-family", "妈"),
        zh("听一听“猫”。哪一个声母对？", "m", ["m", "n", "l"], "猫读作 māo，声母是 m。", "picture-initial", "猫"),
        zh("“火”的声母是哪一个？", "h", ["h", "f", "k"], "火读作 huǒ，声母是 h。", "initial-family", "火"),
        zh("听一听“水”。哪一个声母对？", "sh", ["sh", "s", "ch"], "水读作 shuǐ，声母是 sh。", "picture-initial", "水"),
        zh("哪一个字和“山”的声母一样？", "手", ["手", "火", "月"], "山 shān 和手 shǒu 的声母都是 sh。", "same-initial", "山", 3),
        zh("哪一个字和“兔”的声母一样？", "田", ["田", "鸟", "花"], "兔 tù 和田 tián 的声母都是 t。", "same-initial", "兔", 3),
        zh("“木”的声母是哪一个？", "m", ["m", "n", "f"], "木读作 mù，声母是 m。", "initial-family", "木"),
        zh("听一听“日”。哪一个声母对？", "r", ["r", "l", "z"], "日读作 rì，声母是 r。", "picture-initial", "日"),
        zh("“月”的声母是哪一个？", "y", ["y", "w", "r"], "月读作 yuè，拼音以 y 开头。", "initial-family", "月", 3),
        zh("哪一个字和“鸟”的声母一样？", "牛", ["牛", "雨", "马"], "鸟 niǎo 和牛 niú 的声母都是 n。", "same-initial", "鸟", 3),
        zh("听一听“鱼”。哪一个声母对？", "y", ["y", "r", "w"], "鱼读作 yú，拼音以 y 开头。", "picture-initial", "鱼"),
        zh("哪一个字和“木”的声母一样？", "妈", ["妈", "鸟", "山"], "木 mù 和妈 mā 的声母都是 m。", "same-initial", "木", 3)
      ];
    case "mandarin-finals":
      return [
        zh("“猫” (māo) 的韵母属于哪一族？", "ao", ["ao", "ou", "an"], "māo 的韵母是 ao。", "final-family", "猫"),
        zh("听一听“狗” (gǒu)。哪一个韵母对？", "ou", ["ou", "ao", "iu"], "gǒu 的韵母是 ou。", "picture-final", "狗"),
        zh("“花” (huā) 的韵母属于哪一族？", "ua", ["ua", "uo", "a"], "huā 的韵母是 ua。", "final-family", "花", 3),
        zh("哪一个字和“山”的韵母一样？", "三", ["三", "狗", "月"], "山 shān 和三 sān 的韵母都是 an。", "same-final", "山", 4),
        zh("听一听“牛” (niú)。哪一个韵母对？", "iu", ["iu", "ui", "ou"], "niú 的韵母是 iu。", "picture-final", "牛", 3),
        zh("“手” (shǒu) 和“狗” (gǒu) 的韵母一样吗？", "一样", ["一样", "不一样", "都不同"], "shǒu 和 gǒu 的韵母都是 ou。", "same-final", "手", 4)
      ];
    case "mandarin-tones":
      return [
        zh("“花” (huā) 是第几声？", "第一声", ["第一声", "第二声", "第三声"], "huā 的声调是第一声。", "tone-mark", "花"),
        zh("“火” (huǒ) 是第几声？", "第三声", ["第一声", "第三声", "第四声"], "huǒ 的声调是第三声。", "tone-mark", "火"),
        zh("“木” (mù) 是第几声？", "第四声", ["第二声", "第三声", "第四声"], "mù 的声调是第四声。", "tone-mark", "木"),
        zh("“田” (tián) 是第几声？", "第二声", ["第一声", "第二声", "第四声"], "tián 的声调是第二声。", "tone-mark", "田"),
        zh("“妈 mā”和“猫 māo”的声调一样吗？", "一样", ["一样", "不一样", "都不同"], "两个字都读第一声。", "same-different-tone", undefined, 3),
        zh("“狗 gǒu”和“月 yuè”的声调一样吗？", "不一样", ["一样", "不一样", "都相同"], "gǒu 是第三声，yuè 是第四声。", "same-different-tone", undefined, 3),
        zh("“牛” (niú) 是第几声？", "第二声", ["第一声", "第二声", "第三声"], "niú 的声调是第二声。", "tone-mark", "牛"),
        zh("“马” (mǎ) 是第几声？", "第三声", ["第二声", "第三声", "第四声"], "mǎ 的声调是第三声。", "tone-mark", "马"),
        zh("“山 shān”和“手 shǒu”的声调一样吗？", "不一样", ["一样", "不一样", "都相同"], "shān 是第一声，shǒu 是第三声。", "same-different-tone", undefined, 4),
        zh("“书” (shū) 是第几声？", "第一声", ["第一声", "第二声", "第四声"], "shū 的声调是第一声。", "tone-mark", "书"),
        zh("“兔 tù”和“月 yuè”的声调一样吗？", "一样", ["一样", "不一样", "都不同"], "两个字都读第四声。", "same-different-tone", undefined, 3)
        ,zh("“大” (dà) 是第几声？", "第四声", ["第一声", "第三声", "第四声"], "dà 的声调是第四声。", "tone-mark", "大")
      ];
    case "mandarin-syllables":
      return [
        zh("“火”的正确拼音是哪一个？", "huǒ", ["huǒ", "hǒu", "huò"], "火读作 huǒ。", "complete-pinyin", "火"),
        zh("m 和 ā 合起来是什么？", "mā", ["mā", "má", "mǎ"], "m + ā = mā，妈读作 mā。", "tone-base-combine", "妈", 3),
        zh("听一听“牛”。正确拼音是哪一个？", "niú", ["niú", "niū", "niù"], "牛读作 niú。", "syllable-picture", "牛"),
        zh("“日”的正确拼音是哪一个？", "rì", ["rì", "rí", "rǐ"], "日读作 rì。", "complete-pinyin", "日"),
        zh("sh 和 uǐ 合起来是什么？", "shuǐ", ["shuǐ", "shuí", "shuì"], "sh + uǐ = shuǐ，水读作 shuǐ。", "tone-base-combine", "水", 3)
        ,zh("听一听“花”。正确拼音是哪一个？", "huā", ["huā", "huá", "huà"], "花读作 huā。", "syllable-picture", "花")
      ];
    case "mandarin-characters":
      return [
        zh("哪一个词里有“火”？", "火苗", ["火苗", "月亮", "小鸟"], "“火苗”里有火。", "character-word", "火"),
        zh("哪一个字有“女”字旁？", "妈", ["妈", "狗", "花"], "“妈”有女字旁。", "radical-shape", "妈", 3),
        zh("哪一个字表示身体上用来拿东西的部位？", "手", ["手", "口", "目"], "手可以用来拿东西。", "meaning-character", "手"),
        zh("哪一个词里有“日”？", "太阳", ["太阳", "田地", "足球"], "“太阳”里有日。", "character-word", "日"),
        zh("哪一个字有“艹”草字头？", "花", ["花", "猫", "狗"], "“花”有草字头。", "radical-shape", "花", 3),
        zh("哪一个字表示身体上用来看东西的部位？", "目", ["目", "日", "木"], "目就是眼睛，可以用来看东西。", "meaning-character", "目"),
        zh("哪一个词里有“田”？", "田地", ["田地", "月亮", "小手"], "“田地”里有田。", "character-word", "田"),
        zh("哪一个字有“木”字旁？", "树", ["树", "花", "狗"], "“树”有木字旁。", "radical-shape", "树", 3),
        zh("哪一个字表示身体上用来走路的部位？", "足", ["足", "手", "口"], "足就是脚，可以用来走路。", "meaning-character", "足"),
        zh("哪一个词里有“月”？", "月亮", ["月亮", "田地", "火苗"], "“月亮”里有月。", "character-word", "月"),
        zh("哪一个字表示嘴巴？", "口", ["口", "山", "水"], "“口”表示嘴巴，所以有“开口、门口”等词语。", "meaning-character", "口", 4)
        ,zh("哪一个词里有“手”？", "小手", ["小手", "太阳", "月亮"], "“小手”里有手。", "character-word", "手")
      ];
    case "mandarin-vocabulary":
      return [
        zh("口渴了，应该做什么？", "喝水", ["喝水", "睡觉", "跑步"], "口渴了要喝水。", "context-word"),
        zh("苹果、香蕉、猫，哪一个是动物？", "猫", ["猫", "苹果", "香蕉"], "猫是动物，苹果和香蕉是水果。", "category-word", undefined, 3),
        zh("下雨了，要带什么？", "雨伞", ["雨伞", "水杯", "书本"], "下雨要带雨伞。", "context-word"),
        zh("哪一个是可以喝的？", "水", ["水", "书", "花"], "水可以喝。", "category-word", undefined, 1)
        ,zh("“小鸟”属于哪一类？", "动物", ["动物", "水果", "文具"], "小鸟是动物。", "category-word")
        ,zh("读书的时候，要用什么？", "眼睛", ["眼睛", "耳朵", "嘴巴"], "读书要用眼睛看。", "context-word")
      ];
    case "mandarin-reading-inference": {
      const read = (passage: string, prompt: string, answer: string, options: string[], explanation: string, template: string): LanguageDepthSeed => ({
        prompt,
        instruction: "读一读，选择正确答案。",
        options,
        correctAnswer: answer,
        explanation,
        template,
        passage,
        audioText: passage,
        audioLanguage: "zh-CN" as const
      });
      return [
        read("妹妹把哥哥的积木撞倒了，哥哥深吸一口气，说“没关系，我们一起搭”。", "哥哥现在是什么心情？", "不生气，愿意一起玩", ["很生气，不想玩", "不生气，愿意一起玩", "很难过，想哭"], "哥哥深呼吸后说一起搭，说明他不生气，愿意一起玩。", "feeling"),
        read("小华看到同学摔倒了，马上跑过去扶他。", "小华是一个怎样的孩子？", "乐于助人", ["乐于助人", "喜欢嘲笑别人", "不想帮忙"], "小华主动扶起同学，说明他乐于助人。", "character"),
        read("天空乌云密布，风也变大了。", "接下来最可能发生什么？", "下雨", ["出太阳", "下雨", "下雪"], "乌云和风变大通常说明要下雨。", "next"),
        read("妈妈在厨房切菜，锅里的水开了。", "妈妈接下来最可能做什么？", "把菜放进锅里", ["去睡觉", "把菜放进锅里", "看电视"], "水开了又在切菜，接下来最可能是把菜放进锅里。", "next"),
        read("小丽找不到书包，她记得最后一节课在图书馆看书。", "书包最可能在哪里？", "图书馆", ["厨房", "图书馆", "公园"], "她最后一节课在图书馆，书包最可能留在那里。", "inference-place"),
        read("老师说“请大家安静”，教室马上没有声音了。", "同学们怎么做？", "安静下来", ["继续说话", "安静下来", "跑出教室"], "老师提醒后教室没有声音，说明同学们安静下来了。", "action"),
        read("妈妈提着菜回家，发现下雨了，她加快脚步。", "妈妈为什么加快脚步？", "她想快点回家", ["她想跑步", "她想去公园", "她想买菜"], "下雨了，妈妈想快点回家。", "why"),
        read("弟弟把牛奶洒在桌上，马上拿纸巾。", "弟弟想做什么？", "擦干净桌子", ["把牛奶喝掉", "擦干净桌子", "把纸巾收起来"], "弟弟拿纸巾是想把桌上的牛奶擦干净。", "action"),
        read("小明看到同学的新铅笔，说“真好看”，同学笑了。", "小明在做什么？", "夸同学", ["借铅笔", "夸同学", "买铅笔"], "小明说“真好看”，是在夸同学。", "intent"),
        read("外面风很大，窗户被吹得啪啪响，奶奶走过去关上窗。", "奶奶为什么关窗？", "风太大", ["她想睡觉", "风太大", "她想擦窗"], "风把窗户吹得很响，奶奶关窗是因为风太大。", "why")
      ];
    }
    case "mandarin-reading":
      return [
        { ...zh("我先开门，再进屋。先做什么？", "开门", ["开门", "进屋", "关门"], "句子说“先开门”。", "sequence"), passage: "我先开门，再进屋。", audioText: "我先开门，再进屋。", audioLanguage: "zh-CN" },
        { ...zh("小鸟在天上飞。是谁在飞？", "小鸟", ["小鸟", "小狗", "小鱼"], "句子说小鸟在飞。", "inference-word", "小鸟"), passage: "小鸟在天上飞。", audioText: "小鸟在天上飞。", audioLanguage: "zh-CN" },
        { ...zh("桌上有三本书。桌上有几本书？", "三本", ["三本", "两本", "四本"], "句子说有三本书。", "literal-detail"), passage: "桌上有三本书。", audioText: "桌上有三本书。", audioLanguage: "zh-CN" },
        { ...zh("先洗手，再吃饭。先做哪件事？", "洗手", ["洗手", "吃饭", "喝水"], "句子说先洗手。", "sequence"), passage: "先洗手，再吃饭。", audioText: "先洗手，再吃饭。", audioLanguage: "zh-CN" },
        { ...zh("雨停了，太阳出来了。天气可能怎样？", "天晴了", ["天晴了", "还在下雨", "下雪了"], "太阳出来了，可能是天晴了。", "inference-word"), passage: "雨停了，太阳出来了。", audioText: "雨停了，太阳出来了。", audioLanguage: "zh-CN" }
        ,{ ...zh("小狗在树下睡觉。小狗在哪里？", "树下", ["树下", "天上", "水里"], "句子说小狗在树下。", "literal-detail"), passage: "小狗在树下睡觉。", audioText: "小狗在树下睡觉。", audioLanguage: "zh-CN" }
        ,{ ...zh("天空很黑，小明带伞出门。为什么带伞？", "可能要下雨", ["可能要下雨", "可能很热", "可能下雪"], "天空很黑，带伞可能是要下雨。", "inference-word"), passage: "天空很黑，小明带伞出门。", audioText: "天空很黑，小明带伞出门。", audioLanguage: "zh-CN" }
        ,{ ...zh("妈妈把米洗好，放进锅里。接下来最可能做什么？", "煮饭", ["煮饭", "洗衣", "画画"], "米洗好放进锅里，接下来最可能是煮饭。", "inference-word"), passage: "妈妈把米洗好，放进锅里。", audioText: "妈妈把米洗好，放进锅里。", audioLanguage: "zh-CN" }
        ,{ ...zh("书不在桌上，在椅子下面。书在哪里？", "椅子下面", ["椅子下面", "桌子上", "床上"], "句子说书在椅子下面。", "literal-detail"), passage: "书不在桌上，在椅子下面。", audioText: "书不在桌上，在椅子下面。", audioLanguage: "zh-CN" }
        ,{ ...zh("两个男孩和三个女孩在操场。一共有几个人？", "五个人", ["五个人", "三个人", "两个人"], "2 + 3 = 5，所以有五个人。", "literal-detail"), passage: "两个男孩和三个女孩在操场。", audioText: "两个男孩和三个女孩在操场。", audioLanguage: "zh-CN" }
        ,{ ...zh("朋友送小华一张生日卡。小华为什么笑？", "收到生日卡", ["收到生日卡", "要去睡觉", "找不到书包"], "朋友送生日卡，所以小华笑。", "inference-word"), passage: "朋友送小华一张生日卡。", audioText: "朋友送小华一张生日卡。", audioLanguage: "zh-CN" }
        ,{ ...zh("妹妹先洗手，再吃水果。先做什么？", "洗手", ["洗手", "吃水果", "睡觉"], "句子说先洗手。", "sequence"), passage: "妹妹先洗手，再吃水果。", audioText: "妹妹先洗手，再吃水果。", audioLanguage: "zh-CN" }
      ];
    case "mandarin-classifiers":
      return [
        zh("我看一 ___ 书。", "本", ["本", "只", "座"], "我们说“一本书”。", "phrase-complete", "书"),
        zh("一朵花、一只猫，哪一个用“只”？", "猫", ["猫", "花", "书"], "猫用“只”，花用“朵”，书用“本”。", "picture-sort", "猫", 3),
        zh("公园里有一 ___ 树。", "棵", ["棵", "朵", "只"], "树用“棵”。", "phrase-complete", "树"),
        zh("一本书、一座山，哪一个用“座”？", "山", ["山", "书", "花"], "山用“座”，书用“本”，花用“朵”。", "picture-sort", "山", 3),
        zh("我有一 ___ 手。", "双", ["双", "只", "本"], "两只手叫“一双手”。", "phrase-complete", "手", 4)
        ,zh("我有一 ___ 猫。", "只", ["只", "朵", "本"], "猫用“只”。", "phrase-complete", "猫")
      ];
    case "mandarin-word-order":
      return [
        zh("我 ___ 小猫。", "喜欢", ["喜欢", "在", "是"], "“我喜欢小猫”是完整句子。", "missing-word"),
        zh("先说哪一句才自然？", "你好，妈妈。", ["你好，妈妈。", "妈妈，你好你。", "好你妈妈。"], "打招呼可以说“你好，妈妈”。", "conversation-order"),
        zh("弟弟 ___ 学校。", "去", ["去", "在", "是"], "“弟弟去学校”语序正确。", "missing-word"),
        zh("别人说“谢谢”，你回答哪一句？", "不用谢。", ["不用谢。", "谢谢我。", "不谢用。"], "回答“谢谢”可以说“不用谢”。", "conversation-order", undefined, 3),
        zh("我们一 ___ 去公园。", "起", ["起", "只", "本"], "“我们一起去公园”是完整句子。", "missing-word")
        ,zh("爸爸在 ___ 水。", "喝", ["喝", "本", "朵"], "“爸爸在喝水”语序正确。", "missing-word")
      ];
    case "k2-english-letters":
      return [
        en("Which letter has the name “bee”?", "B", ["B", "D", "P"], "The letter B is called “bee”.", "letter-name"),
        en("Which small letter matches B?", "b", ["b", "d", "p"], "The small letter of B is b.", "letter-case"),
        en("Which letter comes just after K?", "L", ["L", "J", "M"], "The alphabet goes K, L, M, so L comes just after K.", "alphabet-order"),
        en("Which letter comes just before P?", "O", ["O", "Q", "N"], "The alphabet goes O, P, Q, so O comes just before P.", "alphabet-order"),
        en("Which letter starts the word “apple”?", "A", ["A", "P", "E"], "Apple starts with A.", "beginning-letter"),
        en("Which capital letter matches f?", "F", ["F", "E", "H"], "The capital letter of f is F.", "letter-case")
      ];
    case "english-letters":
      return [
        en("Which letter has the name “bee”?", "B", ["B", "D", "P"], "The letter B is called “bee”.", "letter-name"),
        en("Which small letter matches A?", "a", ["a", "b", "d"], "The small letter of A is a.", "letter-case"),
        en("Which letter has the name “ess”?", "S", ["S", "X", "F"], "The letter S is called “ess”.", "letter-name"),
        en("Which capital letter matches b?", "B", ["B", "D", "R"], "The capital letter of b is B.", "letter-case"),
        en("Which letter has the name “ex”?", "X", ["X", "S", "Z"], "The letter X is called “ex”.", "letter-name", 3)
        ,en("Which capital letter matches d?", "D", ["D", "B", "P"], "The capital letter of d is D.", "letter-case")
      ];
    case "english-listening-comprehension": {
      const listen = (passage: string, prompt: string, answer: string, options: string[], explanation: string, template: string): LanguageDepthSeed => ({
        prompt,
        instruction: "Listen first, then tap the answer.",
        options,
        correctAnswer: answer,
        explanation,
        template,
        passage,
        audioText: passage,
        audioLanguage: "en-US" as const,
        audioOnly: true,
        difficulty: 2
      });
      return [
        listen("Ana's shoes are wet. It is raining outside.", "What should Ana wear?", "boots", ["boots", "sandals", "slippers"], "Ana's shoes are wet from the rain, so she should wear boots.", "listen-inference"),
        listen("The teacher says: Line up at the door.", "Where should the children go?", "to the door", ["to the window", "to the door", "to the playground"], "The teacher asks the children to line up at the door.", "listen-where"),
        listen("The cup is empty. Kim wants water.", "What should Kim do?", "get water", ["get water", "eat cake", "go to sleep"], "Kim wants water, so she should get water.", "listen-action"),
        listen("The baby is sleeping.", "What should we do?", "be quiet", ["be quiet", "sing loudly", "run around"], "The baby is sleeping, so we should be quiet.", "listen-inference"),
        listen("Sara sees dark clouds in the sky.", "What might happen?", "rain", ["rain", "snow", "a sunny day"], "Dark clouds often mean rain.", "listen-inference"),
        listen("Ben wants to read a book in a quiet place.", "Where should Ben go?", "to the library", ["to the kitchen", "to the library", "to the playground"], "A library is a quiet place for reading.", "listen-where"),
        listen("The bus is full. Tom waits for the next bus.", "What does Tom do?", "wait for the next bus", ["get on the bus", "wait for the next bus", "walk home"], "The bus is full, so Tom waits for the next bus.", "listen-inference"),
        listen("Lily's pencil is broken. She asks the teacher for a new pencil.", "What does Lily need?", "a new pencil", ["a new book", "a new pencil", "a new bag"], "Lily's pencil is broken, so she needs a new pencil.", "listen-detail"),
        listen("The sign says no food in the library. Ben has a sandwich.", "What should Ben do?", "put the sandwich away", ["eat the sandwich", "put the sandwich away", "buy more food"], "The library does not allow food, so Ben should put the sandwich away.", "listen-inference"),
        listen("It is sports day. The children wear shorts and trainers.", "What are the children ready to do?", "play sports", ["go to sleep", "play sports", "read a book"], "Shorts and trainers are for sports day.", "listen-inference")
      ];
    }
    case "english-listening": {
      const listen = (answer: string, first: string, second: string): LanguageDepthSeed => ({
        prompt: "Listen and tap the picture you hear.",
        instruction: "Listen first, then tap the matching picture.",
        options: [answer, first, second],
        correctAnswer: answer,
        explanation: `You heard ${answer}.`,
        template: "listen-find",
        audioText: answer,
        audioLanguage: "en-US",
        audioOnly: true,
        optionImages: { [answer]: answer, [first]: first, [second]: second },
        difficulty: 2
      });
      return [
        listen("apple", "star", "bear"),
        listen("bear", "apple", "dog"),
        listen("cat", "fish", "sun"),
        listen("dog", "tree", "flower"),
        listen("fish", "moon", "cat"),
        listen("flower", "apple", "star"),
        listen("moon", "fish", "dog"),
        listen("star", "tree", "apple"),
        listen("sun", "cat", "bear"),
        listen("tree", "dog", "moon"),
        listen("apple", "flower", "sun"),
        listen("bear", "star", "fish")
      ];
    }
    case "english-phonics":
      return [
        en("Which word starts with the /d/ sound?", "dog", ["dog", "sun", "moon"], "Dog starts with /d/.", "initial-sound"),
        en("Which word starts with the /s/ sound?", "sun", ["sun", "fish", "tree"], "Sun starts with /s/.", "initial-sound"),
        en("Which word rhymes with “dog”?", "log", ["log", "sun", "tree"], "Dog and log both end with -og.", "rhyme", 3),
        en("Which word is in the -at family?", "cat", ["cat", "dog", "sun"], "Cat ends with -at.", "word-family"),
        en("Which word is in the -og family?", "dog", ["dog", "cat", "fish"], "Dog ends with -og.", "word-family", 3),
        en("Which word ends with the /n/ sound?", "sun", ["sun", "cat", "fish"], "Sun ends with /n/.", "ending-sound", 3),
        en("Which word ends with the /k/ sound?", "book", ["book", "dog", "sun"], "Book ends with /k/.", "ending-sound", 3),
        en("Which word rhymes with “fish”?", "dish", ["dish", "dog", "tree"], "Fish and dish both end with -ish.", "rhyme", 4),
        en("Which word is in the -ee family?", "tree", ["tree", "cat", "dog"], "Tree ends with -ee.", "word-family", 3),
        en("Which word starts with the /t/ sound?", "tree", ["tree", "dog", "moon"], "Tree starts with /t/.", "initial-sound"),
        en("Which word rhymes with “cat”?", "bat", ["bat", "dog", "sun"], "Cat and bat both end with -at.", "rhyme", 3)
        ,en("Which word starts with the /m/ sound?", "moon", ["moon", "sun", "fish"], "Moon starts with /m/.", "initial-sound")
      ];
    case "english-sight-words":
      return [
        en("___ have a red bag.", "I", ["I", "He", "She"], "I have is correct; he and she use has.", "sentence-word"),
        en("You ___ my friend.", "are", ["are", "is", "am"], "Use are with you.", "cloze"),
        en("___ go to school.", "We", ["We", "He", "It"], "We go is correct.", "sentence-word"),
        en("I can ___ a bird.", "see", ["see", "sea", "seen"], "See means look and understand with your eyes.", "word-choice", 3),
        en("Look ___ the moon.", "at", ["at", "in", "on"], "Look at the moon is correct.", "cloze"),
        en("The dogs ___ small.", "are", ["are", "is", "am"], "Use are with plural dogs.", "cloze"),
        en("___ am a pupil.", "I", ["I", "You", "We"], "Use I am.", "sentence-word"),
        en("This is ___ book.", "a", ["a", "an", "and"], "Book begins with a consonant sound, so use a.", "word-choice"),
        en("We ___ to the park.", "go", ["go", "goes", "going"], "Use go with we.", "cloze"),
        en("Come ___ me.", "with", ["with", "and", "for"], "Come with me is a common phrase.", "word-choice", 3),
        en("I ___ a pen.", "have", ["have", "has", "am"], "Use have with I.", "cloze")
        ,en("They ___ happy.", "are", ["are", "is", "am"], "Use are with they.", "cloze")
      ];
    case "english-vocabulary":
      return [
        en("Which one is a fruit?", "apple", ["apple", "dog", "tree"], "An apple is a fruit.", "category-word"),
        en("Which one can fly?", "bird", ["bird", "fish", "tree"], "A bird can fly.", "context-word"),
        { prompt: "Which word means the large round object that shines in the night sky?", instruction: "Tap the correct answer.", options: ["moon", "sun", "star"], correctAnswer: "moon", explanation: "The moon is the large round object seen in the night sky.", template: "word-meaning", audioText: "Tap the correct answer.", audioLanguage: "en-US" },
        en("Which one is a drink?", "water", ["water", "book", "flower"], "Water is a drink.", "category-word")
        ,en("Which one is an animal?", "bear", ["bear", "apple", "star"], "A bear is an animal.", "category-word")
        ,{ prompt: "Which word means a tall plant with a trunk and branches?", instruction: "Tap the correct answer.", options: ["tree", "fish", "book"], correctAnswer: "tree", explanation: "A tree is a tall plant with a trunk and branches.", template: "word-meaning", audioText: "Tap the correct answer.", audioLanguage: "en-US" }
      ];
    case "english-a-an":
      return [
        en("Choose the correct phrase: ___ egg", "an egg", ["an egg", "a egg", "two egg"], "Egg begins with a vowel sound.", "article"),
        en("Choose the correct phrase: ___ pen", "a pen", ["a pen", "an pen", "two pen"], "Pen begins with a consonant sound.", "article"),
        en("Choose the correct phrase: ___ umbrella", "an umbrella", ["an umbrella", "a umbrella", "two umbrella"], "Umbrella begins with a vowel sound.", "article", 3),
        en("Choose the correct phrase: ___ bag", "a bag", ["a bag", "an bag", "two bag"], "Bag begins with a consonant sound.", "article"),
        en("Choose the correct phrase: ___ insect", "an insect", ["an insect", "a insect", "two insect"], "Insect begins with a vowel sound.", "article", 3)
        ,en("Choose the correct phrase: ___ old book", "an old book", ["an old book", "a old book", "two old book"], "Old begins with a vowel sound.", "article")
      ];
    case "english-plural":
      return [
        en("One pen, two ___.", "pens", ["pens", "pen", "books"], "Add -s to make pens.", "plural"),
        en("One bag, two ___.", "bags", ["bags", "bag", "pens"], "Add -s to make bags.", "plural"),
        en("One egg, three ___.", "eggs", ["eggs", "egg", "apples"], "Add -s to make eggs.", "plural"),
        en("One apple, two ___.", "apples", ["apples", "apple", "eggs"], "Add -s to make apples.", "plural"),
        en("One flower, four ___.", "flowers", ["flowers", "flower", "trees"], "Add -s to make flowers.", "plural", 3)
        ,en("One star, two ___.", "stars", ["stars", "star", "birds"], "Add -s to make stars.", "plural")
      ];
    case "english-sentence-order":
      return [
        en("Which sentence is correct?", "I see a bird.", ["I see a bird.", "See I a bird.", "Bird a see I."], "I see a bird uses correct word order.", "sentence-order"),
        en("Which sentence is correct?", "The sun is bright.", ["The sun is bright.", "Sun the is bright.", "Bright is the sun."], "The sun is bright is correct.", "sentence-order"),
        en("Which sentence is correct?", "We like apples.", ["We like apples.", "Like we apples.", "Apples like we."], "We like apples is correct.", "sentence-order"),
        en("Which sentence is correct?", "She can swim.", ["She can swim.", "Can swim she.", "Swim can she."], "She can swim is correct.", "sentence-order"),
        en("Which sentence is correct?", "My dog is small.", ["My dog is small.", "Dog my is small.", "Small is my dog."], "My dog is small is correct.", "sentence-order", 3)
        ,en("Which sentence is correct?", "I have a pencil.", ["I have a pencil.", "Have I a pencil.", "Pencil a have I."], "I have a pencil is correct.", "sentence-order")
        ,en("Which sentence is correct?", "The boy is riding a bike.", ["The boy is riding a bike.", "Boy the is riding a bike.", "Is riding the boy a bike."], "The boy is riding a bike uses correct word order.", "sentence-order", 3)
        ,en("Which sentence is correct?", "Mia and Tom are friends.", ["Mia and Tom are friends.", "Friends are Mia and Tom.", "Mia and Tom friends are."], "Mia and Tom are friends uses correct word order.", "sentence-order", 2)
        ,en("Which sentence is correct?", "We play football after school.", ["We play football after school.", "Play we football after school.", "After school we football play."], "We play football after school uses correct word order.", "sentence-order", 3)
        ,en("Which sentence is correct?", "There is a cat under the table.", ["There is a cat under the table.", "There a cat is under the table.", "A cat there is under the table."], "There is a cat under the table uses correct word order.", "sentence-order", 3)
        ,en("Which sentence is correct?", "My mother works at the hospital.", ["My mother works at the hospital.", "Works my mother at the hospital.", "Hospital the at works mother my."], "My mother works at the hospital uses correct word order.", "sentence-order", 2)
      ];
    case "english-reading":
      return [
        en("What colour is Ben's bag?", "blue", ["blue", "red", "green"], "The text says Ben has a blue bag.", "literal", 2, "Ben has a blue bag."),
        en("Where is the cat?", "under the table", ["under the table", "on the mat", "in the box"], "The text says the cat is under the table.", "literal", 2, "The cat sits under the table."),
        en("What does Mia see?", "a bird", ["a bird", "a cat", "a book"], "Mia opens the door, then sees a bird.", "sequence", 3, "Mia opens the door, then sees a bird."),
        en("How many books are on the desk?", "two", ["two", "three", "four"], "The text says there are two books.", "literal", 2, "There are two books on the desk."),
        en("How does Tom feel?", "happy", ["happy", "sad", "angry"], "Tom has a kite, so he feels happy.", "inference", 4, "Tom is happy because he has a kite.")
        ,en("Where does Ben read?", "under the tree", ["under the tree", "in the box", "on the moon"], "The text says Ben reads under the tree.", "literal", 2, "Ben reads under the tree.")
        ,en("Why is Sam wearing a coat?", "because it is cold", ["because it is cold", "because it is hot", "because it is raining"], "It is cold and windy, so Sam wears a coat.", "inference", 4, "It is cold and windy. Sam puts on a coat.")
        ,en("What will Mia do next?", "play football", ["play football", "read a book", "go to sleep"], "Mia picks up her football boots, so she will play football next.", "inference", 4, "Mia finishes her homework. She picks up her football boots.")
        ,en("Where is the book?", "under the bed", ["under the bed", "on the shelf", "in the bag"], "The text says the book is under the bed.", "literal", 3, "The book is not on the shelf. It is under the bed.")
        ,en("How many children are in the park?", "five", ["five", "three", "two"], "Two boys and three girls make five children.", "literal", 4, "Two boys and three girls are in the park.")
        ,en("Why does Ben smile?", "he gets a birthday card", ["he gets a birthday card", "he loses his bag", "he is hungry"], "Ben smiles because his friend gives him a birthday card.", "inference", 4, "Ben's friend gives him a birthday card. Ben smiles.")
        ,en("Which happens first?", "wash the apple", ["wash the apple", "eat the apple", "cut the apple"], "Ana washes the apple before she eats it.", "sequence", 3, "Ana washes the apple, then eats it.")
        ,read("What colour is Ben's cap?", "red", ["red", "blue", "green"], "The text says Ben has a red cap.", "literal", 2, "Ben is at the park with his dog. The wind blows his red cap under a bench. Ben looks under the bench and finds it. He puts the cap back on.")
        ,read("Where does the cap go?", "under a bench", ["under a bench", "in a tree", "on a slide"], "The wind blows the cap under a bench.", "literal", 2, "Ben is at the park with his dog. The wind blows his red cap under a bench. Ben looks under the bench and finds it. He puts the cap back on.")
        ,read("What does Ben do at the end?", "puts the cap back on", ["puts the cap back on", "feeds his dog", "goes home"], "Ben finds the cap and puts it back on.", "sequence", 3, "Ben is at the park with his dog. The wind blows his red cap under a bench. Ben looks under the bench and finds it. He puts the cap back on.")
        ,read("What does Mia hear?", "rain", ["rain", "wind", "a bell"], "Mia wakes up and hears rain.", "literal", 2, "Mia wakes up and hears rain. She puts on her yellow boots. At school, she sees a big puddle. Mia and her friend jump in it.")
        ,read("What colour are Mia's boots?", "yellow", ["yellow", "blue", "red"], "The text says Mia puts on her yellow boots.", "literal", 2, "Mia wakes up and hears rain. She puts on her yellow boots. At school, she sees a big puddle. Mia and her friend jump in it.")
        ,read("What do Mia and her friend jump in?", "a puddle", ["a puddle", "a box", "a river"], "Mia and her friend jump in a big puddle.", "literal", 2, "Mia wakes up and hears rain. She puts on her yellow boots. At school, she sees a big puddle. Mia and her friend jump in it.")
        ,read("What fruit is in Lily's lunch?", "apple", ["apple", "banana", "orange"], "Lily finds a small apple in her lunch box.", "literal", 2, "Lily opens her lunch box. She finds rice, eggs and a small apple. She eats the rice and eggs. Then she saves the apple for later.")
        ,read("What does Lily eat first?", "rice and eggs", ["rice and eggs", "apple and eggs", "a sandwich"], "Lily eats the rice and eggs before she saves the apple.", "literal", 3, "Lily opens her lunch box. She finds rice, eggs and a small apple. She eats the rice and eggs. Then she saves the apple for later.")
        ,read("Why does Lily save the apple?", "for later", ["for later", "to give to a friend", "to put in her bag"], "Lily saves the apple to eat later.", "why", 3, "Lily opens her lunch box. She finds rice, eggs and a small apple. She eats the rice and eggs. Then she saves the apple for later.")
        ,read("Where does Kim put the pot?", "near the window", ["near the window", "under the bed", "on the table"], "Kim puts the pot near the window.", "literal", 2, "Kim plants a seed in a pot. She puts the pot near the window. Every day she gives it water. After a week, a small green leaf appears.")
        ,read("What does Kim do every day?", "gives it water", ["gives it water", "reads a book", "sings a song"], "Kim gives the plant water every day.", "literal", 2, "Kim plants a seed in a pot. She puts the pot near the window. Every day she gives it water. After a week, a small green leaf appears.")
        ,read("What appears after a week?", "a small green leaf", ["a small green leaf", "a red flower", "a big tree"], "After a week, a small green leaf appears.", "sequence", 3, "Kim plants a seed in a pot. She puts the pot near the window. Every day she gives it water. After a week, a small green leaf appears.")
      ];
    case "english-reading-inference":
      return [
        read("Why will the children return to the garden?", "the tomatoes will be ready", ["the tomatoes will be ready", "the weeds will grow", "Mr Lim will read a book"], "Mr Lim says the tomatoes will be ready in two weeks.", "why", 4, "Every Friday, Class 2 visits the school garden. Ana waters the tomatoes. Ben pulls out the weeds. Their teacher, Mr Lim, says the tomatoes will be ready in two weeks. The children cannot wait to make tomato soup.", "Read the clues, then tap the best answer.")
        ,read("How do the children feel about the soup?", "excited", ["excited", "sleepy", "angry"], "The children cannot wait, so they feel excited.", "feeling", 4, "Every Friday, Class 2 visits the school garden. Ana waters the tomatoes. Ben pulls out the weeds. Their teacher, Mr Lim, says the tomatoes will be ready in two weeks. The children cannot wait to make tomato soup.", "Read the clues, then tap the best answer.")
        ,read("What will the children probably make?", "tomato soup", ["tomato soup", "apple pie", "rice"], "They talk about making tomato soup, so that is what they will probably make.", "inference", 4, "Every Friday, Class 2 visits the school garden. Ana waters the tomatoes. Ben pulls out the weeds. Their teacher, Mr Lim, says the tomatoes will be ready in two weeks. The children cannot wait to make tomato soup.", "Read the clues, then tap the best answer.")
        ,read("Why does Sam look under his bed?", "he thinks the book is there", ["he thinks the book is there", "he wants to sleep", "he is looking for his bag"], "Sam cannot find the book, so he looks in places where it might be.", "inference", 4, "Sam borrows a book about sharks from the library. At home, he cannot find it. He looks under his bed and behind the sofa. Then he remembers: the book is in his school bag. He returns it the next day.", "Read the clues, then tap the best answer.")
        ,read("How does Sam feel when he cannot find the book?", "worried", ["worried", "happy", "proud"], "Sam cannot find the library book, so he feels worried.", "feeling", 4, "Sam borrows a book about sharks from the library. At home, he cannot find it. He looks under his bed and behind the sofa. Then he remembers: the book is in his school bag. He returns it the next day.", "Read the clues, then tap the best answer.")
        ,read("What will Sam do next?", "return the book", ["return the book", "buy a new book", "hide the book"], "Sam finds the book and returns it the next day.", "sequence", 4, "Sam borrows a book about sharks from the library. At home, he cannot find it. He looks under his bed and behind the sofa. Then he remembers: the book is in his school bag. He returns it the next day.", "Read the clues, then tap the best answer.")
        ,read("Why is Mei alone at lunch?", "she is new", ["she is new", "she is angry", "she is sick"], "Mei is a new girl, so she sits alone at first.", "why", 3, "A new girl named Mei joins P2. She sits alone at lunch. Lily shares her sandwich and asks Mei to play. By the end of the day, Mei is smiling and has two new friends.", "Read the clues, then tap the best answer.")
        ,read("How does Mei feel at the end of the day?", "happy", ["happy", "sad", "tired"], "Mei is smiling and has new friends, so she feels happy.", "feeling", 4, "A new girl named Mei joins P2. She sits alone at lunch. Lily shares her sandwich and asks Mei to play. By the end of the day, Mei is smiling and has two new friends.", "Read the clues, then tap the best answer.")
        ,read("What did Lily do to help Mei?", "shared her sandwich and asked her to play", ["shared her sandwich and asked her to play", "took her bag", "told her to go home"], "Lily shares her sandwich and asks Mei to play.", "inference", 3, "A new girl named Mei joins P2. She sits alone at lunch. Lily shares her sandwich and asks Mei to play. By the end of the day, Mei is smiling and has two new friends.", "Read the clues, then tap the best answer.")
        ,read("Why do Tom and his mother put the cake on the table?", "to cool", ["to cool", "to eat it", "to hide it"], "They put the cake on the table to cool.", "why", 3, "It is Grandma's birthday. Tom and his mother bake a cake. They put it on the table to cool. When they come back, the cake has one bite missing. Their cat is licking its paw.", "Read the clues, then tap the best answer.")
        ,read("Who probably ate the cake?", "the cat", ["the cat", "Grandma", "Tom"], "The cat is licking its paw, so it probably ate the cake.", "inference", 4, "It is Grandma's birthday. Tom and his mother bake a cake. They put it on the table to cool. When they come back, the cake has one bite missing. Their cat is licking its paw.", "Read the clues, then tap the best answer.")
        ,read("How does the cake look when they come back?", "one bite is missing", ["one bite is missing", "it is whole", "it is in the oven"], "The cake has one bite missing when they come back.", "inference", 3, "It is Grandma's birthday. Tom and his mother bake a cake. They put it on the table to cool. When they come back, the cake has one bite missing. Their cat is licking its paw.", "Read the clues, then tap the best answer.")
      ];
    case "english-spelling":
      return [
        { ...en("Listen and tap the correct word.", "book", ["book", "look", "cook"], "The correct spelling is book.", "spelling"), audioText: "book", audioLanguage: "en-US", audioOnly: true },
        { ...en("Listen and tap the correct word.", "bag", ["bag", "bat", "bad"], "The correct spelling is bag.", "spelling"), audioText: "bag", audioLanguage: "en-US", audioOnly: true },
        { ...en("Listen and tap the correct word.", "pen", ["pen", "pet", "peg"], "The correct spelling is pen.", "spelling"), audioText: "pen", audioLanguage: "en-US", audioOnly: true },
        { ...en("Listen and tap the correct word.", "egg", ["egg", "leg", "beg"], "The correct spelling is egg.", "spelling"), audioText: "egg", audioLanguage: "en-US", audioOnly: true },
        { ...en("Listen and tap the correct word.", "star", ["star", "stay", "step"], "The correct spelling is star.", "spelling", 3), audioText: "star", audioLanguage: "en-US", audioOnly: true },
        { ...en("Listen and tap the correct word.", "sun", ["sun", "run", "fun"], "The correct spelling is sun.", "spelling"), audioText: "sun", audioLanguage: "en-US", audioOnly: true }
      ];
    default:
      return [];
  }
}
