import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { DOUDOU_ANIMATIONS } from "./PuppyCompanion";

const directory = resolve(process.cwd(), "public/assets/companions/gemini-doudou");
const repoRoot = resolve(process.cwd(), "../..");
const manifest = JSON.parse(readFileSync(resolve(directory, "manifest.json"), "utf8")) as {
  id: string;
  name: string;
  source: {
    type: string;
    file: string;
    width: number;
    height: number;
    columns: number;
    rows: number;
    sha256: string;
  };
  frame: { width: number; height: number };
  animations: Record<
    string,
    {
      file: string;
      frames: number;
      width: number;
      height: number;
      frameWidth: number;
      frameHeight: number;
      sha256: string;
    }
  >;
};

function readPngDimensions(bytes: Buffer): { width: number; height: number } {
  expect(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

describe("Gemini Doudou companion assets", () => {
  it("records the verified Gemini sprite sheet source and SHA-256", () => {
    expect(manifest.id).toBe("gemini-doudou");
    expect(manifest.source.type).toBe("gemini-generated-sprite-sheet");
    expect(manifest.source.file).toBe("work/companion-concepts/gemini-doudou-sprite-sheet.jpeg");
    expect(manifest.source.width).toBe(1376);
    expect(manifest.source.height).toBe(768);
    expect(manifest.source.columns).toBe(4);
    expect(manifest.source.rows).toBe(3);
    expect(manifest.frame).toEqual({ width: 344, height: 256 });

    const sourceBytes = readFileSync(resolve(repoRoot, manifest.source.file));
    const sourceDigest = createHash("sha256").update(sourceBytes).digest("hex");
    expect(sourceDigest).toBe(manifest.source.sha256);
  });

  it("has every runtime animation strip with matching frames, dimensions, and SHA-256", () => {
    for (const [name, animation] of Object.entries(DOUDOU_ANIMATIONS)) {
      const manifestAnimation = manifest.animations[name];
      expect(manifestAnimation, name).toBeDefined();
      expect(manifestAnimation.file).toBe(animation.file);
      expect(manifestAnimation.frames).toBe(animation.frames);
      expect(manifestAnimation.frames).toBe(4);
      expect(manifestAnimation.width).toBe(animation.width);
      expect(manifestAnimation.height).toBe(animation.height);
      expect(manifestAnimation.frameWidth).toBe(animation.frameWidth);
      expect(manifestAnimation.frameHeight).toBe(animation.frameHeight);

      const bytes = readFileSync(resolve(directory, animation.file));
      const dimensions = readPngDimensions(bytes);
      expect(dimensions, name).toEqual({ width: animation.width, height: animation.height });
      expect(dimensions.width / animation.frames, name).toBe(animation.frameWidth);

      const digest = createHash("sha256").update(bytes).digest("hex");
      expect(digest, name).toBe(manifestAnimation.sha256);
    }
  });
});
