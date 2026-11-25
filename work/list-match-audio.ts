import { QUESTIONS } from "../apps/family/src/content/catalog";
import { AUDIO_ASSETS } from "../apps/family/src/content/audioAssets";
const rows: any[] = [];
for (const q of QUESTIONS) {
  if (q.kind !== "match") continue;
  for (const pair of q.pairs) {
    if (pair.audioText && !AUDIO_ASSETS[pair.audioText]) {
      rows.push({ questionId: q.id, subject: q.subject, skillId: q.skillId, pairId: pair.id, left: pair.left, right: pair.right, text: pair.audioText, language: pair.audioLanguage ?? q.audioLanguage ?? (q.subject === "mandarin" ? "zh-CN" : "en-US") });
    }
  }
}
console.log(JSON.stringify(rows, null, 2));
