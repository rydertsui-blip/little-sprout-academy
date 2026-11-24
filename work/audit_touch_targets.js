const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地";
const seed = JSON.parse(fs.readFileSync(path.join(ROOT, "work/new-content-seed.json"), "utf8"));
const BASE = "http://127.0.0.1:4186/family/";

const MIN = 44;
function routeCopy(route) {
  return route;
}
async function collect(page, route) {
  const rows = await page.evaluate(({ MIN }) => {
    const nodes = [...document.querySelectorAll("button, a[href], input, select, summary, [role=button], [tabindex]:not([tabindex='-1'])")];
    return nodes.map((el) => {
      if (el.matches("input[type=checkbox], input[type=file]")) return null;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none" || r.width === 0 || r.height === 0) return null;
      const label = (el.getAttribute("aria-label") || el.innerText || el.getAttribute("placeholder") || el.tagName).trim().replace(/\s+/g, " ").slice(0, 60);
      return { tag: el.tagName, type: el.getAttribute("type") || "", cls: String(el.className).slice(0, 70), label, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y), small: r.width < MIN || r.height < MIN };
    }).filter(Boolean);
  }, { MIN });
  return { route, total: rows.length, small: rows.filter((row) => row.small).map((row) => ({ route, ...row })) };
}
async function openChild(page) {
  await page.getByRole("button", { name: "小果的学习档案" }).waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: "小果的学习档案" }).click();
  await page.getByRole("button", { name: /跟小芽开始/ }).waitFor({ timeout: 10000 });
}
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const out = [];
  const checked = [];
  for (const width of [390, 1024]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 768 }, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
    const page = await context.newPage();
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.evaluate((d) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(d)), seed);
    await page.reload({ waitUntil: "domcontentloaded" });
    if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
      await page.getByLabel("家长密码").fill("2468");
      await page.getByRole("button", { name: "打开家庭学习区" }).click();
    }
    await page.getByRole("button", { name: "小果的学习档案" }).waitFor({ timeout: 10000 });
    { const c = await collect(page, `${width}:profiles`); checked.push({ route: `${width}:profiles`, total: c.total }); out.push(...c.small); }
    // Parent gate + dashboard
    await page.getByRole("button", { name: /家长/ }).click();
    await page.waitForTimeout(150);
    { const c = await collect(page, `${width}:parent-gate`); checked.push({ route: `${width}:parent-gate`, total: c.total }); out.push(...c.small); }
    const pin = page.getByLabel("家长密码确认");
    if (await pin.count()) {
      await pin.fill("2468");
      await page.getByRole("button", { name: "进入设置" }).click();
    }
    await page.getByRole("heading", { name: "家长中心" }).waitFor({ timeout: 10000 }).catch(() => {});
    { const c = await collect(page, `${width}:parent`); checked.push({ route: `${width}:parent`, total: c.total }); out.push(...c.small); }
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.evaluate((d) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(d)), seed);
    await page.reload({ waitUntil: "domcontentloaded" });
    if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
      await page.getByLabel("家长密码").fill("2468");
      await page.getByRole("button", { name: "打开家庭学习区" }).click();
    }
    await openChild(page);
    { const c = await collect(page, `${width}:child-home`); checked.push({ route: `${width}:child-home`, total: c.total }); out.push(...c.small); }
    // Existing English session should open a reading question.
    const english = page.locator(".subject-card.english-course");
    if (await english.count()) {
      await english.click();
      await page.waitForTimeout(300);
      { const c = await collect(page, `${width}:quiz`); checked.push({ route: `${width}:quiz`, total: c.total }); out.push(...c.small); }
      await page.screenshot({ path: path.join(ROOT, `work/family-audit/touch-${width}-quiz.png`), fullPage: true });
    }
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.evaluate((d) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(d)), seed);
    await page.reload({ waitUntil: "domcontentloaded" });
    if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
      await page.getByLabel("家长密码").fill("2468");
      await page.getByRole("button", { name: "打开家庭学习区" }).click();
    }
    await openChild(page);
    const companion = page.locator(".companion-home-card");
    if (await companion.count()) {
      await companion.click();
      await page.waitForTimeout(200);
      { const c = await collect(page, `${width}:companions`); checked.push({ route: `${width}:companions`, total: c.total }); out.push(...c.small); }
    }
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.evaluate((d) => localStorage.setItem("little-sprout-family-v1", JSON.stringify(d)), seed);
    await page.reload({ waitUntil: "domcontentloaded" });
    if (await page.getByRole("button", { name: "打开家庭学习区" }).count()) {
      await page.getByLabel("家长密码").fill("2468");
      await page.getByRole("button", { name: "打开家庭学习区" }).click();
    }
    await openChild(page);
    const handwriting = page.locator(".writing-entry");
    if (await handwriting.count()) {
      await handwriting.click();
      await page.waitForTimeout(300);
      { const c = await collect(page, `${width}:handwriting`); checked.push({ route: `${width}:handwriting`, total: c.total }); out.push(...c.small); }
      await page.screenshot({ path: path.join(ROOT, `work/family-audit/touch-${width}-handwriting.png`), fullPage: true });
    }
    await context.close();
  }
  const small = out;
  const failures = small.map((row) => `${row.route} ${row.tag}.${row.cls} "${row.label}" ${row.w}x${row.h}`);
  fs.writeFileSync(path.join(ROOT, "work/family-audit/touch-target-audit.json"), JSON.stringify({ min: MIN, checked, failures }, null, 2));
  console.log(JSON.stringify({ failureCount: failures.length, checked, failures: failures.slice(0, 80) }, null, 2));
  await browser.close();
  if (failures.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exit(1); });
