const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/redesign");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const checks = [], failures = [];

function seedFor(subject, questionIds) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  seed.children[0].activeSessions[subject] = {
    id: `seed-far-${subject}-${questionIds[0]}`,
    childId: seed.children[0].id,
    subject,
    kind: "practice",
    length: questionIds.length,
    startedAt: "2026-11-24T10:00:00.000Z",
    completedAt: null,
    plannedQuestionIds: questionIds,
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
  await page.waitForTimeout(250);
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

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`http ${response.status()}: ${response.url()}`); });
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });

  await openProfile(page, seedFor("english", ["q-far-english-listening", "q-far-k2-english-listen"]));
  await page.getByRole("button", { name: /英语 English/ }).click();
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
  const englishPrompt = await page.getByTestId("question-prompt").innerText();
  for (const leak of ["cat", "red"]) if (englishPrompt.toLowerCase().includes(leak)) failures.push(`English far listening prompt reveals ${leak}: ${englishPrompt}`);
  if (await page.locator(".question-passage").count()) failures.push("English far listening still renders a passage");
  if (!(await page.getByRole("button", { name: "Listen" }).count())) failures.push("English far listening has no Listen button");
  await assertLayout(page, "English far listening");
  await shot(page, "179-wide-far-listening.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, "English far listening phone");
  await shot(page, "180-phone-far-listening.png");
  await page.setViewportSize({ width: 1180, height: 820 });

  await openProfile(page, seedFor("mandarin", ["q-far-k2-mandarin-listen", "q-far-mandarin-listening"]));
  await page.getByRole("button", { name: /华文 Mandarin/ }).click();
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
  const mandarinPrompt = await page.getByTestId("question-prompt").innerText();
  for (const leak of ["桌上", "书"]) if (mandarinPrompt.includes(leak)) failures.push(`Mandarin far listening prompt reveals ${leak}: ${mandarinPrompt}`);
  if (await page.locator(".question-passage").count()) failures.push("Mandarin far listening still renders a passage");
  if (!(await page.getByRole("button", { name: "听声音" }).count())) failures.push("Mandarin far listening has no 听声音 button");
  await assertLayout(page, "Mandarin far listening");
  await shot(page, "181-wide-far-listening-mandarin.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, "Mandarin far listening phone");
  await shot(page, "182-phone-far-listening-mandarin.png");

  console.log(JSON.stringify({ checks, failures }, null, 2));
  await browser.close();
  if (failures.length) process.exit(1);
})();
