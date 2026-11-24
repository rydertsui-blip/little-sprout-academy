const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/redesign");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const rows = JSON.parse(fs.readFileSync("/tmp/all-questions.json", "utf8"));
const failures = [], checks = [];

function seedFor(row) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  seed.children[0].activeSessions[row.subject] = {
    id: `seed-all-${row.id}`, childId: seed.children[0].id, subject: row.subject, kind: "practice", length: 1,
    startedAt: "2026-11-24T10:00:00.000Z", completedAt: null, plannedQuestionIds: [row.id], attempts: [], summary: []
  };
  return seed;
}
async function tap(el) {
  await el.waitFor({ state: "visible", timeout: 10000 });
  await el.scrollIntoViewIfNeeded();
  await el.tap({ timeout: 10000 });
}
async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: true });
}
async function assertLayout(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) failures.push(`${label}: horizontal overflow ${overflow}px`);
}
async function openProfile(page, seed) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate((data) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(data)), seed);
  await page.reload({ waitUntil: "domcontentloaded" });
  if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
    await page.getByLabel("家长密码").fill("2468");
    await tap(page.getByRole("button", { name: "打开家庭学习区" }));
  }
  await page.getByRole("button", { name: "小果的学习档案" }).waitFor({ state: "visible", timeout: 10000 });
  await tap(page.getByRole("button", { name: "小果的学习档案" }));
  await page.waitForSelector("text=跟小芽开始", { timeout: 10000 });
}
async function openSubject(page, subject) {
  const selector = subject === "math" ? ".subject-card.math-course" : subject === "mandarin" ? ".subject-card.mandarin-course" : ".subject-card.english-course";
  await tap(page.locator(selector));
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 10000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`http ${response.status()}: ${response.url()}`); });
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    try {
      await openProfile(page, seedFor(row));
      await openSubject(page, row.subject);
      const prompt = await page.getByTestId("question-prompt").innerText();
      if (prompt.trim() !== row.prompt.trim()) failures.push(`${row.id}: prompt mismatch`);
      if (row.audioOnly && await page.locator(".question-passage").count()) failures.push(`${row.id}: audio-only passage visible`);
      await assertLayout(page, `${row.id} wide`);
      if (await page.locator(".audio-button").count()) {
        if (row.audioOnly || row.subject !== "math") await tap(page.locator(".audio-button"));
      } else failures.push(`${row.id}: no audio button`);
      if (row.kind === "choice") {
        const correct = page.locator('.answer-option[data-correct="true"]');
        if (await correct.count() !== 1) failures.push(`${row.id}: correct option count ${await correct.count()}`);
        else { await tap(correct.first()); await page.waitForSelector("[data-testid=answer-feedback]", { timeout: 10000 }); }
      } else {
        for (const pair of row.pairs) {
          const left = page.locator(`[data-match-side="left"][data-pair-id="${pair.id}"]`);
          const right = page.locator(`[data-match-side="right"][data-pair-id="${pair.id}"]`);
          await tap(left);
          await tap(right);
        }
        await page.waitForSelector("[data-testid=answer-feedback]", { timeout: 10000 });
      }
      await tap(page.locator(".answer-feedback .wide-button"));
      await page.waitForSelector(".result-screen", { timeout: 10000 });
      checks.push(`${row.id}: ok`);
    } catch (error) {
      failures.push(`${row.id}: ${error.message}`);
      await shot(page, `fail-${row.id}.png`).catch(() => {});
    }
    if ((index + 1) % 50 === 0) console.log(`${index + 1}/${rows.length} checks=${checks.length} failures=${failures.length}`);
  }

  fs.writeFileSync(path.join(ROOT, "family-audit/all-questions-click.json"), JSON.stringify({ checks, failures }, null, 2));
  console.log(JSON.stringify({ total: rows.length, checks: checks.length, failures }, null, 2));
  await browser.close();
  if (failures.length) process.exit(1);
})();
