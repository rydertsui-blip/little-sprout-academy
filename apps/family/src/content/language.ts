import type { ChoiceQuestion, Skill, Subject } from "../lib/types";

function orderedOptions(answer: string, options: string[]): string[] {
  const unique = new Set([answer, ...options]);
  return Array.from(unique).slice(0, 3);
}

function makeLanguageQuestion(
  skill: Skill,
  index: number,
  input: Pick<ChoiceQuestion, "prompt" | "instruction" | "options" | "correctAnswer" | "explanation" | "template"> & Partial<ChoiceQuestion>
): ChoiceQuestion {
  return {
    id: `q-${skill.id}-${index + 1}`,
    subject: skill.subject,
    skillId: skill.id,
    kind: "choice",
    difficulty: index < 2 ? 1 : index < 4 ? 2 : 3,
    diagnostic: false,
    reviewStatus: "verified",
    ...input,
    options: orderedOptions(input.correctAnswer, input.options)
  };
}

function buildMandarinQuestions(skill: Skill): ChoiceQuestion[] {
  const build = (rows: Array<Pick<ChoiceQuestion, "prompt" | "instruction" | "options" | "correctAnswer" | "explanation" | "template"> & Partial<ChoiceQuestion>>) => rows.map((row, index) => makeLanguageQuestion(skill, index, row));
  switch (skill.id) {
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
        { prompt: "“猫” (māo) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第一声", options: ["第一声", "第二声", "第三声"], explanation: "māo 的声调记号是一声。", template: "tone", displayCharacter: "猫", audioText: "猫", audioLanguage: "zh-CN" },
        { prompt: "“人” (rén) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第二声", options: ["第二声", "第三声", "第四声"], explanation: "rén 的声调记号是二声。", template: "tone", displayCharacter: "人", audioText: "人", audioLanguage: "zh-CN" },
        { prompt: "“狗” (gǒu) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第三声", options: ["第一声", "第三声", "第四声"], explanation: "gǒu 的声调记号是三声。", template: "tone", displayCharacter: "狗", audioText: "狗", audioLanguage: "zh-CN" },
        { prompt: "“兔” (tù) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第四声", options: ["第二声", "第三声", "第四声"], explanation: "tù 的声调记号是四声。", template: "tone", displayCharacter: "兔", audioText: "兔", audioLanguage: "zh-CN" },
        { prompt: "“雨” (yǔ) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第三声", options: ["第二声", "第三声", "第四声"], explanation: "yǔ 的声调记号是三声。", template: "tone", displayCharacter: "雨", audioText: "雨", audioLanguage: "zh-CN" },
        { prompt: "“月” (yuè) 是第几声？", instruction: "听一听，选声调。", correctAnswer: "第四声", options: ["第一声", "第二声", "第四声"], explanation: "yuè 的声调记号是四声。", template: "tone", displayCharacter: "月", audioText: "月", audioLanguage: "zh-CN" }
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
        { prompt: "哪一个字是“water”？", instruction: "选择正确的汉字。", correctAnswer: "水", options: ["水", "火", "木"], explanation: "water 对应的汉字是“水”。", template: "meaning-character", audioText: "水", audioLanguage: "zh-CN" },
        { prompt: "哪一个字是“sun”？", instruction: "选择正确的汉字。", correctAnswer: "日", options: ["日", "月", "山"], explanation: "sun 对应的汉字是“日”。", template: "meaning-character", audioText: "日", audioLanguage: "zh-CN" },
        { prompt: "哪一个字是“moon”？", instruction: "选择正确的汉字。", correctAnswer: "月", options: ["月", "日", "雨"], explanation: "moon 对应的汉字是“月”。", template: "meaning-character", audioText: "月", audioLanguage: "zh-CN" },
        { prompt: "哪一个字是“mountain”？", instruction: "选择正确的汉字。", correctAnswer: "山", options: ["山", "水", "田"], explanation: "mountain 对应的汉字是“山”。", template: "meaning-character", audioText: "山", audioLanguage: "zh-CN" },
        { prompt: "哪一个字是“fire”？", instruction: "选择正确的汉字。", correctAnswer: "火", options: ["火", "木", "水"], explanation: "fire 对应的汉字是“火”。", template: "meaning-character", audioText: "火", audioLanguage: "zh-CN" },
        { prompt: "哪一个字是“tree”？", instruction: "选择正确的汉字。", correctAnswer: "木", options: ["木", "火", "口"], explanation: "tree 对应的汉字是“木”。", template: "meaning-character", audioText: "木", audioLanguage: "zh-CN" }
      ]);
    case "mandarin-vocabulary":
      return build([
        { prompt: "“月亮”指的是什么？", instruction: "选择正确的意思。", correctAnswer: "the moon", options: ["the moon", "the sun", "a star"], explanation: "“月亮”就是 the moon。", template: "meaning", audioText: "月亮", audioLanguage: "zh-CN" },
        { prompt: "“喝水”是在做什么？", instruction: "选择正确的动作。", correctAnswer: "drink water", options: ["drink water", "eat rice", "wash hands"], explanation: "“喝水”是 drink water。", template: "meaning", audioText: "喝水", audioLanguage: "zh-CN" },
        { prompt: "“小鸟”指的是哪一种动物？", instruction: "选择正确的意思。", correctAnswer: "bird", options: ["bird", "rabbit", "cat"], explanation: "“小鸟”是 bird。", template: "meaning", audioText: "小鸟", audioLanguage: "zh-CN" },
        { prompt: "“花朵”指的是什么？", instruction: "选择正确的意思。", correctAnswer: "flower", options: ["flower", "tree", "grass"], explanation: "“花朵”是 flower。", template: "meaning", audioText: "花朵", audioLanguage: "zh-CN" },
        { prompt: "“足球”是什么？", instruction: "选择正确的意思。", correctAnswer: "football", options: ["football", "basketball", "a shoe"], explanation: "“足球”是 football。", template: "meaning", audioText: "足球", audioLanguage: "zh-CN" },
        { prompt: "“高山”指的是什么？", instruction: "选择正确的意思。", correctAnswer: "a high mountain", options: ["a high mountain", "a river", "a house"], explanation: "“高山”就是 a high mountain。", template: "meaning", audioText: "高山", audioLanguage: "zh-CN" }
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
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "我喜欢小猫。", options: ["我喜欢小猫。", "小猫喜欢我。", "喜欢我小猫。"], explanation: "“我喜欢小猫。”语序完整自然。", template: "sentence-order", audioText: "我喜欢小猫。", audioLanguage: "zh-CN" },
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "弟弟去学校。", options: ["弟弟去学校。", "去弟弟学校。", "学校去弟弟。"], explanation: "“弟弟去学校。”语序正确。", template: "sentence-order", audioText: "弟弟去学校。", audioLanguage: "zh-CN" },
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "妈妈在厨房。", options: ["妈妈在厨房。", "在妈妈厨房。", "厨房妈妈在。"], explanation: "“妈妈在厨房。”语序正确。", template: "sentence-order", audioText: "妈妈在厨房。", audioLanguage: "zh-CN" },
        { prompt: "哪一句是正确的？", instruction: "选择完整、自然的句子。", correctAnswer: "小鸟飞在天空。", options: ["小鸟飞在天空。", "天空飞在小鸟。", "飞小鸟在天空。"], explanation: "“小鸟飞在天空。”语序自然。", template: "sentence-order", audioText: "小鸟飞在天空。", audioLanguage: "zh-CN" },
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
    case "english-letters":
      return build([
        { prompt: "Which letter starts the word “apple”?", instruction: "Tap the beginning letter.", correctAnswer: "A", options: ["A", "B", "P"], explanation: "Apple starts with A.", template: "beginning-letter", audioText: "apple", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “bear”?", instruction: "Tap the beginning letter.", correctAnswer: "B", options: ["B", "D", "R"], explanation: "Bear starts with B.", template: "beginning-letter", audioText: "bear", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “cat”?", instruction: "Tap the beginning letter.", correctAnswer: "C", options: ["C", "K", "T"], explanation: "Cat starts with C.", template: "beginning-letter", audioText: "cat", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “dog”?", instruction: "Tap the beginning letter.", correctAnswer: "D", options: ["D", "B", "G"], explanation: "Dog starts with D.", template: "beginning-letter", audioText: "dog", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “fish”?", instruction: "Tap the beginning letter.", correctAnswer: "F", options: ["F", "S", "H"], explanation: "Fish starts with F.", template: "beginning-letter", audioText: "fish", audioLanguage: "en-US" },
        { prompt: "Which letter starts the word “sun”?", instruction: "Tap the beginning letter.", correctAnswer: "S", options: ["S", "N", "U"], explanation: "Sun starts with S.", template: "beginning-letter", audioText: "sun", audioLanguage: "en-US" }
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
        { prompt: "Choose the correct phrase: ___ apple", instruction: "Tap a or an.", correctAnswer: "an apple", options: ["an apple", "a apple", "the apple"], explanation: "Apple begins with a vowel sound, so use an.", template: "article", audioText: "an apple", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ cat", instruction: "Tap a or an.", correctAnswer: "a cat", options: ["a cat", "an cat", "the cat"], explanation: "Cat begins with a consonant sound, so use a.", template: "article", audioText: "a cat", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ elephant", instruction: "Tap a or an.", correctAnswer: "an elephant", options: ["an elephant", "a elephant", "the elephant"], explanation: "Elephant begins with a vowel sound, so use an.", template: "article", audioText: "an elephant", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ orange", instruction: "Tap a or an.", correctAnswer: "an orange", options: ["an orange", "a orange", "the orange"], explanation: "Orange begins with a vowel sound, so use an.", template: "article", audioText: "an orange", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ book", instruction: "Tap a or an.", correctAnswer: "a book", options: ["a book", "an book", "the book"], explanation: "Book begins with a consonant sound, so use a.", template: "article", audioText: "a book", audioLanguage: "en-US" },
        { prompt: "Choose the correct phrase: ___ dog", instruction: "Tap a or an.", correctAnswer: "a dog", options: ["a dog", "an dog", "the dog"], explanation: "Dog begins with a consonant sound, so use a.", template: "article", audioText: "a dog", audioLanguage: "en-US" }
      ]);
    case "english-plural":
      return build([
        { prompt: "One cat, two ___.", instruction: "Choose the plural word.", correctAnswer: "cats", options: ["cats", "cat", "catss"], explanation: "Add -s to make cats.", template: "plural", audioText: "one cat, two cats", audioLanguage: "en-US" },
        { prompt: "One dog, two ___.", instruction: "Choose the plural word.", correctAnswer: "dogs", options: ["dogs", "dog", "doges"], explanation: "Add -s to make dogs.", template: "plural", audioText: "one dog, two dogs", audioLanguage: "en-US" },
        { prompt: "One book, three ___.", instruction: "Choose the plural word.", correctAnswer: "books", options: ["books", "book", "bookes"], explanation: "Add -s to make books.", template: "plural", audioText: "one book, three books", audioLanguage: "en-US" },
        { prompt: "One star, four ___.", instruction: "Choose the plural word.", correctAnswer: "stars", options: ["stars", "star", "starss"], explanation: "Add -s to make stars.", template: "plural", audioText: "one star, four stars", audioLanguage: "en-US" },
        { prompt: "One tree, five ___.", instruction: "Choose the plural word.", correctAnswer: "trees", options: ["trees", "tree", "treees"], explanation: "Add -s to make trees.", template: "plural", audioText: "one tree, five trees", audioLanguage: "en-US" },
        { prompt: "One bird, six ___.", instruction: "Choose the plural word.", correctAnswer: "birds", options: ["birds", "bird", "birdes"], explanation: "Add -s to make birds.", template: "plural", audioText: "one bird, six birds", audioLanguage: "en-US" }
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
        { prompt: "What color is the ball?", instruction: "Read and choose the answer.", correctAnswer: "red", options: ["red", "blue", "green"], explanation: "The text says Tom has a red ball.", template: "literal", passage: "Tom has a red ball.", audioText: "Tom has a red ball.", audioLanguage: "en-US" },
        { prompt: "Where is the cat?", instruction: "Read and choose the answer.", correctAnswer: "on the mat", options: ["on the mat", "in the box", "under the tree"], explanation: "The text says the cat is on the mat.", template: "literal", passage: "The cat is on the mat.", audioText: "The cat is on the mat.", audioLanguage: "en-US" },
        { prompt: "What does Mia like?", instruction: "Read and choose the answer.", correctAnswer: "apples", options: ["apples", "fish", "books"], explanation: "The text says Mia likes apples.", template: "literal", passage: "Mia likes apples.", audioText: "Mia likes apples.", audioLanguage: "en-US" },
        { prompt: "How many stars are there?", instruction: "Read and choose the answer.", correctAnswer: "three", options: ["three", "two", "four"], explanation: "The text says there are three stars.", template: "literal", passage: "There are three stars in the sky.", audioText: "There are three stars in the sky.", audioLanguage: "en-US" },
        { prompt: "What is Ben doing?", instruction: "Read and choose the answer.", correctAnswer: "reading", options: ["reading", "sleeping", "running"], explanation: "The text says Ben is reading.", template: "literal", passage: "Ben is reading a book.", audioText: "Ben is reading a book.", audioLanguage: "en-US" },
        { prompt: "Who has a kite?", instruction: "Read and choose the answer.", correctAnswer: "Lily", options: ["Lily", "Tom", "Ben"], explanation: "The text says Lily has a kite.", template: "literal", passage: "Lily has a kite.", audioText: "Lily has a kite.", audioLanguage: "en-US" }
      ]);
    case "english-spelling":
      return build([
        { prompt: "Which spelling is correct?", instruction: "Tap the correctly spelled word.", correctAnswer: "apple", options: ["apple", "aple", "appel"], explanation: "The correct spelling is apple.", template: "spelling", audioText: "apple", audioLanguage: "en-US" },
        { prompt: "Which spelling is correct?", instruction: "Tap the correctly spelled word.", correctAnswer: "bear", options: ["bear", "bere", "baar"], explanation: "The correct spelling is bear.", template: "spelling", audioText: "bear", audioLanguage: "en-US" },
        { prompt: "Which spelling is correct?", instruction: "Tap the correctly spelled word.", correctAnswer: "fish", options: ["fish", "fihs", "fih"], explanation: "The correct spelling is fish.", template: "spelling", audioText: "fish", audioLanguage: "en-US" },
        { prompt: "Which spelling is correct?", instruction: "Tap the correctly spelled word.", correctAnswer: "moon", options: ["moon", "mune", "mone"], explanation: "The correct spelling is moon.", template: "spelling", audioText: "moon", audioLanguage: "en-US" },
        { prompt: "Which spelling is correct?", instruction: "Tap the correctly spelled word.", correctAnswer: "tree", options: ["tree", "trea", "tre"], explanation: "The correct spelling is tree.", template: "spelling", audioText: "tree", audioLanguage: "en-US" },
        { prompt: "Which spelling is correct?", instruction: "Tap the correctly spelled word.", correctAnswer: "water", options: ["water", "watter", "wader"], explanation: "The correct spelling is water.", template: "spelling", audioText: "water", audioLanguage: "en-US" }
      ]);
    default:
      return [];
  }
}

export function buildLanguageQuestions(skill: Skill): ChoiceQuestion[] {
  if (skill.subject === "mandarin") return buildMandarinQuestions(skill);
  if (skill.subject === "english") return buildEnglishQuestions(skill);
  return [];
}
