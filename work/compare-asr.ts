import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const requireApp = createRequire("/Users/rydertsui/Desktop/幼儿学习天地/apps/family/package.json");
const { pinyin } = requireApp("pinyin-pro") as { pinyin: (value: string, options: { toneType: string; type: string }) => string[] };

type Row = { text: string; key: string; lang: "zh" | "en" };
const root = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.resolve(root, "work/family-audit/audio-manifest.json"), "utf8")) as { rows: Row[] };
const transcriptDir = "/tmp/family-asr/txt";

function normalizeEnglish(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}
function normalizeChinese(value: string): string[] {
  const chars = [...value.normalize("NFKC")].filter((char) => !/[，。！？、；：,.!?;:\s“”‘’（）()\-—–]/.test(char));
  if (!chars.length) return [];
  return pinyin(chars.join(""), { toneType: "none", type: "array" }).map((item) => item.replace(/\s+/g, ""));
}
function levenshtein(a: string[], b: string[]): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => Array.from({ length: a.length + 1 }, (_, i) => i === 0 ? j : j === 0 ? i : 0));
  for (let j = 1; j <= b.length; j++) for (let i = 1; i <= a.length; i++) {
    dp[j][i] = Math.min(dp[j - 1][i] + 1, dp[j][i - 1] + 1, dp[j - 1][i - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return dp[b.length][a.length];
}
function similarity(expected: string[], heard: string[]): number {
  if (!expected.length && !heard.length) return 1;
  return 1 - levenshtein(expected, heard) / Math.max(expected.length, heard.length, 1);
}

const rows = manifest.rows.map((row) => {
  const transcript = fs.readFileSync(path.resolve(transcriptDir, `${row.key}.txt`), "utf8").replace(/^\uFEFF/, "").trim();
  const expectedTokens = row.lang === "zh" ? normalizeChinese(row.text) : normalizeEnglish(row.text);
  const heardTokens = row.lang === "zh" ? normalizeChinese(transcript) : normalizeEnglish(transcript);
  const score = similarity(expectedTokens, heardTokens);
  return { ...row, transcript, expectedTokens, heardTokens, score: Number(score.toFixed(3)) };
});
rows.sort((a, b) => a.score - b.score);
const summary = {
  total: rows.length,
  exact: rows.filter((row) => row.score === 1).length,
  under095: rows.filter((row) => row.score < 0.95).length,
  under080: rows.filter((row) => row.score < 0.8).length,
  under050: rows.filter((row) => row.score < 0.5).length
};
fs.writeFileSync(path.resolve(root, "work/family-audit/audio-asr-audit.json"), JSON.stringify({ summary, rows }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log("--- lowest 50 ---");
for (const row of rows.slice(0, 50)) {
  console.log(JSON.stringify({ key: row.key, score: row.score, expected: row.text, heard: row.transcript }));
}
