const PW = process.env.PW || "/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright";
const { chromium, webkit } = require(PW);
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = process.env.BASE || "http://127.0.0.1:4186/family/";
const SHOTS = process.env.SHOTS || path.join(ROOT, "family-audit/new-features");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
fs.mkdirSync(SHOTS, { recursive: true });
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const failures = [];
const checks = [];

function cloneSeed(name = "小写") {
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

async function openChild(page, seed) {
  await page.addInitScript((data) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(data)), seed);
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 20000 });
  if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
    await page.getByLabel("家长密码").fill("2468");
    await page.getByRole("button", { name: "打开家庭学习区" }).click();
  }
  await page.getByRole("button", { name: /的学习档案/ }).first().waitFor({ state: "visible", timeout: 12000 });
  await page.getByRole("button", { name: /的学习档案/ }).first().click();
  await page.getByText("小芽写字").first().waitFor({ state: "visible", timeout: 12000 });
}

async function layoutCheck(page, label) {
  const data = await page.evaluate(() => {
    const doc = document.documentElement;
    const bad = [...document.querySelectorAll("button, summary")].filter((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44);
    }).map((el) => ({ text: (el.textContent || "").trim().slice(0, 24), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }));
    return {
      width: innerWidth,
      height: innerHeight,
      overflowX: doc.scrollWidth - doc.clientWidth,
      overflowY: doc.scrollHeight - doc.clientHeight,
      smallTargets: bad.slice(0, 8),
    };
  });
  if (data.overflowX > 1) failures.push(`${label}: horizontal overflow ${data.overflowX}px`);
  if (data.smallTargets.length) checks.push(`${label}: ${data.smallTargets.length} target(s) under 44px -> ${JSON.stringify(data.smallTargets)}`);
  checks.push(`${label}: viewport ${data.width}x${data.height}, doc overflowY ${data.overflowY}`);
  return data;
}

async function runHome(page, tag) {
  await layoutCheck(page, `${tag} home`);
  for (const label of ["小芽写字", "小芽口说"]) {
    if (!(await page.getByText(label, { exact: false }).count())) failures.push(`${tag}: missing home card ${label}`);
  }
  await page.screenshot({ path: path.join(SHOTS, `${tag}-01-home.png`), fullPage: true });
}

async function runHandwriting(page, tag) {
  await page.getByText("小芽写字", { exact: false }).first().click();
  await page.waitForTimeout(600);
  await layoutCheck(page, `${tag} handwriting`);
  const info = await page.evaluate(() => ({
    chars: [...document.querySelectorAll("button")].filter((b) => /^[\u4e00-\u9fff]$/.test((b.textContent || "").trim())).length,
    canvases: document.querySelectorAll("canvas").length,
    svgs: document.querySelectorAll("svg").length,
    headings: [...document.querySelectorAll("h1,h2,h3")].map((h) => (h.textContent || "").trim()).filter(Boolean).slice(0, 5),
  }));
  checks.push(`${tag} handwriting: ${JSON.stringify(info)}`);
  if (!info.canvases && !info.svgs) failures.push(`${tag}: handwriting screen renders no drawing surface`);
  await page.screenshot({ path: path.join(SHOTS, `${tag}-02-handwriting.png`), fullPage: true });
  // try one character and one stroke-ish pointer drag
  const charButton = page.locator("button").filter({ hasText: /^[\u4e00-\u9fff]$/ }).first();
  if (await charButton.count()) {
    await charButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SHOTS, `${tag}-03-handwriting-char.png`), fullPage: true });
    const canvas = page.locator(".hanzi-target").first();
    if (await canvas.count()) {
      const surface = (await canvas.locator("svg").count()) ? canvas.locator("svg").first() : canvas;
      const box = await surface.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.7, box.y + box.height * 0.7, { steps: 12 });
        await page.mouse.up();
        await page.waitForTimeout(700);
        await page.screenshot({ path: path.join(SHOTS, `${tag}-04-handwriting-stroke.png`), fullPage: true });
        checks.push(`${tag}: drew one stroke on handwriting canvas`);
      } else failures.push(`${tag}: handwriting canvas has no box`);
    }
  }
  await page.goBack().catch(() => {});
  await page.waitForTimeout(300);
  if (!(await page.getByText("小芽口说", { exact: false }).count())) {
    // fall back to re-opening home through the app chrome
    const home = page.getByRole("button", { name: /回到|首页|学习岛/ }).first();
    if (await home.count()) await home.click();
    await page.waitForTimeout(500);
  }
}

async function runSpeaking(page, tag) {
  await page.getByText("小芽口说", { exact: false }).first().click();
  await page.waitForTimeout(800);
  await layoutCheck(page, `${tag} speaking`);
  const info = await page.evaluate(() => ({
    headings: [...document.querySelectorAll("h1,h2,h3")].map((h) => (h.textContent || "").trim()).filter(Boolean).slice(0, 5),
    text: (document.body.innerText || "").replace(/\n+/g, " | ").slice(0, 300),
  }));
  checks.push(`${tag} speaking: ${JSON.stringify(info)}`);
  const record = page.getByRole("button", { name: /录|开始|麦克风|再读/ }).first();
  if (await record.count()) {
    await record.click().catch(() => {});
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(SHOTS, `${tag}-05-speaking-active.png`), fullPage: true });
  } else {
    failures.push(`${tag}: speaking screen exposes no record action`);
  }
  await page.screenshot({ path: path.join(SHOTS, `${tag}-06-speaking.png`), fullPage: true });
}

async function runMandarinQuiz(page, seed, tag) {
  // seed a short mandarin session so the quiz screen (with the pinyin board) opens
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await openChild(page, seed);
  const card = page.locator(".subject-card, button").filter({ hasText: /华文/ }).first();
  if (!(await card.count())) { failures.push(`${tag}: no mandarin entry on home`); return; }
  await card.click();
  await page.waitForTimeout(900);
  const diag = page.getByRole("button", { name: /开始|继续|跟小芽/ }).first();
  if (await diag.count()) await diag.click().catch(() => {});
  await page.waitForTimeout(1200);
  await layoutCheck(page, `${tag} mandarin quiz`);
  const info = await page.evaluate(() => ({
    prompt: (document.querySelector("[data-testid=question-prompt]") || {}).textContent,
    pinyinChart: Boolean(document.querySelector(".pinyin-chart, [data-testid=pinyin-chart]")),
    buttons: [...document.querySelectorAll("button")].map((b) => (b.textContent || "").trim()).filter(Boolean).slice(0, 12),
  }));
  checks.push(`${tag} quiz: ${JSON.stringify(info).slice(0, 400)}`);
  if (!info.prompt) failures.push(`${tag}: quiz prompt did not render`);
  await page.screenshot({ path: path.join(SHOTS, `${tag}-07-mandarin-quiz.png`), fullPage: true });
}

(async () => {
  const only = process.env.ONLY || "";
  for (const [engine, launcher, tag, viewport] of [
    ["chromium", chromium, "desktop", { width: 1180, height: 820 }],
    ["webkit", webkit, "webkit-phone", { width: 390, height: 844 }],
  ].filter(([, , tag]) => !only || tag === only)) {
    const browser = await launcher.launch({ ...(engine === "chromium" ? { executablePath: CHROME } : {}) });
    const context = await browser.newContext({ viewport, hasTouch: engine === "webkit", isMobile: engine === "webkit", deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
    try {
      await openChild(page, cloneSeed(engine === "chromium" ? "小写" : "小听"));
      await runHome(page, tag);
      await runHandwriting(page, tag);
      if (!(await page.getByText("小芽口说", { exact: false }).count())) {
        await page.goto(BASE, { waitUntil: "domcontentloaded" });
        await openChild(page, cloneSeed("小说"));
      }
      await runSpeaking(page, tag);
      await runMandarinQuiz(page, cloneSeed("小华"), tag);
    } catch (err) {
      failures.push(`${tag}: threw ${String(err).slice(0, 300)}`);
      await page.screenshot({ path: path.join(SHOTS, `${tag}-error.png`), fullPage: true }).catch(() => {});
    }
    if (errors.length) checks.push(`${tag} console/page errors: ${JSON.stringify(errors.slice(0, 5))}`);
    await browser.close();
  }
  console.log("=== CHECKS ===");
  console.log(checks.join("\n"));
  console.log("=== FAILURES ===");
  console.log(failures.length ? failures.join("\n") : "none");
  process.exit(failures.length ? 1 : 0);
})();
