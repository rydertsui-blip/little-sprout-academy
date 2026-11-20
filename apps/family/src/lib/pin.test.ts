import { describe, expect, it } from "vitest";
import { hashPin, validatePin } from "./pin";

describe("parent PIN", () => {
  it("accepts only four to six digits", () => {
    expect(validatePin("1234")).toBe(true);
    expect(validatePin("123456")).toBe(true);
    expect(validatePin("123")).toBe(false);
    expect(validatePin("12ab")).toBe(false);
  });

  it("hashes the same PIN consistently and never returns the raw PIN", async () => {
    const first = await hashPin("2468", "household-salt");
    const second = await hashPin("2468", "household-salt");
    expect(first).toBe(second);
    expect(first).not.toContain("2468");
  });
});
