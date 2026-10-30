const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const DOCS=process.env.DOCS||require('path').join(__dirname,'../../docs'), MOCK=fs.readFileSync(__dirname+'/mock-supabase.js','utf8');
const OUT=process.env.OUT||__dirname+'/shots/'; fs.mkdirSync(OUT,{recursive:true});
let errors=0;
(async()=>{
const b=await chromium.launch();
async function ctx(me,opts={}){
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,locale:'he-IL',colorScheme:opts.dark?'dark':'light',userAgent:'Mozilla/5.0 (Linux; Android 14) Mobile'});
 await c.route('**/*',async r=>{const u=new URL(r.request().url());
  if(u.hostname!=='app.test') return r.abort();
  if(u.pathname.endsWith('vendor/supabase.js')) return r.fulfill({contentType:'text/javascript',body:`window.__MOCK_ME=${JSON.stringify(me)};window.__MOCK_LOGGEDOUT=${!!opts.out};`+MOCK});
  if(u.pathname.endsWith('app-version.json')) return r.fulfill({status:404,body:''}); let p=path.join(DOCS,u.pathname.endsWith('/')?'index.html':u.pathname);
  if(!fs.existsSync(p)) return r.fulfill({status:404,body:''});
  const ext=path.extname(p);const ct={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml','.webmanifest':'application/json'}[ext]||'application/octet-stream';
  r.fulfill({contentType:ct,body:fs.readFileSync(p)});});
 await c.addInitScript(()=>{try{localStorage.setItem('cs-guide-seen','1');localStorage.setItem('cs-whatsnew-seen','9999');}catch(e){}});
 if(opts.addInit) await c.addInitScript(opts.addInit);
 const p=await c.newPage(); p.on('pageerror',e=>{errors++;console.log('ERR['+me+']',e.message,e.stack&&e.stack.split('\n')[1])});
 p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')console.log('console['+me+']',m.type(),m.text().slice(0,200))});
 await p.goto('https://app.test/index.html'); await p.waitForTimeout(1500);
 if(!opts.stayOnHouses && await p.evaluate(()=>document.body.dataset.screen==='houses')){ await p.click('[data-house=h1]'); await p.waitForTimeout(900); }
 return p;
}
const shot=async(p,n,full)=>{await p.waitForTimeout(500);await p.screenshot({path:OUT+n+'.png',fullPage:!!full});console.log('shot',n)};
const T=async(p,sel)=>{await p.click(sel);await p.waitForTimeout(600)};
const close=async p=>{await p.evaluate(()=>{const b=document.querySelector('#sheet [data-act=sheet-close]'); if(b) b.click();}); await p.waitForTimeout(400)};
const scr=p=>p.evaluate(()=>document.body.dataset.screen);
let p=await ctx('u1',{out:true}); await shot(p,'01-auth');
// owner, two households: the way in is the households screen
p=await ctx('u1',{stayOnHouses:true}); console.log('entry screen:', await scr(p)); await shot(p,'02-households',true);
await T(p,'[data-house=h1]'); console.log('after picking a household:', await scr(p)); await shot(p,'03-fridges-owner',true);
await T(p,'#tb-up'); console.log('back from fridges:', await scr(p));
await T(p,'[data-house=h1]');
await T(p,'#tb-acct'); await shot(p,'04-settings',true); await close(p);
await T(p,'#fridge-new'); await shot(p,'05-new-list-sheet'); await close(p);
await T(p,'[data-list-more=l2]'); await shot(p,'05b-fridge-menu'); await close(p);
await T(p,'#tb-people'); console.log('people button:', await scr(p)); await shot(p,'06-household-owner',true);
await T(p,'#hh-invite'); await shot(p,'08-invite',true); await close(p);
await T(p,'#tb-up'); console.log('back from household page:', await scr(p));
await T(p,'#lists-open [data-list=l1]'); await shot(p,'09-list-owner'); await shot(p,'09b-list-owner-full',true);
await T(p,'#view-toggle'); await shot(p,'09c-list-flat'); await T(p,'#view-toggle');
await T(p,'#tb-menu'); await shot(p,'10-list-menu'); await close(p);
await T(p,'#pending-toggle'); await shot(p,'11-pending-open',true);
await T(p,'#fab-add'); await shot(p,'12-add-sheet'); await close(p);
await p.goBack(); await p.waitForTimeout(800); console.log('android back from list:', await scr(p));
await T(p,'#lists-closed [data-list=l3]'); await shot(p,'14-closed-owner',true);
await T(p,'#tb-back'); console.log('arrow back from closed list:', await scr(p));
await p.goBack(); await p.waitForTimeout(700); console.log('android back from fridges:', await scr(p));
// requester, one household: lands straight on the fridges, the arrow still leads up to the households
p=await ctx('u3'); console.log('requester entry:', await scr(p)); await shot(p,'16-fridges-requester',true);
await T(p,'#lists-open [data-list=l1]'); await shot(p,'17-list-requester',true);
await T(p,'#fab-add'); await shot(p,'18-request-sheet'); await close(p);
await T(p,'#tb-menu'); await shot(p,'19-menu-requester'); await close(p);
await T(p,'#tb-back'); await T(p,'#tb-people'); await shot(p,'20-household-requester',true);
await T(p,'#tb-up'); await T(p,'#lists-closed [data-list=l3]'); await shot(p,'21-closed-requester',true);
// viewer (merged into requester)
p=await ctx('u4'); await shot(p,'22-fridges-viewer',true);
// editor
p=await ctx('u2'); await shot(p,'24-fridges-editor',true); await T(p,'#lists-closed [data-list=l4]'); await shot(p,'25-closed-editor-collects',true);
// close trip
p=await ctx('u1'); await T(p,'#lists-open [data-list=l1]'); await T(p,'#list-finish'); await shot(p,'26-close-trip');
// dark + english
p=await ctx('u1',{dark:true,stayOnHouses:true}); await shot(p,'27-households-dark'); await T(p,'[data-house=h1]'); await shot(p,'27b-fridges-dark',true); await T(p,'#lists-open [data-list=l1]'); await shot(p,'28-list-dark');
p=await ctx('u1',{addInit:()=>{try{localStorage.setItem('cs-lang','en')}catch(e){}}}); await shot(p,'29-fridges-en',true); await T(p,'#lists-open [data-list=l1]'); await shot(p,'30-list-en');
await b.close();
console.log('PAGE ERRORS:',errors);
})();
