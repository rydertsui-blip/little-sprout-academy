const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, locale: "zh-SG", timezoneId: "Asia/Singapore" });
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", (e) => failures.push(`pageerror: ${e.message}`));
  await page.goto(BASE, { waitUntil: "networkidle" });
  const sw = await page.evaluate(async () => {
    if (!navigator.serviceWorker) return null;
    const reg = await navigator.serviceWorker.ready;
    return { controlled: Boolean(navigator.serviceWorker.controller), script: reg.active?.scriptURL ?? null };
  });
  if (sw && !sw.controlled) {
    await page.reload({ waitUntil: "networkidle", timeout: 15000 });
  }
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
  if (!controlled) failures.push(`not controlled: ${JSON.stringify(sw)}`);
  const cacheInfo = await page.evaluate(async () => {
    const names = await caches.keys();
    const result = {};
    for (const name of names) {
      const cache = await caches.open(name);
      const requests = await cache.keys();
      result[name] = requests.map((r) => new URL(r.url).pathname);
    }
    return result;
  });
  const cacheName = Object.keys(cacheInfo).find((name) => name.includes("little-sprout-family")) ?? null;
  if (!cacheName) failures.push(`family cache missing: ${Object.keys(cacheInfo).join(",")}`);
  const urls = cacheName ? cacheInfo[cacheName] : [];
  const audioCount = urls.filter((u) => u.endsWith(".m4a")).length;
  if (audioCount < 656) failures.push(`audio cached ${audioCount}, expected >= 656`);
  for (const name of ["index.html", "assets/audio/zh-mao.m4a"]) {
    if (!urls.some((u) => u.endsWith(`/${name}`) || (name === "index.html" && u.endsWith("/")))) failures.push(`cache missing ${name}`);
  }
  await page.screenshot({ path: path.join(ROOT, "family-audit/redesign/172-wide-offline-online.png"), fullPage: true });
  await context.setOffline(true);
  let reloadError = null;
  try {
    await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
  } catch (e) { reloadError = e.message; }
  if (reloadError) failures.push(`offline reload failed: ${reloadError}`);
  await page.waitForSelector("#root", { timeout: 10000 }).catch(() => failures.push("offline root missing"));
  const offline = await page.evaluate(async () => {
    const response = await fetch("./assets/audio/zh-mao.m4a");
    const buffer = await response.arrayBuffer();
    return { status: response.status, bytes: buffer.byteLength, title: document.title };
  });
  if (offline.status !== 200 || offline.bytes <= 0) failures.push(`offline audio ${JSON.stringify(offline)}`);
  await page.screenshot({ path: path.join(ROOT, "family-audit/redesign/173-wide-offline-reload.png"), fullPage: true });
  fs.writeFileSync(path.join(ROOT, "family-audit/offline-cache-audit.json"), JSON.stringify({ controlled, cacheName, audioCount, offline, failures }, null, 2));
  console.log(JSON.stringify({ controlled, cacheName, audioCount, offline, failures }, null, 2));
  await browser.close();
  if (failures.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exit(1); });
