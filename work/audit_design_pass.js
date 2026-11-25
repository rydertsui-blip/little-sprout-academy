const { chromium, webkit } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = process.env.BASE || "http://127.0.0.1:5176/";
const SHOTS = process.env.SHOTS || path.join(ROOT, "family-audit/design-pass");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
fs.mkdirSync(SHOTS, { recursive: true });
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const questions = JSON.parse(fs.readFileSync("/tmp/all-questions.json", "utf8"));
const target = questions.find((question) => question.id === "q-match-mandarin-1");
const failures = [];

function cloneSeed(name = "小果") {
  const seed = JSON.parse(JSON.stringify(seedBase));
  const child = seed.children[0];
  child.name = name;
  child.sessions = [];
  child.attempts = [];
  child.evidence = {};
  child.activeSessions = {};
  child.diagnostics = {};
  child.gradeLevel = "K2";
  child.ageYears = 5;
  child.levelConfirmedOn = "2026-11-25";
  child.rewards.lifetimeStars = 0;
  return seed;
}

function seedWithMatch() {
  const seed = cloneSeed("小听");
  const child = seed.children[0];
  const session = {
    id: "audit-design-match",
    childId: child.id,
    subject: "mandarin",
    kind: "practice",
    length: 1,
    startedAt: "2026-11-25T10:00:00.000Z",
    completedAt: null,
    plannedQuestionIds: ["q-match-mandarin-1"],
    attempts: [],
    summary: []
  };
  child.activeSessions.mandarin = session;
  return seed;
}

async function openChild(page, seed) {
  await page.addInitScript((data) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(data)), seed);
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
    await page.getByLabel("家长密码").fill("2468");
    await page.getByRole("button", { name: "打开家庭学习区" }).click();
  }
  await page.getByRole("button", { name: /的学习档案/ }).first().waitFor({ state: "visible", timeout: 12000 });
  await page.getByRole("button", { name: /的学习档案/ }).first().click();
  await page.waitForSelector("text=跟小芽开始", { timeout: 12000 });
}

function rect(el) {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
}

async function inspectHome(page) {
  return page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      docHeight: document.documentElement.scrollHeight,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      trail: rect(document.querySelector(".island-trail")),
      trailStops: [...document.querySelectorAll(".island-trail-stop")].map((el) => rect(el)),
      cards: [...document.querySelectorAll(".subject-card")].map((el) => rect(el)),
      todayTags: [...document.querySelectorAll(".today-tag")].map((el) => ({ text: el.textContent, ...rect(el) })),
      buttonsUnder44: [...document.querySelectorAll("button, summary")].filter((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
      }).map((el) => ({ text: (el.textContent || "").trim().slice(0, 30), ...rect(el) }))
    };
  });
}

async function inspectFeedback(page) {
  return page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      docHeight: document.documentElement.scrollHeight,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      stage: rect(document.querySelector(".quiz-stage")),
      prompt: rect(document.querySelector("[data-testid=question-prompt]")),
      feedback: rect(document.querySelector("[data-testid=answer-feedback]")),
      next: rect([...document.querySelectorAll("button")].find((el) => (el.textContent || "").includes("下一题"))),
      mascot: rect(document.querySelector("[data-testid=feedback-mascot]")),
      matchStatus: rect(document.querySelector(".match-status")),
      isFeedback: Boolean(document.querySelector(".quiz-layout.is-feedback")),
      visibleText: [...document.querySelectorAll("[data-testid=answer-feedback] p, [data-testid=answer-feedback] .feedback-title")].map((el) => (el.textContent || "").trim()).filter(Boolean)
    };
  });
}

async function answerMatch(page) {
  for (const pair of target.pairs) {
    const left = page.locator(`[data-match-side="left"][data-pair-id="${pair.id}"]`);
    const right = page.locator(`[data-match-side="right"][data-pair-id="${pair.id}"]`);
    await left.waitFor({ state: "visible" });
    await left.click();
    await right.waitFor({ state: "visible" });
    await right.click();
  }
  await page.getByTestId("answer-feedback").waitFor({ state: "visible", timeout: 12000 });
  await page.waitForTimeout(800);
}

async function shotHome(browser, width, height, name) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`${name} pageerror: ${error.message}`));
  await openChild(page, cloneSeed());
  await page.waitForTimeout(300);
  const info = await inspectHome(page);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), animations: "disabled" });
  await page.screenshot({ path: path.join(SHOTS, `${name}-full.png`), fullPage: true, animations: "disabled" });
  await context.close();
  return info;
}

async function shotFeedback(browser, width, height, name) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`${name} pageerror: ${error.message}`));
  await openChild(page, seedWithMatch());
  await page.locator(".subject-card.mandarin-course").click();
  await page.getByTestId("question-prompt").waitFor({ state: "visible", timeout: 12000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(SHOTS, `${name}-initial.png`), animations: "disabled" });
  await answerMatch(page);
  const info = await inspectFeedback(page);
  await page.screenshot({ path: path.join(SHOTS, `${name}-feedback.png`), animations: "disabled" });
  await page.screenshot({ path: path.join(SHOTS, `${name}-feedback-full.png`), fullPage: true, animations: "disabled" });
  await context.close();
  return info;
}

(async () => {
  console.log("launching browser");
  const browser = process.env.BROWSER === "webkit" ? await webkit.launch({ headless: true, executablePath: process.env.WEBKIT_BIN || "/Users/rydertsui/Library/Caches/ms-playwright/webkit-2388/pw_run.sh" }) : await chromium.launch({ executablePath: CHROME, headless: true });
  console.log("browser ready");
  console.log("home phone");
  const homePhone = await shotHome(browser, 390, 844, "home-390x844");
  console.log("home wide");
  const homeWide = await shotHome(browser, 1024, 768, "home-1024x768");
  console.log("feedback phone");
  const feedbackPhone = await shotFeedback(browser, 390, 844, "match-feedback-390x844");
  console.log("feedback wide");
  const feedbackWide = await shotFeedback(browser, 1024, 768, "match-feedback-1024x768");
  await browser.close();
  console.log("browser closed");
  const report = { homePhone, homeWide, feedbackPhone, feedbackWide, failures };
  fs.writeFileSync(path.join(SHOTS, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
