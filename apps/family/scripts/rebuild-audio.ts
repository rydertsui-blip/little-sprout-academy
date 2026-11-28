import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { AUDIO_ASSETS, VOICE_LINES } from "../src/content/audioAssets";
import { GENERATED_AUDIO_ASSETS } from "../src/content/audioAssets.generated";
import { QUESTIONS } from "../src/content/catalog";
import { subjectLocale } from "../src/content/copy";
import { HANDWRITING_CHARACTERS } from "../src/content/handwriting";
import { ENGLISH_HANDWRITING_ITEMS } from "../src/content/englishHandwriting";
import { hintForQuestion, teachForQuestion } from "../src/content/hints";
import { SPEAKING_PROMPTS } from "../src/content/speaking";
import { MEMORY_FLIP_DECKS, MONSTER_STAGES, SORTING_ROUNDS, STORY_QUESTS } from "../src/content/arcade";
import { READ_ALONG_STORYBOOKS } from "../src/content/storybooks";
import { COMPANION_ACCESSORIES, PET_TOUCH_VOICES_EN, PET_TOUCH_VOICES_ZH } from "../src/companions/accessories";
import { preAnswerAudio } from "../src/lib/questionAudio";

const CJK_OR_PINYIN_RE = /[\u4e00-\u9fffāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
const PINYIN_TOKEN_RE = /[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+/g;

const DENOMINATOR_WORDS: Record<number, [string, string]> = {
  2: ["half", "halves"],
  3: ["third", "thirds"],
  4: ["quarter", "quarters"],
  5: ["fifth", "fifths"],
  6: ["sixth", "sixths"],
  7: ["seventh", "sevenths"],
  8: ["eighth", "eighths"],
  9: ["ninth", "ninths"],
  10: ["tenth", "tenths"],
  12: ["twelfth", "twelfths"],
};

const PINYIN_TO_HOMOPHONE: Record<string, string> = {
  // 23 initials
  "b": "波",
  "p": "坡",
  "m": "摸",
  "f": "佛",
  "d": "德",
  "t": "特",
  "n": "讷",
  "l": "勒",
  "g": "哥",
  "k": "科",
  "h": "喝",
  "j": "基",
  "q": "欺",
  "x": "希",
  "zh": "知",
  "ch": "吃",
  "sh": "诗",
  "r": "日",
  "z": "资",
  "c": "疵",
  "s": "思",
  "y": "医",
  "w": "屋",
  // 24 finals
  "a": "阿",
  "o": "喔",
  "e": "婀",
  "i": "衣",
  "u": "屋",
  "ü": "迂",
  "ai": "哀",
  "ei": "诶",
  "ui": "威",
  "ao": "凹",
  "ou": "欧",
  "iu": "优",
  "ie": "耶",
  "üe": "约",
  "er": "儿",
  "an": "安",
  "en": "恩",
  "in": "音",
  "un": "温",
  "ün": "晕",
  "ang": "肮",
  "eng": "鞥",
  "ing": "英",
  "ong": "嗡",
  // 16 whole syllables
  "zhi": "知",
  "chi": "吃",
  "shi": "诗",
  "ri": "日",
  "zi": "资",
  "ci": "疵",
  "si": "丝",
  "yi": "衣",
  "wu": "屋",
  "yu": "迂",
  "ye": "耶",
  "yue": "约",
  "yuan": "冤",
  "yin": "音",
  "yun": "晕",
  "ying": "英",
  // Tone-marked pinyin syllables in curriculum prompts, hints & explanations
  "ā": "阿",
  "āo": "凹",
  "ǎo": "袄",
  "āi": "哀",
  "ǒu": "偶",
  "ān": "安",
  "uǐ": "伟",
  "māo": "猫",
  "máo": "毛",
  "mǎo": "卯",
  "mào": "帽",
  "gōu": "沟",
  "gǒu": "狗",
  "gòu": "够",
  "shān": "山",
  "shán": "馋",
  "shàn": "扇",
  "shuī": "吹",
  "shuǐ": "水",
  "shuì": "睡",
  "shuí": "谁",
  "cǎo": "草",
  "shū": "书",
  "rén": "人",
  "tū": "秃",
  "tú": "图",
  "tù": "兔",
  "yǔ": "雨",
  "yuē": "约",
  "yué": "绝",
  "yuè": "月",
  "huā": "花",
  "huá": "华",
  "huà": "画",
  "huǒ": "火",
  "hǒu": "吼",
  "huò": "货",
  "mù": "木",
  "tián": "田",
  "mā": "妈",
  "má": "麻",
  "mǎ": "马",
  "mà": "骂",
  "bā": "八",
  "bá": "拔",
  "bǎ": "把",
  "bà": "爸",
  "niū": "妞",
  "niú": "牛",
  "niù": "拗",
  "niǎo": "鸟",
  "rì": "日",
  "rí": "日",
  "rǐ": "尔",
  "yú": "鱼",
  "fēi": "飞",
  "sān": "三",
  "shǒu": "手",
  "dà": "大",
  "míng": "明",
  "fēng": "风",
  "qǐng": "请",
  "xuě": "雪",
  "xuē": "薛",
  "xuè": "血",
  "kǒu": "口",
  "pǎo": "跑",
  "kāi": "开",
  "bái": "白",
  "lín": "林",
};

export function normalizeSpokenText(raw: string): { spoken: string; lang: "zh" | "en" } {
  const isZh = CJK_OR_PINYIN_RE.test(raw);
  if (isZh) {
    let text = raw.trim();

    // e.g. "山，shān" -> "山"
    text = text.replace(/^([\u4e00-\u9fff]+)[，,]\s*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$/u, "$1");

    // e.g. "“山 shān”和“手 shǒu”" -> "“山”和“手”"
    text = text.replace(/([\u4e00-\u9fff])\s+([a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+)/gu, (full, hanzi: string, py: string) => {
      const mapped = PINYIN_TO_HOMOPHONE[py.toLowerCase()];
      return mapped === hanzi ? hanzi : full;
    });

    // Replace math/blend symbols inside Chinese text
    text = text.replace(/\s*\+\s*/g, "加");
    text = text.replace(/\s*=\s*/g, "等于");

    // Replace all pinyin tokens (initials, finals, whole syllables, tone-marked syllables) with Chinese phonetic homophones
    text = text.replace(PINYIN_TOKEN_RE, (token) => PINYIN_TO_HOMOPHONE[token.toLowerCase()] ?? PINYIN_TO_HOMOPHONE[token] ?? token);

    // Replace blank underscores with a natural pause
    text = text.replace(/\s*_{2,}\s*/g, "，什么，");

    return { spoken: text, lang: "zh" };
  }

  let text = raw.trim();

  // Letter pairs like "A, a" -> "A"
  if (/^[A-Z],\s*[a-z]$/.test(text)) {
    return { spoken: text[0], lang: "en" };
  }

  // Dot / star visual counters: ●●● -> "3 dots", ★★★★★ -> "5 stars"
  text = text.replace(/●+/g, (m) => `${m.length} ${m.length === 1 ? "dot" : "dots"}`);
  text = text.replace(/★+/g, (m) => `${m.length} ${m.length === 1 ? "star" : "stars"}`);

  // Currency: $1.80 -> "1 dollar and 80 cents", $0.80 -> "80 cents", $5 -> "5 dollars"
  text = text.replace(/\$(\d+)\.(\d{2})/g, (_, dStr: string, cStr: string) => {
    const dollars = Number(dStr);
    const cents = Number(cStr);
    const dPart = dollars > 0 ? `${dollars} ${dollars === 1 ? "dollar" : "dollars"}` : "";
    const cPart = cents > 0 ? `${cents} ${cents === 1 ? "cent" : "cents"}` : "";
    if (dPart && cPart) return `${dPart} and ${cPart}`;
    return dPart || cPart || "0 dollars";
  });
  text = text.replace(/\$(\d+)(?!\.\d)/g, (_, dStr: string) => {
    const dollars = Number(dStr);
    return `${dollars} ${dollars === 1 ? "dollar" : "dollars"}`;
  });

  // Fractions: 1/4 -> "1 quarter", 3/8 -> "3 eighths"
  text = text.replace(/\b(\d+)\/(\d+)\b/g, (match, nStr: string, dStr: string) => {
    const num = Number(nStr);
    const den = Number(dStr);
    const words = DENOMINATOR_WORDS[den];
    if (!words) return match;
    return `${num} ${num === 1 ? words[0] : words[1]}`;
  });

  // Time: 10:00 -> "10 o'clock", 10:05 -> "10 oh 5", 11:25 -> "11 25"
  text = text.replace(/\b(\d{1,2}):00\b/g, "$1 o'clock");
  text = text.replace(/\b(\d{1,2}):0(\d)\b/g, "$1 oh $2");
  text = text.replace(/\b(\d{1,2}):(\d{2})\b/g, "$1 $2");

  // Measurement units
  text = text.replace(/\b(\d+)\s*cm\b/g, "$1 centimetres");
  text = text.replace(/\b(\d+)\s*kg\b/g, "$1 kilograms");
  text = text.replace(/\b(\d+)\s*m\b/g, "$1 metres");
  text = text.replace(/\b(\d+)\s*g\b/g, "$1 grams");

  // Math operators
  text = text.replace(/=\s*\?/g, "equals what?");
  text = text.replace(/\s*=\s*/g, " equals ");
  text = text.replace(/\s*×\s*/g, " times ");
  text = text.replace(/\s*÷\s*/g, " divided by ");
  text = text.replace(/\s*\+\s*/g, " plus ");
  text = text.replace(/\s*[−-]\s*(?=\d)/g, " minus ");

  // Blanks
  text = text.replace(/^_{2,}\s*/g, "Blank ");
  text = text.replace(/\s*_{2,}\s*/g, ", blank, ");
  text = text.replace(/\s+,/g, ",").replace(/\s+/g, " ").trim();

  return { spoken: text, lang: "en" };
}

function autoKeyFor(text: string): string {
  return `auto-${createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12)}`;
}

function syncGeneratedAudioMap(): Record<string, string> {
  const combined: Record<string, string> = { ...AUDIO_ASSETS };
  const generated: Record<string, string> = { ...GENERATED_AUDIO_ASSETS };
  let added = 0;

  const ensure = (text?: string | null) => {
    const trimmed = text?.trim();
    if (!trimmed) return;
    if (!combined[trimmed]) {
      const key = autoKeyFor(trimmed);
      combined[trimmed] = key;
      generated[trimmed] = key;
      added += 1;
    }
  };

  for (const line of Object.values(VOICE_LINES)) {
    ensure(line);
  }
  for (const entry of HANDWRITING_CHARACTERS) {
    ensure(entry.audioText);
    ensure(entry.introAudioText);
  }
  for (const enItem of ENGLISH_HANDWRITING_ITEMS) {
    ensure(enItem.introAudioText);
    ensure(enItem.audioText);
    ensure(enItem.word);
  }
  for (const prompt of SPEAKING_PROMPTS) {
    ensure(prompt.text);
  }
  for (const deck of MEMORY_FLIP_DECKS) {
    ensure(deck.introAudio);
    for (const pair of deck.pairs) {
      ensure(pair.leftAudio);
      ensure(pair.rightAudio);
    }
  }
  for (const round of SORTING_ROUNDS) {
    ensure(round.introAudio);
    for (const item of round.items) {
      ensure(item.audioText);
    }
  }
  for (const stage of MONSTER_STAGES) {
    ensure(stage.cravingAudio);
    ensure(stage.successAudio);
    for (const food of stage.foods) {
      ensure(food.audioText);
    }
  }
  for (const quest of STORY_QUESTS) {
    ensure(quest.introAudio);
    ensure(quest.completionAudio);
    for (const scene of quest.scenes) {
      ensure(scene.storyAudio);
    }
  }
  for (const book of READ_ALONG_STORYBOOKS) {
    ensure(book.introAudio);
    ensure(book.completionAudio);
    ensure(book.quiz.audioText);
    ensure(book.quiz.explanation);
    for (const page of book.pages) {
      for (const sentence of page.sentences) {
        ensure(sentence.audioText);
      }
      for (const kw of page.keywords) {
        ensure(kw.audioText);
      }
    }
  }
  for (const acc of COMPANION_ACCESSORIES) {
    ensure(acc.voiceZh);
    ensure(acc.voiceEn);
  }
  for (const line of PET_TOUCH_VOICES_ZH) {
    ensure(line);
  }
  for (const line of PET_TOUCH_VOICES_EN) {
    ensure(line);
  }

  for (const q of QUESTIONS) {
    ensure(preAnswerAudio(q));
    ensure(q.explanation);
    const locale = subjectLocale(q.subject);
    ensure(hintForQuestion(q, locale));
    const teach = teachForQuestion(q, locale);
    if (teach) {
      const sep = locale === "en" ? ". " : "。";
      ensure(`${teach.title}${sep}${teach.body}${teach.example ? `${sep}${teach.example}` : ""}`);
    }
    if (q.kind === "choice" || q.kind === "order") {
      ensure(q.audioText);
    } else if (q.kind === "match") {
      ensure(q.prompt);
      for (const pair of q.pairs) {
        ensure(pair.audioText);
      }
    }
  }

  if (added > 0) {
    const generatedPath = resolve(process.cwd(), "src/content/audioAssets.generated.ts");
    const lines = [
      "// Auto-generated audio asset map for expanded curriculum items",
      "export const GENERATED_AUDIO_ASSETS: Record<string, string> = {",
      ...Object.entries(generated).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)},`),
      "};",
      ""
    ];
    writeFileSync(generatedPath, lines.join("\n"), "utf8");
    console.log(`Added ${added} new entries to src/content/audioAssets.generated.ts (total generated: ${Object.keys(generated).length}).`);
  }

  return combined;
}

async function run(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const forceAll = process.argv.includes("--force");
  const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
  const onlySet = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",").filter(Boolean)) : null;
  const concurrency = onlySet ? 2 : 6;
  const allAssets = syncGeneratedAudioMap();
  const entries = Object.entries(allAssets);
  const outDir = resolve(process.cwd(), "public/assets/audio");
  mkdirSync(outDir, { recursive: true });

  // Deduplicate by asset filename
  const byAsset = new Map<string, { raw: string; spoken: string; lang: "zh" | "en" }>();
  for (const [raw, asset] of entries) {
    if (onlySet && !onlySet.has(asset)) continue;
    const outM4a = resolve(outDir, `${asset}.m4a`);
    if (!forceAll && !onlySet && existsSync(outM4a) && statSync(outM4a).size > 0) {
      continue;
    }
    if (!byAsset.has(asset)) {
      byAsset.set(asset, { raw, ...normalizeSpokenText(raw) });
    }
  }

  const tasks = [...byAsset.entries()];
  const changed = tasks.filter(([, v]) => v.raw !== v.spoken);

  if (dryRun) {
    console.log(`Total pending assets to synthesize: ${tasks.length}`);
    console.log(`Normalized spoken texts: ${changed.length}`);
    for (const [asset, v] of changed.slice(0, 40)) {
      console.log(`  [${v.lang}] ${asset}: "${v.raw}" -> "${v.spoken}"`);
    }
    return;
  }

  if (tasks.length === 0) {
    console.log("All audio assets are already synthesized and up to date.");
    return;
  }

  console.log(`Synthesizing ${tasks.length} new/missing audio files...`);
  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const tmpDir = "/tmp/little-sprout-tts";
  mkdirSync(tmpDir, { recursive: true });

  let completed = 0;
  let failed = 0;
  const failures: Array<{ asset: string; raw: string; error: string }> = [];

  async function synthesizeOne(asset: string, item: { raw: string; spoken: string; lang: "zh" | "en" }): Promise<void> {
    const voice = item.lang === "zh" ? "zh-CN-XiaoxiaoNeural" : "en-SG-LunaNeural";
    const tmpMp3 = resolve(tmpDir, `${asset}.mp3`);
    const outM4a = resolve(outDir, `${asset}.m4a`);

    for (let attempt = 1; attempt <= 4; attempt += 1) {
      try {
        const tts = new MsEdgeTTS();
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        const { audioStream } = tts.toStream(item.spoken, { rate: "-8%" });
        await new Promise<void>((resolveStream, rejectStream) => {
          const ws = createWriteStream(tmpMp3);
          audioStream.pipe(ws);
          ws.on("finish", resolveStream);
          ws.on("error", rejectStream);
          audioStream.on("error", rejectStream);
        });
        execFileSync("ffmpeg", ["-y", "-i", tmpMp3, "-c:a", "aac", "-b:a", "96k", outM4a], { stdio: "ignore" });
        if (!existsSync(outM4a) || statSync(outM4a).size === 0) {
          throw new Error("Empty m4a output");
        }
        return;
      } catch (err) {
        if (attempt === 4) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, 400 * attempt));
      }
    }
  }

  let index = 0;
  async function worker(): Promise<void> {
    while (index < tasks.length) {
      const current = tasks[index++];
      if (!current) return;
      const [asset, item] = current;
      try {
        await synthesizeOne(asset, item);
        completed += 1;
        if (completed % 50 === 0 || completed === tasks.length) {
          console.log(`Progress: ${completed}/${tasks.length} (failed: ${failed})`);
        }
      } catch (err) {
        failed += 1;
        failures.push({ asset, raw: item.raw, error: String(err) });
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  rmSync(tmpDir, { recursive: true, force: true });

  if (failures.length > 0) {
    console.error("Failed items:", JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  console.log(`Successfully synthesized ${completed} audio files.`);
}

if (process.argv[1]?.endsWith("rebuild-audio.ts") || process.argv[1]?.endsWith("rebuild-audio.mjs")) {
  void run();
}
