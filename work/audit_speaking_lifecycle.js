const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/redesign");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const checks = [], failures = [];

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
async function openProfile(page) {
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
async function assertLayout(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) failures.push(`${label}: horizontal overflow ${overflow}px`);
  const small = await page.evaluate(() => [...document.querySelectorAll("button, summary")].filter((el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40);
  }).map((el) => ({ text: el.textContent.trim().slice(0, 30), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) })));
  if (small.length) failures.push(`${label}: touch targets below 40px: ${JSON.stringify(small)}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`http ${response.status()}: ${response.url()}`); });
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });
  await page.addInitScript(() => {
    window.__playCount = 0;
    window.__pauseCount = 0;
    const originalPlay = HTMLMediaElement.prototype.play;
    const originalPause = HTMLMediaElement.prototype.pause;
    HTMLMediaElement.prototype.play = function (...args) {
      window.__playCount += 1;
      return originalPlay.apply(this, args);
    };
    HTMLMediaElement.prototype.pause = function (...args) {
      window.__pauseCount += 1;
      return originalPause.apply(this, args);
    };
  });

  await openProfile(page);
  await page.getByRole("button", { name: /声音小游戏/ }).click();
  await page.waitForSelector(".speaking-screen", { timeout: 15000 });
  await page.waitForTimeout(900);
  const countAfterOpen = await page.evaluate(() => window.__playCount);
  if (countAfterOpen > 1) failures.push(`Speaking: ${countAfterOpen} audio plays after open; expected only the intro`);
  await assertLayout(page, "Speaking idle");
  await shot(page, "176-wide-speaking-idle.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, "Speaking idle phone");
  await shot(page, "177-phone-speaking-idle.png");
  await page.setViewportSize({ width: 1180, height: 820 });

  await tap(page.getByRole("button", { name: /听示范/ }));
  await page.waitForTimeout(500);
  const countAfterDemo = await page.evaluate(() => window.__playCount);
  if (countAfterDemo <= countAfterOpen) failures.push("Speaking: demonstration did not play on tap");

  await tap(page.getByRole("button", { name: "开始说" }));
  await page.waitForTimeout(500);
  await tap(page.getByRole("button", { name: "停止录音" }));
  await page.waitForSelector("text=录好了", { timeout: 15000 });
  await shot(page, "178-wide-speaking-recorded.png");
  await tap(page.getByRole("button", { name: "听自己" }));
  await page.waitForTimeout(200);
  const countAfterPlay = await page.evaluate(() => window.__playCount);
  if (countAfterPlay <= countAfterDemo) failures.push("Speaking: recorded audio did not play on tap");
  const stateAfterPlay = await page.locator(".speaking-teacher strong").innerText();
  if (stateAfterPlay.includes("无法回放")) failures.push(`Speaking: recorded playback failed with ${stateAfterPlay}`);

  // Hide the tab: playback must be paused and the UI must leave the playing state.
  const pauseBeforeHide = await page.evaluate(() => window.__pauseCount);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(200);
  const pauseAfterHide = await page.evaluate(() => window.__pauseCount);
  if (pauseAfterHide <= pauseBeforeHide) failures.push("Speaking: hiding the tab did not pause audio");
  const hiddenState = await page.locator(".speaking-teacher strong").innerText();
  if (hiddenState.includes("正在播放")) failures.push("Speaking: playback continued while tab hidden");
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
  });

  console.log(JSON.stringify({ checks, failures }, null, 2));
  await browser.close();
  if (failures.length) process.exit(1);
})();
