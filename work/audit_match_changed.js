const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs = require("fs");
const path = require("path");
const ROOT = "/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE = "http://127.0.0.1:4186/family/";
const SHOTS = path.join(ROOT, "family-audit/match-fix");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
fs.mkdirSync(SHOTS, { recursive: true });
const seedBase = JSON.parse(fs.readFileSync(path.join(ROOT, "new-content-seed.json"), "utf8"));
const failures = [], checks = [];
const entries = [
  ["q-match-english-7", "english", ["q-match-english-7-p1","q-match-english-7-p2","q-match-english-7-p3"]],
  ["q-match-english-8", "english", ["q-match-english-8-p1","q-match-english-8-p2","q-match-english-8-p3"]],
  ["q-match-english-13", "english", ["q-match-english-13-p1","q-match-english-13-p2","q-match-english-13-p3"]],
  ["q-match-mandarin-10", "mandarin", ["q-match-mandarin-10-p1","q-match-mandarin-10-p2","q-match-mandarin-10-p3"]],
  ["q-match-mandarin-11", "mandarin", ["q-match-mandarin-11-p1","q-match-mandarin-11-p2","q-match-mandarin-11-p3"]],
  ["q-match-mandarin-14", "mandarin", ["q-match-mandarin-14-p1","q-match-mandarin-14-p2","q-match-mandarin-14-p3"]]
];
function seedFor(id, subject) {
  const seed = JSON.parse(JSON.stringify(seedBase));
  const child = seed.children[0];
  child.gradeLevel = "K2"; child.ageYears = 5; child.levelConfirmedOn = "2026-11-24"; child.sessions = [];
  child.activeSessions = { [subject]: { id: `audit-match-${id}`, childId: child.id, subject, kind: "practice", length: 1, startedAt: "2026-11-24T10:00:00.000Z", completedAt: null, plannedQuestionIds: [id], attempts: [], summary: [] } };
  return seed;
}
async function tap(el){await el.waitFor({state:"visible",timeout:15000});await el.scrollIntoViewIfNeeded();await el.tap({timeout:15000});}
async function openProfile(page, seed){
  await page.goto(BASE,{waitUntil:"domcontentloaded"});
  await page.evaluate(data=>localStorage.setItem("little-sprout-family-v1",JSON.stringify(data)),seed);
  await page.reload({waitUntil:"domcontentloaded"});
  if(await page.getByRole("button",{name:"打开家庭学习区"}).count()){await page.getByLabel("家长密码").fill("2468");await tap(page.getByRole("button",{name:"打开家庭学习区"}));}
  await page.getByRole("button",{name:"小果的学习档案"}).waitFor({state:"visible",timeout:15000});
  await tap(page.getByRole("button",{name:"小果的学习档案"}));
  await page.getByText("跟小芽开始").waitFor({state:"visible",timeout:15000});
}
async function measure(page){return page.evaluate(()=>{
  const rect=el=>{if(!el)return null;const r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),height:Math.round(r.height)}};
  return {viewport:{w:innerWidth,h:innerHeight},docHeight:document.documentElement.scrollHeight,overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    prompt:rect(document.querySelector("[data-testid=question-prompt]")),board:rect(document.querySelector("[data-testid=match-board]")),
    cards:[...document.querySelectorAll(".match-card")].map(el=>({text:(el.textContent||"").trim(),side:el.getAttribute("data-match-side"),...rect(el)}))};
});}
async function run(browser,id,subject,pairs,width,height){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<768,hasTouch:true});
  const page=await context.newPage();
  const label=`${id}-${width}x${height}`;
  try{
    await openProfile(page,seedFor(id,subject));
    const title=subject==="english"?"英语 English":"华文 Mandarin";
    await page.getByRole("button",{name:title}).first().click();
    await page.waitForSelector("[data-testid=match-board]",{timeout:15000});
    await page.waitForTimeout(200);
    await page.screenshot({path:path.join(SHOTS,`${label}-initial.png`),fullPage:true});
    const data=await measure(page);
    checks.push({id,width,height,data});
    if(data.overflowX>1) failures.push(`${label}: horizontal overflow ${data.overflowX}`);
    const below=data.cards.filter(c=>c.bottom>height+1);
    if(below.length) failures.push(`${label}: ${below.length} match card(s) below first screen: ${JSON.stringify(below)}`);
    const small=await page.evaluate(()=>[...document.querySelectorAll("button")].filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0&&(r.width<44||r.height<44);}).map(el=>({text:(el.textContent||"").trim().slice(0,30),w:Math.round(el.getBoundingClientRect().width),h:Math.round(el.getBoundingClientRect().height)})));
    if(small.length) failures.push(`${label}: touch targets below 44px ${JSON.stringify(small)}`);
    for(const pairId of pairs){
      await tap(page.locator(`[data-match-side="left"][data-pair-id="${pairId}"]`));
      await tap(page.locator(`[data-match-side="right"][data-pair-id="${pairId}"]`));
      await page.waitForTimeout(180);
    }
    await page.getByRole("button",{name:/Next question|下一题/}).waitFor({state:"visible",timeout:10000});
    await page.screenshot({path:path.join(SHOTS,`${label}-feedback.png`),fullPage:true});
    checks.push({id,width,height,feedback:true,next:true});
  }catch(e){failures.push(`${label}: ${e.message}`);}
  finally{await context.close();}
}
(async()=>{
  const browser=await chromium.launch({executablePath:CHROME,headless:true});
  for(const [id,subject,pairs] of entries){
    await run(browser,id,subject,pairs,390,844);
    await run(browser,id,subject,pairs,1024,768);
  }
  await browser.close();
  fs.writeFileSync(path.join(SHOTS,"audit.json"),JSON.stringify({checks,failures},null,2));
  console.log(JSON.stringify({failures:failures.length,checks:checks.length},null,2));
  if(failures.length) console.log(failures.join("\n"));
})();
