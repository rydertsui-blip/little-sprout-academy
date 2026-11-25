const { chromium, webkit } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const BASE = "http://127.0.0.1:4186/family/";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = process.env.SHOTS || "/Users/rydertsui/Desktop/幼儿学习天地/work/family-audit/connector-motion";
const questionId = "q-match-mandarin-1";
const seedBase = JSON.parse(fs.readFileSync("/Users/rydertsui/Desktop/幼儿学习天地/work/new-content-seed.json", "utf8"));

function makeSeed() {
  const seed = JSON.parse(JSON.stringify(seedBase));
  const child = seed.children[0];
  child.name = "小果";
  child.sessions = [];
  child.attempts = [];
  child.evidence = {};
  child.diagnostics = {};
  child.gradeLevel = "K2";
  child.ageYears = 5;
  child.levelConfirmedOn = "2026-11-25";
  child.rewards.lifetimeStars = 0;
  child.activeSessions = {
    mandarin: {
      id: "audit-match-connector",
      childId: child.id,
      subject: "mandarin",
      kind: "practice",
      length: 1,
      startedAt: "2026-11-25T00:00:00.000Z",
      completedAt: null,
      plannedQuestionIds: [questionId],
      attempts: [],
      summary: [],
    },
  };
  return seed;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = process.env.BROWSER === "webkit" ? await webkit.launch({ headless: true, executablePath: process.env.WEBKIT_BIN || "/Users/rydertsui/Library/Caches/ms-playwright/webkit-2388/pw_run.sh" }) : await chromium.launch({ headless: true, executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.addInitScript((data) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(data)), makeSeed());
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
    await page.getByLabel("家长密码").fill("2468");
    await page.getByRole("button", { name: "打开家庭学习区" }).click();
  }
  await page.getByRole("button", { name: /的学习档案/ }).first().click();
  await page.waitForSelector("text=跟小芽开始", { timeout: 12000 });
  await page.locator(".subject-card.mandarin-course").click();
  await page.waitForSelector(`[data-question-id="${questionId}"]`, { timeout: 12000 });

  const pairs = await page.locator('[data-match-side="left"]').evaluateAll((els) => els.map((el) => el.getAttribute("data-pair-id")));
  for (const pairId of pairs) {
    await page.locator(`[data-match-side="left"][data-pair-id="${pairId}"]`).click();
    await page.locator(`[data-match-side="right"][data-pair-id="${pairId}"]`).click();
  }
  await page.waitForSelector(".match-connectors", { timeout: 12000 });
  await page.waitForTimeout(70);
  await page.screenshot({ path: path.join(OUT, "connectors-390x844-early.png"), fullPage: true });
  const early = await page.locator(".match-connector-line").first().evaluate((el) => {
    const style = getComputedStyle(el);
    return { animationName: style.animationName, animationDuration: style.animationDuration, offset: style.strokeDashoffset, animations: el.getAnimations().map((animation) => ({ playState: animation.playState, currentTime: animation.currentTime, duration: animation.effect?.getTiming().duration })) };
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "connectors-390x844-final.png"), fullPage: true });
  const final = await page.locator(".match-connector-line").first().evaluate((el) => {
    const style = getComputedStyle(el);
    return { animationName: style.animationName, offset: style.strokeDashoffset, animationCount: el.getAnimations().length };
  });
  const paths = await page.locator(".match-connector-line").evaluateAll((els) => els.map((el) => ({ stroke: el.getAttribute("stroke"), d: el.getAttribute("d") })));
  console.log(JSON.stringify({ early, final, paths, failures }, null, 2));
  await browser.close();
  if (failures.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exitCode = 1; });
