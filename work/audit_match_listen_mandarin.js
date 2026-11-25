const { chromium } = require("/Users/rydertsui/.npm/_npx/d6c95a2c1e52845a/node_modules/playwright");
const fs=require("fs"),path=require("path");
const ROOT="/Users/rydertsui/Desktop/幼儿学习天地/work";const BASE="http://127.0.0.1:4186/family/";
const OUT=path.join(ROOT,"family-audit/listen-match-mandarin");fs.mkdirSync(OUT,{recursive:true});
const seedBase=JSON.parse(fs.readFileSync(path.join(ROOT,"new-content-seed.json"),"utf8"));
const row=JSON.parse(fs.readFileSync("/tmp/all-questions.json","utf8")).find(r=>r.id==="q-match-mandarin-2");
const failures=[];async function tap(el){await el.waitFor({state:"visible"});await el.scrollIntoViewIfNeeded();await el.tap();}
function seedFor(){const seed=JSON.parse(JSON.stringify(seedBase));const c=seed.children[0];c.gradeLevel="K2";c.ageYears=5;c.sessions=[];c.activeSessions={mandarin:{id:"listen-md",childId:c.id,subject:"mandarin",kind:"practice",length:1,startedAt:"2026-11-24T10:00:00.000Z",completedAt:null,plannedQuestionIds:[row.id],attempts:[],summary:[]}};return seed;}
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
 await page.waitForFunction(() => [...document.querySelectorAll('[data-match-side="right"] img')].every((img) => img.complete && img.naturalWidth > 0), null, { timeout: 10000 });
 const initial=await page.evaluate(()=>({
  left:[...document.querySelectorAll('[data-match-side="left"]')].map(el=>el.textContent.trim()),
  right:[...document.querySelectorAll('[data-match-side="right"]')].map(el=>el.textContent.trim()),
  images:[...document.querySelectorAll('[data-match-side="right"] img')].map(img=>({src:img.getAttribute('src'),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight})),
  cards:[...document.querySelectorAll('.match-card')].map(el=>{const r=el.getBoundingClientRect();return{text:el.textContent.trim(),top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height)}}),
  overflowX:document.documentElement.scrollWidth-document.documentElement.clientWidth
 }));
 if(!initial.left.every(t=>/^听 \d$/.test(t))) failures.push(`${w}: left cards are not audio-only Chinese ${JSON.stringify(initial.left)}`);
 if(initial.left.some(t=>/猫|狗|鸟/.test(t))) failures.push(`${w}: left card reveals word ${JSON.stringify(initial.left)}`);
 if(initial.images.length!==3||initial.images.some(i=>!i.naturalWidth)) failures.push(`${w}: right pictures not loaded ${JSON.stringify(initial.images)}`);
 if(initial.cards.some(c=>c.bottom>h+1)) failures.push(`${w}: card below first screen ${JSON.stringify(initial.cards.filter(c=>c.bottom>h))}`);
 if(initial.overflowX>1) failures.push(`${w}: overflowX ${initial.overflowX}`);
 await page.screenshot({path:path.join(OUT,`${w}x${h}-initial.png`),fullPage:true});
 await tap(page.locator('[data-match-side="left"][data-pair-id="q-match-mandarin-2-p1"]'));
 await page.waitForTimeout(300);
 const afterLeft=await page.evaluate(()=>({status:document.getElementById('match-status')?.textContent,played:window.__played}));
 if(!afterLeft.played.some(src=>/zh-mao|mao/i.test(src))) failures.push(`${w}: left tap did not play 猫 ${JSON.stringify(afterLeft.played)}`);
 if(["猫","狗","鸟"].some(word=>(afterLeft.status??"").includes(word))) failures.push(`${w}: status reveals word ${afterLeft.status}`);
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
 console.log(w,JSON.stringify({feedbackView}));
 await tap(page.locator(".answer-feedback .wide-button"));await page.waitForSelector(".result-screen",{timeout:10000});
 console.log(w,JSON.stringify({initial,afterLeft}));
 await ctx.close();
}
await browser.close();fs.writeFileSync(path.join(ROOT,"family-audit/listen-match-mandarin-audit.json"),JSON.stringify({failures},null,2));console.log(JSON.stringify({failures},null,2));
})();
