const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/redesign");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const checks = [], failures = [];

function seedFor(subject, sessionId, questionIds) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  seed.children[0].activeSessions[subject] = {
    id: `seed-${subject}-${sessionId}`,
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
async function openSubject(page, name) {
  await page.getByRole("button", { name }).first().click();
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

  // English sentence order: baseline and new longer sentences.
  await openProfile(page, seedFor("english", "english-sentence-order", [
    "q-english-sentence-order-1", "q-english-sentence-order-7", "q-english-sentence-order-13",
    "q-english-sentence-order-14", "q-english-sentence-order-15", "q-english-sentence-order-17"
  ]));
  await openSubject(page, /英语 English/);
  const sentenceChip = await page.locator(".quiz-skill-chip").innerText();
  if (!/Sentence order/i.test(sentenceChip)) failures.push(`sentence order: chip is ${sentenceChip}`);
  await captureQuestion(page, "Sentence order first", "126-wide-sentence-order-first.png", "127-phone-sentence-order-first.png", ["The cat is small."], ["sentence-tiles"], [".answer-option"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Sentence order longer", "128-wide-sentence-order-longer.png", "129-phone-sentence-order-longer.png", ["The boy is riding a bike."], ["sentence-tiles"], [".answer-option"]);
  if (await page.getByText("Math tool").count()) failures.push("sentence order: unexpected math tool");
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Sentence order", "130-wide-sentence-order-result.png", "131-phone-sentence-order-result.png");

  // Division: equation, sharing, array, fact family, new equation and far story.
  await openProfile(page, seedFor("math", "math-divide-tables", [
    "q-math-divide-tables-1", "q-math-divide-tables-7", "q-math-divide-tables-9",
    "q-math-divide-tables-11", "q-math-divide-tables-12", "q-far-math-divide-tables"
  ]));
  await openSubject(page, /数学 Math/);
  const divisionChip = await page.locator(".quiz-skill-chip").innerText();
  if (!/Division/i.test(divisionChip)) failures.push(`division: chip is ${divisionChip}`);
  await captureQuestion(page, "Division equation", "132-wide-division-equation.png", "133-phone-division-equation.png", ["2 equal groups"], ["division-board"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Division sharing", "134-wide-division-sharing.png", "135-phone-division-sharing.png", ["3 equal groups"], ["division-board"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Division array", "136-wide-division-array.png", "137-phone-division-array.png", ["3 equal groups"], ["division-board"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Division fact family", "138-wide-division-fact-family.png", "139-phone-division-fact-family.png", ["5 equal groups"], ["division-board"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Division far story", "140-wide-division-far-story.png", "141-phone-division-far-story.png", ["4 equal groups", "2 eaten from one group"], ["division-board"]);
  await answerCorrect(page);
  await finishSix(page, "Division", "142-wide-division-result.png", "143-phone-division-result.png");

  // Fractions: whole, set, tenths, fifths, equal parts and pizza remainder.
  await openProfile(page, seedFor("math", "math-fractions", [
    "q-math-fractions-1", "q-math-fractions-7", "q-math-fractions-12",
    "q-math-fractions-13", "q-math-fractions-16", "q-far-math-fractions"
  ]));
  await openSubject(page, /数学 Math/);
  const fractionChip = await page.locator(".quiz-skill-chip").innerText();
  if (!/Fractions/i.test(fractionChip)) failures.push(`fractions: chip is ${fractionChip}`);
  await captureQuestion(page, "Fraction whole quarters", "144-wide-fraction-whole-quarters.png", "145-phone-fraction-whole-quarters.png", ["One part is shaded."], ["fraction-whole-board"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Fraction of a set", "146-wide-fraction-set.png", "147-phone-fraction-set.png", ["1 of 2 equal groups"], ["fraction-set-board"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Fraction tenths", "148-wide-fraction-tenths.png", "149-phone-fraction-tenths.png", ["One part is shaded."], ["fraction-whole-board"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Fraction fifths of set", "150-wide-fraction-fifths.png", "151-phone-fraction-fifths.png", ["1 of 5 equal groups"], ["fraction-set-board"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Fraction tenths", "152-wide-fraction-equal-parts.png", "153-phone-fraction-equal-parts.png", ["One part is shaded."], ["fraction-whole-board"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Fraction pizza remainder", "154-wide-fraction-pizza.png", "155-phone-fraction-pizza.png", ["2 of 8 slices eaten"], ["fraction-whole-board"]);
  await answerCorrect(page);
  await finishSix(page, "Fractions", "156-wide-fraction-result.png", "157-phone-fraction-result.png");

  await browser.close();
  fs.writeFileSync(path.join(ROOT, "family-audit/batch4-content-tools-audit.json"), JSON.stringify({ checks, failures }, null, 2));
  console.log(JSON.stringify({ checks: checks.length, failures }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
