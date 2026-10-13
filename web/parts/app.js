/* Pure UI layer: rendering, local category/emoji guessing, sheets, toast. No network here — cloud.js drives state and wires the real actions via CS.on.*. */
(function(){
const $ = id => document.getElementById(id);
const esc = s => String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- local item -> category/emoji guesser (works with zero network; the AI edge function can refine this later) ---------- */
const DICT = [
  [['חלב','milk'],'dairy','🥛'], [['גבינה','cheese'],'dairy','🧀'], [['ביצים','egg'],'dairy','🥚'],
  [['יוגורט','yogurt','yoghurt'],'dairy','🥣'], [['חמאה','butter'],'dairy','🧈'], [['שמנת','cream'],'dairy','🥛'],
  [['קוטג','cottage'],'dairy','🧀'],
  [['לחם','bread'],'bakery','🍞'], [['חלה','challah'],'bakery','🍞'], [['פיתה','pita'],'bakery','🫓'],
  [['בורקס','croissant','קרואסון'],'bakery','🥐'], [['עוגה','cake'],'bakery','🍰'], [['בייגל','bagel'],'bakery','🥯'],
  [['עגבני','tomato'],'produce','🍅'], [['מלפפון','cucumber'],'produce','🥒'], [['בננה','banana'],'produce','🍌'],
  [['תפוח אדמה','תפוחי אדמה','potato'],'produce','🥔'], [['תפוח','apple'],'produce','🍎'], [['תפוז','orange'],'produce','🍊'],
  [['תות','strawberr'],'produce','🍓'], [['אבוקדו','avocado'],'produce','🥑'], [['בצל','onion'],'produce','🧅'],
  [['שום','garlic'],'produce','🧄'], [['גזר','carrot'],'produce','🥕'], [['פלפל','pepper'],'produce','🫑'],
  [['חסה','lettuce'],'produce','🥬'], [['ברוקולי','broccoli'],'produce','🥦'], [['לימון','lemon'],'produce','🍋'],
  [['ענבים','grape'],'produce','🍇'], [['אבטיח','watermelon'],'produce','🍉'], [['מנגו','mango'],'produce','🥭'],
  [['עוף','chicken'],'meat','🍗'], [['הודו','turkey'],'meat','🦃'], [['בשר','beef','meat'],'meat','🥩'],
  [['דג','fish','סלמון','salmon','טונה','tuna'],'meat','🐟'], [['נקניק','sausage','hotdog'],'meat','🌭'],
  [['המבורגר','burger'],'meat','🍔'],
  [['פסטה','pasta','ספגטי','spaghetti'],'pantry','🍝'], [['אורז','rice'],'pantry','🍚'], [['קמח','flour'],'pantry','🌾'],
  [['סוכר','sugar'],'pantry','🍬'], [['שמן','oil'],'pantry','🫒'], [['קטשופ','ketchup'],'pantry','🍅'],
  [['חומוס','hummus'],'pantry','🧆'], [['טחינה','tahini'],'pantry','🥫'], [['קורנפלקס','cereal'],'pantry','🥣'],
  [['מלח','salt'],'pantry','🧂'], [['טונה','tuna'],'pantry','🥫'], [['שימורים','canned'],'pantry','🥫'],
  [['קפה','coffee'],'beverages','☕'], [['תה','tea'],'beverages','🍵'], [['מים','water'],'beverages','💧'],
  [['מיץ','juice'],'beverages','🧃'], [['קולה','cola','סודה','soda'],'beverages','🥤'], [['בירה','beer'],'beverages','🍺'],
  [['יין','wine'],'beverages','🍷'],
  [['שוקולד','chocolate'],'snacks','🍫'], [['חטיף','chips','צ׳יפס'],'snacks','🍿'], [['עוגי','cookie','biscuit'],'snacks','🍪'],
  [['גומי','candy','ממתק'],'snacks','🍬'], [['בוטנים','peanut','אגוז','nuts'],'snacks','🥜'],
  [['גלידה','ice cream'],'frozen','🍦'], [['קפוא','frozen'],'frozen','🧊'], [['פיצה','pizza'],'frozen','🍕'],
  [['סבון','soap'],'household','🧼'], [['נייר טואלט','toilet paper'],'household','🧻'], [['מגבונים','wipes'],'household','🧻'],
  [['אקונומיקה','bleach','נוזל כלים','dish soap'],'household','🧽'], [['שקיות','bags'],'household','🛍️'],
  [['מטהר','detergent','אבקת כביסה','laundry'],'household','🧴'],
  [['שמפו','shampoo'],'care','🧴'], [['משחת שיניים','toothpaste'],'care','🪥'], [['דאודורנט','deodorant'],'care','🧴'],
  [['סבון גוף','body wash'],'care','🧴'],
  [['חיתול','diaper'],'baby','🍼'], [['מטרנה','similac','תמ״ל','formula'],'baby','🍼'],
  [['מזון לכלב','dog food'],'pet','🐶'], [['מזון לחתול','cat food'],'pet','🐱'], [['חול לחתול','litter'],'pet','🐾'],
];
function guess(text){
  const n = (text||'').trim().toLowerCase();
  if(!n) return {cat:'other',emoji:CS.CATS.other.emoji};
  for(const [keys,cat,emoji] of DICT){
    if(keys.some(k=>n.includes(k.toLowerCase()))) return {cat,emoji};
  }
  return {cat:'other',emoji:CS.CATS.other.emoji};
}

/* ---------- sheet / toast ---------- */
let pendingConfirmCancel=null;
function openSheet(html){ $('sheet').innerHTML = html; $('sheet').hidden=false; $('shade').hidden=false; }
function closeSheet(){
  $('sheet').hidden=true; $('shade').hidden=true; $('sheet').innerHTML='';
  if(pendingConfirmCancel){ const c=pendingConfirmCancel; pendingConfirmCancel=null; c(); }
}
function sheetHead(title){ return `<div class="sheet-head"><h2>${esc(title)}</h2><button class="close" data-act="sheet-close">✕</button></div>`; }
let toastTimer=null;
function toast(msg){
  const el=$('toast'); el.innerHTML=''; el.textContent=msg; el.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.hidden=true,2600);
}
function toastAction(msg,actionLabel,onAction,ms){
  const el=$('toast');
  el.innerHTML=`<span></span><button class="toast-action" id="toast-act-btn"></button>`;
  el.querySelector('span').textContent=msg;
  el.querySelector('#toast-act-btn').textContent=actionLabel;
  el.hidden=false;
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.hidden=true,ms||5000);
  $('toast-act-btn').onclick=()=>{ clearTimeout(toastTimer); el.hidden=true; onAction(); };
}
$('shade').addEventListener('click',closeSheet);
document.addEventListener('click',e=>{ if(e.target.closest('[data-act="sheet-close"]')) closeSheet(); });

/* ---------- app-styled confirmation sheet (replaces native confirm()) ---------- */
function confirmSheet(opts){
  const t=CS.t;
  const title=opts.title||'', body=opts.body||'';
  const yesLabel=opts.confirmLabel||t('yes'), noLabel=opts.cancelLabel||t('cancel');
  return new Promise(resolve=>{
    openSheet(sheetHead(title)+`<div class="card">
      <p class="sub">${esc(body)}</p>
      <div class="actions-row" style="display:flex;gap:8px;margin-top:4px">
        <button class="btn ghost wide" id="cs-no">${esc(noLabel)}</button>
        <button class="btn wide${opts.danger?' danger':''}" id="cs-yes">${esc(yesLabel)}</button>
      </div>
    </div>`);
    let done=false;
    const finish=v=>{ if(done) return; done=true; pendingConfirmCancel=null; closeSheet(); resolve(v); };
    pendingConfirmCancel=()=>finish(false);
    $('cs-yes').onclick=()=>finish(true);
    $('cs-no').onclick=()=>finish(false);
  });
}

/* ---------- screens ---------- */
function setScreen(name){
  $('splash').hidden = true;
  ['auth','onboard','home','lists','main'].forEach(s=>{ $('view-'+s).hidden = s!==name; });
}

/* ---------- i18n paint ---------- */
// placeholder text disappears on input and isn't a reliable accessible name on its own — every
// field that relies on it for a label gets the same string as aria-label too.
function field(id,text){ const el=$(id); if(!el) return; el.placeholder=text; el.setAttribute('aria-label',text); }
function paintStrings(){
  const t = CS.t;
  $('brand-name').textContent = t('appName');
  $('lang-label').textContent = t('langLabel');
  $('auth-title').textContent = t('authHero');
  $('auth-sub').textContent = t('authSub');
  $('tab-login').textContent = t('login');
  $('tab-signup').textContent = t('signup');
  field('au-email', t('email'));
  field('au-pass', t('password'));
  field('au-name', t('name'));
  $('au-forgot').textContent = t('forgot');
  $('onboard-title').textContent = t('onboardTitle');
  $('onboard-sub').textContent = t('onboardSub');
  $('create-h').textContent = t('createHh');
  field('hh-name', t('hhNamePh'));
  $('hh-create').textContent = t('create');
  $('join-h').textContent = t('joinHh');
  field('hh-code', t('codePh'));
  $('hh-join').textContent = t('join');
  $('trip-label').textContent = t('tripActive');
  $('trip-close').textContent = t('tripClose');
  $('home-lists-heading').textContent = t('homeListsHeading');
  $('home-activity-heading').textContent = t('homeActivityHeading');
  $('home-lists-more').textContent = t('homeListsMore');
  $('home-lists-empty-text').textContent = t('listsEmpty');
  $('home-lists-new-label').textContent = t('newListTitle');
  $('home-members-label').textContent = t('homeMembers');
  $('lists-title').textContent = t('listsTitle');
  $('lists-open-title').textContent = t('listsOpenTitle');
  $('lists-closed-title').textContent = t('listsClosedTitle');
  $('lists-empty-text').textContent = t('listsEmpty');
  field('search-input', t('searchPh'));
  if($('item-input')) field('item-input', t('itemPh')); // only exists while the add sheet is open
  if($('item-qty')) field('item-qty', t('qtyPh'));
  if($('item-add')) $('item-add').textContent = t('add');
  $('pending-title').textContent = t('pendingTitle');
  $('empty-text').textContent = t('emptyList');
  $('activity-title').textContent = t('activityTitle');
  $('fab-add-label').textContent = t('addToListFab');
  const authGoMode = $('au-go').dataset.mode || 'login';
  $('au-go').textContent = authGoMode==='signup'?t('signupGo'):authGoMode==='reset'?t('resetGo'):t('loginGo');
}

/* ---------- member avatars: each person gets a stable color, hashed from their user id ---------- */
function initials(nameOrEmail){
  const s = (nameOrEmail||'?').trim();
  return (s[0]||'?').toUpperCase();
}
function personColor(uid){
  let h=0; const s=String(uid||'');
  for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%360;
  return `hsl(${h} 62% 46%)`;
}
function renderMembers(members, targetId){
  const html = (members||[]).slice(0,5).map(m=>
    `<span class="avatar" style="background:${personColor(m.user_id)}" title="${esc(m.display_name||m.email||'')}">${esc(initials(m.display_name||m.email))}</span>`).join('');
  $(targetId||'members-strip').innerHTML = html;
}
function personName(name){
  if(!name) return '';
  return `<span class="who-name">${esc(name)}</span>`;
}

/* ---------- lists directory ---------- */
function fmtDate(iso){
  if(!iso) return '';
  try{ return new Date(iso).toLocaleDateString(CS.lang()==='he'?'he-IL':'en-US',{day:'numeric',month:'short'}); }catch(e){ return ''; }
}
function fmtTime(iso){
  if(!iso) return '';
  try{ return new Date(iso).toLocaleTimeString(CS.lang()==='he'?'he-IL':'en-US',{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; }
}

/* ---------- list activity log: who added/checked/removed what, and when ---------- */
const ACTION_META={
  added:{icon:'➕',key:'actAdded'}, requested:{icon:'🙋',key:'actRequested'},
  approved:{icon:'✅',key:'actApproved'}, rejected:{icon:'🚫',key:'actRejected'},
  checked:{icon:'🧺',key:'actChecked'}, unchecked:{icon:'↩️',key:'actUnchecked'},
  deleted:{icon:'🗑️',key:'actDeleted'},
};
function formatActivity(a){
  const meta=ACTION_META[a.action]||ACTION_META.added;
  const text=CS.t(meta.key).replace('{n}',a.actorName||'?').replace('{t}',a.item_text||'');
  return {icon:meta.icon, text};
}
function activityRow(a){
  const {icon,text}=formatActivity(a);
  const tag=a.listName?` · ${esc(a.listName)}`:'';
  return `<li class="activity-row"><span class="e">${icon}</span><span class="activity-text">${esc(text)}${tag}</span><span class="activity-time">${esc(fmtTime(a.created_at))}</span></li>`;
}

/* ---------- home dashboard: list previews with remaining counts, short cross-list activity feed ---------- */
function renderHomeLists(previewLists, counts, hasMore){
  const box=$('home-lists-preview');
  box.innerHTML=(previewLists||[]).map(l=>{
    const n=(counts&&counts[l.id])||0;
    const meta=n?CS.t('itemsLeft').replace('{n}',n):CS.t('allCollected');
    return `<li><button class="list-row" data-list="${l.id}">
      <span class="e" style="font-size:1.3rem">🛒</span><span class="nm">${esc(l.name)}</span><span class="meta">${esc(meta)}</span>
    </button></li>`;
  }).join('');
  $('home-lists-empty').hidden=!!(previewLists&&previewLists.length);
  box.hidden=!(previewLists&&previewLists.length);
  $('home-lists-more').hidden=!hasMore;
}
function renderHomeActivity(entries){
  const section=$('home-activity-section');
  if(!entries||!entries.length){ section.hidden=true; return; }
  section.hidden=false;
  $('home-activity-list').innerHTML=entries.map(activityRow).join('');
}
function renderActivity(entries){
  const box=$('activity-list');
  if(!box) return;
  box.innerHTML = (entries&&entries.length)
    ? entries.map(activityRow).join('')
    : `<li class="activity-empty">${esc(CS.t('activityEmpty'))}</li>`;
}
let activityOpen=false;
function paintActivityToggle(){
  const btn=$('activity-toggle'); if(!btn) return;
  btn.setAttribute('aria-expanded', activityOpen?'true':'false');
  const box=$('activity-list'); if(box) box.hidden=!activityOpen;
}
if($('activity-toggle')) $('activity-toggle').addEventListener('click',()=>{ activityOpen=!activityOpen; paintActivityToggle(); });
function renderLists(lists, canManage){
  const open=(lists||[]).filter(l=>l.status==='open');
  const closed=(lists||[]).filter(l=>l.status==='closed');
  $('lists-open').innerHTML = open.map(l=>`<li><button class="list-row" data-list="${l.id}">
    <span class="e" style="font-size:1.3rem">🛒</span><span class="nm">${esc(l.name)}</span><span class="meta">${esc(fmtDate(l.created_at))}</span>
  </button></li>`).join('');
  $('lists-empty').hidden = !!open.length;
  $('lists-closed-box').hidden = !closed.length;
  $('lists-closed').innerHTML = closed.map(l=>`<li class="list-row-wrap">
    <button class="list-row closed" data-list="${l.id}">
      <span class="e" style="font-size:1.3rem">✅</span><span class="nm">${esc(l.name)}</span><span class="meta">${esc(CS.t('closedOn').replace('{d}',fmtDate(l.closed_at)))}</span>
    </button>
    ${canManage?`<button class="list-del" data-del-list="${l.id}" aria-label="${esc(CS.t('deleteList'))}">🗑️</button>`:''}
  </li>`).join('');
}

/* ---------- view mode: grouped-by-category vs flat+draggable ---------- */
let viewMode='grouped';
try{ viewMode = localStorage.getItem('cs-view')||'grouped'; }catch(e){}
function paintViewToggle(){ $('view-toggle').textContent = viewMode==='flat'?'📋':'🗂️'; }
function setViewMode(m){ viewMode=m; try{localStorage.setItem('cs-view',m)}catch(e){} paintViewToggle(); if(window.CS.rerenderMain) window.CS.rerenderMain(); }
$('view-toggle').addEventListener('click',()=>setViewMode(viewMode==='flat'?'grouped':'flat'));
paintViewToggle();

/* ---------- item rows ---------- */
function itemRow(item, mode, draggable){
  const cat = CS.CATS[item.category]||CS.CATS.other;
  const qty = item.qty ? `<span class="qty-tag">${esc(item.qty)}</span>` : '';
  const addedWho = personName(item.added_by_name);
  if(mode==='pending'){
    const mine = item.created_by && CS.myId && item.created_by===CS.myId;
    const actions = mine
      ? `<span class="pending-actions">
          <button class="ok-btn" data-action="edit" data-id="${item.id}" aria-label="${esc(CS.t('editItem'))}">✏️</button>
          <button class="no-btn" data-action="del" data-id="${item.id}" aria-label="delete">🗑️</button>
        </span>`
      : `<span class="pending-actions">
          <button class="ok-btn" data-action="approve" data-id="${item.id}" aria-label="approve">✓</button>
          <button class="no-btn" data-action="reject" data-id="${item.id}" aria-label="reject">✕</button>
        </span>`;
    return `<li class="item" data-id="${item.id}">
      <span class="emo e" data-cat="${esc(item.category||'other')}">${esc(item.emoji||cat.emoji)}</span>
      <span class="t">${esc(item.text)}${addedWho}</span>
      ${qty}
      ${actions}
    </li>`;
  }
  const done = item.status==='checked';
  const checkedWho = (done && item.checked_by_name)
    ? `<span class="who-name checked-label">✅ ${esc(CS.t('checkedBy').replace('{n}',item.checked_by_name))}</span>` : '';
  const handle = draggable ? `<span class="handle">⋮⋮</span>` : '';
  return `<li class="item ${done?'done':''}" data-id="${item.id}" ${draggable?'draggable="true"':''}>
    ${handle}
    <button class="check" data-action="toggle" data-id="${item.id}" aria-label="check">
      <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <span class="emo e" data-cat="${esc(item.category||'other')}">${esc(item.emoji||cat.emoji)}</span>
    <button class="t" data-action="edit" data-id="${item.id}" aria-label="${esc(CS.t('editItem'))}"><span class="t-text">${esc(item.text)}</span>${addedWho}${checkedWho}</button>
    ${qty}
    <button class="del" data-action="del" data-id="${item.id}" aria-label="delete">🗑️</button>
  </li>`;
}

/* swipe left/right on an item toggles check, as an alternative to the check button */
function attachSwipe(container){
  container.querySelectorAll('.item[data-id]').forEach(el=>{
    let x0=null,y0=null,dx=0,active=false;
    el.addEventListener('pointerdown',e=>{
      if(e.target.closest('button,.handle')) return;
      x0=e.clientX; y0=e.clientY; dx=0; active=true; el.classList.add('swiping'); el.setPointerCapture(e.pointerId);
    });
    el.addEventListener('pointermove',e=>{
      if(!active) return;
      dx=e.clientX-x0;
      if(Math.abs(e.clientY-y0)>40){ active=false; el.classList.remove('swiping'); el.style.transform=''; return; }
      el.style.transform=`translateX(${dx}px)`;
      el.classList.toggle('swipe-ok',Math.abs(dx)>70);
    });
    const end=()=>{
      if(!active) return;
      active=false; el.classList.remove('swiping');
      if(Math.abs(dx)>70) window.CS.on && window.CS.on.toggle && window.CS.on.toggle(el.dataset.id);
      el.style.transform=''; el.classList.remove('swipe-ok');
    };
    el.addEventListener('pointerup',end);
    el.addEventListener('pointercancel',end);
  });
}

/* drag-to-reorder, only active in flat view */
function attachDrag(listEl){
  if(!listEl) return;
  let dragEl=null;
  listEl.querySelectorAll('.item[draggable="true"]').forEach(el=>{
    el.addEventListener('dragstart',()=>{ dragEl=el; el.classList.add('dragging'); });
    el.addEventListener('dragend',()=>{
      el.classList.remove('dragging'); dragEl=null;
      const ids=[...listEl.querySelectorAll('.item[data-id]')].map(x=>x.dataset.id);
      window.CS.on && window.CS.on.reorder && window.CS.on.reorder(ids);
    });
    el.addEventListener('dragover',e=>{
      e.preventDefault();
      if(!dragEl||dragEl===el) return;
      const r=el.getBoundingClientRect();
      const before = (e.clientY - r.top) < r.height/2;
      listEl.insertBefore(dragEl, before?el:el.nextSibling);
    });
  });
}

function renderGroups(items){
  // checked items stay put among the active ones (same category, same position) — just marked done in place
  const visible = items.filter(i=>i.status!=='pending').sort((a,b)=>(a.position||0)-(b.position||0));
  const box = $('groups');
  if(!visible.length){ box.innerHTML=''; }
  else if(viewMode==='flat'){
    box.innerHTML = `<ul class="list" id="flat-list">${visible.map(i=>itemRow(i,'active',true)).join('')}</ul>`;
    attachDrag($('flat-list'));
  }else{
    const byCat = {};
    visible.forEach(i=>{ (byCat[i.category||'other'] = byCat[i.category||'other']||[]).push(i); });
    box.innerHTML = CS.CAT_ORDER.filter(c=>byCat[c]&&byCat[c].length).map(c=>{
      const meta = CS.CATS[c];
      return `<div class="group"><div class="group-h"><span class="e">${meta.emoji}</span><span>${CS.lang()==='he'?meta.he:meta.en}</span></div>
        <ul class="list">${byCat[c].map(i=>itemRow(i,'active')).join('')}</ul></div>`;
    }).join('');
  }
  $('empty-state').hidden = !!visible.length;
  attachSwipe(box);

  const pending = items.filter(i=>i.status==='pending');
  $('pending-box').hidden = !pending.length;
  $('pending-list').innerHTML = pending.map(i=>itemRow(i,'pending')).join('');
}

/* ---------- auth tabs ---------- */
function setAuthMode(mode){
  $('au-go').dataset.mode = mode;
  $('tab-login').classList.toggle('active',mode==='login');
  $('tab-signup').classList.toggle('active',mode==='signup');
  $('au-name').hidden = mode!=='signup';
  $('au-pass').hidden = mode==='reset';
  $('au-forgot').hidden = mode!=='login';
  paintStrings();
}
$('tab-login').addEventListener('click',()=>setAuthMode('login'));
$('tab-signup').addEventListener('click',()=>setAuthMode('signup'));
$('au-forgot').addEventListener('click',()=>setAuthMode('reset'));

$('lang-btn').addEventListener('click',()=>{ CS.setLang(CS.lang()==='he'?'en':'he'); });

Object.assign(window.CS,{
  $, esc, guess, openSheet, closeSheet, sheetHead, toast, toastAction, confirmSheet,
  setScreen, paintStrings, setAuthMode, renderMembers, renderGroups, renderLists, initials, personColor,
  renderActivity, formatActivity, renderHomeLists, renderHomeActivity,
  render(){ paintStrings(); if(window.CS.rerenderMain) window.CS.rerenderMain(); },
});
paintStrings(); // body.html's hardcoded defaults are Hebrew; an English-preferring first visit needs this to actually show English, not just flip direction
})();
