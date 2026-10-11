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
function openSheet(html){ $('sheet').innerHTML = html; $('sheet').hidden=false; $('shade').hidden=false; }
function closeSheet(){ $('sheet').hidden=true; $('shade').hidden=true; $('sheet').innerHTML=''; }
function sheetHead(title){ return `<div class="sheet-head"><h2>${esc(title)}</h2><button class="close" data-act="sheet-close">✕</button></div>`; }
let toastTimer=null;
function toast(msg){ const el=$('toast'); el.textContent=msg; el.hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.hidden=true,2600); }
$('shade').addEventListener('click',closeSheet);
document.addEventListener('click',e=>{ if(e.target.closest('[data-act="sheet-close"]')) closeSheet(); });

/* ---------- screens ---------- */
function setScreen(name){
  ['auth','onboard','main'].forEach(s=>{ $('view-'+s).hidden = s!==name; });
}

/* ---------- i18n paint ---------- */
function paintStrings(){
  const t = CS.t;
  $('brand-name').textContent = t('appName');
  $('auth-title').textContent = t('authHero');
  $('auth-sub').textContent = t('authSub');
  $('tab-login').textContent = t('login');
  $('tab-signup').textContent = t('signup');
  $('au-email').placeholder = t('email');
  $('au-pass').placeholder = t('password');
  $('au-name').placeholder = t('name');
  $('au-forgot').textContent = t('forgot');
  $('onboard-title').textContent = t('onboardTitle');
  $('onboard-sub').textContent = t('onboardSub');
  $('create-h').textContent = t('createHh');
  $('hh-name').placeholder = t('hhNamePh');
  $('hh-create').textContent = t('create');
  $('join-h').textContent = t('joinHh');
  $('hh-code').placeholder = t('codePh');
  $('hh-join').textContent = t('join');
  $('item-input').placeholder = t('itemPh');
  $('item-add').textContent = t('add');
  $('pending-title').textContent = t('pendingTitle');
  $('bought-title').textContent = t('boughtTitle');
  $('empty-text').textContent = t('emptyList');
  const authGoMode = $('au-go').dataset.mode || 'login';
  $('au-go').textContent = authGoMode==='signup'?t('signupGo'):authGoMode==='reset'?t('resetGo'):t('loginGo');
}

/* ---------- member avatars ---------- */
function initials(nameOrEmail){
  const s = (nameOrEmail||'?').trim();
  return (s[0]||'?').toUpperCase();
}
function renderMembers(members){
  $('members-strip').innerHTML = (members||[]).slice(0,5).map(m=>
    `<span class="avatar" title="${esc(m.display_name||m.email||'')}">${esc(initials(m.display_name||m.email))}</span>`).join('');
}

/* ---------- item rows ---------- */
function itemRow(item, mode){
  const cat = CS.CATS[item.category]||CS.CATS.other;
  const lang = CS.lang();
  const who = item.checked_by_name ? `<span class="who">${esc(item.checked_by_name)}</span>` : '';
  if(mode==='pending'){
    return `<li class="item" data-id="${item.id}">
      <span class="emo e">${esc(item.emoji||cat.emoji)}</span>
      <span class="t">${esc(item.text)}<span class="who">${esc(item.requested_by_name||'')}</span></span>
      <span class="pending-actions">
        <button class="ok-btn" data-action="approve" data-id="${item.id}" aria-label="approve">✓</button>
        <button class="no-btn" data-action="reject" data-id="${item.id}" aria-label="reject">✕</button>
      </span>
    </li>`;
  }
  const done = item.status==='checked';
  return `<li class="item ${done?'done':''}" data-id="${item.id}">
    <button class="check" data-action="toggle" data-id="${item.id}" aria-label="check">
      <svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <span class="emo e">${esc(item.emoji||cat.emoji)}</span>
    <span class="t">${esc(item.text)}${who}</span>
    <button class="del" data-action="del" data-id="${item.id}" aria-label="delete">🗑️</button>
  </li>`;
}

function renderGroups(items){
  const active = items.filter(i=>i.status==='active');
  const box = $('groups');
  if(!active.length){ box.innerHTML=''; }
  else{
    const byCat = {};
    active.forEach(i=>{ (byCat[i.category||'other'] = byCat[i.category||'other']||[]).push(i); });
    box.innerHTML = CS.CAT_ORDER.filter(c=>byCat[c]&&byCat[c].length).map(c=>{
      const meta = CS.CATS[c];
      return `<div class="group"><div class="group-h"><span class="e">${meta.emoji}</span><span>${CS.lang()==='he'?meta.he:meta.en}</span></div>
        <ul class="list">${byCat[c].map(i=>itemRow(i,'active')).join('')}</ul></div>`;
    }).join('');
  }
  $('empty-state').hidden = !!active.length;

  const pending = items.filter(i=>i.status==='pending');
  $('pending-box').hidden = !pending.length;
  $('pending-list').innerHTML = pending.map(i=>itemRow(i,'pending')).join('');

  const bought = items.filter(i=>i.status==='checked');
  $('bought-box').hidden = !bought.length;
  $('bought-count').textContent = bought.length;
  $('bought-list').innerHTML = bought.map(i=>itemRow(i,'active')).join('');
}
$('bought-toggle').addEventListener('click',()=>{ const l=$('bought-list'); l.hidden=!l.hidden; });

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
  $, esc, guess, openSheet, closeSheet, sheetHead, toast,
  setScreen, paintStrings, setAuthMode, renderMembers, renderGroups, initials,
  render(){ paintStrings(); if(window.CS.rerenderMain) window.CS.rerenderMain(); },
});
})();
