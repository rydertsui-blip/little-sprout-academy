import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { QUESTIONS } from "../src/content/catalog";

const output = resolve(import.meta.dirname, "../src/content/question-id-history.json");
const ids = [...QUESTIONS].map((question) => question.id).sort();
writeFileSync(output, `${JSON.stringify(ids, null, 2)}\n`, "utf8");
console.log(`Updated ${ids.length} historical question ids.`);
