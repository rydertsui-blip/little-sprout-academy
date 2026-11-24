const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/redesign");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const checks = [], failures = [];
let browser;

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
  const broken = await page.evaluate(() => [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.getAttribute("src")));
  if (broken.length) failures.push(`${label}: broken images: ${broken.join(", ")}`);
  const inputs = await page.evaluate(() => document.querySelectorAll("input, textarea, [contenteditable='true']").length);
  if (inputs !== 0) failures.push(`${label}: child screen has ${inputs} keyboard inputs`);
  checks.push(`${label}: layout checked, no keyboard inputs`);
}
async function openSubject(page, name) {
  await page.getByRole("button", { name: new RegExp(name) }).first().click();
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
}
async function backHome(page) {
  const back = page.getByRole("button", { name: /Back to learning|回到学习区/ });
  await tap(back);
  await page.waitForSelector("text=跟小芽开始", { timeout: 15000 });
}
async function capture(page, label, chipText, wide, phone) {
  const chip = await page.locator(".quiz-skill-chip").innerText();
  if (!chip.includes(chipText)) failures.push(`${label}: chip is ${chip}, expected ${chipText}`);
  await assertLayout(page, label);
  await shot(page, wide);
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, `${label} phone`);
  await shot(page, phone);
  await page.setViewportSize({ width: 1180, height: 820 });
}
async function answerCorrect(page) {
  await tap(page.locator("button[data-correct='true']").first());
  await page.waitForSelector("[data-testid=answer-feedback]", { timeout: 15000 });
}
async function next(page) {
  await tap(page.getByRole("button", { name: /Next question|下一题/ }));
}
async function completeSix(page, label, firstWasRetry = false) {
  for (let index = 0; index < 6; index += 1) {
    await answerCorrect(page);
    if (index === 0 && firstWasRetry) {
      const note = await page.getByTestId("answer-feedback").innerText();
      if (!/hint|提示|independent|不算/i.test(note)) failures.push(`${label}: hinted feedback lacks hint note: ${note}`);
    }
    if (index < 5) {
      await next(page);
      await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
    }
  }
  await next(page);
  await page.waitForSelector(".result-screen", { timeout: 15000 });
}
async function captureResult(page, label, shotWide, expectedScore, phoneShot = null) {
  await assertLayout(page, `${label} result`);
  const stats = await page.locator(".result-stats").innerText();
  if (!stats.includes(expectedScore) && !(expectedScore === "6/6" && stats.includes("5/6"))) failures.push(`${label}: result stats ${stats}, expected ${expectedScore}`);
  if (!(await page.locator(".result-reward").count())) failures.push(`${label}: result reward missing`);
  await shot(page, shotWide);
  if (phoneShot) {
    await page.setViewportSize({ width: 390, height: 844 });
    await assertLayout(page, `${label} result phone`);
    await shot(page, phoneShot);
    await page.setViewportSize({ width: 1180, height: 820 });
  }
  await backHome(page);
}

(async () => {
  browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore" });
  await context.grantPermissions(["microphone"], { origin: "http://127.0.0.1:4186" });
  const page = await context.newPage();
  page.on("pageerror", (e) => failures.push(`pageerror: ${e.message}`));
  page.on("response", (r) => { if (r.status() >= 400) failures.push(`http ${r.status()}: ${r.url()}`); });
  page.on("console", (m) => { if (m.type() === "error") failures.push(`console: ${m.text()}`); });
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
  await assertLayout(page, "P2 seed home");
  await shot(page, "50-wide-p2-seeded-home.png");

  await openSubject(page, "英语 English");
  await capture(page, "P2 listening comprehension", "Listening comprehension", "50-wide-p2-listening-comp.png", "51-phone-p2-listening-comp.png");
  await tap(page.locator("button[data-correct='false']").first());
  await page.waitForSelector("[data-testid=retry-feedback]", { timeout: 15000 });
  await assertLayout(page, "P2 listening retry");
  await shot(page, "56-wide-p2-listening-retry.png");
  await tap(page.getByRole("button", { name: /Try again|再试一次/ }));
  await answerCorrect(page);
  await assertLayout(page, "P2 listening feedback");
  await shot(page, "57-wide-p2-listening-feedback.png");
  await next(page);
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
  for (let index = 1; index < 6; index += 1) {
    await answerCorrect(page);
    if (index < 5) {
      await next(page);
      await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
    }
  }
  await next(page);
  await page.waitForSelector(".result-screen", { timeout: 15000 });
  await captureResult(page, "P2 listening comprehension", "58-wide-p2-listening-result.png", "5/6");

  await openSubject(page, "华文 Mandarin");
  await capture(page, "P2 Mandarin reading inference", "读文推断", "52-wide-p2-reading-inference.png", "53-phone-p2-reading-inference.png");
  await completeSix(page, "P2 Mandarin reading inference");
  await captureResult(page, "P2 Mandarin reading inference", "59-wide-p2-reading-result.png", "6/6");

  await openSubject(page, "数学 Math");
  await capture(page, "P2 time duration", "Time and duration", "54-wide-p2-time-duration.png", "55-phone-p2-time-duration.png");
  const timeline = await page.locator(".duration-visual").innerText();
  if (!timeline.includes("2:00") || !timeline.includes("3:00") || !timeline.includes("?")) failures.push(`time line mismatch: ${timeline}`);
  await completeSix(page, "P2 time duration");
  await captureResult(page, "P2 time duration", "60-wide-p2-time-result.png", "6/6", "61-phone-p2-time-result.png");

  await browser.close();
  console.log(JSON.stringify({ checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(async (e) => { console.error(e); if (browser) await browser.close().catch(()=>{}); process.exitCode = 1; });
