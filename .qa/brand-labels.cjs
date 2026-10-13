// Regression: exact visible comparison labels after scripts and a translation-contract exercise.
// Run with PLAYWRIGHT_MODULE=<installed playwright-core> node .qa/brand-labels.cjs <origin> <report-dir>
// This checks rendered text, not just source regex. It never sends visit events.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright-core');
const origin=process.argv[2]||'https://a510.space',out=path.resolve(process.argv[3]||'brand-qa');
const slugs=['hubox-paramytha-hills','mz-olivia','novocasa-perfect-homes-138','essa-kypseli','africanos-serenity-a','demirel-valora','gokmenoglu-fethiye','cmt-yasam1332','hermes-hill','ozaydin-serenity'];
const tasks=slugs.flatMap((slug,i)=>['owner','p'].flatMap(kind=>(i<5?['']:['','en/']).flatMap(lang=>['','presentation/'].map(demo=>({number:i+1,slug,kind,lang,demo,pathname:`/apertis/${kind}/${slug}/${lang}${demo}`})))));
const result={status:'running',pages:[],errors:[],method:'Actual DOM after JS; translation stress respects HTML translate=false/notranslate. Native Chrome autotranslate not invoked.'};
(async()=>{fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/Users/arkadiy/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'});try{
 for(const task of tasks){
  const c=await b.newContext({serviceWorkers:'block'}),p=await c.newPage();let blocked=0;
  await c.addInitScript(()=>{const block=u=>new URL(String(u),location.href).pathname==='/api/apertis/visit';const f=window.fetch.bind(window),s=navigator.sendBeacon.bind(navigator);window.fetch=(u,o)=>block(u)?Promise.resolve(new Response(null,{status:204})):f(u,o);navigator.sendBeacon=(u,d)=>block(u)?true:s(u,d)});
  await c.route('**/*',async r=>{if(new URL(r.request().url()).origin===origin)await r.continue();else{blocked++;await r.abort()}});
  for(const width of [1440,390]){
   await p.setViewportSize({width,height:1000});const response=await p.goto(origin+task.pathname,{waitUntil:'networkidle'});assert.equal(response.status(),200);
   const labels=p.locator('.comparison-labels > span:last-child');assert.equal(await labels.count(),task.demo?0:2);
   const audit=await p.evaluate(()=>{
    const labels=[...document.querySelectorAll('.comparison-labels > span:last-child')].map(e=>({text:e.innerText,translate:e.translate,before:getComputedStyle(e,'::before').content,after:getComputedStyle(e,'::after').content,display:getComputedStyle(e).display,rect:e.getBoundingClientRect().toJSON()}));
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),unprotected=[];let n;
    while(n=walker.nextNode())if(/\bAPERTIS\b/.test(n.data)&&!n.parentElement.closest('script,style')&&n.parentElement.translate!==false)unprotected.push(n.data);
    return {labels,unprotected,typos:/\baperit\b/i.test(document.body.innerText)};
   });
   assert.deepEqual(audit.unprotected,[]);assert.equal(audit.typos,false);
   for(const e of audit.labels){assert.equal(e.text,'APERTIS');assert.equal(e.translate,false);assert(['none','normal','""'].includes(e.before));assert(['none','normal','""'].includes(e.after));assert(e.rect.width>0&&e.rect.height>0);}
   if(!task.demo){for(let i=0;i<2;i++)await p.locator('.comparison-labels').nth(i).screenshot({path:path.join(out,`${task.number}-${task.kind}-${task.lang?'en':'primary'}-${width}-label${i+1}.png`)});}
   if(task.number===7&&!task.demo&&task.kind==='p'&&!task.lang){await p.emulateMedia({colorScheme:'dark'});await p.locator('.cases figure').first().screenshot({path:path.join(out,`target-7-primary-${width}.png`)});await p.emulateMedia({colorScheme:'light'});}
   // Controlled translator to exercise markup contract, not a claim to reproduce Chrome's engine.
   const translated=await p.evaluate(()=>{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];let n;while(n=walker.nextNode())nodes.push(n);let changed=0;for(const n of nodes){if(n.parentElement.closest('script,style')||n.parentElement.translate===false||n.parentElement.closest('.notranslate'))continue;const text=n.data.replace(/\bAPERTIS\b/g,'Aperit').replace(/\bOriginal\b/g,'Translated original');if(text!==n.data){n.data=text;changed++}}return changed});
   assert.deepEqual(await labels.allInnerTexts(),task.demo?[]:['APERTIS','APERTIS']);if(!task.demo)assert(translated>0,'Rest of page must remain translatable');
   result.pages.push({...task,width,labels:audit.labels.map(x=>x.text),protected:true,translationContract:'passed',blockedExternalRequests:blocked});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));
  }
  await c.close();console.log('BRAND PASS',task.pathname);
 }
 result.status='passed';
}catch(e){result.status='failed';result.errors.push(e.stack||String(e));throw e}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));await b.close();}})().catch(e=>{console.error(e);process.exitCode=1});
