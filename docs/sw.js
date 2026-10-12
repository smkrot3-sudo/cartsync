/* network first, cache as fallback: always the latest version when online, still works offline */
const CACHE='cartsync-1791787611279';
const CORE=['./','index.html','manifest.webmanifest','vendor/supabase.js','fonts/varela-round-hebrew-400-normal.woff2','fonts/varela-round-latin-400-normal.woff2','fonts/suez-one-hebrew-400-normal.woff2','fonts/suez-one-latin-400-normal.woff2','fonts/rubik-wetpaint-hebrew.woff2','fonts/rubik-wetpaint-latin.woff2','icons/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin||u.pathname.endsWith('.apk')||u.pathname.endsWith('app-version.json'))return;
  e.respondWith(fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c))}return r})
    .catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||(e.request.mode==='navigate'?caches.match('index.html'):undefined))));
});
