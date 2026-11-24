const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const path = require("path");

const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = "/Users/rydertsui/Desktop/幼儿学习天地/work/family-audit/redesign";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const checks = [];
const failures = [];
let browser;

async function tap(locator) {
  await locator.waitFor({ state: "visible", timeout: 15000 });
  await locator.scrollIntoViewIfNeeded();
  await locator.tap({ timeout: 15000 });
}

async function shot(page, name) {
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(SHOTS, name), fullPage: true });
  checks.push(`shot ${name}`);
}

async function assertLayout(page, label, requireNoInput = false) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) failures.push(`${label}: horizontal overflow ${overflow}px`);
  const smallTargets = await page.evaluate(() =>
    [...document.querySelectorAll("button, summary")]
      .filter((el) => {
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40);
      })
      .map((el) => ({ text: el.textContent.trim().slice(0, 40), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) }))
  );
  if (smallTargets.length) failures.push(`${label}: touch targets below 40px: ${JSON.stringify(smallTargets)}`);
  const broken = await page.evaluate(() => [...document.images].filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.getAttribute("src")));
  if (broken.length) failures.push(`${label}: broken images: ${broken.join(", ")}`);
  if (requireNoInput) {
    const inputCount = await page.evaluate(() => document.querySelectorAll("input, textarea, [contenteditable='true']").length);
    if (inputCount !== 0) failures.push(`${label}: child screen has ${inputCount} keyboard inputs`);
    checks.push(`${label}: no keyboard inputs`);
  }
  checks.push(`${label}: layout checked`);
}

async function setupFamily(page) {
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("text=建立家庭学习区");
  await tap(page.getByLabel("家庭名称"));
  await page.getByLabel("家庭名称").fill("我们的学习区");
  await tap(page.getByLabel("家长称呼"));
  await page.getByLabel("家长称呼").fill("妈妈");
  await tap(page.getByLabel("家长密码"));
  await page.getByLabel("家长密码").fill("2468");
  await tap(page.getByRole("button", { name: "建立家庭学习区" }));
  await page.waitForSelector("text=今天谁来学习？");
}

async function openParent(page) {
  await tap(page.getByRole("button", { name: /家庭版|家长设置|Parent settings|Family/ }));
  await page.waitForSelector("text=进入家长设置");
  await tap(page.getByLabel("家长密码确认"));
  await page.getByLabel("家长密码确认").fill("2468");
  await tap(page.getByRole("button", { name: "进入设置" }));
  await page.waitForSelector("text=孩子学习情况");
}

async function closeParent(page) {
  await tap(page.getByRole("button", { name: "关闭" }));
  await page.waitForSelector("text=今天谁来学习？");
}

async function addChild(page, name, age, avatar = "星星头像", first = false) {
  await openParent(page);
  await tap(page.getByRole("button", { name: first ? "添加第一个孩子" : "添加孩子" }));
  await tap(page.getByLabel("孩子的名字"));
  await page.getByLabel("孩子的名字").fill(name);
  await tap(page.getByLabel("孩子年龄"));
  await page.getByLabel("孩子年龄").selectOption(String(age));
  await tap(page.getByRole("button", { name: avatar }));
  await tap(page.getByRole("button", { name: "保存档案" }));
  await page.getByRole("heading", { name }).waitFor({ state: "visible" });
  await closeParent(page);
}

async function openChild(page, name) {
  await tap(page.locator(`button[aria-label='${name}的学习档案']`));
  await page.waitForSelector("text=跟小芽开始");
}

async function backToProfiles(page) {
  await tap(page.locator("button[aria-label='回到孩子选择']"));
  await page.waitForSelector("text=今天谁来学习？");
}

async function answerCurrent(page) {
  const matchBoard = page.getByTestId("match-board");
  if ((await matchBoard.count()) > 0 && (await matchBoard.first().isVisible())) {
    const pairIds = await page.locator('[data-match-side="left"]').evaluateAll((els) => els.map((el) => el.dataset.pairId));
    for (const pairId of pairIds) {
      const left = page.locator(`[data-match-side="left"][data-pair-id="${pairId}"]`);
      const right = page.locator(`[data-match-side="right"][data-pair-id="${pairId}"]`);
      await tap(left);
      await page.waitForFunction((el) => !el.disabled, await right.elementHandle(), { timeout: 4000 });
      await tap(right);
    }
    await page.waitForSelector("[data-testid=answer-feedback]", { timeout: 15000 });
    return;
  }
  const correct = page.locator("button[data-correct='true']").first();
  await tap(correct);
  await page.waitForSelector("[data-testid=answer-feedback]", { timeout: 15000 });
}

async function finishSession(page, count = 8) {
  for (let index = 0; index < count; index += 1) {
    await answerCurrent(page);
    await page.waitForTimeout(120);
    await tap(page.getByRole("button", { name: "Next question" }));
    if (index < count - 1) await page.waitForSelector("[data-testid=question-prompt]");
  }
  await page.waitForSelector("text=回到学习区", { timeout: 15000 });
}

(async () => {
  browser = await chromium.launch({
    headless: true,
    executablePath: CHROME,
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"]
  });
  const context = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    deviceScaleFactor: 1,
    hasTouch: true,
    locale: "zh-SG",
    timezoneId: "Asia/Singapore"
  });
  await context.grantPermissions(["microphone"], { origin: "http://127.0.0.1:4186" });
  const page = await context.newPage();
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) failures.push(`http ${response.status()}: ${response.url()}`);
  });
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()} (${message.location().url})`);
  });

  await setupFamily(page);
  console.error("stage: setup");
  await addChild(page, "小禾", 5, "星星头像", true);
  console.error("stage: k2 child added");
  await addChild(page, "小树", 7, "花朵头像", false);
  console.error("stage: p2 child added");
  await openChild(page, "小禾");
  await assertLayout(page, "K2 child home");
  await shot(page, "37-wide-k2-home.png");

  await tap(page.getByRole("button", { name: /数学 Math/ }).first());
  await page.waitForSelector("[data-testid=question-prompt]");
  const k2Prompt = await page.getByTestId("question-prompt").innerText();
  if (!/dots|match each number|count/i.test(k2Prompt)) failures.push(`K2 math did not start with the K2 number-sense bank: ${k2Prompt}`);
  await assertLayout(page, "K2 math question", true);
  await shot(page, "38-wide-k2-math.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, "K2 math phone", true);
  await shot(page, "39-phone-k2-math.png");
  await page.setViewportSize({ width: 1180, height: 820 });
  await answerCurrent(page);
  await tap(page.getByRole("button", { name: "Next question" }));
  await page.waitForSelector("[data-testid=question-prompt]");
  const k2NextPrompt = await page.getByTestId("question-prompt").innerText();
  if (!/add|subtract|altogether|left|bond|more|less|\+|−/i.test(k2NextPrompt)) failures.push(`K2 math second item did not show add/subtract content: ${k2NextPrompt}`);
  await assertLayout(page, "K2 add and subtract question", true);
  await shot(page, "44-wide-k2-add.png");
  await page.setViewportSize({ width: 390, height: 844 });
  await assertLayout(page, "K2 add and subtract phone", true);
  await shot(page, "45-phone-k2-add.png");
  await page.setViewportSize({ width: 1180, height: 820 });
  await tap(page.getByRole("button", { name: "Exit" }));
  await page.waitForSelector("text=跟小芽开始");
  await backToProfiles(page);

  await openChild(page, "小禾");
  await tap(page.getByRole("button", { name: /英语 English/ }).first());
  await page.waitForSelector("[data-testid=question-prompt]");
  await assertLayout(page, "K2 English question", true);
  await shot(page, "46-wide-k2-english.png");
  await answerCurrent(page);
  await tap(page.getByRole("button", { name: "Next question" }));
  await page.waitForSelector("[data-testid=question-prompt]");
  const k2LetterPrompt = await page.getByTestId("question-prompt").innerText();
  if (!/letter|alphabet|capital|small|beginning|comes after|comes before/i.test(k2LetterPrompt)) failures.push(`K2 English second item did not show letter content: ${k2LetterPrompt}`);
  await assertLayout(page, "K2 letters question", true);
  await shot(page, "47-wide-k2-letters.png");
  await tap(page.getByRole("button", { name: "Exit" }));
  await page.waitForSelector("text=跟小芽开始");
  await backToProfiles(page);

  await openChild(page, "小禾");
  await tap(page.getByRole("button", { name: /华文 Mandarin/ }).first());
  await page.waitForSelector("[data-testid=question-prompt]");
  await assertLayout(page, "K2 Mandarin question", true);
  await shot(page, "48-wide-k2-mandarin.png");
  await answerCurrent(page);
  await tap(page.getByRole("button", { name: /Next question|下一题/ }));
  await page.waitForSelector("[data-testid=question-prompt]");
  const k2VocabularyPrompt = await page.getByTestId("question-prompt").innerText();
  if (!/哪一类|什么|反义词|用来|苹果|铅笔|小狗|眼睛|耳朵|书包/i.test(k2VocabularyPrompt)) failures.push(`K2 Mandarin second item did not show vocabulary content: ${k2VocabularyPrompt}`);
  await assertLayout(page, "K2 vocabulary question", true);
  await shot(page, "49-wide-k2-vocabulary.png");
  await tap(page.getByRole("button", { name: /Exit|退出/ }));
  await page.waitForSelector("text=跟小芽开始");
  await backToProfiles(page);

  await openChild(page, "小树");
  await assertLayout(page, "P2 child home");
  await shot(page, "41-wide-p2-home.png");
  await tap(page.getByRole("button", { name: /英语 English/ }).first());
  await page.waitForSelector("[data-testid=question-prompt]");
  await assertLayout(page, "P2 English question", true);
  await shot(page, "42-wide-p2-english.png");
  await tap(page.getByRole("button", { name: "Exit" }));
  await page.waitForSelector("text=跟小芽开始");

  await backToProfiles(page);
  await openParent(page);
  const details = page.locator("details.content-provenance");
  if (!(await details.evaluate((el) => el.open))) await page.locator("details.content-provenance summary").click();
  await page.getByText(/内容版本 pilot-22/).waitFor({ state: "visible" });
  const summary = await details.innerText();
  if (!summary.includes("46 个知识点") || !summary.includes("775 道题")) failures.push(`content summary is not 46/775: ${summary}`);
  if (!summary.includes("K2 准备")) failures.push(`content summary omits K2 readiness: ${summary}`);
  await assertLayout(page, "parent content summary");
  await shot(page, "43-wide-parent-content-summary.png");

  await browser.close();
  console.log(JSON.stringify({ checks, failures }, null, 2));
  if (failures.length) process.exitCode = 1;
})().catch(async (error) => {
  console.error(error);
  if (browser) await browser.close().catch(() => {});
  process.exitCode = 1;
});
