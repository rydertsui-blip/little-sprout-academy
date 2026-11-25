const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/math-fix");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
fs.mkdirSync(SHOTS, { recursive: true });
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const checks = [];
const failures = [];

function seedFor(questionId) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  const child = seed.children[0];
  child.gradeLevel = "K2";
  child.ageYears = 5;
  child.levelConfirmedOn = "2026-11-24";
  child.sessions = [];
  child.activeSessions = {
    math: {
      id: `audit-math-${questionId}`,
      childId: child.id,
      subject: "math",
      kind: "practice",
      length: 1,
      startedAt: "2026-11-24T10:00:00.000Z",
      completedAt: null,
      plannedQuestionIds: [questionId],
      attempts: [],
      summary: []
    }
  };
  return seed;
}

async function tap(el) {
  await el.waitFor({ state: "visible", timeout: 15000 });
  await el.scrollIntoViewIfNeeded();
  await el.tap({ timeout: 15000 });
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
  await page.getByText("跟小芽开始").waitFor({ state: "visible", timeout: 15000 });
}

async function openMath(page) {
  await page.getByRole("button", { name: "数学 Math" }).first().click();
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
}

async function measure(page) {
  return page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const prompt = document.querySelector("[data-testid=question-prompt]");
    const options = [...document.querySelectorAll(".answer-option")];
    return {
      viewport: { width: innerWidth, height: innerHeight },
      docHeight: document.documentElement.scrollHeight,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      prompt: rect(prompt),
      options: options.map((el) => ({ text: el.textContent.trim().slice(0, 60), ...rect(el) })),
      tool: rect(document.querySelector(".math-tool-body")),
      toolLabel: document.querySelector(".math-tool summary strong")?.textContent?.trim() ?? null,
      buttons: [...document.querySelectorAll("button, summary")].filter((el) => {
        const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
      }).map((el) => ({ text: el.textContent.trim().slice(0, 40), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }))
    };
  });
}

async function captureQuestion(browser, questionId, answer, width, height, doClick) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: true });
  const page = await context.newPage();
  try {
    await openProfile(page, seedFor(questionId));
    await openMath(page);
    await page.waitForTimeout(250);
    const label = `${questionId}-${width}x${height}`;
    await page.screenshot({ path: path.join(SHOTS, `${label}-initial.png`), fullPage: true });
    const data = await measure(page);
    const below = data.options.filter((option) => option.bottom > height + 1);
    const report = { questionId, width, height, data, below };
    checks.push(report);
    if (data.overflowX > 1) failures.push(`${label}: horizontal overflow ${data.overflowX}`);
    if (data.buttons.length) failures.push(`${label}: touch targets below 44px ${JSON.stringify(data.buttons)}`);
    if (below.length) failures.push(`${label}: ${below.length} answer option(s) below first screen: ${JSON.stringify(below)}`);
    if (doClick) {
      const option = page.locator(".answer-option").filter({ hasText: new RegExp(`^${answer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) });
      if (!(await option.count())) throw new Error(`missing answer option ${answer}`);
      await tap(option.first());
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SHOTS, `${label}-feedback.png`), fullPage: true });
      const next = page.getByRole("button", { name: /Next question|下一题/ });
      await next.waitFor({ state: "visible", timeout: 10000 });
      checks.push({ questionId, width, height, feedbackVisible: true, nextVisible: true });
    }
  } catch (error) {
    failures.push(`${questionId}-${width}x${height}: ${error.message}`);
  } finally {
    await context.close();
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const targets = [
    ["q-k2-math-add-within-10-1", "5"],
    ["q-k2-math-count-20-8", "red"],
    ["q-k2-math-count-20-6", "13"],
    ["q-k2-math-add-within-10-5", "5"],
    ["q-k2-math-add-within-10-11", "4"],
    ["q-k2-math-count-20-11", "5 dots"],
    ["q-math-multiply-tables-7", "12"],
    ["q-math-shapes-4", "cylinder"],
    ["q-math-measurement-units-6", "5 kg"],
    ["q-math-measurement-units-10", "300 centimetres"],
    ["q-math-money-1", "350"]
  ];
  for (const [id, answer] of targets) {
    await captureQuestion(browser, id, answer, 390, 844, true);
    await captureQuestion(browser, id, answer, 1024, 768, false);
  }
  await browser.close();
  fs.writeFileSync(path.join(SHOTS, "audit.json"), JSON.stringify({ checks, failures }, null, 2));
  console.log(JSON.stringify({ failures: failures.length, targetChecks: checks.filter((x) => x.questionId).length }, null, 2));
  if (failures.length) console.log(failures.join("\n"));
})();
