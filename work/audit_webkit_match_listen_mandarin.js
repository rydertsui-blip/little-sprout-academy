const { webkit } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs=require("fs"),path=require("path");
const ROOT="/Users/rydertsui/Desktop/幼儿学习天地/work";const BASE="http://127.0.0.1:4186/family/";
const WEBKIT="/Users/rydertsui/Library/Caches/ms-playwright/webkit-2388/pw_run.sh";
const OUT=path.join(ROOT,"family-audit/webkit-listen-mandarin");fs.mkdirSync(OUT,{recursive:true});
const seedBase=JSON.parse(fs.readFileSync(path.join(ROOT,"new-content-seed.json"),"utf8"));
const row=JSON.parse(fs.readFileSync("/tmp/all-questions.json","utf8")).find(r=>r.id==="q-match-mandarin-2");
const failures=[],checks=[];async function tap(el){await el.waitFor({state:"visible",timeout:15000});await el.scrollIntoViewIfNeeded();await el.tap({timeout:15000});}
function seedFor(){const seed=JSON.parse(JSON.stringify(seedBase));const c=seed.children[0];c.gradeLevel="K2";c.ageYears=5;c.sessions=[];c.activeSessions={mandarin:{id:"wk-listen-md",childId:c.id,subject:"mandarin",kind:"practice",length:1,startedAt:"2026-11-24T10:00:00.000Z",completedAt:null,plannedQuestionIds:[row.id],attempts:[],summary:[]}};return seed;}
(async()=>{const browser=await webkit.launch({headless:true,executablePath:WEBKIT});
for(const [w,h] of [[390,844],[1024,768]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:w<768,hasTouch:true,locale:"zh-SG",serviceWorkers:"block"});const page=await ctx.newPage();
 await page.addInitScript(()=>{const original=HTMLMediaElement.prototype.play;window.__played=[];HTMLMediaElement.prototype.play=function(){window.__played.push(this.src);return original.call(this).catch(()=>{});};});
 page.on("pageerror",e=>failures.push(`${w} pageerror ${e.message}`));
 await page.addInitScript(d=>localStorage.setItem("little-sprout-family-v1",JSON.stringify(d)),seedFor());
 await page.goto(BASE,{waitUntil:"networkidle"});
 if(await page.getByRole("button",{name:"打开家庭学习区"}).count()){await page.getByLabel("家长密码").fill("2468");await tap(page.getByRole("button",{name:"打开家庭学习区"}));}
 await page.getByRole("button",{name:"小果的学习档案"}).tap();await page.waitForSelector("text=跟小芽开始");
 await page.locator(".subject-card.mandarin-course").tap();await page.waitForSelector("[data-testid=question-prompt]");
 await page.waitForFunction(() => [...document.querySelectorAll('[data-match-side="right"] img')].every((img) => img.complete && img.naturalWidth > 0), null, { timeout: 15000 });
 const data=await page.evaluate(()=>{const rect=el=>{const r=el.getBoundingClientRect();return{top:Math.round(r.top),bottom:Math.round(r.bottom),w:Math.round(r.width),h:Math.round(r.height),text:(el.textContent||"").trim()};};return{overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth,cards:[...document.querySelectorAll('.match-card')].map(rect),left:[...document.querySelectorAll('[data-match-side="left"]')].map(el=>el.textContent.trim()),images:[...document.querySelectorAll('[data-match-side="right"] img')].map(img=>({src:img.getAttribute('src'),width:img.naturalWidth,height:img.naturalHeight})),small:[...document.querySelectorAll('button,summary')].filter(el=>{const r=el.getBoundingClientRect();const s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&(r.width<44||r.height<44);}).map(rect)};});
 if(data.overflowX>1) failures.push(`${w}: overflowX ${data.overflowX}`);
 if(!data.left.every(t=>/^听 \d$/.test(t))) failures.push(`${w}: left not audio-only Chinese ${JSON.stringify(data.left)}`);
 if(data.left.some(t=>/猫|狗|鸟/.test(t))) failures.push(`${w}: left reveals word ${JSON.stringify(data.left)}`);
 if(data.images.length!==3||data.images.some(i=>!i.width)) failures.push(`${w}: pictures ${JSON.stringify(data.images)}`);
 if(data.cards.some(c=>c.bottom>h+1)) failures.push(`${w}: below first screen ${JSON.stringify(data.cards.filter(c=>c.bottom>h))}`);
 if(data.small.length&&w<768) failures.push(`${w}: touch under 44 ${JSON.stringify(data.small)}`);
 checks.push(`${w}: overflowX=${data.overflowX} cards=${data.cards.length} images=${data.images.length} small=${data.small.length}`);
 await page.screenshot({path:path.join(OUT,`${w}x${h}-initial.png`),fullPage:true});
 await tap(page.locator('[data-match-side="left"][data-pair-id="q-match-mandarin-2-p1"]'));
 await page.waitForTimeout(300);
 const after=await page.evaluate(()=>({status:document.getElementById('match-status')?.textContent,played:window.__played}));
 if(!after.played.some(src=>/zh-mao|mao/i.test(src))) failures.push(`${w}: no 猫 play ${JSON.stringify(after.played)}`);
 if(["猫","狗","鸟"].some(word=>(after.status??"").includes(word))) failures.push(`${w}: status reveal ${after.status}`);
 await page.screenshot({path:path.join(OUT,`${w}x${h}-selected.png`),fullPage:true});
 for(const pair of row.pairs){await tap(page.locator(`[data-match-side="left"][data-pair-id="${pair.id}"]`));await tap(page.locator(`[data-match-side="right"][data-pair-id="${pair.id}"]`));}
 await page.waitForSelector("[data-testid=answer-feedback]",{timeout:15000});await page.screenshot({path:path.join(OUT,`${w}x${h}-feedback.png`),fullPage:true});
 await tap(page.locator(".answer-feedback .wide-button"));await page.waitForSelector(".result-screen",{timeout:15000});
 console.log(w,JSON.stringify({data,after}));await ctx.close();
}
await browser.close();fs.writeFileSync(path.join(ROOT,"family-audit/webkit-listen-mandarin-audit.json"),JSON.stringify({checks,failures},null,2));console.log(JSON.stringify({checks,failures},null,2));
})();
