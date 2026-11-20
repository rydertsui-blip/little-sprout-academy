import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { canonicalContentPayload } from "../src/content/identity";
import { QUESTIONS, validateContentCatalog } from "../src/content/catalog";

const signaturePath = resolve(import.meta.dirname, "../src/content/content.sha256");
const issues = validateContentCatalog();
if (issues.length > 0) {
  console.error("Content validation failed:", issues);
  process.exit(1);
}
if (QUESTIONS.length !== 210) {
  console.error(`Expected 210 questions, found ${QUESTIONS.length}`);
  process.exit(1);
}

const digest = createHash("sha256").update(canonicalContentPayload(), "utf8").digest("hex");
const historyPath = resolve(import.meta.dirname, "../src/content/question-id-history.json");
const history = existsSync(historyPath)
  ? JSON.parse(readFileSync(historyPath, "utf8")) as string[]
  : [];
const currentIds = new Set(QUESTIONS.map((question) => question.id));
const missingHistoricalIds = history.filter((id) => !currentIds.has(id));
if (missingHistoricalIds.length > 0) {
  console.error(`Historical question ids are missing: ${missingHistoricalIds.join(", ")}`);
  process.exit(1);
}
if (process.argv.includes("--update")) {
  writeFileSync(signaturePath, `${digest}\n`, "utf8");
  console.log(`Updated content signature: ${digest}`);
} else {
  if (!existsSync(signaturePath)) {
    console.error("Missing content signature. Run npm run update:content.");
    process.exit(1);
  }
  const expected = readFileSync(signaturePath, "utf8").trim();
  if (expected !== digest) {
    console.error(`Content signature mismatch.\nExpected: ${expected}\nActual:   ${digest}`);
    console.error("Review the content change, then run npm run update:content.");
    process.exit(1);
  }
  console.log(`Content signature verified: ${digest}`);
}
