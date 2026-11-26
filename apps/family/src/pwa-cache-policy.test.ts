import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const sw = readFileSync(resolve(process.cwd(), "src/manual-sw.js"), "utf8");

describe("PWA audio cache policy", () => {
  it("does not precache the full audio library during install", () => {
    expect(sw).toContain('const assetPaths = ["images", "companions", "hanzi"]');
    expect(sw).not.toContain('const assetPaths = ["audio", "images", "companions", "hanzi"]');
  });

  it("keeps same-origin audio playable offline after first fetch", () => {
    expect(sw).toContain("cache.put(event.request, copy)");
    expect(sw).toContain('if (event.request.mode === "navigate")');
  });
});
