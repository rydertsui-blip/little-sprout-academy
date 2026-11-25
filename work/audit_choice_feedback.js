const { chromium, webkit } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");

const BASE = process.env.BASE || "http://127.0.0.1:5176/";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SHOTS = process.env.SHOTS || "/Users/rydertsui/Desktop/幼儿学习天地/work/family-audit/design-choice";
const seedBase = JSON.parse(fs.readFileSync("/Users/rydertsui/Desktop/幼儿学习天地/work/new-content-seed.json", "utf8"));
const QUESTION_ID = "q-math-multiply-tables-7";
const failures = [];
fs.mkdirSync(SHOTS, { recursive: true });

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
    math: {
      id: "seed-math-choice-check",
      childId: child.id,
      subject: "math",
      kind: "practice",
      length: 1,
      startedAt: "2026-11-25T00:00:00.000Z",
      completedAt: null,
      plannedQuestionIds: [QUESTION_ID],
      attempts: [],
      summary: [],
    },
  };
  return seed;
}

async function openChild(page) {
  const seed = makeSeed();
  await page.addInitScript((data) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(data)), seed);
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
    await page.getByLabel("家长密码").fill("2468");
    await page.getByRole("button", { name: "打开家庭学习区" }).click();
  }
  await page.getByRole("button", { name: /的学习档案/ }).first().waitFor({ state: "visible", timeout: 12000 });
  await page.getByRole("button", { name: /的学习档案/ }).first().click();
  await page.waitForSelector("text=跟小芽开始", { timeout: 12000 });
  await page.getByRole("button", { name: /跟小芽开始/ }).click();
}

async function shot(browser, width, height, name, mismatch = false) {
  const context = await browser.newContext({
    viewport: { width, height },
    isMobile: width < 768,
    hasTouch: width < 768,
    locale: "zh-SG",
    timezoneId: "Asia/Singapore",
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`${name}: ${error.message}`));
  await openChild(page);
  await page.waitForSelector(`[data-question-id="${QUESTION_ID}"]`, { timeout: 12000 });
  const answer = page.locator(".answer-option").filter({ hasText: mismatch ? "10" : "12" }).first();
  if (!(await answer.count())) throw new Error(`${name}: answer option not found`);
  await answer.click();
  await page.waitForSelector(".quiz-layout.is-feedback", { timeout: 15000 });
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true });
  const metrics = await page.evaluate(() => {
    const rect = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const visible = (selector) => {
      const el = document.querySelector(selector);
      return Boolean(el && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
    };
    const buttons = [...document.querySelectorAll("button")].filter((button) => {
      const style = getComputedStyle(button);
      return button.getClientRects().length && style.visibility !== "hidden";
    }).map((button) => {
      const r = button.getBoundingClientRect();
      return { text: (button.innerText || "").trim().slice(0, 30), width: Math.round(r.width), height: Math.round(r.height) };
    });
    return {
      viewport: { width: innerWidth, height: innerHeight },
      docHeight: Math.round(document.documentElement.scrollHeight),
      stage: rect(".quiz-stage"),
      tool: rect(".math-tool"),
      toolVisible: visible(".math-tool"),
      answerPanel: rect(".answer-panel"),
      feedback: rect(".answer-feedback"),
      next: rect(".answer-feedback .wide-button"),
      isFeedback: document.querySelector(".quiz-layout")?.classList.contains("is-feedback"),
      buttonsUnder44: buttons.filter((button) => button.width < 44 || button.height < 44),
    };
  });
  await context.close();
  return { name, mismatch, ...metrics };
}

(async () => {
  const browser = process.env.BROWSER === "webkit" ? await webkit.launch({ headless: true, executablePath: process.env.WEBKIT_BIN || "/Users/rydertsui/Library/Caches/ms-playwright/webkit-2388/pw_run.sh" }) : await chromium.launch({ executablePath: CHROME, headless: true });
  const phone = await shot(browser, 390, 844, "multiply-390x844-feedback");
  const wide = await shot(browser, 1024, 768, "multiply-1024x768-feedback");
  await browser.close();
  const report = { phone, wide, failures };
  fs.writeFileSync(path.join(SHOTS, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
