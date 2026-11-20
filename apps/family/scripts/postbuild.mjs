import { readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const output = join(import.meta.dirname, "../../../family");
for (const entry of readdirSync(output)) {
  if (/^workbox-[a-f0-9]+\.js$/.test(entry)) rmSync(join(output, entry), { force: true });
}
