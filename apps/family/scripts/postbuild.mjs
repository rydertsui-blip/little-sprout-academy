import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const output = join(import.meta.dirname, "../../../family");
for (const entry of readdirSync(output)) {
  if (/^workbox-[a-f0-9]+\.js$/.test(entry)) rmSync(join(output, entry), { force: true });
}

function filesUnder(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
    .sort();
}

const audioDir = join(output, "assets/audio");
const audio = filesUnder(audioDir).filter((entry) => entry.endsWith(".m4a")).map((entry) => `./${relative(output, entry)}`);
const images = filesUnder(join(output, "assets/images")).filter((entry) => entry.endsWith(".png")).map((entry) => `./${relative(output, entry)}`);
const companions = filesUnder(join(output, "assets/companions")).map((entry) => `./${relative(output, entry)}`);
const hanzi = filesUnder(join(output, "assets/hanzi")).filter((entry) => entry.endsWith(".json")).map((entry) => `./${relative(output, entry)}`);
const manifest = { audio, images, companions, hanzi };
const manifestPath = join(output, "precache-manifest.json");
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

// The service worker script itself is byte-identical across builds unless this
// cache name changes. Derive it from the built shell plus all media metadata so
// a new deployment replaces the previous cache instead of silently serving
// stale JS with a fresh index, and so old media cannot be reused indefinitely.
const digest = createHash("sha256");
digest.update(readFileSync(join(output, "index.html")));
digest.update(readFileSync(manifestPath));
digest.update(filesUnder(output).filter((entry) => !entry.endsWith("sw.js")).map((entry) => {
  const fileHash = createHash("sha256").update(readFileSync(entry)).digest("hex");
  return `${relative(output, entry)}:${statSync(entry).size}:${fileHash}`;
}).join("\n"));
const buildRevision = digest.digest("hex").slice(0, 12);
const swPath = join(output, "sw.js");
const sw = readFileSync(swPath, "utf8");
const replaced = sw.replace(/little-sprout-family-build/g, `little-sprout-family-${buildRevision}`);
if (replaced === sw) throw new Error("service worker cache placeholder missing");
writeFileSync(swPath, replaced);
