import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatBytes, getStorageHealth } from "./storageHealth";

describe("storage health", () => {
  beforeEach(() => localStorage.clear());

  it("reports the encrypted local payload size when quota estimation is unavailable", async () => {
    localStorage.setItem("little-sprout-family-v1", "x".repeat(2048));
    Object.defineProperty(navigator, "storage", { configurable: true, value: undefined });
    const health = await getStorageHealth();
    expect(health.localBytes).toBe(2048);
    expect(health.quotaBytes).toBeNull();
  });

  it("accepts browser storage estimates without inventing missing quota", async () => {
    Object.defineProperty(navigator, "storage", {
      configurable: true,
      value: {
        estimate: vi.fn().mockResolvedValue({ usage: 20, quota: 100 }),
        persisted: vi.fn().mockResolvedValue(true)
      }
    });
    const health = await getStorageHealth();
    expect(health.usageRatio).toBeCloseTo(0.2);
    expect(health.persisted).toBe(true);
    expect(formatBytes(12 * 1024 * 1024)).toBe("12.0 MB");
  });
});
