const { chromium, webkit } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const questions = JSON.parse(fs.readFileSync("/tmp/all-questions.json", "utf8"));
const QUESTION_ID = process.env.QUESTION_ID || "q-match-mandarin-1";
const QUESTION = questions.find((q) => q.id === QUESTION_ID);
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = process.env.BASE || "http://127.0.0.1:5176/";
const SHOTS = process.env.SHOTS || path.join(ROOT, "family-audit/match-affordance");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WEBKIT_BIN = process.env.WEBKIT_BIN || "/Users/rydertsui/Library/Caches/ms-playwright/webkit-2388/pw_run.sh";
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
fs.mkdirSync(SHOTS, { recursive: true });

function seedWithMatch() {
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
  child.activeSessions.mandarin = {
    id: "audit-match-affordance",
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
  return seed;
}

async function openMatch(page) {
  await page.addInitScript((data) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(data)), seedWithMatch());
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
    await page.getByLabel("家长密码").fill("2468");
    await page.getByRole("button", { name: "打开家庭学习区" }).click();
  }
  await page.getByRole("button", { name: /的学习档案/ }).first().waitFor({ state: "visible", timeout: 12000 });
  await page.getByRole("button", { name: /的学习档案/ }).first().click();
  await page.waitForSelector("text=跟小芽开始", { timeout: 12000 });
  const course = QUESTION.subject === "math" ? "math" : QUESTION.subject === "english" ? "english" : "mandarin";
  await page.locator(`.subject-card.${course}-course`).click();
  await page.getByTestId("question-prompt").waitFor({ state: "visible", timeout: 12000 });
  await page.waitForTimeout(250);
}

async function inspect(page) {
  return page.evaluate(() => {
    const right = [...document.querySelectorAll(".match-card-right")];
    const left = [...document.querySelectorAll(".match-card:not(.match-card-right)")];
    return {
      left: left.map((el) => ({ text: (el.textContent || "").trim(), className: el.className, shadow: getComputedStyle(el).boxShadow })),
      right: right.map((el) => {
        const style = getComputedStyle(el);
        return {
          text: (el.textContent || "").trim(),
          disabled: el.disabled,
          className: el.className,
          opacity: style.opacity,
          borderStyle: style.borderStyle,
          borderColor: style.borderColor,
          boxShadow: style.boxShadow,
          filter: style.filter
        };
      })
    };
  });
}

async function run(browser, width, height, name) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 600, hasTouch: width < 600, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  await openMatch(page);
  const initial = await inspect(page);
  await page.screenshot({ path: path.join(SHOTS, `${name}-locked.png`), animations: "disabled" });
  await page.locator(`[data-match-side="left"][data-pair-id="${QUESTION_ID}-p1"]`).click();
  await page.waitForTimeout(150);
  const ready = await inspect(page);
  await page.screenshot({ path: path.join(SHOTS, `${name}-ready.png`), animations: "disabled" });
  await context.close();
  return { initial, ready };
}

(async () => {
  const browser = process.env.BROWSER === "webkit"
    ? await webkit.launch({ executablePath: WEBKIT_BIN, headless: true })
    : await chromium.launch({ executablePath: CHROME, headless: true });
  const phone = await run(browser, 390, 844, "affordance-390x844");
  const wide = await run(browser, 1024, 768, "affordance-1024x768");
  await browser.close();
  const report = { phone, wide };
  fs.writeFileSync(path.join(SHOTS, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
