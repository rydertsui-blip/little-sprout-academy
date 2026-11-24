const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/redesign");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const rows = JSON.parse(fs.readFileSync("/tmp/skill-first-questions.json", "utf8"));
const failures = [], checks = [];
const firstBySubject = new Set();

function seedFor(row) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  seed.children[0].activeSessions[row.subject] = {
    id: `seed-skill-${row.skillId}`,
    childId: seed.children[0].id,
    subject: row.subject,
    kind: "practice",
    length: 1,
    startedAt: "2026-11-24T10:00:00.000Z",
    completedAt: null,
    plannedQuestionIds: [row.questionId],
    attempts: [],
    summary: []
  };
  return seed;
}
async function tap(el) {
  await el.waitFor({ state: "visible", timeout: 15000 });
  await el.scrollIntoViewIfNeeded();
  await el.tap({ timeout: 15000 });
}
async function shot(page, name) {
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: true });
  checks.push(`shot ${name}`);
}
async function assertLayout(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) failures.push(`${label}: horizontal overflow ${overflow}px`);
  const small = await page.evaluate(() => [...document.querySelectorAll("button, summary")].filter((el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40);
  }).map((el) => ({ text: el.textContent.trim().slice(0, 30), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) })));
  if (small.length) failures.push(`${label}: touch targets below 40px: ${JSON.stringify(small)}`);
}
async function openProfile(page, seed) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.evaluate((data) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(data)), seed);
  await page.reload({ waitUntil: "domcontentloaded" });
  if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
    await page.getByLabel("家长密码").fill("2468");
    await tap(page.getByRole("button", { name: "打开家庭学习区" }));
  }
  await page.getByRole("button", { name: "小果的学习档案" }).waitFor({ state: "visible", timeout: 15000 });
  await tap(page.getByRole("button", { name: "小果的学习档案" }));
  await page.waitForSelector("text=跟小芽开始", { timeout: 15000 });
}
async function openSubject(page, subject) {
  const selector = subject === "math" ? ".subject-card.math-course" : subject === "mandarin" ? ".subject-card.mandarin-course" : ".subject-card.english-course";
  await tap(page.locator(selector));
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`http ${response.status()}: ${response.url()}`); });
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });

  for (const row of rows) {
    const tag = row.skillId;
    try {
      await page.setViewportSize({ width: 1180, height: 820 });
      await openProfile(page, seedFor(row));
      await openSubject(page, row.subject);
      const prompt = await page.getByTestId("question-prompt").innerText();
      if (prompt !== row.prompt) failures.push(`${tag}: prompt mismatch: ${prompt} !== ${row.prompt}`);
      if (row.audioOnly && await page.locator(".question-passage").count()) failures.push(`${tag}: audio-only passage visible`);
      await assertLayout(page, `${tag} wide`);
      const audio = page.locator(".audio-button");
      if (await audio.count()) { await tap(audio.first()); await page.waitForTimeout(200); } else failures.push(`${tag}: no audio button`);
      const correct = page.locator('.answer-option[data-correct="true"]');
      if (await correct.count() !== 1) failures.push(`${tag}: correct option count ${await correct.count()}`);
      else { await tap(correct.first()); await page.waitForSelector("[data-testid=answer-feedback]", { timeout: 15000 }); }
      const next = page.locator(".answer-feedback .wide-button");
      if (await next.count()) { await tap(next.first()); await page.waitForSelector(".result-screen", { timeout: 15000 }); }
      else failures.push(`${tag}: no next button`);
      if (!firstBySubject.has(row.subject)) {
        firstBySubject.add(row.subject);
        await shot(page, `183-wide-${row.subject}-result.png`);
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await assertLayout(page, `${tag} phone result`);
      if (!firstBySubject.has(`${row.subject}-phone`)) {
        firstBySubject.add(`${row.subject}-phone`);
        await shot(page, `184-phone-${row.subject}-result.png`);
      }
      checks.push(`${tag}: ok`);
    } catch (error) {
      failures.push(`${tag}: ${error.message}`);
    }
  }

  fs.writeFileSync(path.join(ROOT, "family-audit/all-skills-audit.json"), JSON.stringify({ checks, failures }, null, 2));
  console.log(JSON.stringify({ checks: checks.filter((c) => c.endsWith(": ok")).length, shots: checks.filter((c) => c.startsWith("shot")).length, failures }, null, 2));
  await browser.close();
  if (failures.length) process.exit(1);
})();
