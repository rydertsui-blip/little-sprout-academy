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
async function captureQuestion(page, label, wide, phone, requiredTexts = [], requiredTestIds = [], requiredSelectors = []) {
  await assertLayout(page, label);
  const prompt = await page.getByTestId("question-prompt").innerText();
  if (!prompt.length) failures.push(`${label}: empty prompt`);
  for (const text of requiredTexts) {
    if (!(await page.getByText(text, { exact: false }).count())) failures.push(`${label}: missing visual text ${text}`);
  }
  for (const testId of requiredTestIds) {
    if (!(await page.getByTestId(testId).count())) failures.push(`${label}: missing visual ${testId}`);
  }
  for (const selector of requiredSelectors) {
    if (!(await page.locator(selector).count())) failures.push(`${label}: missing visual ${selector}`);
  }
  await shot(page, wide);
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, `${label} phone`);
  await shot(page, phone);
  await page.setViewportSize({ width: 1180, height: 820 });
}
async function finishSix(page, label, resultWide, resultPhone) {
  await tap(page.getByRole("button", { name: /Next question|下一题/ }));
  await page.waitForSelector(".result-screen", { timeout: 15000 });
  await assertLayout(page, `${label} result`);
  const stats = await page.locator(".result-stats").innerText();
  if (!stats.includes("6/6") && !stats.includes("5/6")) failures.push(`${label}: result stats ${stats}, expected 5/6 or 6/6`);
  if (!(await page.locator(".result-reward").count())) failures.push(`${label}: result reward missing`);
  await shot(page, resultWide);
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, `${label} result phone`);
  await shot(page, resultPhone);
  await page.setViewportSize({ width: 1180, height: 820 });
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

  // Place value: target digit, expanded form and digit value.
  await openProfile(page, seedFor("math-place-value-1000", [
    "q-math-place-value-1000-12", "q-math-place-value-1000-14", "q-math-place-value-1000-15",
    "q-math-place-value-1000-1", "q-math-place-value-1000-10", "q-math-place-value-1000-16"
  ]));
  await openMath(page);
  const placeChip = await page.locator(".quiz-skill-chip").innerText();
  if (!/Numbers to 1000/i.test(placeChip)) failures.push(`place value: chip is ${placeChip}`);
  await captureQuestion(page, "Place value tens chart", "102-wide-place-value-tens.png", "103-phone-place-value-tens.png", ["Tens"], ["place-value-chart"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Place value expanded form", "104-wide-place-value-expanded.png", "105-phone-place-value-expanded.png", ["800", "30", "7"], ["expanded-form"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Place value digit value", "106-wide-place-value-digit-value.png", "107-phone-place-value-digit-value.png", ["Tens", "× 10"], ["place-value-chart"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Place value", "108-wide-place-value-result.png", "109-phone-place-value-result.png");

  // Regrouping: addition, subtraction and a story bar model.
  await openProfile(page, seedFor("math-add-sub-regroup", [
    "q-math-add-sub-regroup-12", "q-math-add-sub-regroup-13", "q-math-add-sub-regroup-16",
    "q-math-add-sub-regroup-14", "q-math-add-sub-regroup-15", "q-math-add-sub-regroup-11"
  ]));
  await openMath(page);
  const regroupChip = await page.locator(".quiz-skill-chip").innerText();
  if (!/Renaming add and subtract/i.test(regroupChip)) failures.push(`regroup: chip is ${regroupChip}`);
  await captureQuestion(page, "Regroup add jump", "110-wide-regroup-add-jump.png", "111-phone-regroup-add-jump.png", ["+ 26", "Start at 57"], ["jump-number-line"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Regroup subtract jump", "112-wide-regroup-sub-jump.png", "113-phone-regroup-sub-jump.png", ["− 38", "Start at 74"], ["jump-number-line"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Regroup story bar", "114-wide-regroup-story-bar.png", "115-phone-regroup-story-bar.png", ["48", "27"], [], [".bar-model-visual"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Regroup", "116-wide-regroup-result.png", "117-phone-regroup-result.png");

  // Three-digit: add, subtract and decomposition.
  await openProfile(page, seedFor("math-add-sub-1000", [
    "q-math-add-sub-1000-12", "q-math-add-sub-1000-13", "q-math-add-sub-1000-15",
    "q-math-add-sub-1000-14", "q-math-add-sub-1000-16", "q-math-add-sub-1000-5"
  ]));
  await openMath(page);
  const thousandChip = await page.locator(".quiz-skill-chip").innerText();
  if (!/Add and subtract to 1000/i.test(thousandChip)) failures.push(`1000: chip is ${thousandChip}`);
  await captureQuestion(page, "Three-digit add jump", "118-wide-three-digit-add-jump.png", "119-phone-three-digit-add-jump.png", ["+ 245", "Start at 367"], ["jump-number-line"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Three-digit subtract jump", "120-wide-three-digit-sub-jump.png", "121-phone-three-digit-sub-jump.png", ["− 357", "Start at 804"], ["jump-number-line"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Three-digit decomposition jump", "122-wide-three-digit-decomp-jump.png", "123-phone-three-digit-decomp-jump.png", ["+ 70", "Start at 600"], ["jump-number-line"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Three-digit", "124-wide-three-digit-result.png", "125-phone-three-digit-result.png");

  await browser.close();
  fs.writeFileSync(path.join(ROOT, "family-audit/math-tools-batch3-audit.json"), JSON.stringify({ checks, failures }, null, 2));
  console.log(JSON.stringify({ checks: checks.length, failures }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
