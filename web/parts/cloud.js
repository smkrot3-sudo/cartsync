/* Supabase: auth, households, realtime shopping list, offline queue. Shares the tsaad-katan project but fully separate tables/RLS. */
(function(){
const SB_URL='https://pzrzwilkloksfxsvcwji.supabase.co';
const SB_KEY='sb_publishable_kTKMU6nUUWtGAgb-SJvYyQ_QweS_o60';
const $=CS.$, esc=CS.esc, toast=CS.toast, openSheet=CS.openSheet, closeSheet=CS.closeSheet, sheetHead=CS.sheetHead;
if(!window.supabase) return;
const sb=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'cartsync-auth'}});

let user=null, household=null, role=null, members=[], membersById={}, listId=null, items=[], online=navigator.onLine, channel=null;
let queue=[], flushing=false;

/* ---------- offline cache + outbox: lets add/check/delete work with no network, synced once back online ---------- */
const CACHE_KEY='cs-cache';
function cacheSnapshot(){
  try{ localStorage.setItem(CACHE_KEY, JSON.stringify({hhId:household,hhName:$('hh-name-lbl').textContent,members,role,listId,items,ts:Date.now()})); }catch(e){}
}
function loadCache(){ try{ return JSON.parse(localStorage.getItem(CACHE_KEY)||'null'); }catch(e){ return null; } }
function queueKeyFor(lid){ return 'cs-queue-'+lid; }
function loadQueueFor(lid){ try{ return JSON.parse(localStorage.getItem(queueKeyFor(lid))||'[]'); }catch(e){ return []; } }
function saveQueue(){ try{ localStorage.setItem(queueKeyFor(listId), JSON.stringify(queue)); }catch(e){} }
function isTemp(id){ return typeof id==='string' && id.startsWith('tmp_'); }

function showOfflineNote(show){ const el=$('offline-note'); if(el){ el.hidden=!show; el.textContent=CS.t('offline'); } }

function queueAdd(row){
  const tempId='tmp_'+Date.now()+'_'+Math.random().toString(36).slice(2,7);
  const status = role==='requester' ? 'pending' : 'active';
  items.push({...row, id:tempId, status, checked_by:null, checked_at:null, created_at:new Date().toISOString(), updated_at:new Date().toISOString()});
  queue.push({op:'add', id:tempId, row});
  saveQueue(); cacheSnapshot(); paintItems();
}
function queueOp(op,id,patch){
  if(op==='del' && isTemp(id)){
    queue = queue.filter(q=>q.id!==id); // the item never left this device: cancel its queued add (and any edits) instead of queuing a delete
    saveQueue();
    return;
  }
  queue.push({op,id,patch});
  saveQueue();
}
async function flushQueue(){
  if(!navigator.onLine || flushing || !queue.length) return;
  flushing=true;
  const idMap={};
  while(queue.length){
    const op=queue[0];
    const realId = idMap[op.id] || op.id;
    try{
      if(op.op==='add'){
        const {data,error}=await sb.from('list_items').insert(op.row).select().single();
        if(error) throw error;
        idMap[op.id]=data.id;
      }else if(op.op==='toggle'){
        if(isTemp(realId)) throw new Error('unresolved temp id');
        const {error}=await sb.from('list_items').update(op.patch).eq('id',realId);
        if(error) throw error;
      }else if(op.op==='del'){
        if(!isTemp(realId)){ const {error}=await sb.from('list_items').delete().eq('id',realId); if(error) throw error; }
      }
    }catch(e){ console.warn('flush failed, will retry later',e); break; }
    queue.shift(); saveQueue();
  }
  flushing=false;
  if(listId) await fetchItems(); // reconcile with server truth, replacing any leftover temp ids
}

/* ---------- auth ---------- */
async function doAuth(){
  const mode=$('au-go').dataset.mode||'login';
  const email=$('au-email').value.trim(), pass=$('au-pass').value;
  const msg=$('au-msg');
  if(!email){ $('au-email').focus(); return; }
  $('au-go').disabled=true; msg.hidden=true;
  try{
    if(mode==='reset'){
      const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
      if(error) throw error;
      msg.className='msg ok'; msg.textContent=CS.t('resetSent'); msg.hidden=false;
    }else if(mode==='signup'){
      const name=$('au-name').value.trim();
      const {data,error}=await sb.auth.signUp({email,password:pass,options:{data:{full_name:name}}});
      if(error) throw error;
      if(!data.session){ msg.className='msg ok'; msg.textContent=CS.t('resetSent'); msg.hidden=false; }
    }else{
      const {error}=await sb.auth.signInWithPassword({email,password:pass});
      if(error) throw error;
    }
  }catch(e){ msg.className='msg err'; msg.textContent=CS.authErr(e); msg.hidden=false; }
  $('au-go').disabled=false;
}
$('au-go').addEventListener('click',doAuth);
['au-email','au-pass'].forEach(id=>$(id).addEventListener('keydown',e=>{ if(e.key==='Enter') doAuth(); }));

function renderAccount(){
  const box=$('acct-top');
  if(!user){ box.innerHTML=''; return; }
  box.innerHTML=`<button class="iconbtn" id="acct-btn" aria-label="account">${esc(CS.initials(user.user_metadata&&user.user_metadata.full_name||user.email))}</button>`;
  $('acct-btn').onclick=openAccountSheet;
}
function openAccountSheet(){
  const t=CS.t;
  const curTheme=CS.theme();
  openSheet(sheetHead(t('settings'))+`
    <div class="card">
      <div style="font-size:.9rem;color:var(--muted)" dir="ltr">${esc(user.email)}</div>
      <p style="margin:2px 0 -4px">${esc(t('themeLabel'))}</p>
      <div class="role-pick" id="theme-pick">
        ${['light','dark','system'].map(v=>`<button data-theme-opt="${v}" class="${v===curTheme?'active':''}">${esc(t('theme'+v[0].toUpperCase()+v.slice(1)))}</button>`).join('')}
      </div>
      <button class="btn ghost" id="acct-sync">🔄 ${esc(t('syncNow'))}</button>
      <button class="btn ghost" id="acct-switch">🏠 ${esc(t('switchHousehold'))}</button>
      <button class="btn ghost" id="acct-signout">👋 ${esc(t('signOut'))}</button>
    </div>`);
  $('theme-pick').querySelectorAll('[data-theme-opt]').forEach(b=>b.onclick=()=>{ CS.setTheme(b.dataset.themeOpt); openAccountSheet(); });
  $('acct-sync').onclick=async()=>{ await flushQueue(); await refreshHousehold(); toast('🔄'); };
  $('acct-switch').onclick=()=>{ closeSheet(); openHouseholdSwitcher(); };
  $('acct-signout').onclick=async()=>{ await sb.auth.signOut(); closeSheet(); };
}

/* ---------- households ---------- */
async function ensureDisplayName(hh){
  const fallback=(user.user_metadata&&user.user_metadata.full_name)||user.email.split('@')[0];
  const mine=members.find(m=>m.user_id===user.id);
  if(mine&&!mine.display_name){
    await sb.from('household_members').update({display_name:fallback}).eq('household_id',hh).eq('user_id',user.id);
  }
}
async function listMyHouseholds(){
  const {data,error}=await sb.from('household_members').select('household_id,role,households(name)').eq('user_id',user.id);
  if(error){ console.warn(error); return []; }
  return (data||[]).map(r=>({id:r.household_id,name:r.households&&r.households.name,role:r.role}));
}
function applyCachedHousehold(cache){
  household=cache.hhId; listId=cache.listId; role=cache.role; members=cache.members||[];
  membersById={}; members.forEach(m=>membersById[m.user_id]=m);
  items=cache.items||[];
  $('hh-name-lbl').textContent=cache.hhName||'';
  CS.renderMembers(members);
  CS.setScreen('main');
  queue=listId?loadQueueFor(listId):[];
  paintItems();
  showOfflineNote(true);
}
async function loadHousehold(hh){
  household=hh;
  try{ localStorage.setItem('cs-last-hh',hh); }catch(e){}
  try{
    const [{data:hrow,error:e1},{data:mrows,error:e2},{data:lrows,error:e3}]=await Promise.all([
      sb.from('households').select('*').eq('id',hh).maybeSingle(),
      sb.from('household_members').select('*').eq('household_id',hh),
      sb.from('shopping_lists').select('*').eq('household_id',hh).order('created_at').limit(1),
    ]);
    if(e1||e2||e3) throw (e1||e2||e3);
    if(!hrow){ CS.setScreen('onboard'); return; }
    members=mrows||[]; membersById={}; members.forEach(m=>membersById[m.user_id]=m);
    role=(membersById[user.id]||{}).role||null;
    listId=lrows&&lrows[0]&&lrows[0].id;
    await ensureDisplayName(hh);
    $('hh-name-lbl').textContent=hrow.name;
    CS.renderMembers(members);
    CS.setScreen('main');
    queue=listId?loadQueueFor(listId):[];
    showOfflineNote(false);
    if(listId) await fetchItems();
    cacheSnapshot();
    subscribeRealtime();
    if(queue.length) flushQueue();
  }catch(e){
    const cache=loadCache();
    if(cache && cache.hhId===hh) applyCachedHousehold(cache);
    else toast(CS.t('offline'));
  }
}
async function refreshHousehold(){ if(household) await loadHousehold(household); }

async function createHousehold(){
  const name=$('hh-name').value.trim();
  const msg=$('hh-msg');
  if(!name){ msg.className='msg err'; msg.textContent=CS.t('needHhName'); msg.hidden=false; return; }
  const {data,error}=await sb.rpc('create_household',{p_name:name});
  if(error){ msg.className='msg err'; msg.textContent=CS.authErr(error); msg.hidden=false; return; }
  await loadHousehold(data);
}
async function joinHousehold(){
  const code=$('hh-code').value.trim();
  const msg=$('hh-msg');
  if(!code){ msg.className='msg err'; msg.textContent=CS.t('needCode'); msg.hidden=false; return; }
  const {data,error}=await sb.rpc('accept_invite',{p_code:code});
  if(error){ msg.className='msg err'; msg.textContent=CS.t('errInvite'); msg.hidden=false; return; }
  await loadHousehold(data);
}
$('hh-create').addEventListener('click',createHousehold);
$('hh-join').addEventListener('click',joinHousehold);

async function openHouseholdSwitcher(){
  const list=await listMyHouseholds();
  const t=CS.t;
  openSheet(sheetHead(t('switchHousehold'))+`<div class="card">
    ${list.map(h=>`<button class="btn ghost wide" data-hh="${h.id}">🏠 ${esc(h.name)}</button>`).join('')}
    <button class="btn wide" id="hh-new">➕ ${esc(t('createHh'))}</button>
  </div>`);
  $('sheet').querySelectorAll('[data-hh]').forEach(b=>b.onclick=async()=>{ closeSheet(); await loadHousehold(b.dataset.hh); });
  $('hh-new').onclick=()=>{ closeSheet(); CS.setScreen('onboard'); };
}
$('hh-switch').addEventListener('click',openHouseholdSwitcher);

/* ---------- invites ---------- */
function openInviteSheet(){
  const t=CS.t;
  let pickedRole='editor';
  const draw=()=>openSheet(sheetHead(t('invite'))+`<div class="card">
      <p class="sub">${esc(t('inviteSub'))}</p>
      <p>${esc(t('inviteRole'))}</p>
      <div class="role-pick">
        ${['editor','requester','viewer'].map(r=>`<button data-role="${r}" class="${r===pickedRole?'active':''}">${esc(t('role'+r[0].toUpperCase()+r.slice(1)))}</button>`).join('')}
      </div>
      <button class="btn wide" id="inv-go">${esc(t('invite'))}</button>
      <div id="inv-code-box"></div>
    </div>`);
  draw();
  $('sheet').addEventListener('click',e=>{
    const rb=e.target.closest('[data-role]'); if(rb){ pickedRole=rb.dataset.role; draw(); }
  });
  document.getElementById('inv-go').onclick=async()=>{
    const {data,error}=await sb.rpc('create_invite',{p_household:household,p_role:pickedRole});
    if(error){ toast(CS.authErr(error)); return; }
    document.getElementById('inv-code-box').innerHTML=`<div class="invite-code">${esc(data)}</div>
      <button class="btn ghost wide" id="inv-copy">📋 ${esc(t('inviteCopy'))}</button>`;
    document.getElementById('inv-copy').onclick=()=>{
      navigator.clipboard&&navigator.clipboard.writeText(data).catch(()=>{});
      toast(t('inviteCopied'));
    };
  };
}
$('invite-btn').addEventListener('click',openInviteSheet);

/* ---------- items ---------- */
function decorate(list){
  return list.map(i=>({...i,
    checked_by_name: i.checked_by&&membersById[i.checked_by]?membersById[i.checked_by].display_name:'',
    requested_by_name: i.created_by&&membersById[i.created_by]?membersById[i.created_by].display_name:'',
  }));
}
function paintItems(){ CS.renderGroups(decorate(items)); cacheSnapshot(); }
async function fetchItems(){
  try{
    const {data,error}=await sb.from('list_items').select('*').eq('list_id',listId).order('position');
    if(error) throw error;
    items=data||[];
  }catch(e){
    const cache=loadCache();
    if(cache && cache.listId===listId) items=cache.items||[];
  }
  paintItems();
}
async function aiCategorize(text){
  try{
    const {data,error}=await sb.functions.invoke('categorize',{body:{text}});
    if(error||!data||!data.results||!data.results[0]) return null;
    const r=data.results[0];
    return {cat:r.category,emoji:r.emoji};
  }catch(e){ return null; }
}
async function addItem(){
  const input=$('item-input'), qtyInput=$('item-qty');
  const text=input.value.trim();
  const qty=qtyInput.value.trim();
  if(!text||!listId) return;
  input.value=''; qtyInput.value='';
  let g=CS.guess(text);
  if(online && g.cat==='other'){ const ai=await aiCategorize(text); if(ai) g=ai; } // local dictionary has no match: ask the AI edge function instead of settling for "other"
  const row={ list_id:listId, household_id:household, text, category:g.cat, emoji:g.emoji, qty:qty||null, created_by:user.id, position:Date.now() };
  if(!online){ queueAdd(row); toast(role==='requester'?CS.t('itemRequested'):CS.t('itemAdded')); return; }
  const {error}=await sb.from('list_items').insert(row);
  if(error){ toast(CS.authErr(error)); return; }
  toast(role==='requester'?CS.t('itemRequested'):CS.t('itemAdded'));
}
$('item-add').addEventListener('click',addItem);
$('item-input').addEventListener('keydown',e=>{ if(e.key==='Enter') addItem(); });
$('item-qty').addEventListener('keydown',e=>{ if(e.key==='Enter') addItem(); });

async function reorderItems(ids){
  if(!online) return; // manual reorder is an online-only convenience for v1
  await Promise.all(ids.map((id,i)=>sb.from('list_items').update({position:(i+1)*1000}).eq('id',id)));
}

async function toggleItem(id){
  const it=items.find(i=>i.id===id); if(!it) return;
  const patch = it.status==='checked'
    ? {status:'active',checked_by:null,checked_at:null}
    : {status:'checked',checked_by:user.id,checked_at:new Date().toISOString()};
  if(!online || isTemp(id)){
    Object.assign(it,patch); queueOp('toggle',id,patch); paintItems();
    return;
  }
  await sb.from('list_items').update(patch).eq('id',id);
}
async function delItem(id){
  if(!online || isTemp(id)){
    items=items.filter(i=>i.id!==id); queueOp('del',id); paintItems();
    return;
  }
  await sb.from('list_items').delete().eq('id',id);
}
async function approveItem(id){
  if(!online){ toast(CS.t('offline')); return; }
  await sb.from('list_items').update({status:'active'}).eq('id',id); toast(CS.t('itemApproved'));
}
async function rejectItem(id){
  if(!online){ toast(CS.t('offline')); return; }
  await sb.from('list_items').delete().eq('id',id);
}
window.CS.on={toggle:toggleItem, reorder:reorderItems};

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]'); if(!b) return;
  const id=b.dataset.id, action=b.dataset.action;
  if(action==='toggle') toggleItem(id);
  else if(action==='del') delItem(id);
  else if(action==='approve') approveItem(id);
  else if(action==='reject') rejectItem(id);
});

/* ---------- realtime ---------- */
function subscribeRealtime(){
  if(channel){ sb.removeChannel(channel); channel=null; }
  if(!listId) return;
  channel=sb.channel('list:'+listId)
    .on('postgres_changes',{event:'*',schema:'public',table:'list_items',filter:'list_id=eq.'+listId},payload=>{
      if(payload.eventType==='INSERT') items.push(payload.new);
      else if(payload.eventType==='UPDATE') items=items.map(i=>i.id===payload.new.id?payload.new:i);
      else if(payload.eventType==='DELETE') items=items.filter(i=>i.id!==payload.old.id);
      paintItems();
    })
    .on('postgres_changes',{event:'*',schema:'public',table:'household_members',filter:'household_id=eq.'+household},()=>{
      refreshHousehold();
    })
    .subscribe();
}
addEventListener('online',()=>{ online=true; showOfflineNote(false); flushQueue(); });
addEventListener('offline',()=>{ online=false; showOfflineNote(true); });

/* ---------- boot ---------- */
async function onUser(u){
  user=u;
  renderAccount();
  if(!u){ household=null; listId=null; items=[]; CS.setScreen('auth'); return; }
  const list=await listMyHouseholds();
  if(!list.length){
    const cache=loadCache();
    if(cache && cache.hhId){ await loadHousehold(cache.hhId); return; } // offline cold start: fall back to last-known household
    CS.setScreen('onboard'); return;
  }
  let last=null; try{ last=localStorage.getItem('cs-last-hh'); }catch(e){}
  const pick=(last&&list.find(h=>h.id===last))||list[0];
  await loadHousehold(pick.id);
}
sb.auth.onAuthStateChange((event,session)=>{ setTimeout(()=>onUser(session?session.user:null),0); });

showOfflineNote(!online);
window.CS.rerenderMain=paintItems;
})();
