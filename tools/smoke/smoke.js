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
 if(!opts.stayOnHouses && await p.evaluate(()=>document.body.dataset.screen==='houses')){ await p.click('[data-house=h1]'); await p.waitForTimeout(900); await p.click('#tab-home'); await p.waitForTimeout(600); }
 return p;
}
const shot=async(p,n,full)=>{await p.waitForTimeout(500);await p.screenshot({path:OUT+n+'.png',fullPage:!!full});console.log('shot',n)};
const T=async(p,sel)=>{await p.click(sel);await p.waitForTimeout(600)};
const close=async p=>{await p.evaluate(()=>{const b=document.querySelector('#sheet [data-act=sheet-close]'); if(b) b.click();}); await p.waitForTimeout(400)};
let p=await ctx('u1',{out:true}); await shot(p,'01-auth');
// the houses: the way in when you belong to more than one household
p=await ctx('u1',{stayOnHouses:true}); await shot(p,'01b-houses',true);
console.log('entry screen:', await p.evaluate(()=>document.body.dataset.screen));
await T(p,'[data-house=h1]'); console.log('after picking a house:', await p.evaluate(()=>document.body.dataset.screen));
await shot(p,'01c-fridges-after-house',true);
// owner
p=await ctx('u1'); await shot(p,'02-home-owner',true);
await T(p,'#tb-hh'); await shot(p,'03-houses-from-topbar',true); await p.goBack(); await p.waitForTimeout(700);
await T(p,'#tb-acct'); await shot(p,'04-settings',true); await close(p);
await T(p,'#tab-lists'); await shot(p,'05-lists-owner',true);
await T(p,'[data-list-more=l2]'); await shot(p,'05b-row-menu'); await close(p);
await T(p,'#tab-household'); await shot(p,'06-household-owner',true);
await T(p,'#hh-members [data-member=u3], #hh-members button >> nth=2'); await shot(p,'07-member-sheet'); await close(p);
await T(p,'#hh-invite'); await shot(p,'08-invite',true); await close(p);
await T(p,'#tab-home'); await T(p,'#home-hero [data-list]'); await shot(p,'09-list-owner'); await shot(p,'09b-list-owner-full',true);
await T(p,'#tb-menu'); await shot(p,'10-list-menu'); await close(p);
await T(p,'#pending-toggle'); await shot(p,'11-pending-open',true);
await T(p,'#fab-add'); await shot(p,'12-add-sheet'); await close(p);
await p.goBack(); await p.waitForTimeout(800); await shot(p,'13-after-back');
console.log('screen after back:', await p.evaluate(()=>document.body.dataset.screen));
await T(p,'#tab-lists'); await T(p,'#lists-closed [data-list=l3]'); await shot(p,'14-closed-owner',true);
await p.goBack(); await p.waitForTimeout(600); console.log('after back from closed:', await p.evaluate(()=>document.body.dataset.screen));
await p.goBack(); await p.waitForTimeout(600); console.log('after 2nd back:', await p.evaluate(()=>document.body.dataset.screen));
// quick add on home
await p.fill('#home-quick-input','מלח'); await p.press('#home-quick-input','Enter'); await p.waitForTimeout(800); await shot(p,'15-quickadd');
// requester
p=await ctx('u3'); await shot(p,'16-home-requester',true); await T(p,'#home-hero [data-list]'); await shot(p,'17-list-requester',true);
await T(p,'#fab-add'); await shot(p,'18-request-sheet'); await close(p);
await T(p,'#tb-menu'); await shot(p,'19-menu-requester'); await close(p);
await p.goBack(); await p.waitForTimeout(500); await T(p,'#tab-household'); await shot(p,'20-household-requester',true);
await T(p,'#tab-lists'); await T(p,'#lists-closed [data-list=l3]'); await shot(p,'21-closed-requester',true);
// viewer (merged into requester)
p=await ctx('u4'); await shot(p,'22-home-viewer',true); await T(p,'#tab-household'); await shot(p,'23-household-viewer',true);
// editor
p=await ctx('u2'); await shot(p,'24-home-editor',true); await T(p,'#tab-lists'); await T(p,'#lists-closed [data-list=l4]'); await shot(p,'25-closed-editor-collects',true);
// close trip
p=await ctx('u1'); await T(p,'#home-hero [data-list]'); await T(p,'#list-finish'); await shot(p,'26-close-trip');
// dark + english
p=await ctx('u1',{dark:true}); await shot(p,'27-home-dark'); await T(p,'#home-hero [data-list]'); await shot(p,'28-list-dark');
p=await ctx('u1',{addInit:()=>{try{localStorage.setItem('cs-lang','en')}catch(e){}}}); await shot(p,'29-home-en',true); await T(p,'#home-hero [data-list]'); await shot(p,'30-list-en');
await b.close();
console.log('PAGE ERRORS:',errors);
})();
