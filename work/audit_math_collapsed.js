const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/math-fix");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const out = [];
function seedFor(id) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  const child = seed.children[0];
  child.sessions = []; child.activeSessions = { math: { id: `audit-${id}`, childId: child.id, subject: "math", kind: "practice", length: 1, startedAt: "2026-11-24T10:00:00.000Z", completedAt: null, plannedQuestionIds: [id], attempts: [], summary: [] } };
  return seed;
}
async function tap(el){await el.waitFor({state:"visible",timeout:15000}); await el.scrollIntoViewIfNeeded(); await el.tap({timeout:15000});}
async function open(page,id){
  await page.goto(BASE,{waitUntil:"domcontentloaded"});
  await page.evaluate(d=>localStorage.setItem("little-sprout-family-v1",JSON.stringify(d)),seedFor(id));
  await page.reload({waitUntil:"domcontentloaded"});
  if(await page.getByRole("button",{name:"打开家庭学习区"}).count()){await page.getByLabel("家长密码").fill("2468"); await tap(page.getByRole("button",{name:"打开家庭学习区"}));}
  await page.getByRole("button",{name:"小果的学习档案"}).waitFor({state:"visible"});
  await tap(page.getByRole("button",{name:"小果的学习档案"}));
  await page.getByText("跟小芽开始").waitFor({state:"visible"});
  await page.getByRole("button",{name:"数学 Math"}).first().click();
  await page.waitForSelector("[data-testid=question-prompt]");
}
async function measure(page){return page.evaluate(()=>{const r=e=>{if(!e)return null;const x=e.getBoundingClientRect();return {top:Math.round(x.top),bottom:Math.round(x.bottom),height:Math.round(x.height)}};return {docHeight:document.documentElement.scrollHeight,overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth,prompt:r(document.querySelector("[data-testid=question-prompt]")),tool:r(document.querySelector(".math-tool-body")),teach:r(document.querySelector(".skill-teach")),options:[...document.querySelectorAll(".answer-option")].map(e=>({text:e.textContent.trim().slice(0,50),...r(e)}))};})}
(async()=>{
 const browser=await chromium.launch({executablePath:CHROME,headless:true});
 const targets=["q-math-multiply-tables-7","q-math-shapes-4","q-math-measurement-units-6","q-math-measurement-units-10","q-math-money-1"];
 for(const id of targets){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  await open(page,id);
  const teachCount=await page.locator(".skill-teach summary").count();
  if(teachCount){ await tap(page.locator(".skill-teach summary").first()); await page.waitForTimeout(200); }
  const data=await measure(page);
  await page.screenshot({path:path.join(SHOTS,`${id}-390x844-teach-collapsed.png`),fullPage:true});
  out.push({id,teachCount,data});
  console.log(id,'teach',teachCount,'doc',data.docHeight,'options',data.options.map(o=>[o.text,o.top,o.bottom]));
  await context.close();
 }
 await browser.close();
 fs.writeFileSync(path.join(SHOTS,"collapsed-audit.json"),JSON.stringify(out,null,2));
})();
