/* network first, cache as fallback: always the latest version when online, still works offline */
const CACHE='cartsync-1791881909960';
const CORE=['./','index.html','manifest.webmanifest','vendor/supabase.js','fonts/varela-round-hebrew-400-normal.woff2','fonts/varela-round-latin-400-normal.woff2','fonts/suez-one-hebrew-400-normal.woff2','fonts/suez-one-latin-400-normal.woff2','fonts/rubik-wetpaint-hebrew.woff2','fonts/rubik-wetpaint-latin.woff2','icons/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.endsWith('.apk')||u.pathname.endsWith('app-version.json'))return;
  // the page (index.html) carries ALL of the app's JS inline — GitHub Pages serves it with a
  // 10-minute browser cache, which silently defeated "network first" here. Force a real request
  // for navigations so a fix actually reaches people instead of sitting behind that cache.
  const opts = e.request.mode==='navigate' ? {cache:'no-store'} : {};
  e.respondWith(fetch(e.request,opts).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r})
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||(e.request.mode==='navigate'?caches.match('index.html'):undefined))));
});
