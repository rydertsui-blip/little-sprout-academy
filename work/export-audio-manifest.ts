import fs from "node:fs";
import path from "node:path";
import { AUDIO_ASSETS } from "../apps/family/src/content/audioAssets";
const rows = Object.entries(AUDIO_ASSETS).map(([text, key]) => ({
  text,
  key,
  lang: /[\u3400-\u9fff]/.test(text) ? "zh" : "en"
}));
const seen = new Map<string, string>();
for (const row of rows) {
  if (seen.has(row.key)) throw new Error(`duplicate audio key ${row.key}: ${seen.get(row.key)} / ${row.text}`);
  seen.set(row.key, row.text);
}
const out = { generatedAt: new Date().toISOString(), rows };
fs.writeFileSync(path.resolve(import.meta.dirname, "family-audit/audio-manifest.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ total: rows.length, zh: rows.filter((r) => r.lang === "zh").length, en: rows.filter((r) => r.lang === "en").length }, null, 2));
