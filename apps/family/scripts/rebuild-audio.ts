import { execFileSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, rmSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { AUDIO_ASSETS } from "../src/content/audioAssets";

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
  "qǐng": "请",
  "fēng": "风",
};

export function normalizeSpokenText(raw: string): { spoken: string; lang: "zh" | "en" } {
  const isZh = CJK_OR_PINYIN_RE.test(raw);
  if (isZh) {
    let text = raw.trim();

    // e.g. "山，shān" -> "山"
    text = text.replace(/^([\u4e00-\u9fff]+)[，,]\s*[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+$/u, "$1");

    // e.g. "“山 shān”和“手 shǒu”的声调一样吗？" -> "“山”和“手”的声调一样吗？"
    text = text.replace(/([\u4e00-\u9fff])\s+[a-zA-Zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]+/gu, "$1");

    // Replace standalone tone-marked pinyin words like qǐng / fēng with target homophone character
    text = text.replace(PINYIN_TOKEN_RE, (token) => PINYIN_TO_HOMOPHONE[token] ?? token);

    // Replace blank underscores with a natural pause
    text = text.replace(/\s*_{2,}\s*/g, "……");

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

async function run(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
  const onlySet = onlyArg ? new Set(onlyArg.slice("--only=".length).split(",").filter(Boolean)) : null;
  const concurrency = onlySet ? 2 : 6;
  const entries = Object.entries(AUDIO_ASSETS);

  // Deduplicate by asset filename
  const byAsset = new Map<string, { raw: string; spoken: string; lang: "zh" | "en" }>();
  for (const [raw, asset] of entries) {
    if (onlySet && !onlySet.has(asset)) continue;
    if (!byAsset.has(asset)) {
      byAsset.set(asset, { raw, ...normalizeSpokenText(raw) });
    }
  }

  const tasks = [...byAsset.entries()];
  const changed = tasks.filter(([, v]) => v.raw !== v.spoken);

  if (dryRun) {
    console.log(`Total unique assets: ${tasks.length}`);
    console.log(`Normalized spoken texts: ${changed.length}`);
    for (const [asset, v] of changed.slice(0, 40)) {
      console.log(`  [${v.lang}] ${asset}: "${v.raw}" -> "${v.spoken}"`);
    }
    return;
  }

  const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
  const outDir = resolve(process.cwd(), "public/assets/audio");
  const tmpDir = "/tmp/little-sprout-tts";
  mkdirSync(outDir, { recursive: true });
  mkdirSync(tmpDir, { recursive: true });

  let completed = 0;
  let failed = 0;
  const failures: Array<{ asset: string; raw: string; error: string }> = [];

  async function synthesizeOne(asset: string, item: { raw: string; spoken: string; lang: "zh" | "en" }): Promise<void> {
    const voice = item.lang === "zh" ? "zh-CN-XiaoxiaoNeural" : "en-SG-LunaNeural";
    const tmpMp3 = resolve(tmpDir, `${asset}.mp3`);
    const outM4a = resolve(outDir, `${asset}.m4a`);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
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
        if (attempt === 3) {
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
        if (completed % 100 === 0 || completed === tasks.length) {
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
  console.log(`Successfully rebuilt all ${completed} audio files.`);
}

if (process.argv[1]?.endsWith("rebuild-audio.ts")) {
  void run();
}
