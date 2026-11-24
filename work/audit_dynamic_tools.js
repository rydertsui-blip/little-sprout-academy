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
async function captureQuestion(page, label, wide, phone, requiredTexts = []) {
  await assertLayout(page, label);
  const prompt = await page.getByTestId("question-prompt").innerText();
  if (!prompt.length) failures.push(`${label}: empty prompt`);
  for (const text of requiredTexts) {
    if (!(await page.getByText(text, { exact: false }).count())) failures.push(`${label}: missing visual text ${text}`);
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

  // Time: first question and a crossing-the-hour question.
  await openProfile(page, seedFor("math-time", ["q-math-time-1", "q-math-time-6", "q-math-time-9", "q-math-time-16", "q-math-time-11", "q-far-math-time"]));
  await openMath(page);
  const timeChip = await page.locator(".quiz-skill-chip").innerText();
  if (!timeChip.includes("Time")) failures.push(`time: chip is ${timeChip}`);
  await captureQuestion(page, "Time clock", "62-wide-math-time-clock.png", "63-phone-math-time-clock.png", ["Read the hour and minute hands."]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Time crossing hour", "64-wide-math-time-cross-hour.png", "65-phone-math-time-cross-hour.png", ["5:50"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Time", "66-wide-math-time-result.png");

  // Money: amount card, difference equation, less-than question.
  await openProfile(page, seedFor("math-money", ["q-math-money-1", "q-math-money-10", "q-math-money-11", "q-math-money-14", "q-math-money-15", "q-math-money-6"]));
  await openMath(page);
  const moneyChip = await page.locator(".quiz-skill-chip").innerText();
  if (!moneyChip.includes("Money")) failures.push(`money: chip is ${moneyChip}`);
  await captureQuestion(page, "Money amount", "67-wide-math-money-amount.png", "68-phone-math-money-amount.png", ["$3.50", "? cents"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Money difference", "69-wide-math-money-equation.png", "70-phone-math-money-equation.png", ["$5.50", "$4.80", "?"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Money change", "71-wide-math-money-change.png", "72-phone-math-money-change.png", ["$5.00", "$3.40", "?"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Money", "73-wide-math-money-result.png");

  // Graph: two-row and three-row picture graphs, then a totals question.
  await openProfile(page, seedFor("math-picture-graph", ["q-math-picture-graph-1", "q-math-picture-graph-3", "q-math-picture-graph-11", "q-math-picture-graph-17", "q-math-picture-graph-14", "q-math-picture-graph-7"]));
  await openMath(page);
  const graphChip = await page.locator(".quiz-skill-chip").innerText();
  if (!graphChip.includes("graphs")) failures.push(`graph: chip is ${graphChip}`);
  await captureQuestion(page, "Graph two rows", "74-wide-math-graph-two-rows.png", "75-phone-math-graph-two-rows.png", ["Apples", "Pears"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Graph colour rows", "79-wide-math-graph-colour-rows.png", "80-phone-math-graph-colour-rows.png", ["Red cars", "Blue cars"]);
  await answerCorrect(page); await next(page);
  await captureQuestion(page, "Graph three rows", "76-wide-math-graph-three-rows.png", "77-phone-math-graph-three-rows.png", ["Stars", "Moons", "Suns"]);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page); await next(page);
  await answerCorrect(page);
  await finishSix(page, "Graph", "78-wide-math-graph-result.png");

  await browser.close();
  fs.writeFileSync(path.join(ROOT, "family-audit/dynamic-tools-audit.json"), JSON.stringify({ checks, failures }, null, 2));
  console.log(JSON.stringify({ checks: checks.length, failures }, null, 2));
})().catch((error) => { console.error(error); process.exit(1); });
