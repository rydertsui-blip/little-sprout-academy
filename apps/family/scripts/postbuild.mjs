import { existsSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const output = join(import.meta.dirname, "../../../family");
for (const entry of readdirSync(output)) {
  if (/^workbox-[a-f0-9]+\.js$/.test(entry)) rmSync(join(output, entry), { force: true });
}

const audioDir = join(output, "assets/audio");
const audio = existsSync(audioDir)
  ? readdirSync(audioDir).filter((entry) => entry.endsWith(".m4a")).sort().map((entry) => `./assets/audio/${entry}`)
  : [];
writeFileSync(join(output, "precache-manifest.json"), JSON.stringify({ audio }, null, 2) + "\n");
