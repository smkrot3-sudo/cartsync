/* Version footer + in-app updates. Works two ways:
   - inside the Android app: compares versionCode against app-version.json and installs via the
     native CartApp.installUpdate bridge (a PackageInstaller session, no browser/Downloads folder).
   - on the web/PWA: compares the build timestamp baked into this page and just reloads to the latest. */
(function(){
const $=CS.$;
if(!$('version-label')) return;
const SITE = window.CS_SITE || './';
const WEB_BUILD = window.CS_BUILD || 0;
const inApp = !!window.CartApp;

function showBtn(show, label, onClick){
  const b=$('update-btn');
  b.hidden=!show; b.textContent=label; b.disabled=false;
  b.onclick=onClick;
}

function startAndroidUpdate(url){
  showBtn(true, CS.t('updateDownloading'), null);
  const b=$('update-btn'); b.disabled=true;
  window.onUpdateProgress=function(pct){
    if(pct===-2){ showBtn(true, CS.t('updateNow'), ()=>startAndroidUpdate(url)); CS.toast(CS.t('updateFailed')); return; }
    if(pct>=100){ b.textContent=CS.t('updateDone'); return; }
    b.textContent='⏳ '+pct+'%';
  };
  try{ window.CartApp.installUpdate(url); }catch(e){ CS.toast(CS.t('updateFailed')); }
}

function paintCurrentLabel(){
  if(inApp){
    let current=0, name='';
    try{ current=window.CartApp.versionCode(); name=window.CartApp.versionName(); }catch(e){}
    $('version-label').textContent=CS.t('versionLabel').replace('{v}', name+' ('+current+')');
  }else{
    const d=new Date(WEB_BUILD);
    const label=isNaN(d)?'':d.toLocaleString(CS.lang()==='he'?'he-IL':'en-US',{dateStyle:'short',timeStyle:'short'});
    $('version-label').textContent=CS.t('versionLabel').replace('{v}', label);
  }
}

async function check(){
  paintCurrentLabel(); // always show what we know locally, even before (or instead of) the version-check fetch
  try{
    const r=await fetch(SITE+'app-version.json?t='+Date.now(),{cache:'no-store'});
    if(!r.ok) return;
    const v=await r.json();
    if(inApp && v.android){
      let current=0; try{ current=window.CartApp.versionCode(); }catch(e){}
      if(v.android.versionCode>current) showBtn(true, CS.t('updateNow'), ()=>startAndroidUpdate(v.android.url));
    }else if(!inApp && v.build && v.build>WEB_BUILD+5000){
      showBtn(true, CS.t('updateNow'), ()=>location.reload());
    }
  }catch(e){ /* offline or missing file: stay quiet, not worth an error toast */ }
}
check();
window.CS.checkUpdate=check;
})();
