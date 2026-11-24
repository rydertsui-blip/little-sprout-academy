const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/redesign");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const checks = [], failures = [];

function seedFor(sessionId, questionIds) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  seed.children[0].activeSessions.math = {
    id: `seed-math-${sessionId}`,
    childId: seed.children[0].id,
    subject: "math",
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
  const inputs = await page.evaluate(() => document.querySelectorAll("input, textarea, [contenteditable='true']").length);
  if (inputs !== 0) failures.push(`${label}: child screen has ${inputs} keyboard inputs`);
  checks.push(`${label}: layout checked, no keyboard inputs`);
}
async function answerCorrect(page) {
  await tap(page.locator("button[data-correct='true']").first());
  await page.waitForSelector("[data-testid=answer-feedback]", { timeout: 15000 });
}
async function next(page) {
  await tap(page.getByRole("button", { name: /Next question|下一题/ }));
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
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
async function openMath(page) {
  await page.getByRole("button", { name: /数学 Math/ }).first().click();
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
}
async function captureQuestion(page, label, wide, phone, requiredTexts = [], requiredTestIds = []) {
  await assertLayout(page, label);
  const prompt = await page.getByTestId("question-prompt").innerText();
  if (!prompt.length) failures.push(`${label}: empty prompt`);
  for (const text of requiredTexts) {
    if (!(await page.getByText(text, { exact: false }).count())) failures.push(`${label}: missing visual text ${text}`);
  }
  for (const testId of requiredTestIds) {
    if (!(await page.getByTestId(testId).count())) failures.push(`${label}: missing visual ${testId}`);
  }
  await shot(page, wide);
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, `${label} phone`);
  await shot(page, phone);
  await page.setViewportSize({ width: 1180, height: 820 });
}
async function finishSix(page, label, resultShot) {
  await tap(page.getByRole("button", { name: /Next question|下一题/ }));
  await page.waitForSelector(".result-screen", { timeout: 15000 });
  await assertLayout(page, `${label} result`);
  const stats = await page.locator(".result-stats").innerText();
  if (!stats.includes("6/6") && !stats.includes("5/6")) failures.push(`${label}: result stats ${stats}, expected 5/6 or 6/6`);
  if (!(await page.locator(".result-reward").count())) failures.push(`${label}: result reward missing`);
  await shot(page, resultShot);
  await tap(page.getByRole("button", { name: /Back to learning|回到学习区/ }));
  await page.waitForSelector("text=跟小芽开始", { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  await context.grantPermissions(["microphone"], { origin: "http://127.0.0.1:4186" });
  const page = await context.newPage();
  page.on("pageerror", (e) => failures.push(`pageerror: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) failures.push(`http ${r.status()}: ${r.url()}`); });
  page.on("console", (m) => { if (m.type() === "error") failures.push(`console: ${m.text()}`); });

  // Length: ruler segment, then comparison bars.
  await openProfile(page, seedFor("math-length-measure", ["q-math-length-measure-1", "q-math-length-measure-8", "q-math-length-measure-13", "q-math-length-measure-14", "q-math-length-measure-15", "q-math-length-measure-17"]));
  await openMath(page);
  const lengthChip = await page.locator(".quiz-skill-chip").innerText();
  if (!lengthChip.includes("Length in")) failures.push(`length: chip is ${lengthChip}`);
  await captureQuestion(page, "Length ruler", "81-wide-length-ruler.png", "82-phone-length-ruler.png", ["Read the marked segment on the ruler."], ["ruler-visual"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Length ruler offset", "83-wide-length-offset.png", "84-phone-length-offset.png", ["5 cm", "12 cm"], ["ruler-visual"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Length bars", "85-wide-length-bars.png", "86-phone-length-bars.png", ["20 cm", "7 cm"], ["length-bars"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Length", "87-wide-length-result.png");

  // Fractions: addition, subtraction and twelfths.
  await openProfile(page, seedFor("math-fractions-add-sub", ["q-math-fractions-add-sub-1", "q-math-fractions-add-sub-3", "q-math-fractions-add-sub-15", "q-math-fractions-add-sub-7", "q-math-fractions-add-sub-10", "q-math-fractions-add-sub-16"]));
  await openMath(page);
  const fractionChip = await page.locator(".quiz-skill-chip").innerText();
  if (!fractionChip.includes("fractions")) failures.push(`fractions: chip is ${fractionChip}`);
  await captureQuestion(page, "Fraction addition", "88-wide-fraction-add.png", "89-phone-fraction-add.png", ["1/5", "2/5"], ["fraction-pairs", "fraction-card"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Fraction subtraction", "90-wide-fraction-sub.png", "91-phone-fraction-sub.png", ["take away"], ["fraction-pairs", "fraction-card"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Fraction twelfths", "92-wide-fraction-twelfths.png", "93-phone-fraction-twelfths.png", ["9/12", "5/12"], ["fraction-pairs", "fraction-card"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Fractions", "94-wide-fraction-result.png");

  // Units: option cards, quantities and conversion.
  await openProfile(page, seedFor("math-measurement-units", ["q-math-measurement-units-1", "q-math-measurement-units-4", "q-math-measurement-units-10", "q-math-measurement-units-14", "q-math-measurement-units-17", "q-math-measurement-units-5"]));
  await openMath(page);
  const unitChip = await page.locator(".quiz-skill-chip").innerText();
  if (!unitChip.includes("mass")) failures.push(`units: chip is ${unitChip}`);
  await captureQuestion(page, "Unit options", "95-wide-unit-options.png", "96-phone-unit-options.png", ["grams", "metres"], ["unit-cards"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Unit quantities", "97-wide-unit-quantities.png", "98-phone-unit-quantities.png", ["5 kg", "3 kg"], ["unit-quantities"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Unit conversion", "99-wide-unit-conversion.png", "100-phone-unit-conversion.png", ["1 m", "100 cm"], ["unit-conversion"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Units", "101-wide-unit-result.png");

  await browser.close();
  fs.writeFileSync(path.join(ROOT, "family-audit/math-tools-batch2-audit.json"), JSON.stringify({ checks, failures }, null, 2));
  console.log(JSON.stringify({ checks: checks.length, failures }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
