const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/all-desktop");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
fs.mkdirSync(SHOTS, { recursive: true });
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const rows = JSON.parse(fs.readFileSync("/tmp/all-questions.json", "utf8"));
const bySubject = Object.fromEntries(["math", "mandarin", "english"].map((s) => [s, rows.filter((r) => r.subject === s)]));
const requestedSubjects = (process.env.SUBJECTS || "math,mandarin,english").split(",").filter(Boolean);
const failures = [], summaries = [];

function seedFor(subject) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  const child = seed.children[0];
  child.gradeLevel = "K2"; child.ageYears = 5; child.levelConfirmedOn = "2026-11-24";
  child.sessions = [];
  const list = bySubject[subject].map((r) => r.id);
  child.activeSessions = {
    [subject]: {
      id: `audit-all-desktop-${subject}`, childId: child.id, subject, kind: "practice", length: list.length,
      startedAt: "2026-11-24T10:00:00.000Z", completedAt: null, plannedQuestionIds: list, attempts: [], summary: []
    }
  };
  return seed;
}
async function tap(el) {
  await el.waitFor({ state: "visible", timeout: 12000 });
  await el.scrollIntoViewIfNeeded();
  await el.tap({ timeout: 12000 });
}
async function openProfile(page, seed) {
  await page.addInitScript((data) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(data)), seed);
  await page.goto(BASE, { waitUntil: "networkidle" });
  if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
    await page.getByLabel("家长密码").fill("2468");
    await tap(page.getByRole("button", { name: "打开家庭学习区" }));
  }
  await page.getByRole("button", { name: "小果的学习档案" }).waitFor({ state: "visible", timeout: 12000 });
  await tap(page.getByRole("button", { name: "小果的学习档案" }));
  await page.waitForSelector("text=跟小芽开始", { timeout: 12000 });
}
async function openSubject(page, subject) {
  const selector = subject === "math" ? ".subject-card.math-course" : subject === "mandarin" ? ".subject-card.mandarin-course" : ".subject-card.english-course";
  await tap(page.locator(selector));
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 12000 });
}
async function measure(page) {
  return page.evaluate(() => {
    const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return {top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), height: Math.round(r.height)}; };
    const prompt = document.querySelector("[data-testid=question-prompt]");
    return {
      viewport: {w: innerWidth, h: innerHeight},
      questionId: prompt?.getAttribute("data-question-id") ?? null,
      docHeight: document.documentElement.scrollHeight,
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      prompt: rect(prompt),
      options: [...document.querySelectorAll(".answer-option")].map((el) => ({text: (el.textContent || "").trim().slice(0, 60), ...rect(el)})),
      cards: [...document.querySelectorAll(".match-card")].map((el) => ({text: (el.textContent || "").trim().slice(0, 60), side: el.getAttribute("data-match-side"), ...rect(el)})),
      buttons: [...document.querySelectorAll("button, summary")].filter((el) => {
        const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
        return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
      }).map((el) => ({text: (el.textContent || "").trim().slice(0, 30), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height)}))
    };
  });
}
async function runSubject(browser, subject) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, isMobile: false, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  const list = bySubject[subject];
  const local = [];
  let currentId = "start";
  page.on("pageerror", (error) => failures.push(`${currentId} pageerror: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`${currentId} http ${response.status()}: ${response.url()}`); });
  page.on("requestfailed", (request) => failures.push(`${currentId} requestfailed: ${request.url()} ${request.failure()?.errorText ?? ""}`));
  page.on("console", (message) => { if (message.type() === "error") failures.push(`${currentId} console: ${message.text()} @ ${message.location().url}`); });
  try {
    await openProfile(page, seedFor(subject));
    await openSubject(page, subject);
    for (let i = 0; i < list.length; i += 1) {
      const row = list[i];
      currentId = row.id;
      if (await page.locator(".result-screen").count()) throw new Error(`ended early at ${i}/${list.length} before ${row.id}`);
      const data = await measure(page);
      if (data.questionId !== row.id) failures.push(`${row.id}: rendered ${data.questionId}`);
      if (data.overflowX > 1) failures.push(`${row.id}: horizontal overflow ${data.overflowX}px`);
      const below = [...data.options, ...data.cards].filter((x) => x.bottom > data.viewport.h + 1);
      if (below.length) failures.push(`${row.id}: ${below.length} answer/card(s) below first screen ${JSON.stringify(below)}`);
      if (data.buttons.length) failures.push(`${row.id}: touch targets below 44px ${JSON.stringify(data.buttons)}`);
      if (row.kind === "choice") {
        const option = page.locator(".answer-option").filter({ hasText: new RegExp(`^${row.correctAnswer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`) });
        if (await option.count() !== 1) throw new Error(`correct option count ${await option.count()} for ${row.correctAnswer}`);
        await tap(option.first());
      } else {
        for (const pair of row.pairs) {
          await tap(page.locator(`[data-match-side="left"][data-pair-id="${pair.id}"]`));
          await tap(page.locator(`[data-match-side="right"][data-pair-id="${pair.id}"]`));
        }
      }
      await page.waitForSelector("[data-testid=answer-feedback]", { timeout: 12000 });
      const feedbackButton = page.locator(".answer-feedback .wide-button");
      if (await feedbackButton.count()) await tap(feedbackButton.first());
      else await page.getByRole("button", { name: /下一题|Next question/ }).first().tap();
      if (i + 1 < list.length) await page.waitForSelector("[data-testid=question-prompt]", { timeout: 12000 });
      else await page.waitForSelector(".result-screen", { timeout: 12000 });
      local.push(`${row.id}: ok`);
      if ((i + 1) % 25 === 0) console.log(`${subject} ${i + 1}/${list.length} failures=${failures.length}`);
    }
    await page.screenshot({ path: path.join(SHOTS, `${subject}-result.png`), fullPage: true });
    summaries.push({subject, attempted: local.length, total: list.length, ok: local.length === list.length});
    console.log(`${subject} done ${local.length}/${list.length}`);
  } catch (error) {
    failures.push(`${subject}: ${error.message}`);
    await page.screenshot({ path: path.join(SHOTS, `${subject}-fail.png`), fullPage: true }).catch(() => {});
    summaries.push({subject, attempted: local.length, total: list.length, ok: false});
  } finally { await context.close(); }
}
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  for (const subject of requestedSubjects) await runSubject(browser, subject);
  await browser.close();
  fs.writeFileSync(path.join(ROOT, "family-audit/all-desktop-audit.json"), JSON.stringify({ summaries, failures }, null, 2));
  console.log(JSON.stringify({ summaries, failureCount: failures.length }, null, 2));
  if (failures.length) console.log(failures.slice(0, 12).join("\n"));
})();
