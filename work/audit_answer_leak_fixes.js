const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/redesign");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const checks = [], failures = [];

function seedFor(subject, questionIds) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  seed.children[0].activeSessions[subject] = {
    id: `seed-fix-${subject}-${questionIds[0]}`,
    childId: seed.children[0].id,
    subject,
    kind: "practice",
    length: questionIds.length,
    startedAt: "2026-11-24T10:00:00.000Z",
    completedAt: null,
    plannedQuestionIds: questionIds,
    attempts: [],
    summary: []
  };
  return seed;
}
async function tap(el) {
  await el.waitFor({ state: "visible", timeout: 15000 });
  await el.scrollIntoViewIfNeeded();
  await el.tap({ timeout: 15000 });
}
async function shot(page, name) {
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: true });
  checks.push(`shot ${name}`);
}
async function assertLayout(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) failures.push(`${label}: horizontal overflow ${overflow}px`);
  const small = await page.evaluate(() => [...document.querySelectorAll("button, summary")].filter((el) => {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0 && (r.width < 40 || r.height < 40);
  }).map((el) => ({ text: el.textContent.trim().slice(0, 30), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) })));
  if (small.length) failures.push(`${label}: touch targets below 40px: ${JSON.stringify(small)}`);
  const inputs = await page.evaluate(() => document.querySelectorAll("input, textarea, [contenteditable='true']").length);
  if (inputs !== 0) failures.push(`${label}: child screen has ${inputs} keyboard inputs`);
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
  await page.waitForSelector("text=跟小芽开始", { timeout: 15000 });
}
async function openSubject(page, name) {
  await page.getByRole("button", { name }).first().click();
  await page.waitForSelector("[data-testid=question-prompt]", { timeout: 15000 });
}
async function capture(page, label, wide, phone, checksFn) {
  await assertLayout(page, label);
  if (checksFn) await checksFn();
  await shot(page, wide);
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, `${label} phone`);
  if (checksFn) await checksFn();
  await shot(page, phone);
  await page.setViewportSize({ width: 1180, height: 820 });
}
function assertNotIncludes(text, value, label) {
  if (text.includes(value)) failures.push(`${label}: found hidden answer text ${value}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 1, hasTouch: true, locale: "zh-SG", timezoneId: "Asia/Singapore", serviceWorkers: "block" });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`http ${response.status()}: ${response.url()}`); });
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console: ${message.text()}`); });

  // Place value: the target digit must not be printed.
  await openProfile(page, seedFor("math", ["q-math-place-value-1000-12", "q-math-place-value-1000-15"]));
  await openSubject(page, /数学 Math/);
  await capture(page, "Place value", "158-wide-place-value-no-answer.png", "159-phone-place-value-no-answer.png", async () => {
    const tool = await page.locator(".math-tool").innerText();
    assertNotIncludes(tool, "5", "Place value tool");
    const target = await page.getByTestId("place-digit-1").innerText();
    if (target.trim() !== "?") failures.push(`Place value: target digit is ${target}, expected ?`);
  });

  // Money: cent answer and comparison answer must not appear in the tool.
  await openProfile(page, seedFor("math", ["q-math-money-1", "q-math-money-13"]));
  await openSubject(page, /数学 Math/);
  await capture(page, "Money", "160-wide-money-no-answer.png", "161-phone-money-no-answer.png", async () => {
    const tool = await page.locator(".math-tool").innerText();
    assertNotIncludes(tool, "350 cents", "Money tool");
  });

  // Duration: total duration must be hidden for "how long" questions.
  await openProfile(page, seedFor("math", ["q-math-time-duration-1", "q-math-time-duration-4"]));
  await openSubject(page, /数学 Math/);
  await capture(page, "Duration", "162-wide-duration-no-answer.png", "163-phone-duration-no-answer.png", async () => {
    const tool = await page.locator(".math-tool").innerText();
    assertNotIncludes(tool, "1 hour", "Duration tool");
    const rail = await page.getByTestId("duration-rail").innerText();
    if (rail.trim() !== "?") failures.push(`Duration: rail is ${rail}, expected ?`);
  });

  // Ruler: length must not be printed.
  await openProfile(page, seedFor("math", ["q-math-length-measure-1", "q-math-length-measure-4"]));
  await openSubject(page, /数学 Math/);
  await capture(page, "Ruler", "164-wide-ruler-no-answer.png", "165-phone-ruler-no-answer.png", async () => {
    const tool = await page.locator(".math-tool").innerText();
    assertNotIncludes(tool, "Length: 7 cm", "Ruler tool");
  });

  // Picture graph: row labels must not print counts.
  await openProfile(page, seedFor("math", ["q-math-picture-graph-1", "q-math-picture-graph-3"]));
  await openSubject(page, /数学 Math/);
  await capture(page, "Picture graph", "166-wide-graph-no-counts.png", "167-phone-graph-no-counts.png", async () => {
    const rows = await page.getByTestId("graph-row").allInnerTexts();
    if (rows.some((row) => row.includes("·") || /\b4\b/.test(row) || /\b2\b/.test(row))) failures.push(`Picture graph: counts printed in rows ${JSON.stringify(rows)}`);
  });

  // Shapes: names must stay out of the reference tool.
  await openProfile(page, seedFor("math", ["q-math-shapes-6", "q-math-shapes-3"]));
  await openSubject(page, /数学 Math/);
  await capture(page, "Shapes", "174-wide-shapes-no-names.png", "175-phone-shapes-no-names.png", async () => {
    const tool = await page.locator(".math-tool").innerText();
    for (const name of ["Triangle", "Square", "Rectangle", "Circle"]) assertNotIncludes(tool, name, "Shapes tool");
  });

  // Sentence tiles: real taps must build and remove a word.
  await openProfile(page, seedFor("english", ["q-english-sentence-order-13", "q-english-sentence-order-14"]));
  await openSubject(page, /英语 English/);
  await capture(page, "Sentence tiles before tap", "168-wide-sentence-tiles.png", "169-phone-sentence-tiles.png", async () => {
    if (!(await page.getByTestId("sentence-answer").count())) failures.push("Sentence tiles: answer row missing");
  });
  const firstTile = page.getByTestId("sentence-tiles").getByTestId("sentence-tile").first();
  const firstWord = (await firstTile.innerText()).trim();
  await tap(firstTile);
  await page.waitForTimeout(120);
  const built = await page.getByTestId("sentence-answer").innerText();
  if (!built.includes(firstWord)) failures.push(`Sentence tiles: ${firstWord} was not added to ${built}`);
  await shot(page, "170-wide-sentence-tiles-tapped.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, "Sentence tiles tapped phone");
  await shot(page, "171-phone-sentence-tiles-tapped.png");
  await page.setViewportSize({ width: 1180, height: 820 });
  await tap(page.getByTestId("sentence-answer").getByTestId("sentence-tile").first());
  await page.waitForTimeout(120);
  if ((await page.getByTestId("sentence-answer").innerText()).includes(firstWord)) failures.push("Sentence tiles: tapping a placed word did not remove it");

  await browser.close();
  const report = { checks, failures };
  fs.writeFileSync(path.join(ROOT, "family-audit/answer-leak-fix-audit.json"), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  process.exit(failures.length ? 1 : 0);
})().catch((error) => { console.error(error); process.exit(1); });
