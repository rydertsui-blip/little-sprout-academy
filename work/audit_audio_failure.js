const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = process.env.BASE || "http://127.0.0.1:4186/family/";
const SHOTS = process.env.SHOTS || path.join(ROOT, "family-audit/audio-failure");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MODE = process.env.MODE || "quiz";
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const questions = JSON.parse(fs.readFileSync("/tmp/all-questions.json", "utf8"));
fs.mkdirSync(SHOTS, { recursive: true });

function seedWithQuestion(question) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  const child = seed.children[0];
  child.name = "小听";
  child.sessions = [];
  child.attempts = [];
  child.evidence = {};
  child.activeSessions = {};
  child.diagnostics = {};
  child.gradeLevel = "K2";
  child.ageYears = 5;
  child.levelConfirmedOn = "2026-11-25";
  child.rewards.lifetimeStars = 0;
  child.activeSessions[question.subject] = {
    id: `audit-audio-${MODE}`,
    childId: child.id,
    subject: question.subject,
    kind: "practice",
    length: 1,
    startedAt: "2026-11-25T10:00:00.000Z",
    completedAt: null,
    plannedQuestionIds: [question.id],
    attempts: [],
    summary: []
  };
  return seed;
}

function questionForMode() {
  if (MODE === "match") return questions.find((q) => q.id === "q-match-mandarin-1");
  return questions.find((q) => q.id === "q-k2-math-count-20-1");
}

async function openQuiz(page) {
  const question = questionForMode();
  await page.addInitScript((data) => {
    localStorage.setItem("little-sprout-family-v1", JSON.stringify(data));
    try {
      Object.defineProperty(window, "speechSynthesis", { value: undefined, configurable: true });
      Object.defineProperty(window, "SpeechSynthesisUtterance", { value: undefined, configurable: true });
    } catch {
      try { delete window.speechSynthesis; } catch {}
      try { delete window.SpeechSynthesisUtterance; } catch {}
    }
  }, seedWithQuestion(question));
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
    await page.getByLabel("家长密码").fill("2468");
    await page.getByRole("button", { name: "打开家庭学习区" }).click();
  }
  await page.getByRole("button", { name: /的学习档案/ }).first().waitFor({ state: "visible", timeout: 12000 });
  await page.getByRole("button", { name: /的学习档案/ }).first().click();
  await page.waitForSelector("text=跟小芽开始", { timeout: 12000 });
  await page.locator(`.subject-card.${MODE === "match" ? "mandarin" : "math"}-course`).click();
  await page.getByTestId("question-prompt").waitFor({ state: "visible", timeout: 12000 });
  await page.waitForTimeout(250);
}

async function quizState(page) {
  return page.evaluate(() => {
    const button = document.querySelector(".audio-button");
    if (!button) return null;
    return {
      text: (button.textContent || "").trim(),
      className: button.className,
      ariaLabel: button.getAttribute("aria-label"),
      background: getComputedStyle(button).backgroundColor,
      borderColor: getComputedStyle(button).borderColor
    };
  });
}

async function matchState(page) {
  return page.evaluate(() => {
    const card = document.querySelector('[data-match-side="left"][data-pair-id="q-match-mandarin-1-p1"]');
    if (!card) return null;
    return {
      text: (card.textContent || "").trim(),
      className: card.className,
      ariaLabel: card.getAttribute("aria-label"),
      background: getComputedStyle(card).backgroundColor,
      borderColor: getComputedStyle(card).borderColor
    };
  });
}

async function run(browser, width, height, name) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: width < 600,
    hasTouch: width < 600,
    locale: "zh-SG",
    timezoneId: "Asia/Singapore",
    serviceWorkers: "block"
  });
  await context.route("**/assets/audio/*.m4a", (route) => route.abort());
  const page = await context.newPage();
  await openQuiz(page);
  if (MODE === "match") {
    await page.locator('[data-match-side="left"][data-pair-id="q-match-mandarin-1-p1"]').click();
  } else {
    await page.locator(".audio-button").click();
  }
  await page.waitForTimeout(300);
  const state = MODE === "match" ? await matchState(page) : await quizState(page);
  await page.screenshot({ path: path.join(SHOTS, `${name}-error.png`), animations: "disabled" });
  await context.close();
  return state;
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const phone = await run(browser, 390, 844, `${MODE}-390x844`);
  const wide = await run(browser, 1024, 768, `${MODE}-1024x768`);
  await browser.close();
  const report = { mode: MODE, phone, wide };
  fs.writeFileSync(path.join(SHOTS, `${MODE}-report.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
