import fs from "node:fs";
import path from "node:path";
import { QUESTIONS, SKILLS, CONTENT_PACK, CONTENT_VERSION } from "../apps/family/src/content/catalog";
import { AUDIO_ASSETS } from "../apps/family/src/content/audioAssets";
import { SPEAKING_PROMPTS } from "../apps/family/src/content/speaking";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGE_DIR = path.join(ROOT, "apps/family/public/assets/images");
const AUDIO_DIR = path.join(ROOT, "apps/family/public/assets/audio");
const audioFiles = new Set(fs.readdirSync(AUDIO_DIR).filter((f) => f.endsWith(".m4a")));
const imageFiles = new Set(fs.readdirSync(IMAGE_DIR).filter((f) => f.endsWith(".png")));
const historyIds = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "apps/family/src/content/question-id-history.json"), "utf8")));
const failures: Array<Record<string, unknown>> = [];
const warnings: Array<Record<string, unknown>> = [];
const counts = {
  questions: QUESTIONS.length,
  choice: 0,
  match: 0,
  bySubject: {} as Record<string, number>,
  byGrade: {} as Record<string, number>,
  byAuditLanguage: {} as Record<string, number>,
  byAuditPedagogy: {} as Record<string, number>,
  audioKeys: Object.keys(AUDIO_ASSETS).length,
  audioFiles: audioFiles.size,
  imageFiles: imageFiles.size
};
const ids = new Set<string>();
const prompts = new Map<string, string[]>();
const audioKeysUsed = new Set<string>();
const answersByPosition: Record<number, number> = { 0: 0, 1: 0, 2: 0 };

function fail(kind: string, question: any, detail: string) {
  failures.push({ kind, id: question?.id, subject: question?.subject, skillId: question?.skillId, detail });
}
function warn(kind: string, question: any, detail: string) {
  warnings.push({ kind, id: question?.id, subject: question?.subject, skillId: question?.skillId, detail });
}
function hasChinese(text: string) { return /[\u3400-\u9fff]/.test(text); }
function hasLatin(text: string) { return /[A-Za-z]/.test(text); }
function numeric(text: string): number | null {
  const value = text.replace(/[$,]/g, "").trim();
  return /^-?\d+(?:\.\d+)?$/.test(value) ? Number(value) : null;
}
function simpleMath(prompt: string): number | null {
  const sum = prompt.match(/(\d+)\s*\+\s*(\d+)\s*\+\s*(\d+)\s*=\s*[?？]/i);
  if (sum) return Number(sum[1]) + Number(sum[2]) + Number(sum[3]);
  const match = prompt.match(/(\d+)\s*([+−\-×x*÷/])\s*(\d+)\s*=\s*[?？]/i);
  if (!match) return null;
  const a = Number(match[1]);
  const b = Number(match[3]);
  switch (match[2]) {
    case "+": return a + b;
    case "-": case "−": return a - b;
    case "×": case "x": case "X": case "*": return a * b;
    case "÷": case "/": return b === 0 ? null : a / b;
  }
  return null;
}

for (const skill of SKILLS) {
  counts.byGrade[skill.gradeBand] = (counts.byGrade[skill.gradeBand] ?? 0) + 1;
}
for (const question of QUESTIONS) {
  counts.bySubject[question.subject] = (counts.bySubject[question.subject] ?? 0) + 1;
  counts.byAuditLanguage[question.audit.humanLanguageReview] = (counts.byAuditLanguage[question.audit.humanLanguageReview] ?? 0) + 1;
  counts.byAuditPedagogy[question.audit.humanPedagogyReview] = (counts.byAuditPedagogy[question.audit.humanPedagogyReview] ?? 0) + 1;
  if (!question.id || !question.id.startsWith("q-")) fail("bad-id", question, `bad id ${question.id}`);
  if (ids.has(question.id)) fail("duplicate-id", question, "duplicate question id");
  ids.add(question.id);
  if (!historyIds.has(question.id)) fail("id-not-in-history", question, "question id absent from published id snapshot");
  const skill = SKILLS.find((item) => item.id === question.skillId);
  if (!skill) fail("missing-skill", question, `unknown skill ${question.skillId}`);
  else if (skill.subject !== question.subject) fail("skill-subject-mismatch", question, `${skill.subject} != ${question.subject}`);
  if (!question.prompt?.trim()) fail("empty-prompt", question, "empty prompt");
  if (!question.explanation?.trim()) fail("empty-explanation", question, "empty explanation");
  if (!question.instruction?.trim()) fail("empty-instruction", question, "empty instruction");
  if (prompts.has(question.prompt)) prompts.get(question.prompt)!.push(question.id);
  else prompts.set(question.prompt, [question.id]);

  // Language separation: math and English are English; Mandarin is Chinese.
  const bilingualEnglishGloss = question.subject === "english" && question.kind === "match" && ["match-pronoun", "match-word-picture", "match-spelling-meaning"].includes(question.template);
  if (question.subject === "math" || (question.subject === "english" && !bilingualEnglishGloss)) {
    if (hasChinese(question.prompt) || hasChinese(question.explanation) || hasChinese(question.instruction)) {
      fail("language-leak", question, "Chinese characters in an English/math question");
    }
  }
  if (question.subject === "mandarin") {
    if (!hasChinese(question.prompt)) fail("mandarin-no-chinese", question, "Mandarin question prompt has no Chinese characters");
    if (hasLatin(question.prompt) && /[A-Za-z]{3,}/.test(question.prompt) && !/[\u3400-\u9fff]/.test(question.explanation)) {
      warn("mandarin-latin-heavy", question, "Mandarin prompt contains a long Latin sequence");
    }
  }

  if (question.kind === "choice") {
    counts.choice++;
    const options = question.options;
    if (!Array.isArray(options) || options.length !== 3) fail("choice-option-count", question, `expected 3 options, got ${options?.length}`);
    else {
      if (new Set(options).size !== options.length) fail("duplicate-options", question, "duplicate option text");
      if (!options.includes(question.correctAnswer)) fail("answer-not-in-options", question, `correct ${JSON.stringify(question.correctAnswer)} not in ${JSON.stringify(options)}`);
      const index = options.indexOf(question.correctAnswer);
      if (index >= 0) answersByPosition[index]++;
      if (options.some((option) => !option?.trim())) fail("empty-option", question, "empty option");
      if (options.some((option) => option === question.prompt)) fail("option-equals-prompt", question, "option repeats prompt");
    }
    const expected = simpleMath(question.prompt);
    const actual = numeric(question.correctAnswer);
    if (expected !== null && actual !== null && expected !== actual) fail("math-answer-mismatch", question, `${question.prompt} expected ${expected}, got ${actual}`);
    if (question.subject === "math" && /^(What is|Which|How many|Order|Count|A |There |Ben |Lina |A shop|A bus|A farmer|A book|A toy|A pencil|A tray)/.test(question.prompt) && actual === null) {
      // Non-numeric math answers are allowed for shapes/units/patterns; no failure.
    }
  } else {
    counts.match++;
    if (!Array.isArray(question.pairs) || question.pairs.length !== 3) fail("match-pair-count", question, `expected 3 pairs, got ${question.pairs?.length}`);
    else {
      for (const pair of question.pairs) {
        if (!pair.id || !pair.left?.trim() || !pair.right?.trim()) fail("match-empty-pair", question, "empty matching pair");
        if (pair.audioText) {
          audioKeysUsed.add(pair.audioText);
          if (!AUDIO_ASSETS[pair.audioText]) fail("match-audio-missing", question, `no audio for pair ${JSON.stringify(pair.audioText)}`);
        }
      }
      if (new Set(question.pairs.map((pair) => pair.left)).size !== 3) fail("match-duplicate-left", question, "duplicate left labels");
      if (new Set(question.pairs.map((pair) => pair.right)).size !== 3) fail("match-duplicate-right", question, "duplicate right labels");
    }
  }

  const audioText = question.audioText ?? question.prompt;
  if (audioText) {
    audioKeysUsed.add(audioText);
    if (!AUDIO_ASSETS[audioText]) fail("audio-mapping-missing", question, `no audio mapping for ${JSON.stringify(audioText.slice(0, 80))}`);
  }
  if (question.image && !imageFiles.has(`${question.image}.png`)) fail("image-missing", question, `missing image ${question.image}.png`);
  if (question.optionImages) {
    for (const [option, image] of Object.entries(question.optionImages)) {
      if (!imageFiles.has(`${image}.png`)) fail("option-image-missing", question, `missing option image ${image}.png for ${option}`);
    }
  }
}

for (const [prompt, questionIds] of prompts) {
  if (questionIds.length > 1) warn("duplicate-prompt", { id: questionIds[0] }, `${questionIds.length} questions share prompt: ${prompt.slice(0, 100)}`);
}
for (const [text, key] of Object.entries(AUDIO_ASSETS)) {
  if (!audioFiles.has(`${key}.m4a`)) fail("audio-file-missing", null, `map ${key} -> ${text.slice(0, 80)} has no m4a`);
}
for (const prompt of SPEAKING_PROMPTS) {
  if (!AUDIO_ASSETS[prompt.text]) fail("speaking-audio-missing", null, `speaking prompt lacks audio: ${prompt.text}`);
}
for (const file of audioFiles) {
  const base = file.replace(/\.m4a$/, "");
  if (!Object.values(AUDIO_ASSETS).includes(base)) warn("audio-file-unmapped", null, `audio file ${file} not referenced by AUDIO_ASSETS`);
}

const summary = {
  contentVersion: CONTENT_VERSION,
  contentPack: CONTENT_PACK,
  counts: { ...counts, promptsUnique: prompts.size, answerPositions: answersByPosition },
  failures,
  warnings,
  failureCount: failures.length,
  warningCount: warnings.length
};
fs.mkdirSync(path.join(ROOT, "work/family-audit"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "work/family-audit/content-self-audit.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, failures: failures.slice(0, 30), warnings: warnings.slice(0, 30) }, null, 2));
