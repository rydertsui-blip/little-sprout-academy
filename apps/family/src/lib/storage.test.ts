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
    expect(result.household.version).toBe(2);
    expect(result.household.children[0].activeSessions).toEqual({});
    expect(result.household.children[0].settings.enabledSkills).toEqual(SKILLS.map((skill) => skill.id));
    expect(result.household.children[0].evidence["math-count-100"].questionIds).toEqual([]);
    expect(result.household.children[0].evidence["math-count-100"].lastStageAdvanceAt).toBeNull();
  });

  it("reports a write failure instead of throwing into the UI", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Quota exceeded", "QuotaExceededError"); });
    const child = createChildProfile("小安", "star");
    const result = saveHousehold({
      version: 2,
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

  it("encrypts child names and records at rest and unlocks only with the correct PIN", async () => {
    const child = createChildProfile("小树", "leaf", new Date("2026-11-20T00:00:00Z"));
    const household = {
      version: 2 as const,
      householdName: "测试家庭",
      parentName: "妈妈",
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
      version: 2,
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
