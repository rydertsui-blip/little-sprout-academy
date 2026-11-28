import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 语音唯一的硬性要求：全部是预合成的微软 Neural 语音（24 kHz 单声道 AAC），
 * 不允许任何系统 TTS、采样率参差或压缩过度的“低质量”文件混进来。
 */
const AUDIO_DIR = resolve(process.cwd(), "public/assets/audio");

function readAacSampleEntry(path: string) {
  const bytes = readFileSync(path);
  const at = bytes.indexOf(Buffer.from("mp4a", "ascii"));
  if (at < 0) return null;
  const channels = bytes.readUInt16BE(at + 4 + 16);
  const sampleRate = bytes.readUInt32BE(at + 4 + 24) / 65_536;
  return { channels, sampleRate };
}

describe("audio assets are uniformly high-quality neural AAC", () => {
  const files = readdirSync(AUDIO_DIR).filter((name) => name.endsWith(".m4a"));

  it("ships only .m4a neural assets", () => {
    const others = readdirSync(AUDIO_DIR).filter((name) => !name.endsWith(".m4a"));
    expect(others).toEqual([]);
    expect(files.length).toBeGreaterThan(2600);
  });

  it("keeps every clip at 24 kHz mono AAC", () => {
    const bad: string[] = [];
    for (const name of files) {
      const meta = readAacSampleEntry(resolve(AUDIO_DIR, name));
      if (!meta || meta.channels !== 1 || Math.abs(meta.sampleRate - 24_000) > 1) {
        bad.push(`${name}: ${JSON.stringify(meta)}`);
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });

  it("keeps every clip above the quality floor", () => {
    const small: string[] = [];
    for (const name of files) {
      if (readFileSync(resolve(AUDIO_DIR, name)).byteLength < 1500) small.push(name);
    }
    expect(small.slice(0, 5)).toEqual([]);
  });
});
