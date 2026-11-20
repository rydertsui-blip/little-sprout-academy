import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { SKILLS } from "../src/content/skills";
import {
  OFFICIAL_ACTIVITIES,
  OFFICIAL_ACTIVITY_DATA,
  OFFICIAL_OUTCOMES,
  OFFICIAL_OUTCOME_DATA,
  OFFICIAL_SOURCES,
  OFFICIAL_SOURCES_BY_ID,
  OFFICIAL_SOURCE_MANIFEST
} from "../src/content/officialSources";

const officialDirectory = resolve(import.meta.dirname, "../sources/official");
const cacheDirectory = resolve(officialDirectory, "cache");
const refresh = process.argv.includes("--refresh");
const summaryOnly = process.argv.includes("--summary");
const failures: string[] = [];

const normalizeEvidenceText = (value: string) => value
  .normalize("NFKC")
  .replace(/FOR USE BY MEMBERS OF THE PUBLIC\s*\d*/gi, "")
  .replace(/\s+/g, "");

function commandAvailable(command: string): boolean {
  try {
    execFileSync("/bin/sh", ["-lc", `command -v ${command}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function renderCoverageReport() {
  const subjectNames = { math: "数学", mandarin: "华文", english: "英语" } as const;
  const lines = [
    "# MOE P1/P2 官方学习目标覆盖矩阵",
    "",
    "> 本文件由 `npm run verify:sources` 根据已校验的 MOE PDF、页面原文和 `src/content/skills.ts` 自动生成。不要手改。",
    "> `exact` 表示当前技能直接对应官方原文目标；`broad` 表示只能对应到官方能力范畴，不能宣称已达到逐年微目标。",
    "> 没有真人教师审核，因此任何内容都不得标记为 `approved`。",
    "",
    "## 来源",
    "",
    "| 来源 ID | 文件 | 版本 | 页数 | SHA-256 |",
    "|---|---|---|---:|---|",
    ...OFFICIAL_SOURCES.map((source) => `| ${source.id} | [官方 PDF](${source.officialUrl}) | ${source.documentVersion} | ${source.pages} | \`${source.sha256}\` |`),
    "",
    "## 汇总",
    "",
    `- 官方来源：${OFFICIAL_SOURCES.length} 份 MOE PDF`,
    `- 官方 P1/P2 outcome：${OFFICIAL_OUTCOMES.length} 条`,
    `- 当前技能：${SKILLS.length} 个`,
    `- 非测验活动：${OFFICIAL_ACTIVITIES.length} 组`,
    `- 至少有一个 exact 映射的技能：${SKILLS.filter((skill) => skill.officialOutcomes.some((mapping) => mapping.mapping === "exact")).length} 个`,
    `- 只有 broad 映射的技能：${SKILLS.filter((skill) => skill.officialOutcomes.length > 0 && skill.officialOutcomes.every((mapping) => mapping.mapping === "broad")).length} 个`,
    `- 不纳入官方覆盖的课外补充技能：${SKILLS.filter((skill) => skill.provenanceScope === "supplementary-practice").length} 个`,
    ""
  ];

  for (const subject of ["math", "mandarin", "english"] as const) {
    const outcomes = OFFICIAL_OUTCOMES.filter((outcome) => outcome.subject === subject);
    const mappedOutcomeIds = outcomes.map((outcome) => {
      const skills = SKILLS.filter((skill) => skill.officialOutcomes.some((mapping) => mapping.outcomeId === outcome.id));
      const activities = OFFICIAL_ACTIVITIES.filter((activity) => activity.outcomeMappings.some((mapping) => mapping.outcomeId === outcome.id));
      const skillStatus = skills.length
        ? skills.map((skill) => `${skill.id}(${skill.officialOutcomes.find((mapping) => mapping.outcomeId === outcome.id)?.mapping})`).join("<br>")
        : "";
      const activityStatus = activities.map((activity) => `${activity.id}(${activity.outcomeMappings.find((mapping) => mapping.outcomeId === outcome.id)?.mapping})`).join("<br>");
      const status = [skillStatus, activityStatus].filter(Boolean).join("<br>") || "**尚未映射**";
      return `| ${outcome.id} | ${outcome.levels.join("/")} | ${outcome.pdfPage} | ${outcome.summary} | ${status} |`;
    });
    lines.push(`## ${subjectNames[subject]}`, "", "| Outcome | 年級 | PDF 頁 | 官方摘要 | 當前技能／活動映射 |", "|---|---|---:|---|---|", ...mappedOutcomeIds, "");
  }

  const supplementarySkills = SKILLS.filter((skill) => skill.provenanceScope === "supplementary-practice");
  lines.push(
    "## 課外補充（不納入官方覆蓋）",
    "",
    supplementarySkills.length
      ? "| 技能 | 科目 | 說明 |\n|---|---|---|\n" + supplementarySkills.map((skill) => `| ${skill.id} | ${subjectNames[skill.subject]} | ${skill.description} |`).join("\n")
      : "目前沒有課外補充技能。",
    "",
    "這些技能可以保留作練習，但不能列入 MOE outcome 的已覆蓋數量。",
    ""
  );

  lines.push(
    "## 使用限制",
    "",
    "- 本矩阵只证明「原文引用存在」和「技能有明确的来源映射」，不等于教师已审核，也不等于学校教材顺序完全一致。",
    "- 官方文件只给 lower-primary 能力进程时，具体 a/an、复数、量词或句子顺序等微目标只能标为 `broad`。",
    "- 尚未映射的官方目标必须继续补内容或明确列为未覆盖，不能当作已完成。",
    ""
  );
  return lines.join("\n");
}

async function ensurePdf(source: typeof OFFICIAL_SOURCES[number]): Promise<string> {
  const file = resolve(cacheDirectory, source.cacheFile);
  if (!existsSync(file) || refresh) {
    if (process.argv.includes("--no-download")) throw new Error(`Missing source cache: ${source.cacheFile}`);
    const response = await fetch(source.officialUrl, { redirect: "follow", signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`Download failed for ${source.id}: HTTP ${response.status}`);
    if (!response.headers.get("content-type")?.startsWith("application/pdf")) throw new Error(`Download is not a PDF for ${source.id}`);
    const finalUrl = new URL(response.url);
    if (finalUrl.hostname !== "www.moe.gov.sg") throw new Error(`Unexpected redirect host for ${source.id}: ${finalUrl.hostname}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = createHash("sha256").update(bytes).digest("hex");
    if (bytes.length !== source.bytes || hash !== source.sha256) throw new Error(`Downloaded source does not match pinned bytes for ${source.id}`);
    writeFileSync(file, bytes);
  }
  return file;
}

function extractPages(file: string): string[] {
  const text = execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  return text.split("\f");
}

async function verify() {
  if (!commandAvailable("pdfinfo") || !commandAvailable("pdftotext")) {
    throw new Error("pdfinfo and pdftotext are required to verify official source evidence");
  }
  mkdirSync(cacheDirectory, { recursive: true });
  if (normalizeEvidenceText(OFFICIAL_SOURCE_MANIFEST.authorityPolicy) === "") failures.push("Source authority policy is empty");

  for (const source of OFFICIAL_SOURCES) {
    let url: URL;
    try {
      url = new URL(source.officialUrl);
    } catch {
      failures.push(`${source.id}: invalid official URL`);
      continue;
    }
    if (url.protocol !== "https:" || url.hostname !== "www.moe.gov.sg") failures.push(`${source.id}: source is not an official HTTPS MOE URL`);
  }

  const pageText = new Map<string, string[]>();
  for (const source of OFFICIAL_SOURCES) {
    try {
      const file = await ensurePdf(source);
      const bytes = readFileSync(file);
      const hash = createHash("sha256").update(bytes).digest("hex");
      if (hash !== source.sha256) failures.push(`${source.id}: SHA-256 mismatch, expected ${source.sha256}, got ${hash}`);
      if (bytes.length !== source.bytes) failures.push(`${source.id}: byte-length mismatch, expected ${source.bytes}, got ${bytes.length}`);
      const info = execFileSync("pdfinfo", [file], { encoding: "utf8" });
      const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);
      if (pages !== source.pages) failures.push(`${source.id}: page-count mismatch, expected ${source.pages}, got ${pages}`);
      pageText.set(source.id, extractPages(file));
    } catch (error) {
      failures.push(`${source.id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const outcomeIds = new Set<string>();
  for (const outcome of OFFICIAL_OUTCOMES) {
    if (outcomeIds.has(outcome.id)) failures.push(`Duplicate outcome id: ${outcome.id}`);
    outcomeIds.add(outcome.id);
    const source = OFFICIAL_SOURCES_BY_ID.get(outcome.sourceId);
    if (!source) {
      failures.push(`${outcome.id}: unknown source ${outcome.sourceId}`);
      continue;
    }
    if (source.subject !== outcome.subject) failures.push(`${outcome.id}: subject does not match its source`);
    if (!outcome.levels.length || outcome.levels.some((level) => !["P1", "P2"].includes(level))) failures.push(`${outcome.id}: outcome is outside the supported P1/P2 scope`);
    if (outcome.pdfPage < 1 || outcome.pdfPage > source.pages) {
      failures.push(`${outcome.id}: PDF page ${outcome.pdfPage} is outside ${source.pages} pages`);
      continue;
    }
    const page = pageText.get(source.id)?.[outcome.pdfPage - 1] ?? "";
    const quoteParts = outcome.quoteParts ?? (outcome.quote ? [outcome.quote] : []);
    if (!quoteParts.length) failures.push(`${outcome.id}: no exact quote evidence`);
    for (const quote of quoteParts) {
      if (!normalizeEvidenceText(page).includes(normalizeEvidenceText(quote))) {
        failures.push(`${outcome.id}: exact quote fragment not found on ${source.id} PDF page ${outcome.pdfPage}: ${quote}`);
      }
    }
  }

  for (const skill of SKILLS) {
    if (!skill.officialOutcomes.length && skill.provenanceScope !== "supplementary-practice") failures.push(`${skill.id}: no official outcome mapping and not marked supplementary`);
    if (skill.officialOutcomes.length && skill.provenanceScope !== "official-outcome") failures.push(`${skill.id}: has official outcomes but is marked supplementary`);
    for (const mapping of skill.officialOutcomes) {
      const outcome = OFFICIAL_OUTCOMES.find((item) => item.id === mapping.outcomeId);
      if (!outcome) {
        failures.push(`${skill.id}: unknown outcome ${mapping.outcomeId}`);
        continue;
      }
      if (outcome.subject !== skill.subject) failures.push(`${skill.id}: outcome subject mismatch`);
      if (!outcome.levels.some((level) => skill.gradeBand.includes(level))) failures.push(`${skill.id}: outcome level does not overlap ${skill.gradeBand}`);
    }
  }

  const activityIds = new Set<string>();
  for (const activity of OFFICIAL_ACTIVITIES) {
    if (activityIds.has(activity.id)) failures.push(`Duplicate activity id: ${activity.id}`);
    activityIds.add(activity.id);
    if (!activity.contentIds.length) failures.push(`${activity.id}: no content ids`);
    if (!activity.outcomeMappings.length) failures.push(`${activity.id}: no official outcome mapping`);
    for (const mapping of activity.outcomeMappings) {
      const outcome = OFFICIAL_OUTCOMES.find((item) => item.id === mapping.outcomeId);
      if (!outcome) failures.push(`${activity.id}: unknown outcome ${mapping.outcomeId}`);
      else if (outcome.subject !== activity.subject) failures.push(`${activity.id}: outcome subject mismatch`);
    }
  }

  if (failures.length) {
    console.error("Official-source verification failed:");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  const exactSkills = SKILLS.filter((skill) => skill.officialOutcomes.some((mapping) => mapping.mapping === "exact")).length;
  const broadOnlySkills = SKILLS.filter((skill) => skill.officialOutcomes.length > 0 && skill.officialOutcomes.every((mapping) => mapping.mapping === "broad")).length;
  const supplementarySkills = SKILLS.filter((skill) => skill.provenanceScope === "supplementary-practice").length;
  const mappedOutcomes = new Set([
    ...SKILLS.flatMap((skill) => skill.officialOutcomes.map((mapping) => mapping.outcomeId)),
    ...OFFICIAL_ACTIVITIES.flatMap((activity) => activity.outcomeMappings.map((mapping) => mapping.outcomeId))
  ]);
  const unmappedOutcomes = OFFICIAL_OUTCOMES.filter((outcome) => !mappedOutcomes.has(outcome.id));
  const reportPath = resolve(officialDirectory, "coverage-report.md");
  const report = renderCoverageReport();
  if (!existsSync(reportPath) || readFileSync(reportPath, "utf8") !== report) writeFileSync(reportPath, report, "utf8");
  console.log(`Official sources verified: ${OFFICIAL_SOURCES.length} MOE PDFs, ${OFFICIAL_OUTCOMES.length} outcomes.`);
  console.log(`Skill mapping: ${exactSkills} skills with at least one exact outcome; ${broadOnlySkills} broad-only skills.`);
  console.log(`Supplementary practice outside official coverage: ${supplementarySkills} skills.`);
  console.log(`P1/P2 outcomes with no current content mapping: ${unmappedOutcomes.length}`);
  if (summaryOnly) {
    console.log(JSON.stringify({ sources: OFFICIAL_SOURCE_MANIFEST.sources.map((source) => ({ id: source.id, sha256: source.sha256, pages: source.pages })), outcomeSchemaVersion: OFFICIAL_OUTCOME_DATA.schemaVersion, activitySchemaVersion: OFFICIAL_ACTIVITY_DATA.schemaVersion, exactSkills, broadOnlySkills, supplementarySkills, unmappedOutcomeIds: unmappedOutcomes.map((outcome) => outcome.id) }, null, 2));
  }
}

verify().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

