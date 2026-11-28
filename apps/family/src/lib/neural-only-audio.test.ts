import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SRC_ROOT = resolve(process.cwd(), "src");

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) files.push(path);
  }
  return files;
}

describe("voice policy: neural clips only", () => {
  it("never references the browser speech synthesis engine anywhere in the shipped source", () => {
    const offenders = walk(SRC_ROOT)
      .filter((file) => {
        const text = readFileSync(file, "utf8");
        return /speechSynthesis|SpeechSynthesisUtterance/.test(text);
      })
      .map((file) => relative(SRC_ROOT, file));

    expect(offenders).toEqual([]);
  });
});
