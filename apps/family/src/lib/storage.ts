import { z } from "zod";
import { SKILLS } from "../content/catalog";
import { createSkillEvidence } from "../engine/bkt";
import { createEvidenceDiversity } from "../engine/bkt";
import { createRewardState } from "../rewards/rewardState";
import { COMPANIONS } from "../companions/companions";
import { levelDateKey, K2_SKILL_IDS } from "./levels";
import type { GrowthRewardState, HouseholdState, SkillEvidence } from "./types";

const STORAGE_KEY = "little-sprout-family-v1";
const ENCRYPTED_FORMAT = "little-sprout-secure-v1";

const subjectSchema = z.enum(["math", "mandarin", "english"]);
const levelSchema = z.enum(["K2", "P1", "P2"]);
const diversitySchema = z.object({
  templateFamilies: z.record(z.string(), z.number().int().nonnegative()),
  responseModes: z.object({
    "tap-choice": z.number().int().nonnegative(),
    "tap-match": z.number().int().nonnegative(),
    "tap-order": z.number().int().nonnegative(),
    "voice-practice": z.number().int().nonnegative()
  }),
  transferCorrect: z.number().int().nonnegative(),
  farTransferCorrect: z.number().int().nonnegative(),
  delayedIndependentCorrect: z.number().int().nonnegative(),
  contextKeys: z.array(z.string()),
  lastIndependentWrongAt: z.string().nullable()
});
const evidenceSchema = z.object({
  skillId: z.string(),
  pKnown: z.number(),
  pInit: z.number(),
  pGuess: z.number(),
  pSlip: z.number(),
  pTransit: z.number(),
  nEff: z.number(),
  independentCorrect: z.number(),
  correctWithHint: z.number(),
  templates: z.array(z.string()),
  questionIds: z.array(z.string()),
  lastAttemptAt: z.string().nullable(),
  firstEvidenceAt: z.string().nullable(),
  lastStageAdvanceAt: z.string().nullable(),
  delayedEvidence: z.boolean(),
  reviewStage: z.number(),
  dueAt: z.string().nullable(),
  wrongStreak: z.number(),
  diversity: diversitySchema.default(createEvidenceDiversity())
});
const attemptSchema = z.object({
  id: z.string(),
  childId: z.string(),
  questionId: z.string(),
  skillId: z.string(),
  subject: subjectSchema,
  correct: z.boolean(),
  hintUsed: z.boolean(),
  createdAt: z.string(),
  sessionId: z.string()
});
const sessionSummarySchema = z.object({
  skillId: z.string(),
  title: z.string(),
  level: z.enum(["unknown", "developing", "likely-secure", "secure"]),
  pKnown: z.number(),
  evidenceCount: z.number()
});
const dailyPlanSchema = z.object({
  dateKey: z.string(),
  timezone: z.literal("Asia/Singapore"),
  subject: subjectSchema,
  questionCount: z.number().int().positive(),
  estimatedMinutes: z.number().int().positive(),
  items: z.array(z.object({
    kind: z.enum(["review", "current", "transfer"]),
    skillId: z.string(),
    questionId: z.string(),
    template: z.string()
  }))
});
const sessionSchema = z.object({
  id: z.string(),
  childId: z.string(),
  subject: subjectSchema,
  kind: z.enum(["diagnostic", "practice"]),
  length: z.number().int().positive(),
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  plannedQuestionIds: z.array(z.string()),
  dailyPlan: dailyPlanSchema.optional(),
  attempts: z.array(attemptSchema),
  summary: z.array(sessionSummarySchema)
});
const handwritingRecordSchema = z.object({
  character: z.string(),
  lastCompletedAt: z.string(),
  bestMistakes: z.number().int().nonnegative(),
  attempts: z.number().int().positive()
});
const rewardStateSchema = z.object({
  lifetimeStars: z.number().int().nonnegative(),
  awardedEventKeys: z.array(z.string()),
  redeemedCompanionIds: z.array(z.string()),
  redeemedAtByCompanionId: z.record(z.string(), z.string()),
  activeCompanionId: z.string().nullable(),
  dailyAwardKey: z.string().nullable(),
  dailyStars: z.number().int().nonnegative()
});
const childSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  avatar: z.string(),
  ageYears: z.number().int().min(4).max(8).default(6),
  birthYear: z.number().int().min(2000).max(2100).optional(),
  gradeLevel: levelSchema.default("P1"),
  levelConfirmedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  createdAt: z.string(),
  diagnostics: z.record(z.string(), z.object({ completedAt: z.string(), sessionId: z.string() })),
  evidence: z.record(z.string(), evidenceSchema),
  attempts: z.array(attemptSchema),
  sessions: z.array(sessionSchema),
  activeSessions: z.record(z.string(), sessionSchema),
  handwriting: z.record(z.string(), handwritingRecordSchema).default({}),
  rewards: rewardStateSchema.default(createRewardState()),
  settings: z.object({
    sessionLength: z.number().int().positive(),
    enabledSkills: z.array(z.string()),
    highContrast: z.boolean().default(false),
    largeText: z.boolean().default(false),
    rewardsEnabled: z.boolean().default(true),
    companionAnimationsEnabled: z.boolean().default(true)
  })
});
const householdSchema = z.object({
  version: z.literal(4),
  uiLocale: z.enum(["zh", "en"]).default("zh"),
  householdName: z.string(),
  parentName: z.string(),
  pinHash: z.string(),
  pinSalt: z.string(),
  createdAt: z.string(),
  children: z.array(childSchema)
});
const envelopeSchema = z.object({
  format: z.literal(ENCRYPTED_FORMAT),
  kdfSalt: z.string(),
  iv: z.string(),
  ciphertext: z.string(),
  uiLocale: z.enum(["zh", "en"]).default("zh")
});

export type EncryptedEnvelope = z.infer<typeof envelopeSchema>;

export type HouseholdReadResult =
  | { status: "empty" }
  | { status: "ok"; household: HouseholdState }
  | { status: "encrypted"; envelope: EncryptedEnvelope }
  | { status: "corrupt"; raw: string; error: string };
export type SaveResult = { ok: true } | { ok: false; error: string };

let writeQueue: Promise<SaveResult> = Promise.resolve({ ok: true });

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("家庭数据不是对象");
  return value as Record<string, unknown>;
}

function fillRewards(raw: Record<string, unknown>): GrowthRewardState {
  const base = createRewardState();
  const lifetimeStars = raw.lifetimeStars === undefined ? base.lifetimeStars : raw.lifetimeStars;
  if (!Number.isInteger(lifetimeStars) || Number(lifetimeStars) < 0) throw new Error("孩子的成长星数据已损坏");
  const stringArray = (key: keyof GrowthRewardState) => {
    const value = raw[key];
    if (value === undefined) return [] as string[];
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) throw new Error(`孩子的奖励字段 ${key} 已损坏`);
    return value as string[];
  };
  const redeemedCompanionIds = stringArray("redeemedCompanionIds");
  if (redeemedCompanionIds.some((id) => !COMPANIONS.some((companion) => companion.id === id))) throw new Error("孩子的伙伴收藏包含未知角色");
  const rawTimes = raw.redeemedAtByCompanionId;
  if (rawTimes !== undefined && (typeof rawTimes !== "object" || Array.isArray(rawTimes))) throw new Error("孩子的伙伴兑换时间已损坏");
  const redeemedTimes = rawTimes === undefined ? {} : rawTimes as Record<string, string>;
  const activeCompanionId = raw.activeCompanionId === undefined || raw.activeCompanionId === null ? null : String(raw.activeCompanionId);
  if (activeCompanionId && !redeemedCompanionIds.includes(activeCompanionId)) throw new Error("当前陪伴角色尚未兑换");
  const dailyAwardKey = raw.dailyAwardKey === undefined || raw.dailyAwardKey === null ? null : String(raw.dailyAwardKey);
  const dailyStars = raw.dailyStars === undefined ? 0 : raw.dailyStars;
  if (!Number.isInteger(dailyStars) || Number(dailyStars) < 0) throw new Error("孩子的每日成长星数据已损坏");
  return {
    lifetimeStars: Number(lifetimeStars),
    awardedEventKeys: stringArray("awardedEventKeys"),
    redeemedCompanionIds,
    redeemedAtByCompanionId: redeemedTimes,
    activeCompanionId,
    dailyAwardKey,
    dailyStars: Number(dailyStars)
  };
}

function fillEvidence(raw: unknown, skillId: string, attempts: unknown[]): SkillEvidence {
  const base = createSkillEvidence(skillId, new Date(0));
  if (raw === undefined || raw === null) return base;
  if (typeof raw !== "object" || Array.isArray(raw)) throw new Error(`知识点 ${skillId} 的数据已损坏`);
  const value = raw as Record<string, unknown>;
  const inferredQuestionIds = Array.from(new Set(attempts
    .filter((attempt) => attempt && typeof attempt === "object" && (attempt as Record<string, unknown>).questionId && (attempt as Record<string, unknown>).skillId === skillId)
    .map((attempt) => String((attempt as Record<string, unknown>).questionId))));
  return {
    ...base,
    ...value,
    templates: Array.isArray(value.templates) ? value.templates.map(String) : [],
    questionIds: Array.isArray(value.questionIds) ? value.questionIds.map(String) : inferredQuestionIds,
    diversity: createEvidenceDiversity(),
    lastStageAdvanceAt: typeof value.lastStageAdvanceAt === "string" ? value.lastStageAdvanceAt : null
  } as SkillEvidence;
}

export function migrateHousehold(raw: unknown): HouseholdState {
  const value = asRecord(raw);
  const version = value.version;
  if (version !== 1 && version !== 2 && version !== 3 && version !== 4) throw new Error(`不支持的数据版本：${String(version)}`);
  const requireVersion2Fields = version === 2;
  const requireVersion3Fields = version === 3 || version === 4;
  if (!Array.isArray(value.children)) throw new Error("家庭的孩子列表已损坏");
  const children = value.children;
  const migratedChildren = children.map((rawChild) => {
    const child = asRecord(rawChild);
    if (requireVersion2Fields && child.attempts === undefined) throw new Error("孩子的作答记录缺失");
    if (child.attempts !== undefined && !Array.isArray(child.attempts)) throw new Error("孩子的作答记录已损坏");
    const attempts = Array.isArray(child.attempts) ? child.attempts : [];
    if (requireVersion2Fields && child.evidence === undefined) throw new Error("孩子的掌握度数据缺失");
    if (child.evidence !== undefined && (typeof child.evidence !== "object" || Array.isArray(child.evidence))) throw new Error("孩子的掌握度数据已损坏");
    const rawEvidence = child.evidence && typeof child.evidence === "object" ? child.evidence as Record<string, unknown> : {};
    const evidence = Object.fromEntries(SKILLS.map((skill) => [skill.id, fillEvidence(rawEvidence[skill.id], skill.id, attempts)]));
    if (requireVersion2Fields && child.settings === undefined) throw new Error("孩子的学习设置缺失");
    const settings = asRecord(child.settings ?? {});
    if (requireVersion2Fields && settings.enabledSkills === undefined) throw new Error("孩子的启用知识点设置缺失");
    if (settings.enabledSkills !== undefined && !Array.isArray(settings.enabledSkills)) throw new Error("孩子的启用知识点设置已损坏");
    if (settings.enabledSkills !== undefined && !settings.enabledSkills.every((id) => typeof id === "string")) throw new Error("孩子的启用知识点设置已损坏");
    const enabled = Array.isArray(settings.enabledSkills) ? settings.enabledSkills : [];
    const enabledValid = Array.from(new Set(enabled.filter((id) => SKILLS.some((skill) => skill.id === id))));
    const enabledSkills = version === 1
      ? SKILLS.map((skill) => skill.id)
      : enabledValid.length > 0
        ? enabledValid
        : SKILLS.map((skill) => skill.id);
    if (requireVersion2Fields && settings.sessionLength === undefined) throw new Error("孩子的每次题量设置缺失");
    const sessionLengthValue = settings.sessionLength === undefined ? 8 : Number(settings.sessionLength);
    if (!Number.isInteger(sessionLengthValue) || sessionLengthValue < 4 || sessionLengthValue > 20) throw new Error("孩子的每次题量设置已损坏");
    if (requireVersion2Fields && child.diagnostics === undefined) throw new Error("孩子的定位记录缺失");
    if (settings.highContrast !== undefined && typeof settings.highContrast !== "boolean") throw new Error("孩子的对比度设置已损坏");
    if (settings.largeText !== undefined && typeof settings.largeText !== "boolean") throw new Error("孩子的大字设置已损坏");
    if (settings.rewardsEnabled !== undefined && typeof settings.rewardsEnabled !== "boolean") throw new Error("孩子的奖励设置已损坏");
    if (settings.companionAnimationsEnabled !== undefined && typeof settings.companionAnimationsEnabled !== "boolean") throw new Error("角色的动画设置已损坏");
    if (requireVersion3Fields && child.rewards === undefined) throw new Error("孩子的奖励数据缺失");
    const rewards = child.rewards === undefined ? createRewardState() : fillRewards(asRecord(child.rewards));
    const inferredLevel = enabledSkills.some((skillId) => SKILLS.some((skill) => skill.id === skillId && skill.gradeBand === "P2")) ? "P2" : "P1";
    const inferredAge = inferredLevel === "P2" ? 7 : 6;
    const ageYears = Number.isInteger(child.ageYears) && Number(child.ageYears) >= 4 && Number(child.ageYears) <= 8 ? Number(child.ageYears) : inferredAge;
    const createdAtText = typeof child.createdAt === "string" ? child.createdAt : "";
    const createdYear = /^\d{4}/.test(createdAtText) ? Number(createdAtText.slice(0, 4)) : new Date().getFullYear();
    const inferredBirthYear = createdYear - ageYears;
    const birthYear = Number.isInteger(child.birthYear) && Number(child.birthYear) >= 2000 && Number(child.birthYear) <= 2100
      ? Number(child.birthYear)
      : inferredBirthYear;
    const levelConfirmedOn = typeof child.levelConfirmedOn === "string" && /^\d{4}-\d{2}-\d{2}$/.test(child.levelConfirmedOn)
      ? child.levelConfirmedOn
      : /^\d{4}-\d{2}-\d{2}/.test(createdAtText)
        ? createdAtText.slice(0, 10)
        : levelDateKey();
    const gradeLevel = levelSchema.safeParse(child.gradeLevel).success ? child.gradeLevel : inferredLevel;
    // Older K2 profiles were saved before the K2 readiness layer existed. Add
    // those skills on load; P1 and P2 keep their confirmed scope unchanged.
    const effectiveEnabledSkills = gradeLevel === "K2" ? [...K2_SKILL_IDS] : enabledSkills;
    if (requireVersion2Fields && child.sessions === undefined) throw new Error("孩子的学习会话缺失");
    if (requireVersion2Fields && child.activeSessions === undefined) throw new Error("孩子的进行中学习会话缺失");
    return {
      ...child,
      diagnostics: child.diagnostics === undefined ? {} : asRecord(child.diagnostics),
      evidence,
      attempts,
      sessions: child.sessions === undefined ? [] : Array.isArray(child.sessions) ? child.sessions : (() => { throw new Error("孩子的学习会话已损坏"); })(),
      activeSessions: child.activeSessions === undefined ? {} : asRecord(child.activeSessions),
      handwriting: child.handwriting === undefined ? {} : asRecord(child.handwriting),
      rewards,
      ageYears,
      birthYear,
      gradeLevel,
      levelConfirmedOn,
      settings: {
        sessionLength: sessionLengthValue,
        enabledSkills: effectiveEnabledSkills,
        highContrast: settings.highContrast === undefined ? false : settings.highContrast,
        largeText: settings.largeText === undefined ? false : settings.largeText,
        rewardsEnabled: settings.rewardsEnabled === undefined ? true : settings.rewardsEnabled,
        companionAnimationsEnabled: settings.companionAnimationsEnabled === undefined ? true : settings.companionAnimationsEnabled
      }
    };
  });
  const candidate = { ...value, version: 4, uiLocale: value.uiLocale === "en" ? "en" : "zh", children: migratedChildren };
  return householdSchema.parse(candidate) as HouseholdState;
}

export function parseHouseholdBackup(raw: string): HouseholdState {
  return migrateHousehold(JSON.parse(raw));
}

export function readHousehold(): HouseholdReadResult {
  let raw: string | null;
  try {
    raw = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return { status: "corrupt", raw: "", error: String(error) };
  }
  if (!raw) return { status: "empty" };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.format === ENCRYPTED_FORMAT) {
      return { status: "encrypted", envelope: envelopeSchema.parse(parsed) };
    }
    return { status: "ok", household: migrateHousehold(parsed) };
  } catch (error) {
    return { status: "corrupt", raw, error: error instanceof Error ? error.message : String(error) };
  }
}

export function saveHousehold(household: HouseholdState): SaveResult {
  try {
    const validated = householdSchema.parse(household);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function deriveEncryptionKey(pin: string, salt: string): Promise<CryptoKey> {
  if (!/^\d{4,6}$/.test(pin)) throw new Error("PIN 必须是 4 到 6 位数字");
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode(salt), iterations: 210_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptHouseholdWithKey(household: HouseholdState, key: CryptoKey): Promise<EncryptedEnvelope> {
  const validated = householdSchema.parse(household) as HouseholdState;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(validated)));
  return {
    format: ENCRYPTED_FORMAT,
    kdfSalt: validated.pinSalt,
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext)),
    uiLocale: validated.uiLocale
  };
}

export async function createEncryptedHousehold(household: HouseholdState, pin: string): Promise<{ envelope: EncryptedEnvelope; key: CryptoKey }> {
  const key = await deriveEncryptionKey(pin, household.pinSalt);
  return { envelope: await encryptHouseholdWithKey(household, key), key };
}

export async function unlockEncryptedHousehold(envelope: EncryptedEnvelope, pin: string): Promise<{ household: HouseholdState; key: CryptoKey }> {
  const validatedEnvelope = envelopeSchema.parse(envelope);
  const key = await deriveEncryptionKey(pin, validatedEnvelope.kdfSalt);
  const iv = base64ToBytes(validatedEnvelope.iv) as unknown as BufferSource;
  const ciphertext = base64ToBytes(validatedEnvelope.ciphertext) as unknown as BufferSource;
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return { household: migrateHousehold(JSON.parse(new TextDecoder().decode(plaintext))), key };
}

export function writeEncryptedEnvelope(envelope: EncryptedEnvelope): SaveResult {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelopeSchema.parse(envelope)));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function saveEncryptedHousehold(household: HouseholdState, key: CryptoKey): Promise<SaveResult> {
  const write = async (): Promise<SaveResult> => {
    try {
      const envelope = await encryptHouseholdWithKey(household, key);
      return writeEncryptedEnvelope(envelope);
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  };
  writeQueue = writeQueue.then(write, write);
  return writeQueue;
}

export function flushStorageWrites(): Promise<SaveResult> {
  return writeQueue;
}

export function clearHousehold(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function storageKeyName(): string {
  return STORAGE_KEY;
}
