import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEncryptedHousehold, parseHouseholdBackup, readHousehold, saveEncryptedHousehold, saveHousehold, unlockEncryptedHousehold } from "./storage";
import { createChildProfile } from "./profile";
import { SKILLS } from "../content/catalog";

const KEY = "little-sprout-family-v1";

describe("household storage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("distinguishes an empty store from corrupt data", () => {
    expect(readHousehold().status).toBe("empty");
    localStorage.setItem(KEY, "{not-json");
    const result = readHousehold();
    expect(result.status).toBe("corrupt");
    if (result.status === "corrupt") expect(result.raw).toBe("{not-json");
  });

  it("rejects v1 collections with the wrong shape instead of turning them into empty data", () => {
    localStorage.setItem(KEY, JSON.stringify({
      version: 1,
      householdName: "旧家庭",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: "corrupt"
    }));
    const result = readHousehold();
    expect(result.status).toBe("corrupt");
  });

  it("rejects incomplete version 2 child collections instead of inventing empty progress", () => {
    const child = createChildProfile("新版本孩子", "star", new Date("2026-11-20T00:00:00Z")) as unknown as Record<string, unknown>;
    delete child.activeSessions;
    localStorage.setItem(KEY, JSON.stringify({
      version: 2,
      householdName: "新家庭",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    }));
    const result = readHousehold();
    expect(result.status).toBe("corrupt");
  });

  it("rejects malformed version 2 learning settings instead of silently choosing a default", () => {
    const child = createChildProfile("设置损坏", "moon", new Date("2026-11-20T00:00:00Z")) as unknown as Record<string, unknown>;
    child.settings = { sessionLength: "broken", enabledSkills: [] };
    localStorage.setItem(KEY, JSON.stringify({
      version: 2,
      householdName: "新家庭",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    }));
    const result = readHousehold();
    expect(result.status).toBe("corrupt");
  });

  it("migrates a version 1 child and fills current skill and evidence fields", () => {
    const child = createChildProfile("小树", "leaf", new Date("2026-11-20T00:00:00Z")) as unknown as Record<string, unknown>;
    delete child.activeSessions;
    child.settings = { sessionLength: 8, enabledSkills: ["math-count-100"] };
    const evidence = child.evidence as Record<string, Record<string, unknown>>;
    delete evidence["math-count-100"].questionIds;
    delete evidence["math-count-100"].lastStageAdvanceAt;
    localStorage.setItem(KEY, JSON.stringify({
      version: 1,
      householdName: "旧家庭",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    }));
    const result = readHousehold();
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.household.version).toBe(4);
    expect(result.household.children[0].activeSessions).toEqual({});
    expect(result.household.children[0].settings.enabledSkills).toEqual(SKILLS.map((skill) => skill.id));
    expect(result.household.children[0].evidence["math-count-100"].questionIds).toEqual([]);
    expect(result.household.children[0].evidence["math-count-100"].lastStageAdvanceAt).toBeNull();
    expect(result.household.children[0].settings.highContrast).toBe(false);
    expect(result.household.children[0].settings.largeText).toBe(false);
  });

  it("adds an empty handwriting record when migrating an older version 2 child", () => {
    const child = createChildProfile("旧版孩子", "star", new Date("2026-11-20T00:00:00Z")) as unknown as Record<string, unknown>;
    delete child.handwriting;
    localStorage.setItem(KEY, JSON.stringify({
      version: 2,
      householdName: "旧家庭",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    }));
    const result = readHousehold();
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.household.children[0].handwriting).toEqual({});
    expect(result.household.children[0].rewards.lifetimeStars).toBe(0);
    expect(result.household.children[0].settings.rewardsEnabled).toBe(true);
    expect(result.household.children[0].settings.companionAnimationsEnabled).toBe(true);
  });

  it("adds a birth year and level confirmation date when migrating older records", () => {
    const child = createChildProfile("旧版年龄", "star", new Date("2026-11-20T00:00:00Z")) as unknown as Record<string, unknown>;
    delete child.birthYear;
    delete child.levelConfirmedOn;
    localStorage.setItem(KEY, JSON.stringify({
      version: 3,
      householdName: "旧家庭",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    }));
    const result = readHousehold();
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.household.children[0].birthYear).toBe(2020);
    expect(result.household.children[0].levelConfirmedOn).toBe("2026-11-20");
  });

  it("reports a write failure instead of throwing into the UI", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });
    const child = createChildProfile("小安", "star");
    const result = saveHousehold({
      version: 4,
    uiLocale: "zh",
      householdName: "测试",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Quota");
  });

  it("keeps mastery diversity across a storage reload", () => {
    const child = createChildProfile("小果", "star", new Date("2026-11-20T00:00:00Z"));
    const evidence = child.evidence["math-count-100"];
    evidence.diversity.templateFamilies = { "number-bond": 2, "count-on": 1 };
    evidence.diversity.responseModes["tap-choice"] = 3;
    evidence.diversity.responseModes["tap-match"] = 1;
    evidence.diversity.transferCorrect = 2;
    evidence.diversity.farTransferCorrect = 1;
    evidence.diversity.delayedIndependentCorrect = 1;
    evidence.diversity.contextKeys = ["bare-number", "story"];
    evidence.diversity.lastIndependentWrongAt = "2026-11-20T10:00:00.000Z";
    saveHousehold({
      version: 4,
      uiLocale: "zh",
      householdName: "测试家庭",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    });
    const result = readHousehold();
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.household.children[0].evidence["math-count-100"].diversity).toEqual(evidence.diversity);
  });

  it("keeps a narrowed enabled-skill scope for current household data", () => {
    const child = createChildProfile("小范围", "star", new Date("2026-11-20T00:00:00Z"));
    const p1Skills = SKILLS.filter((skill) => skill.gradeBand !== "P2").map((skill) => skill.id);
    child.settings.enabledSkills = p1Skills;
    saveHousehold({
      version: 4,
    uiLocale: "zh",
      householdName: "测试家庭",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    });
    const result = readHousehold();
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.household.children[0].settings.enabledSkills).toEqual(p1Skills);
  });

  it("encrypts child names and records at rest and unlocks only with the correct PIN", async () => {
    const child = createChildProfile("小树", "leaf", new Date("2026-11-20T00:00:00Z"));
    const household = {
      version: 4 as const,
      householdName: "测试家庭",
      parentName: "妈妈",
      uiLocale: "zh" as const,
      pinHash: "hash",
      pinSalt: "fixed-salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    };
    const sealed = await createEncryptedHousehold(household, "2468");
    localStorage.setItem(KEY, JSON.stringify(sealed.envelope));
    expect(localStorage.getItem(KEY)).not.toContain("小树");
    expect(readHousehold().status).toBe("encrypted");
    await expect(unlockEncryptedHousehold(sealed.envelope, "1357")).rejects.toBeTruthy();
    const unlocked = await unlockEncryptedHousehold(sealed.envelope, "2468");
    expect(unlocked.household.children[0].name).toBe("小树");
    unlocked.household.children[0].settings.sessionLength = 6;
    const saved = await saveEncryptedHousehold(unlocked.household, sealed.key);
    expect(saved.ok).toBe(true);
    expect(localStorage.getItem(KEY)).not.toContain("小树");
  });

  it("validates a portable household backup before import", () => {
    const child = createChildProfile("备份孩子", "star", new Date("2026-11-20T00:00:00Z"));
    const backup = JSON.stringify({
      version: 4,
    uiLocale: "zh",
      householdName: "备份家庭",
      parentName: "妈妈",
      pinHash: "hash",
      pinSalt: "salt",
      createdAt: "2026-11-20T00:00:00.000Z",
      children: [child]
    });
    expect(parseHouseholdBackup(backup).children[0].name).toBe("备份孩子");
    expect(() => parseHouseholdBackup("{bad")).toThrow();
  });
});
