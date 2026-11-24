import { QUESTIONS, SKILLS, validateContentCatalog, CONTENT_VERSION } from "../apps/family/src/content/catalog";
import { getAudioAsset } from "../apps/family/src/content/audioAssets";
import { preAnswerAudio, speechRevealsAnswer } from "../apps/family/src/lib/questionAudio";
import { writeFileSync } from "node:fs";

const failures: string[] = [];
const warnings: string[] = [];
const choice = QUESTIONS.filter((q) => q.kind === "choice");
const match = QUESTIONS.filter((q) => q.kind === "match");
const audioOnly = QUESTIONS.filter((q) => q.audioOnly);
const bySubject = Object.fromEntries(["math", "mandarin", "english"].map((s) => [s, QUESTIONS.filter((q) => q.subject === s).length]));

for (const issue of validateContentCatalog()) failures.push(`catalog ${issue.code}: ${issue.message}`);
for (const q of choice) {
  const opts = q.options ?? [];
  if (!opts.includes(q.correctAnswer)) failures.push(`${q.id}: answer not in options`);
  const normalized = opts.map((o) => o.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length) failures.push(`${q.id}: duplicate option ${JSON.stringify(opts)}`);
  if (opts.length < 3) failures.push(`${q.id}: only ${opts.length} options`);
  if (!q.instruction?.trim()) failures.push(`${q.id}: missing instruction`);
  if (!q.explanation?.trim()) failures.push(`${q.id}: missing explanation`);
  if (q.subject === "math" && /[\u3400-\u9fff]/.test(JSON.stringify(q).replace(/"audioText":[^,}]*/g, ""))) warnings.push(`${q.id}: Math contains CJK`);
  if (q.subject !== "math" && q.language && q.language !== (q.subject === "mandarin" ? "zh-CN" : "en-US")) failures.push(`${q.id}: language ${q.language} for ${q.subject}`);
  if (!q.audioOnly && /listen/i.test(q.skillId) && (q.prompt.includes(q.correctAnswer) || (q.passage ?? "").includes(q.correctAnswer))) failures.push(`${q.id}: listening prompt/passage reveals ${q.correctAnswer}`);
  if (q.audioOnly && q.prompt.includes(q.correctAnswer)) failures.push(`${q.id}: audio-only prompt reveals ${q.correctAnswer}`);
}
for (const m of match) {
  if (!m.pairs?.length) failures.push(`${m.id}: no pairs`);
  if (!m.instruction?.trim() || !m.explanation?.trim()) failures.push(`${m.id}: missing copy`);
  for (const p of m.pairs ?? []) {
    if (!p.left?.trim() || !p.right?.trim()) failures.push(`${m.id}: empty pair`);
  }
}
for (const q of audioOnly) {
  if (!q.audioText) failures.push(`${q.id}: audioOnly without audioText`);
  const file = getAudioAsset(q.audioText ?? "");
  if (!file) failures.push(`${q.id}: audioOnly without asset: ${q.audioText}`);
}
let protectedAudio = 0;
for (const q of QUESTIONS) {
  if (!q.audioText) continue;
  const text = preAnswerAudio(q);
  if (!audioOnly.includes(q) && speechRevealsAnswer(q, q.audioText)) protectedAudio += 1;
  if (!audioOnly.includes(q) && speechRevealsAnswer(q, q.audioText) && text !== q.instruction) {
    failures.push(`${q.id}: preAnswer did not replace leaking audio`);
  }
  if (!audioOnly.includes(q) && speechRevealsAnswer(q, q.audioText) && speechRevealsAnswer(q, text)) {
    failures.push(`${q.id}: replacement audio still reveals answer`);
  }
}
const uniqueIds = new Set(QUESTIONS.map((q) => q.id));
if (uniqueIds.size !== QUESTIONS.length) failures.push(`duplicate question ids: ${QUESTIONS.length} vs ${uniqueIds.size}`);
const uniqueSkills = new Set(SKILLS.map((s) => s.id));
if (uniqueSkills.size !== SKILLS.length) failures.push(`duplicate skill ids`);

const report = {
  version: CONTENT_VERSION,
  questions: QUESTIONS.length,
  bySubject,
  choice: choice.length,
  match: match.length,
  audioOnly: audioOnly.length,
  protectedAudio,
  skills: SKILLS.length,
  warnings: warnings.slice(0, 30),
  warningCount: warnings.length,
  failures
};
writeFileSync("/Users/rydertsui/Desktop/幼儿学习天地/work/family-audit/all-questions-audit.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
