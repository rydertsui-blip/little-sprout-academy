const { webkit } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs=require("fs"), path=require("path");
const ROOT="/Users/rydertsui/Desktop/幼儿学习天地/work";
const BASE="http://127.0.0.1:4186/family/";
const WEBKIT="/Users/rydertsui/Library/Caches/ms-playwright/webkit-2388/pw_run.sh";
const SHOTS=path.join(ROOT,"family-audit/webkit-fix"); fs.mkdirSync(SHOTS,{recursive:true});
const seedBase=JSON.parse(fs.readFileSync(path.join(ROOT,"new-content-seed.json"),"utf8"));
const rows=JSON.parse(fs.readFileSync("/tmp/all-questions.json","utf8"));
const targets=["q-math-time-1","q-math-add-sub-100-18","q-match-math-15"];
const failures=[], checks=[];
function seedFor(row){const seed=JSON.parse(JSON.stringify(seedBase));const child=seed.children[0];child.gradeLevel="K2";child.ageYears=5;child.sessions=[];child.activeSessions={[row.subject]:{id:`wk-${row.id}`,childId:child.id,subject:row.subject,kind:"practice",length:1,startedAt:"2026-11-24T10:00:00.000Z",completedAt:null,plannedQuestionIds:[row.id],attempts:[],summary:[]}};return seed;}
async function tap(el){await el.waitFor({state:"visible",timeout:15000});await el.scrollIntoViewIfNeeded();await el.tap({timeout:15000});}
async function open(page, seed, row){
 await page.addInitScript(data=>localStorage.setItem("little-sprout-family-v1",JSON.stringify(data)),seed);
 await page.goto(BASE,{waitUntil:"networkidle"});
 if(await page.getByRole("button",{name:"打开家庭学习区"}).count()){await page.getByLabel("家长密码").fill("2468");await tap(page.getByRole("button",{name:"打开家庭学习区"}));}
 await page.getByRole("button",{name:"小果的学习档案"}).tap();await page.waitForSelector("text=跟小芽开始");
 await page.locator(row.subject==="math"?".subject-card.math-course":row.subject==="mandarin"?".subject-card.mandarin-course":".subject-card.english-course").tap();
 await page.waitForSelector("[data-testid=question-prompt]");
}
async function inspect(page,label,phone){
 const data=await page.evaluate(()=>{
  const rect=el=>{const r=el.getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),w:Math.round(r.width),h:Math.round(r.height),text:(el.textContent||"").trim().slice(0,40)};};
  return {overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth,options:[...document.querySelectorAll(".answer-option")].map(rect),cards:[...document.querySelectorAll(".match-card")].map(rect),small:[...document.querySelectorAll("button,summary")].filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return s.display!=="none"&&s.visibility!=="hidden"&&r.width>0&&r.height>0&&(r.width<44||r.height<44);}).map(rect),clockNumbers:document.querySelectorAll(".clock-svg text").length};
 });
 if(data.overflowX>1) failures.push(`${label}: horizontal overflow ${data.overflowX}`);
 if(phone) for(const x of [...data.options,...data.cards]) if(x.bottom>845) failures.push(`${label}: below first screen ${JSON.stringify(x)}`);
 if(data.small.length) failures.push(`${label}: touch <44 ${JSON.stringify(data.small)}`);
 checks.push(`${label}: overflowX=${data.overflowX} options=${data.options.length} cards=${data.cards.length} clockNumbers=${data.clockNumbers}`);
}
(async()=>{
 const browser=await webkit.launch({headless:true,executablePath:WEBKIT});
 for(const id of targets){
  const row=rows.find(r=>r.id===id);
  for(const [w,h] of [[390,844],[1024,768]]){
   const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:1,hasTouch:true,locale:"zh-SG",timezoneId:"Asia/Singapore",serviceWorkers:"block"});
   const page=await ctx.newPage();
   page.on("pageerror",e=>failures.push(`${id}-${w} pageerror: ${e.message}`));
   page.on("console",m=>{if(m.type()==="error")failures.push(`${id}-${w} console: ${m.text()}`);});
   try{
    await open(page,seedFor(row),row);
    await inspect(page,`${id}-${w}`,w<768);
    await page.screenshot({path:path.join(SHOTS,`${id}-${w}-initial.png`),fullPage:true});
    if(row.kind==="choice"){
      const opt=page.locator(".answer-option").filter({hasText:new RegExp(`^${row.correctAnswer.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}$`)});
      if(await opt.count()!==1) throw new Error(`correct option count ${await opt.count()}`);
      await tap(opt.first());
    }else{
      for(const pair of row.pairs){await tap(page.locator(`[data-match-side="left"][data-pair-id="${pair.id}"]`));await tap(page.locator(`[data-match-side="right"][data-pair-id="${pair.id}"]`));}
    }
    await page.waitForSelector("[data-testid=answer-feedback]",{timeout:15000});
    await inspect(page,`${id}-${w}-feedback`,w<768);
    await page.screenshot({path:path.join(SHOTS,`${id}-${w}-feedback.png`),fullPage:true});
    await tap(page.locator(".answer-feedback .wide-button"));
    await page.waitForSelector(".result-screen",{timeout:15000});
    checks.push(`${id}-${w}: ok`);
   }catch(e){failures.push(`${id}-${w}: ${e.message}`);await page.screenshot({path:path.join(SHOTS,`${id}-${w}-fail.png`),fullPage:true}).catch(()=>{});}
   await ctx.close();
  }
 }
 await browser.close();
 fs.writeFileSync(path.join(ROOT,"family-audit/webkit-math-layout-audit.json"),JSON.stringify({checks,failures},null,2));
 console.log(JSON.stringify({checks:checks.length,failures},null,2));
})();
