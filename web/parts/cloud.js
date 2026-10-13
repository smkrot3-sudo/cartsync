/* Supabase: auth, households, realtime shopping list, offline queue. Shares the tsaad-katan project but fully separate tables/RLS. */
(function(){
const SB_URL='https://pzrzwilkloksfxsvcwji.supabase.co';
const SB_KEY='sb_publishable_kTKMU6nUUWtGAgb-SJvYyQ_QweS_o60';
const $=CS.$, esc=CS.esc, toast=CS.toast, toastAction=CS.toastAction, openSheet=CS.openSheet, closeSheet=CS.closeSheet, sheetHead=CS.sheetHead;
if(!window.supabase) return;
const sb=supabase.createClient(SB_URL,SB_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'cartsync-auth'}});

let user=null, household=null, role=null, members=[], membersById={}, listId=null, listStatus='open', items=[], activity=[], online=navigator.onLine, channel=null;
let queue=[], flushing=false;

/* ---------- invite links: ?join=CODE, persisted across the email-confirmation round trip ---------- */
let pendingJoin=null;
try{
  const qp=new URLSearchParams(location.search);
  const j=qp.get('join');
  if(j){ pendingJoin=j; localStorage.setItem('cs-pending-join',j); history.replaceState(null,'',location.pathname); }
  else pendingJoin=localStorage.getItem('cs-pending-join');
}catch(e){}
async function consumePendingJoin(){
  if(!pendingJoin) return false;
  const code=pendingJoin; pendingJoin=null;
  try{ localStorage.removeItem('cs-pending-join'); }catch(e){}
  const {data,error}=await sb.rpc('accept_invite',{p_code:code});
  if(error){ toast(CS.t('errInvite')); return false; }
  await loadHousehold(data);
  toast(CS.t('joinedViaLink'));
  return true;
}

/* ---------- offline cache + outbox: lets add/check/delete work with no network, synced once back online ---------- */
const CACHE_KEY='cs-cache';
function cacheSnapshot(){
  try{ localStorage.setItem(CACHE_KEY, JSON.stringify({hhId:household,hhName,members,role,listId,items,ts:Date.now()})); }catch(e){}
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
async function flushQueue(opts){
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
        const idx=items.findIndex(i=>i.id===op.id);
        if(idx>-1) items[idx]=data; // swap the temp id for the real row locally — no refetch needed for this
      }else if(op.op==='toggle'||op.op==='update'){
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
  // a full resync (reconnecting after being offline, or an explicit "sync now") should catch up with
  // whatever other members changed meanwhile; a routine flush after one local add doesn't need that round trip
  if(opts && opts.resync && listId) await fetchItems();
  else paintItems();
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
  box.innerHTML=`<button class="iconbtn avatarbtn" id="acct-btn" aria-label="account">${esc(CS.initials(user.user_metadata&&user.user_metadata.full_name||user.email))}</button>`;
  $('acct-btn').onclick=openAccountSheet;
}
function openAccountSheet(){
  const t=CS.t;
  const curTheme=CS.theme(), curFont=CS.fontSize();
  openSheet(sheetHead(t('settings'))+`
    <div class="card">
      <div style="font-size:.9rem;color:var(--muted)" dir="ltr">${esc(user.email)}</div>
      <p style="margin:2px 0 -4px">${esc(t('themeLabel'))}</p>
      <div class="role-pick" id="theme-pick">
        ${['light','dark','system'].map(v=>`<button data-theme-opt="${v}" class="${v===curTheme?'active':''}">${esc(t('theme'+v[0].toUpperCase()+v.slice(1)))}</button>`).join('')}
      </div>
      <p style="margin:2px 0 -4px">${esc(t('fontSizeLabel'))}</p>
      <div class="role-pick" id="font-pick">
        ${['normal','large','xlarge'].map(v=>`<button data-font-opt="${v}" class="${v===curFont?'active':''}">${esc(t('font'+v[0].toUpperCase()+v.slice(1)))}</button>`).join('')}
      </div>
      <button class="btn ghost" id="acct-profile">${esc(t('editProfile'))}</button>
      <button class="btn ghost" id="acct-members">👥 ${esc(t('homeMembers'))}</button>
      <button class="btn ghost" id="acct-switch">🏠 ${esc(t('switchHousehold'))}</button>
      <button class="btn ghost" id="acct-guide">📖 ${esc(t('guideOpen'))}</button>
      <button class="btn ghost" id="acct-sync">🔄 ${esc(t('syncNow'))}</button>
      <button class="btn ghost" id="acct-signout">👋 ${esc(t('signOut'))}</button>
    </div>`);
  $('theme-pick').querySelectorAll('[data-theme-opt]').forEach(b=>b.onclick=()=>{ CS.setTheme(b.dataset.themeOpt); openAccountSheet(); });
  $('font-pick').querySelectorAll('[data-font-opt]').forEach(b=>b.onclick=()=>{ CS.setFontSize(b.dataset.fontOpt); openAccountSheet(); });
  $('acct-profile').onclick=openProfileSheet;
  $('acct-members').onclick=drawMembersSheet;
  $('acct-guide').onclick=()=>openGuideSheet();
  $('acct-sync').onclick=async()=>{ await flushQueue({resync:true}); await refreshHousehold(); toast('🔄'); };
  $('acct-switch').onclick=()=>{ closeSheet(); openHouseholdSwitcher(); };
  $('acct-signout').onclick=async()=>{ await sb.auth.signOut(); closeSheet(); };
}

/* ---------- in-app guide: shown once automatically to every new user, reachable anytime from Settings ---------- */
function openGuideSheet(){
  const t=CS.t;
  const sections=CS.guide().map(s=>`<div class="guide-section">
    <h3><span class="e">${esc(s.icon)}</span> ${esc(s.title)}</h3>
    <p>${s.body}</p>
  </div>`).join('');
  openSheet(sheetHead(t('guideTitle'))+`<div class="card guide-card">
    <p class="sub">${esc(t('guideIntro'))}</p>
    ${sections}
  </div>`);
}
function openWhatsNewSheet(entries){
  const t=CS.t;
  const items=entries.flatMap(e=>e.items).map(i=>`<li>${esc(i)}</li>`).join('');
  openSheet(sheetHead(t('whatsNewTitle'))+`<div class="card">
    <p class="sub">${esc(t('whatsNewIntro'))}</p>
    <ul class="whats-new-list">${items}</ul>
    <button class="btn wide" data-act="sheet-close">${esc(t('whatsNewClose'))}</button>
  </div>`);
}
/* a brand-new user gets the full guide and is marked caught-up on "what's new" (nothing to catch up
   on); a returning user whose last-seen version is behind gets just the "what's new" summary */
function maybeShowOnboarding(){
  let guideSeen=null, whatsNewSeen=0;
  try{
    guideSeen=localStorage.getItem('cs-guide-seen');
    whatsNewSeen=parseInt(localStorage.getItem('cs-whatsnew-seen')||'0',10)||0;
  }catch(e){ return; }
  if(!guideSeen){
    try{ localStorage.setItem('cs-guide-seen','1'); localStorage.setItem('cs-whatsnew-seen',String(CS.whatsNewVersion)); }catch(e){}
    setTimeout(()=>openGuideSheet(),500); // let the screen transition settle first
    return;
  }
  if(whatsNewSeen<CS.whatsNewVersion){
    const entries=CS.whatsNew().filter(e=>e.version>whatsNewSeen);
    try{ localStorage.setItem('cs-whatsnew-seen',String(CS.whatsNewVersion)); }catch(e){}
    if(entries.length) setTimeout(()=>openWhatsNewSheet(entries),500);
  }
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
let hhName='';
function greetingText(){
  const h=new Date().getHours();
  const key = h>=5&&h<12 ? 'greetingMorning' : h>=12&&h<17 ? 'greetingAfternoon' : h>=17&&h<21 ? 'greetingEvening' : 'greetingNeutral';
  const mine=members.find(m=>m.user_id===user.id);
  const full=(mine&&mine.display_name)||(user.user_metadata&&user.user_metadata.full_name)||'';
  const first=full.trim().split(' ')[0];
  return CS.t(key).replace('{n}', first?(' '+first):'');
}
/* the hhbar (back + title + avatars + actions) lives inside .top itself now, directly continuing the
   brand capsule's shape — this just reconfigures its content/handlers per screen instead of swapping DOM */
function setTopHhbar(mode){
  const bar=$('top-hhbar');
  if(mode==='none'){ bar.hidden=true; return; }
  bar.hidden=false;
  const shareBtn=$('top-hhbar-share'), viewBtn=$('top-hhbar-view'), newBtn=$('top-hhbar-new');
  if(mode==='lists'){
    $('top-hhbar-title').textContent=CS.t('homeLists');
    $('top-hhbar-back').onclick=goHome;
    $('top-hhbar-members').innerHTML='';
    shareBtn.hidden=true; viewBtn.hidden=true; newBtn.hidden=false;
  }else if(mode==='main'){
    $('top-hhbar-back').onclick=openListsPage;
    shareBtn.hidden=false; viewBtn.hidden=false; newBtn.hidden=true;
    CS.renderMembers(members);
  }
}
function goHome(){
  if(!household) return;
  $('home-greeting').textContent=greetingText();
  $('home-hh-name').textContent=hhName;
  CS.renderMembers(members, 'home-members-strip');
  setTopHhbar('none');
  CS.setScreen('home');
  fetchHomeData().catch(()=>{}); // best-effort dashboard content — the screen already works without it
}
function applyCachedHousehold(cache){
  household=cache.hhId; hhName=cache.hhName||''; role=cache.role; members=cache.members||[];
  membersById={}; members.forEach(m=>membersById[m.user_id]=m);
  CS.renderMembers(members);
  goHome();
  showOfflineNote(true);
}
async function loadHousehold(hh, navigate){
  if(navigate===undefined) navigate=true;
  household=hh;
  try{ localStorage.setItem('cs-last-hh',hh); }catch(e){}
  try{
    const [{data:hrow,error:e1},{data:mrows,error:e2}]=await Promise.all([
      sb.from('households').select('*').eq('id',hh).maybeSingle(),
      sb.from('household_members').select('*').eq('household_id',hh),
    ]);
    if(e1||e2) throw (e1||e2);
    if(!hrow){ if(navigate) CS.setScreen('onboard'); return; }
    members=mrows||[]; membersById={}; members.forEach(m=>membersById[m.user_id]=m);
    role=(membersById[user.id]||{}).role||null;
    hhName=hrow.name;
    await ensureDisplayName(hh);
    CS.renderMembers(members);
    if(!$('view-lists').hidden) CS.renderLists(lists); // keep the open lists page's data fresh without navigating away from it
    showOfflineNote(false);
    subscribeHouseholdRealtime();
    if(!navigate) return; // a background refresh (realtime update, resumed tab) must never yank the user off whatever screen they're on
    // resume exactly where this household was left — a fresh boot should land in the list you
    // were shopping from, not back at Home every time
    let lastList=null; try{ lastList=localStorage.getItem('cs-last-list-'+hh); }catch(e){}
    if(lastList && await openList(lastList, true)) return;
    goHome();
  }catch(e){
    const cache=loadCache();
    if(cache && cache.hhId===hh) applyCachedHousehold(cache);
    else if(navigate) toast(CS.t('offline'));
  }
}
async function refreshHousehold(){ if(household) await loadHousehold(household, false); }
$('brand-home-btn').addEventListener('click',async()=>{
  if(!household) return;
  if(!$('view-main').hidden){ // leaving an open list mid-shopping shouldn't be one accidental tap away
    const ok=await CS.confirmSheet({
      title:CS.t('leaveListTitle'), body:CS.t('leaveListConfirm'), confirmLabel:CS.t('leaveListAction')
    });
    if(!ok) return;
  }
  goHome();
});

async function createHousehold(){
  const name=$('hh-name').value.trim();
  const msg=$('hh-msg');
  if(!name){ msg.className='msg err'; msg.textContent=CS.t('needHhName'); msg.hidden=false; return; }
  if($('hh-create').disabled) return;
  $('hh-create').disabled=true;
  const {data,error}=await sb.rpc('create_household',{p_name:name});
  $('hh-create').disabled=false;
  if(error){ msg.className='msg err'; msg.textContent=CS.authErr(error); msg.hidden=false; return; }
  await loadHousehold(data);
}
$('hh-create').addEventListener('click',createHousehold);

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

/* ---------- household members management ---------- */
function drawMembersSheet(){
  const t=CS.t;
  const isOwner=role==='owner';
  const rows=members.map(m=>{
    const isSelf=m.user_id===user.id;
    const name=m.display_name||m.email||'?';
    const label=esc(name)+(isSelf?' '+esc(t('you')):'');
    const roleControl = (isOwner && !isSelf)
      ? `<select class="role-select" data-role-member="${m.user_id}">
          ${['editor','requester','viewer'].map(r=>`<option value="${r}" ${r===m.role?'selected':''}>${esc(t('role'+r[0].toUpperCase()+r.slice(1)))}</option>`).join('')}
        </select>`
      : `<span class="role-chip ${esc(m.role)}">${esc(t('role'+m.role[0].toUpperCase()+m.role.slice(1)))}</span>`;
    const editBtn = isSelf ? `<button class="member-remove" data-edit-name="${m.user_id}" aria-label="edit name">✏️</button>` : '';
    const transferBtn = (isOwner && !isSelf)
      ? `<button class="member-remove" data-transfer-owner="${m.user_id}" aria-label="${esc(t('transferOwnerAction'))}" title="${esc(t('transferOwnerAction'))}">👑</button>`
      : '';
    const removeBtn = (isSelf || (isOwner && !isSelf))
      ? `<button class="member-remove" data-remove-member="${m.user_id}" aria-label="remove">${isSelf?'🚪':'✕'}</button>`
      : '';
    return `<div class="member-row">
      <span class="avatar" style="background:${CS.personColor(m.user_id)};margin-inline-start:0">${esc(CS.initials(name))}</span>
      <span class="nm">${label}</span>
      ${roleControl}
      ${editBtn}
      ${transferBtn}
      ${removeBtn}
    </div>`;
  }).join('');
  const inviteRow = (isOwner||role==='editor') ? `<button class="btn wide" id="members-invite-btn">➕ ${esc(t('homeInvite'))}</button>` : '';
  const deleteHhRow = isOwner ? `<button class="btn danger wide" id="delete-household-btn">${esc(t('deleteHousehold'))}</button>` : '';
  openSheet(sheetHead(t('membersTitle'))+`<div class="card">${inviteRow}${rows}${deleteHhRow}</div>`);
  if(inviteRow) $('members-invite-btn').onclick=()=>{ closeSheet(); openInviteSheet(); };
  if(isOwner) $('delete-household-btn').onclick=deleteHousehold;
  $('sheet').querySelectorAll('[data-transfer-owner]').forEach(b=>b.onclick=async()=>{
    const uid=b.dataset.transferOwner;
    const m=members.find(x=>x.user_id===uid);
    const ok=await CS.confirmSheet({
      title:t('transferOwnerTitle'),
      body:t('transferOwnerConfirm').replace('{n}',m?(m.display_name||m.email):''),
      confirmLabel:t('transferOwnerAction'), danger:true
    });
    if(!ok){ drawMembersSheet(); return; }
    const {error}=await sb.rpc('transfer_household_ownership',{p_household:household,p_new_owner:uid});
    if(error){ toast(CS.authErr(error)); return; }
    role='editor';
    const me=members.find(x=>x.user_id===user.id); if(me) me.role='editor';
    if(m) m.role='owner';
    membersById=Object.fromEntries(members.map(x=>[x.user_id,x]));
    toast(t('ownerTransferred'));
    drawMembersSheet();
  });
  $('sheet').querySelectorAll('[data-role-member]').forEach(sel=>sel.onchange=async()=>{
    const uid=sel.dataset.roleMember, newRole=sel.value;
    const {error}=await sb.from('household_members').update({role:newRole}).eq('household_id',household).eq('user_id',uid);
    if(error){ toast(CS.authErr(error)); return; }
    const m=members.find(x=>x.user_id===uid); if(m) m.role=newRole;
    membersById=Object.fromEntries(members.map(x=>[x.user_id,x]));
    toast(t('roleUpdated'));
    drawMembersSheet();
  });
  $('sheet').querySelectorAll('[data-edit-name]').forEach(b=>b.onclick=()=>openEditNameSheet());
  $('sheet').querySelectorAll('[data-remove-member]').forEach(b=>b.onclick=async()=>{
    const uid=b.dataset.removeMember, isSelf=uid===user.id;
    const m=members.find(x=>x.user_id===uid);
    if(isSelf && role==='owner' && members.length>1){
      toast(t('ownerMustTransferFirst'));
      return;
    }
    if(isSelf && role==='owner' && members.length===1){
      await deleteHousehold();
      return;
    }
    const ok=await CS.confirmSheet({
      title:isSelf?t('leaveTitle'):t('removeTitle'),
      body:isSelf?t('leaveConfirm'):t('removeConfirm').replace('{n}',m?(m.display_name||m.email):''),
      confirmLabel:isSelf?t('leaveAction'):t('removeAction'), danger:true
    });
    if(!ok){ drawMembersSheet(); return; }
    const {error}=await sb.from('household_members').delete().eq('household_id',household).eq('user_id',uid);
    if(error){ toast(CS.authErr(error)); return; }
    if(isSelf){ closeSheet(); toast(t('youLeft')); await onUser(user); return; }
    members=members.filter(x=>x.user_id!==uid);
    membersById=Object.fromEntries(members.map(x=>[x.user_id,x]));
    CS.renderMembers(members,'home-members-strip'); CS.renderMembers(members);
    toast(t('memberRemoved'));
    drawMembersSheet();
  });
}

async function deleteHousehold(){
  const t=CS.t;
  const ok=await CS.confirmSheet({
    title:t('deleteHouseholdTitle'),
    body:t('deleteHouseholdConfirm').replace('{n}',hhName||''),
    confirmLabel:t('deleteHousehold'), danger:true
  });
  if(!ok){ drawMembersSheet(); return; }
  const {error}=await sb.from('households').delete().eq('id',household);
  if(error){ toast(CS.authErr(error)); return; }
  closeSheet();
  toast(t('householdDeleted'));
  await onUser(user);
}

function openEditNameSheet(){
  const t=CS.t;
  const mine=members.find(x=>x.user_id===user.id);
  openSheet(sheetHead(t('editNameTitle'))+`<div class="card">
    <p class="sub">${esc(t('editNameSub'))}</p>
    <input id="edit-name-input" value="${esc(mine?mine.display_name||'':'')}">
    <button class="btn wide" id="edit-name-save">${esc(t('editSave'))}</button>
  </div>`);
  $('edit-name-input').focus();
  $('edit-name-save').onclick=async()=>{
    const name=$('edit-name-input').value.trim();
    if(!name) return;
    const {error}=await sb.from('household_members').update({display_name:name}).eq('household_id',household).eq('user_id',user.id);
    if(error){ toast(CS.authErr(error)); return; }
    if(mine) mine.display_name=name;
    CS.renderMembers(members,'home-members-strip'); CS.renderMembers(members);
    toast(t('nameUpdated'));
    drawMembersSheet();
  };
}

function openProfileSheet(){
  const t=CS.t;
  const curName=(user.user_metadata&&user.user_metadata.full_name)||'';
  openSheet(sheetHead(t('profileTitle'))+`<div class="card">
    <div style="font-size:.9rem;color:var(--muted)" dir="ltr">${esc(user.email)}</div>
    <p class="sub">${esc(t('profileNameSub'))}</p>
    <input id="profile-name" value="${esc(curName)}">
    <button class="btn wide" id="profile-save">${esc(t('editSave'))}</button>
    <p class="sub" style="margin-top:8px">${esc(t('profilePassSub'))}</p>
    <input id="profile-pass" type="password" placeholder="${esc(t('newPasswordPh'))}" dir="ltr">
    <button class="btn ghost wide" id="profile-pass-save">${esc(t('profilePassSave'))}</button>
    <div id="profile-msg" class="msg" hidden></div>
  </div>`);
  $('profile-name').focus();
  $('profile-save').onclick=async()=>{
    const name=$('profile-name').value.trim();
    if(!name) return;
    const {error}=await sb.auth.updateUser({data:{full_name:name}});
    if(error){ const m=$('profile-msg'); m.className='msg err'; m.textContent=CS.authErr(error); m.hidden=false; return; }
    renderAccount();
    toast(t('profileSaved'));
  };
  $('profile-pass-save').onclick=async()=>{
    const pass=$('profile-pass').value;
    if(!pass||pass.length<6) return;
    const {error}=await sb.auth.updateUser({password:pass});
    if(error){ const m=$('profile-msg'); m.className='msg err'; m.textContent=CS.authErr(error); m.hidden=false; return; }
    $('profile-pass').value='';
    toast(t('passwordUpdated'));
  };
}

/* ---------- lists directory ---------- */
let lists=[];
async function fetchLists(){
  const {data,error}=await sb.from('shopping_lists').select('*').eq('household_id',household).order('created_at',{ascending:false});
  if(error){ console.warn(error); return; }
  lists=data||[];
  CS.renderLists(lists, role==='owner'||role==='editor');
}
async function openListsPage(){
  setTopHhbar('lists');
  CS.setScreen('lists');
  await fetchLists();
}
$('home-lists-more').addEventListener('click',openListsPage);
$('home-lists-empty-btn').addEventListener('click',openNewListSheet);

/* ---------- home dashboard: open-list previews with remaining counts + a short cross-list activity feed ---------- */
async function fetchHomeData(){
  await fetchLists();
  const openLists=lists.filter(l=>l.status==='open');
  const preview=openLists.slice(0,4);
  let counts={};
  if(preview.length){
    const {data}=await sb.from('list_items').select('list_id,status').eq('household_id',household).in('status',['active','pending']);
    (data||[]).forEach(r=>{ counts[r.list_id]=(counts[r.list_id]||0)+1; });
  }
  CS.renderHomeLists(preview, counts, openLists.length>preview.length);
  const {data:actData}=await sb.from('list_activity').select('*').eq('household_id',household).order('created_at',{ascending:false}).limit(5);
  CS.renderHomeActivity((actData||[]).map(decorateHomeActivity));
}
function decorateHomeActivity(a){
  const base=decorateActivity(a);
  const l=lists.find(x=>x.id===a.list_id);
  return {...base, listName:l?l.name:''};
}

function openNewListSheet(){
  const t=CS.t;
  openSheet(sheetHead(t('newListTitle'))+`<div class="card">
    <input id="new-list-name" placeholder="${esc(t('newListName'))}">
    <div id="new-list-msg" class="msg err" hidden></div>
    <button class="btn wide" id="new-list-go">${esc(t('newListGo'))}</button>
  </div>`);
  $('new-list-name').focus();
  const go=async()=>{
    const name=$('new-list-name').value.trim();
    if(!name){ const m=$('new-list-msg'); m.textContent=t('needListName'); m.hidden=false; return; }
    const btn=$('new-list-go'); if(btn.disabled) return;
    btn.disabled=true;
    const {data,error}=await sb.rpc('create_shopping_list',{p_household:household,p_name:name});
    btn.disabled=false;
    if(error){ const m=$('new-list-msg'); m.textContent=CS.authErr(error); m.hidden=false; return; }
    closeSheet();
    await openList(data);
  };
  $('new-list-go').onclick=go;
  $('new-list-name').addEventListener('keydown',e=>{ if(e.key==='Enter') go(); });
}
$('top-hhbar-new').addEventListener('click',openNewListSheet);

document.addEventListener('click',async e=>{
  const delBtn=e.target.closest('[data-del-list]');
  if(delBtn){
    const id=delBtn.dataset.delList;
    const l=lists.find(x=>x.id===id);
    const ok=await CS.confirmSheet({
      title:CS.t('deleteListTitle'),
      body:CS.t('deleteListConfirm').replace('{n}',l?l.name:''),
      confirmLabel:CS.t('deleteList'), danger:true
    });
    if(!ok) return;
    const {error}=await sb.from('shopping_lists').delete().eq('id',id);
    if(error){ toast(CS.authErr(error)); return; }
    toast(CS.t('listDeleted'));
    await fetchLists();
    return;
  }
  const row=e.target.closest('[data-list]'); if(!row) return;
  openList(row.dataset.list);
});

async function openList(id, silent){
  const {data:lrow,error}=await sb.from('shopping_lists').select('*').eq('id',id).maybeSingle();
  if(error||!lrow){ if(!silent) toast(CS.authErr(error||'not_found')); return false; }
  listId=id;
  try{ localStorage.setItem('cs-last-list-'+household,id); }catch(e){}
  setTopHhbar('main');
  $('top-hhbar-title').textContent=lrow.name;
  listStatus=lrow.status;
  $('trip-bar').hidden=listStatus!=='open';
  $('view-main').classList.toggle('readonly',listStatus!=='open');
  searchQuery=''; $('search-input').value=''; $('search-input').hidden=true; $('search-toggle').hidden=false;
  items=[]; paintItems(); // clear the previous list's items so they don't flash under this list's name while loading
  activity=[]; CS.renderActivity([]);
  CS.setScreen('main');
  queue=loadQueueFor(listId);
  await fetchItems();
  cacheSnapshot();
  subscribeListRealtime();
  fetchActivity(); // not awaited — the item list shouldn't wait on history loading
  if(queue.length) flushQueue({resync:true});
  return true;
}

async function doCloseTrip(payload){
  closeSheet();
  const {error}=await sb.rpc('close_shopping_trip',payload);
  if(error){ toast(CS.authErr(error)); return; }
  toast(CS.t('tripClosed'));
  await openListsPage();
}
async function openCloseTripSheet(){
  const t=CS.t;
  const uncheckedCount=items.filter(i=>i.status==='active'||i.status==='pending').length;
  if(!uncheckedCount){
    openSheet(sheetHead(t('tripCloseTitle'))+`<div class="card">
      <p>${esc(t('tripCloseBodyEmpty'))}</p>
      <button class="btn wide" id="trip-confirm">${esc(t('tripClose'))}</button>
      <button class="btn ghost wide" data-act="sheet-close">${esc(t('cancel'))}</button>
    </div>`);
    $('trip-confirm').onclick=()=>doCloseTrip({p_list_id:listId,p_action:'leave'});
    return;
  }
  const {data:openRows}=await sb.from('shopping_lists').select('id,name').eq('household_id',household).eq('status','open').neq('id',listId);
  const otherLists=openRows||[];
  openSheet(sheetHead(t('tripCloseTitle'))+`<div class="card">
    <p>${esc(t('tripCloseBodyUnchecked').replace('{n}',uncheckedCount))}</p>
    <div class="role-pick" id="trip-choice">
      <button class="active" data-choice="leave" type="button">${esc(t('tripLeave'))}</button>
      ${otherLists.length?`<button data-choice="move_existing" type="button">${esc(t('tripMoveExisting'))}</button>`:''}
      <button data-choice="move_new" type="button">${esc(t('tripMoveNew'))}</button>
    </div>
    <div id="trip-choice-detail"></div>
    <button class="btn wide" id="trip-confirm">${esc(t('tripClose'))}</button>
    <button class="btn ghost wide" data-act="sheet-close">${esc(t('cancel'))}</button>
  </div>`);
  let choice='leave';
  const detail=$('trip-choice-detail');
  function renderDetail(){
    if(choice==='move_existing'){
      detail.innerHTML=`<select class="role-select" id="trip-target-list" style="width:100%;margin-top:8px">
        ${otherLists.map(l=>`<option value="${l.id}">${esc(l.name)}</option>`).join('')}
      </select>`;
    }else if(choice==='move_new'){
      detail.innerHTML=`<input id="trip-new-name" placeholder="${esc(t('newListName'))}" style="margin-top:8px">`;
    }else{
      detail.innerHTML='';
    }
  }
  renderDetail();
  $('trip-choice').querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
    choice=b.dataset.choice;
    $('trip-choice').querySelectorAll('[data-choice]').forEach(x=>x.classList.toggle('active',x===b));
    renderDetail();
  });
  $('trip-confirm').onclick=()=>{
    const payload={p_list_id:listId,p_action:choice};
    if(choice==='move_existing'){
      const sel=$('trip-target-list');
      if(!sel||!sel.value) return;
      payload.p_target_list_id=sel.value;
    }else if(choice==='move_new'){
      const nm=$('trip-new-name')?$('trip-new-name').value.trim():'';
      if(!nm) return;
      payload.p_new_list_name=nm;
    }
    doCloseTrip(payload);
  };
}
$('trip-close').addEventListener('click',openCloseTripSheet);

function buildTripSummaryText(){
  const t=CS.t;
  const bought=items.filter(i=>i.status==='checked');
  const notBought=items.filter(i=>i.status==='active'||i.status==='pending');
  const name=$('top-hhbar-title').textContent||'';
  const lines=[`🛒 ${name}`.trim(),''];
  lines.push(`✅ ${t('boughtHeader')} (${bought.length})`);
  bought.forEach(i=>lines.push('• '+i.text));
  lines.push('');
  lines.push(`🧺 ${t('notBoughtHeader')} (${notBought.length})`);
  notBought.forEach(i=>lines.push('• '+i.text));
  return lines.join('\n');
}
async function shareTripSummary(){
  const text=buildTripSummaryText();
  if(navigator.share){
    try{ await navigator.share({title:CS.t('appName'),text}); }catch(e){}
    return;
  }
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
}
$('top-hhbar-share').addEventListener('click',shareTripSummary);

/* ---------- invites ---------- */
async function shareInvite(text){
  if(window.CartApp && window.CartApp.shareText){
    try{ window.CartApp.shareText(text); return; }catch(e){} // native Android share chooser — plain WebView has no navigator.share
  }
  if(navigator.share){
    try{ await navigator.share({title:CS.t('appName'), text}); return; }catch(e){ return; } // cancelled or failed — don't fall through to a copy they didn't ask for
  }
  navigator.clipboard&&navigator.clipboard.writeText(text).catch(()=>{});
  toast(CS.t('inviteCopied'));
}

let inviteRole='editor';
function openInviteSheet(){
  const t=CS.t;
  inviteRole='editor';
  const draw=()=>{
    openSheet(sheetHead(t('invite'))+`<div class="card">
      <p class="sub">${esc(t('inviteSub'))}</p>
      <p>${esc(t('inviteRole'))}</p>
      <div class="role-pick">
        ${['editor','requester','viewer'].map(r=>`<button data-role="${r}" class="${r===inviteRole?'active':''}" type="button">${esc(t('role'+r[0].toUpperCase()+r.slice(1)))}</button>`).join('')}
      </div>
      <button class="btn wide" id="inv-go">${esc(t('invite'))}</button>
    </div>`);
    $('sheet').querySelectorAll('[data-role]').forEach(rb=>rb.onclick=()=>{ inviteRole=rb.dataset.role; draw(); });
    $('inv-go').onclick=go;
  };
  async function go(){
    const btn=$('inv-go'); if(btn.disabled) return;
    btn.disabled=true;
    const {data,error}=await sb.rpc('create_invite',{p_household:household,p_role:inviteRole});
    btn.disabled=false;
    if(error){ toast(CS.authErr(error)); return; }
    const joinUrl=(window.CS_SITE||location.origin+location.pathname.replace(/[^/]*$/,''))+'?join='+data;
    const shareMsg=t('inviteShareText')+'\n'+joinUrl;
    openSheet(sheetHead(t('invite'))+`<div class="card">
      <p class="sub">${esc(t('inviteReadySub'))}</p>
      <button class="btn wide" id="inv-share">${esc(t('inviteShare'))}</button>
    </div>`);
    $('inv-share').onclick=()=>shareInvite(shareMsg);
  }
  draw();
}

/* ---------- items ---------- */
function decorate(list){
  return list.map(i=>({...i,
    checked_by_name: i.checked_by&&membersById[i.checked_by]?membersById[i.checked_by].display_name:'',
    added_by_name: i.created_by&&membersById[i.created_by]?membersById[i.created_by].display_name:'',
  }));
}
let searchQuery='';
function paintItems(){
  let list=decorate(items);
  if(searchQuery) list=list.filter(i=>i.text.toLowerCase().includes(searchQuery));
  CS.renderGroups(list);
  cacheSnapshot();
}
$('search-input').addEventListener('input',e=>{ searchQuery=e.target.value.trim().toLowerCase(); paintItems(); });
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

/* ---------- activity log ---------- */
function decorateActivity(a){
  const name = a.actor===user.id ? CS.t('you') : (a.actor&&membersById[a.actor]?(membersById[a.actor].display_name||membersById[a.actor].email):'?');
  return {...a, actorName:name};
}
async function fetchActivity(){
  try{
    const {data,error}=await sb.from('list_activity').select('*').eq('list_id',listId).order('created_at',{ascending:false}).limit(50);
    if(error) throw error;
    activity=data||[];
  }catch(e){ activity=[]; }
  CS.renderActivity(activity.map(decorateActivity));
}
function openActivitySheet(){
  openSheet(sheetHead(CS.t('activityTitle'))+`<div class="card"><ul class="list activity-list" id="activity-list"></ul></div>`);
  CS.renderActivity(activity.map(decorateActivity));
}
$('activity-open').addEventListener('click',openActivitySheet);

/* best-effort background category/emoji upgrade for items the local dictionary couldn't place —
   batched (debounced) so a fast multi-add only costs one AI call, and never blocks the add itself */
let aiPending=[], aiTimer=null;
function queueAiUpgrade(text){
  aiPending.push(text);
  clearTimeout(aiTimer);
  aiTimer=setTimeout(flushAiUpgrade,500);
}
function applyAiUpgrade(text,r,retried){
  const matches=items.filter(i=>i.text===text && i.created_by===user.id && !isTemp(i.id) && i.category==='other');
  if(!matches.length){
    if(!retried) setTimeout(()=>applyAiUpgrade(text,r,true),600); // the matching add may still be mid-sync — retry once
    return;
  }
  matches.forEach(it=>{
    it.category=r.category; it.emoji=r.emoji;
    sb.from('list_items').update({category:r.category,emoji:r.emoji}).eq('id',it.id);
  });
  paintItems();
}
async function flushAiUpgrade(){
  const texts=[...new Set(aiPending)]; aiPending=[];
  if(!texts.length || !online) return;
  try{
    const {data,error}=await sb.functions.invoke('categorize',{body:{texts}});
    if(error||!data||!data.results) return;
    texts.forEach((text,i)=>{
      const r=data.results[i];
      if(r && r.category!=='other') applyAiUpgrade(text,r);
    });
  }catch(e){ /* best-effort only: the item already has a sensible fallback category */ }
}
function normText(s){ return (s||'').trim().toLowerCase().replace(/\s+/g,' '); }
let forceAddDup=false;
async function addItem(){
  const input=$('item-input'), qtyInput=$('item-qty');
  if(!input||!qtyInput) return;
  const text=input.value.trim();
  const qty=qtyInput.value.trim();
  if(!text||!listId) return;
  if(!forceAddDup){
    const norm=normText(text);
    const dup=items.find(i=>i.status!=='checked' && normText(i.text)===norm);
    if(dup){
      const msg=$('item-dup-msg');
      if(msg){
        msg.hidden=false; msg.className='msg warn';
        msg.innerHTML=`${esc(CS.t('dupWarning').replace('{n}',dup.text))} <button class="linkbtn" id="item-dup-force" type="button" style="color:inherit">${esc(CS.t('dupAddAnyway'))}</button>`;
        const fb=$('item-dup-force'); if(fb) fb.onclick=()=>{ forceAddDup=true; addItem(); };
      }
      return;
    }
  }
  forceAddDup=false;
  const dupMsg=$('item-dup-msg'); if(dupMsg) dupMsg.hidden=true;
  input.value=''; qtyInput.value=''; input.focus(); // keep the sheet open for fast multi-add before heading to the store
  const g=CS.guess(text); // instant local dictionary guess — the item appears right away, no network wait
  const row={ list_id:listId, household_id:household, text, category:g.cat, emoji:g.emoji, qty:qty||null, created_by:user.id, position:Date.now() };
  queueAdd(row); // optimistic: shows immediately and syncs in the background, online or not
  toast(role==='requester'?CS.t('itemRequested'):CS.t('itemAdded'));
  if(online) flushQueue();
  if(online && g.cat==='other') queueAiUpgrade(text); // ask the AI to refine it once it's safely saved, never blocking the add
}
function openAddSheet(){
  const t=CS.t;
  forceAddDup=false;
  openSheet(sheetHead(t('add'))+`<div class="card">
    <input id="item-input" placeholder="${esc(t('itemPh'))}" autocomplete="off">
    <input id="item-qty" class="qty-input" placeholder="${esc(t('qtyPh'))}" autocomplete="off" inputmode="numeric">
    <div id="item-dup-msg" class="msg" hidden></div>
    <button class="btn wide" id="item-add">${esc(t('add'))}</button>
  </div>`);
  $('item-add').addEventListener('click',addItem);
  $('item-input').addEventListener('keydown',e=>{ if(e.key==='Enter') addItem(); });
  $('item-input').addEventListener('input',()=>{ forceAddDup=false; const m=$('item-dup-msg'); if(m) m.hidden=true; });
  $('item-qty').addEventListener('keydown',e=>{ if(e.key==='Enter') addItem(); });
  $('item-input').focus();
}
$('fab-add').addEventListener('click',openAddSheet);

async function reorderItems(ids){
  if(!online) return; // manual reorder is an online-only convenience for v1
  await Promise.all(ids.map((id,i)=>sb.from('list_items').update({position:(i+1)*1000}).eq('id',id)));
}

async function toggleItem(id){
  if(listStatus!=='open') return; // a closed list is history, not editable
  const it=items.find(i=>i.id===id); if(!it) return;
  const prev={status:it.status,checked_by:it.checked_by,checked_at:it.checked_at};
  const patch = it.status==='checked'
    ? {status:'active',checked_by:null,checked_at:null}
    : {status:'checked',checked_by:user.id,checked_at:new Date().toISOString()};
  Object.assign(it,patch); paintItems(); // instant feedback — a checkbox tap shouldn't wait on a round trip
  if(!online || isTemp(id)){ queueOp('toggle',id,patch); return; }
  const {error}=await sb.from('list_items').update(patch).eq('id',id);
  if(error){ Object.assign(it,prev); paintItems(); toast(CS.authErr(error)); }
}
let pendingDeletes={};
async function delItem(id){
  if(listStatus!=='open') return;
  const it=items.find(i=>i.id===id); if(!it) return;
  items=items.filter(i=>i.id!==id); paintItems();
  if(!online || isTemp(id)){ queueOp('del',id); return; } // no undo window offline: it's already safely queued
  if(pendingDeletes[id]) clearTimeout(pendingDeletes[id].timer);
  pendingDeletes[id]={item:it, timer:setTimeout(async()=>{
    delete pendingDeletes[id];
    await sb.from('list_items').delete().eq('id',id);
  },5000)};
  toastAction(CS.t('deleted'), CS.t('undo'), ()=>{
    const p=pendingDeletes[id]; if(!p) return;
    clearTimeout(p.timer); delete pendingDeletes[id];
    items.push(p.item); paintItems();
  });
}
function openEditSheet(id){
  if(listStatus!=='open') return;
  const it=items.find(i=>i.id===id); if(!it) return;
  const t=CS.t;
  openSheet(sheetHead(t('editItem'))+`<div class="card">
    <input id="edit-text" value="${esc(it.text)}">
    <input id="edit-qty" class="qty-input" placeholder="${esc(t('qtyPh'))}" value="${esc(it.qty||'')}" inputmode="numeric">
    <button class="btn wide" id="edit-save">${esc(t('editSave'))}</button>
  </div>`);
  $('edit-text').focus();
  const save=async()=>{
    const text=$('edit-text').value.trim(), qty=$('edit-qty').value.trim();
    if(!text) return;
    closeSheet();
    const patch={text, qty:qty||null};
    const g=CS.guess(text);
    if(g.cat!=='other'){ patch.category=g.cat; patch.emoji=g.emoji; } // keep the current category when the edited text doesn't match anything specific
    Object.assign(it,patch); paintItems(); // instant feedback, same as the rest of the item actions
    if(!online || isTemp(id)){ queueOp('update',id,patch); return; }
    await sb.from('list_items').update(patch).eq('id',id);
  };
  $('edit-save').onclick=save;
  $('edit-text').addEventListener('keydown',e=>{ if(e.key==='Enter') save(); });
}
async function approveItem(id){
  if(!online){ toast(CS.t('offline')); return; }
  const it=items.find(i=>i.id===id);
  if(it){ it.status='active'; paintItems(); }
  const {error}=await sb.from('list_items').update({status:'active'}).eq('id',id);
  if(error){ if(it) it.status='pending'; paintItems(); toast(CS.authErr(error)); return; }
  toast(CS.t('itemApproved'));
}
async function rejectItem(id){
  if(!online){ toast(CS.t('offline')); return; }
  const it=items.find(i=>i.id===id);
  items=items.filter(i=>i.id!==id); paintItems();
  const {error}=await sb.from('list_items').delete().eq('id',id);
  if(error){ if(it) items.push(it); paintItems(); toast(CS.authErr(error)); }
}
window.CS.on={toggle:toggleItem, reorder:reorderItems};

document.addEventListener('click',e=>{
  const b=e.target.closest('[data-action]'); if(!b) return;
  const id=b.dataset.id, action=b.dataset.action;
  if(action==='toggle') toggleItem(id);
  else if(action==='del') delItem(id);
  else if(action==='edit') openEditSheet(id);
  else if(action==='approve') approveItem(id);
  else if(action==='reject') rejectItem(id);
});

/* ---------- realtime ---------- */
let hhChannel=null;
function subscribeHouseholdRealtime(){
  if(hhChannel){ sb.removeChannel(hhChannel); hhChannel=null; }
  if(!household) return;
  hhChannel=sb.channel('household:'+household)
    .on('postgres_changes',{event:'*',schema:'public',table:'household_members',filter:'household_id=eq.'+household},()=>{
      refreshHousehold();
    })
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'shopping_lists',filter:'household_id=eq.'+household},payload=>{
      const row=payload.new;
      if(row.created_by && row.created_by!==user.id){
        const name=membersById[row.created_by]?membersById[row.created_by].display_name:'';
        toast(CS.t('notifyListOpened').replace('{n}',name||'?').replace('{l}',row.name));
      }
      if(!$('view-lists').hidden) fetchLists();
    })
    .on('postgres_changes',{event:'UPDATE',schema:'public',table:'shopping_lists',filter:'household_id=eq.'+household},payload=>{
      const row=payload.new;
      if(row.status==='closed' && payload.old.status!=='closed' && row.closed_by && row.closed_by!==user.id){
        const name=membersById[row.closed_by]?membersById[row.closed_by].display_name:'';
        toast(CS.t('notifyListClosed').replace('{n}',name||'?').replace('{l}',row.name));
      }
      if(!$('view-lists').hidden) fetchLists();
    })
    .subscribe();
}
function subscribeListRealtime(){
  if(channel){ sb.removeChannel(channel); channel=null; }
  if(!listId) return;
  channel=sb.channel('list:'+listId)
    .on('postgres_changes',{event:'*',schema:'public',table:'list_items',filter:'list_id=eq.'+listId},payload=>{
      if(payload.eventType==='INSERT'){
        const idx=items.findIndex(i=>i.id===payload.new.id);
        if(idx>-1) items[idx]=payload.new; else items.push(payload.new); // our own optimistic adds echo back here too — upsert, don't duplicate
      }
      else if(payload.eventType==='UPDATE') items=items.map(i=>i.id===payload.new.id?payload.new:i);
      else if(payload.eventType==='DELETE') items=items.filter(i=>i.id!==payload.old.id);
      paintItems();
    })
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'list_activity',filter:'list_id=eq.'+listId},payload=>{
      activity=[payload.new, ...activity].slice(0,50);
      CS.renderActivity(activity.map(decorateActivity));
      if(payload.new.actor && payload.new.actor!==user.id){
        const f=CS.formatActivity(decorateActivity(payload.new));
        toast(f.icon+' '+f.text);
      }
    })
    .subscribe();
}
addEventListener('online',()=>{ online=true; showOfflineNote(false); flushQueue({resync:true}); });
addEventListener('offline',()=>{ online=false; showOfflineNote(true); });

/* ---------- boot ---------- */
async function onUser(u){
  user=u; window.CS.myId=u?u.id:null;
  renderAccount();
  if(!u){ household=null; listId=null; items=[]; CS.setScreen('auth'); return; }
  if(pendingJoin && await consumePendingJoin()){ maybeShowOnboarding(); return; }
  const list=await listMyHouseholds();
  if(!list.length){
    const cache=loadCache();
    if(cache && cache.hhId){ await loadHousehold(cache.hhId); maybeShowOnboarding(); return; } // offline cold start: fall back to last-known household
    CS.setScreen('onboard'); maybeShowOnboarding(); return;
  }
  let last=null; try{ last=localStorage.getItem('cs-last-hh'); }catch(e){}
  const pick=(last&&list.find(h=>h.id===last))||list[0];
  await loadHousehold(pick.id);
  maybeShowOnboarding();
}
let bootedUserId=null;
sb.auth.onAuthStateChange((event,session)=>{
  setTimeout(()=>{
    const u=session?session.user:null;
    // the app resuming from background (or a profile/password edit) fires TOKEN_REFRESHED /
    // USER_UPDATED for the same already-signed-in user — re-running the whole boot flow for those
    // was throwing people back to Home mid-list every time they switched back to the app.
    if((event==='TOKEN_REFRESHED'||event==='USER_UPDATED') && u && u.id===bootedUserId){
      user=u; window.CS.myId=u.id; renderAccount();
      return;
    }
    bootedUserId=u?u.id:null;
    onUser(u);
  },0);
});

showOfflineNote(!online);
window.CS.rerenderMain=paintItems;
})();
