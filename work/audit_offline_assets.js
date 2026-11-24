const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地";
const BASE = "http://127.0.0.1:4186/family/";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

function paths(directory) {
  return fs.readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath ?? entry.path, entry.name));
}

(async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "family/precache-manifest.json"), "utf8"));
  const expected = new Set(["audio", "images", "companions"].flatMap((key) => manifest[key]));
  const browser = await chromium.launch({ headless: true, executablePath: CHROME });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, locale: "zh-SG", timezoneId: "Asia/Singapore" });
  const page = await context.newPage();
  const failures = [];
  page.on("pageerror", (e) => failures.push(`pageerror: ${e.message}`));
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 30000 });
  const sw = await page.evaluate(async () => {
    if (!navigator.serviceWorker) return null;
    const reg = await navigator.serviceWorker.ready;
    return { controlled: Boolean(navigator.serviceWorker.controller), script: reg.active?.scriptURL ?? null };
  });
  if (sw && !sw.controlled) await page.reload({ waitUntil: "networkidle", timeout: 30000 });
  const controlled = await page.evaluate(() => Boolean(navigator.serviceWorker?.controller));
  if (!controlled) failures.push(`not controlled: ${JSON.stringify(sw)}`);
  await page.waitForTimeout(1000);
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
  const cachedPaths = (cacheName ? cacheInfo[cacheName] : []).map((p) => p.replace(/^.*\/family\//, "./"));
  const missing = [...expected].filter((p) => !cachedPaths.some((cached) => cached === p));
  const audioCount = cachedPaths.filter((p) => p.endsWith(".m4a")).length;
  const imageCount = cachedPaths.filter((p) => p.endsWith(".png")).length;
  for (const name of ["index.html", "assets/images/scene-empty.png", "assets/audio/zh-mao.m4a", "assets/companions/gemini-doudou/idle.png"]) {
    if (!cachedPaths.some((p) => p.endsWith(`/${name}`) || (name === "index.html" && p.endsWith("/")))) failures.push(`cache missing ${name}`);
  }
  await context.setOffline(true);
  let reloadError = null;
  try { await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 }); } catch (e) { reloadError = e.message; }
  if (reloadError) failures.push(`offline reload failed: ${reloadError}`);
  await page.waitForSelector("#root", { timeout: 10000 }).catch(() => failures.push("offline root missing"));
  const offline = await page.evaluate(async () => {
    const results = {};
    for (const path of ["./assets/audio/zh-mao.m4a", "./assets/images/scene-empty.png", "./assets/images/avatar-pikachu.png", "./assets/companions/gemini-doudou/idle.png"]) {
      const response = await fetch(path);
      results[path] = { status: response.status, bytes: (await response.arrayBuffer()).byteLength };
    }
    return { title: document.title, results };
  });
  for (const [pathName, result] of Object.entries(offline.results)) {
    if (result.status !== 200 || result.bytes <= 0) failures.push(`offline asset ${pathName}: ${JSON.stringify(result)}`);
  }
  await page.screenshot({ path: path.join(ROOT, "work/family-audit/redesign/187-wide-offline-all-assets.png"), fullPage: true });
  const output = { controlled, cacheName, expectedCount: expected.size, cachedCount: cachedPaths.length, audioCount, imageCount, missingCount: missing.length, missing: missing.slice(0, 20), offline, failures };
  fs.writeFileSync(path.join(ROOT, "work/family-audit/offline-all-assets-audit.json"), JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
  await browser.close();
  if (failures.length) process.exitCode = 1;
})().catch((error) => { console.error(error); process.exit(1); });
