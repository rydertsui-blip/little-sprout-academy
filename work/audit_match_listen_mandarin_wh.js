const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs=require("fs"),path=require("path");
const ROOT="/Users/rydertsui/Desktop/幼儿学习天地/work";const BASE="http://127.0.0.1:4186/family/";
const OUT=path.join(ROOT,"family-audit/listen-match-mandarin-wh");fs.mkdirSync(OUT,{recursive:true});
const seedBase=JSON.parse(fs.readFileSync(path.join(ROOT,"new-content-seed.json"),"utf8"));
const row=JSON.parse(fs.readFileSync("/tmp/all-questions.json","utf8")).find(r=>r.id==="q-match-mandarin-1");
const failures=[];async function tap(el){await el.waitFor({state:"visible"});await el.scrollIntoViewIfNeeded();await el.tap();}
function seedFor(){const seed=JSON.parse(JSON.stringify(seedBase));const c=seed.children[0];c.gradeLevel="P1";c.ageYears=6;c.sessions=[];c.activeSessions={mandarin:{id:"listen-wh",childId:c.id,subject:"mandarin",kind:"practice",length:1,startedAt:"2026-11-24T10:00:00.000Z",completedAt:null,plannedQuestionIds:[row.id],attempts:[],summary:[]}};return seed;}
(async()=>{const browser=await chromium.launch({headless:true,executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"});
for(const [w,h] of [[390,844],[1024,768]]){
 const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:w<768,hasTouch:true,locale:"zh-SG",serviceWorkers:"block"});const page=await ctx.newPage();
 await page.addInitScript(()=>{const original=HTMLMediaElement.prototype.play;window.__played=[];HTMLMediaElement.prototype.play=function(){window.__played.push(this.src);return original.call(this);};});
 page.on("pageerror",e=>failures.push(`${w} pageerror ${e.message}`));
 await page.addInitScript(d=>localStorage.setItem("little-sprout-family-v1",JSON.stringify(d)),seedFor());
 await page.goto(BASE,{waitUntil:"networkidle"});
 if(await page.getByRole("button",{name:"打开家庭学习区"}).count()){await page.getByLabel("家长密码").fill("2468");await tap(page.getByRole("button",{name:"打开家庭学习区"}));}
 await page.getByRole("button",{name:"小果的学习档案"}).tap();await page.waitForSelector("text=跟小芽开始");
 await page.locator(".subject-card.mandarin-course").tap();await page.waitForSelector("[data-testid=question-prompt]");
 const initial=await page.evaluate(()=>({
  left:[...document.querySelectorAll('[data-match-side="left"]')].map(el=>el.textContent.trim()),
  right:[...document.querySelectorAll('[data-match-side="right"]')].map(el=>el.textContent.trim()),
  images:[...document.querySelectorAll('[data-match-side="right"] img')].length,
  cards:[...document.querySelectorAll('.match-card')].map(el=>{const r=el.getBoundingClientRect();return{text:el.textContent.trim(),top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height)}}),
  overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth
 }));
 if(!initial.left.every(t=>/^听 \d$/.test(t))) failures.push(`${w}: left not audio-only Chinese ${JSON.stringify(initial.left)}`);
 if(initial.left.some(t=>/小明|厨房|看书/.test(t))) failures.push(`${w}: left reveals answer ${JSON.stringify(initial.left)}`);
 if(initial.images!==0) failures.push(`${w}: unexpected right image`);
 if(initial.cards.some(c=>c.bottom>h+1)) failures.push(`${w}: card below first screen ${JSON.stringify(initial.cards.filter(c=>c.bottom>h))}`);
 if(initial.overflowX>1) failures.push(`${w}: overflowX ${initial.overflowX}`);
 await page.screenshot({path:path.join(OUT,`${w}x${h}-initial.png`),fullPage:true});
 await tap(page.locator('[data-match-side="left"][data-pair-id="q-match-mandarin-1-p1"]'));
 await page.waitForTimeout(300);
 const afterLeft=await page.evaluate(()=>({status:document.getElementById('match-status')?.textContent,played:window.__played}));
 if(!afterLeft.played.some(src=>/zh-xiaoming|x iaoming/i.test(src))) failures.push(`${w}: left tap did not play 小明 ${JSON.stringify(afterLeft.played)}`);
 if(["小明","厨房","看书"].some(word=>(afterLeft.status??"").includes(word))) failures.push(`${w}: status reveals answer ${afterLeft.status}`);
 await page.screenshot({path:path.join(OUT,`${w}x${h}-selected.png`),fullPage:true});
 for(const pair of row.pairs){
  await tap(page.locator(`[data-match-side="left"][data-pair-id="${pair.id}"]`));
  await tap(page.locator(`[data-match-side="right"][data-pair-id="${pair.id}"]`));
 }
 await page.waitForSelector("[data-testid=answer-feedback]",{timeout:10000});
 await page.waitForTimeout(800);
 const feedbackView=await page.evaluate(()=>{const fb=document.querySelector('[data-testid=answer-feedback]').getBoundingClientRect();const next=document.querySelector('.answer-feedback .wide-button').getBoundingClientRect();return{scrollY:Math.round(scrollY),feedback:{top:Math.round(fb.top),bottom:Math.round(fb.bottom)},next:{top:Math.round(next.top),bottom:Math.round(next.bottom)},viewport:innerHeight};});
 if(feedbackView.feedback.top>=feedbackView.viewport||feedbackView.next.bottom>feedbackView.viewport+1) failures.push(`${w}: feedback/next not in view ${JSON.stringify(feedbackView)}`);
 await page.screenshot({path:path.join(OUT,`${w}x${h}-feedback.png`),fullPage:false});
 await tap(page.locator(".answer-feedback .wide-button"));await page.waitForSelector(".result-screen",{timeout:10000});
 console.log(w,JSON.stringify({initial,afterLeft,feedbackView}));
 await ctx.close();
}
await browser.close();fs.writeFileSync(path.join(ROOT,"family-audit/listen-match-mandarin-wh-audit.json"),JSON.stringify({failures},null,2));console.log(JSON.stringify({failures},null,2));
})();
