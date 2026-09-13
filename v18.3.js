/* =========================================================
   V18.3 — updater bootstrap + QOL
   The important fix is the EARLY Service Worker update guard:
   the old page-level checker could start before the injected patch
   and wait indefinitely on registration.update().
   ========================================================= */
(function(){
  'use strict';

  const CURRENT_VERSION='18.3.0';
  const CHECK_TIMEOUT=6000;
  const UPDATE_TIMEOUT=8000;
  const WORKER_TIMEOUT=12000;
  const PATCH_FLAG='__valedouro_v183_bootstrap';

  function delay(ms){return new Promise(resolve=>setTimeout(resolve,ms));}

  /*
   * EARLY BOOTSTRAP
   *
   * This file is injected in <head>, before the game's large inline script.
   * The game's original updater can therefore not dead-lock the page while
   * waiting for ServiceWorkerRegistration.update(). Its real result is still
   * available to the manual updater below through __nativeSwUpdate.
   */
  if(!window[PATCH_FLAG]){
    window[PATCH_FLAG]=true;
    try{
      const proto=window.ServiceWorkerRegistration&&window.ServiceWorkerRegistration.prototype;
      if(proto&&typeof proto.update==='function'&&!proto.__valedouroOriginalUpdate){
        const native=proto.update;
        Object.defineProperty(proto,'__valedouroOriginalUpdate',{value:native,writable:false,configurable:false});
        proto.update=function(){
          const registration=this;
          return Promise.race([
            Promise.resolve().then(()=>native.call(registration)),
            delay(1200).then(()=>registration)
          ]);
        };
      }
    }catch(e){}
  }

  function nativeUpdate(reg){
    try{
      const proto=window.ServiceWorkerRegistration&&window.ServiceWorkerRegistration.prototype;
      const native=proto&&proto.__valedouroOriginalUpdate;
      if(typeof native==='function')return native.call(reg);
    }catch(e){}
    try{return reg.update()}catch(e){return Promise.reject(e)}
  }

  function withTimeout(promise,ms){
    return Promise.race([Promise.resolve(promise),delay(ms).then(()=>{throw new Error('timeout')})]);
  }

  function versionParts(v){
    return String(v||'0').replace(/^v/i,'').split('.').map(n=>parseInt(n,10)||0);
  }
  function isNewer(latest,current){
    const a=versionParts(latest),b=versionParts(current);
    for(let i=0;i<3;i++){
      if((a[i]||0)!==(b[i]||0))return (a[i]||0)>(b[i]||0);
    }
    return false;
  }

  async function fetchVersion(){
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),CHECK_TIMEOUT);
    try{
      const res=await fetch('./version.json?t='+Date.now(),{cache:'no-store',signal:controller.signal});
      if(!res.ok)throw new Error('version-http');
      const data=await res.json();
      if(!data||typeof data.version!=='string')throw new Error('version-format');
      return data;
    }finally{clearTimeout(timer)}
  }

  function getText(){return document.getElementById('updateText')}
  function getButton(){return document.getElementById('updateBtn')}

  function showChecking(manual){
    const text=getText(),btn=getButton();
    if(text)text.textContent=manual?'A procurar a versão mais recente…':'A verificar versão…';
    if(btn)btn.disabled=true;
  }

  function showRetry(message){
    const text=getText(),btn=getButton();
    if(text)text.textContent=message||'Não foi possível verificar agora. O jogo continua a funcionar.';
    if(btn){
      btn.style.display='block';
      btn.disabled=false;
      btn.textContent='🔄 Tentar novamente';
      btn.onclick=()=>window.__valedouroV183.check(true);
    }
  }

  function setLatest(){
    const text=getText(),btn=getButton();
    if(text)text.textContent='V'+CURRENT_VERSION+' — estás na versão mais recente. Os teus saves ficam neste dispositivo.';
    if(btn){
      btn.style.display='block';
      btn.disabled=false;
      btn.textContent='🔄 Procurar atualização';
      btn.onclick=()=>window.__valedouroV183.check(true);
    }
  }

  function setAvailable(data){
    const text=getText(),btn=getButton();
    if(text)text.innerHTML='<b>Nova versão disponível: V'+data.version+'</b><br>'+((Array.isArray(data.changelog)?data.changelog:[]).slice(0,5).map(x=>'• '+x).join('<br>')||'Atualização disponível.');
    if(btn){
      btn.style.display='block';
      btn.disabled=false;
      btn.textContent='⬆️ Atualizar agora';
      btn.onclick=()=>window.__valedouroV183.apply();
    }
  }

  function refreshGiftButtons(){
    const enabled=!!(typeof coopRoom!=='undefined' && coopRoom && Array.isArray(coopPlayers) && coopPlayers.some(p=>p&&p.id&&p.id!==coopPlayerId));
    document.querySelectorAll('button').forEach(btn=>{
      const text=String(btn.textContent||'').trim().toLowerCase();
      if(text.includes('presentear')){
        btn.classList.toggle('v18-gift-hidden',!enabled);
        btn.setAttribute('aria-hidden',enabled?'false':'true');
        btn.tabIndex=enabled?0:-1;
      }
    });
  }

  function hud(){
    let el=document.getElementById('v18-hud');
    if(!el){
      el=document.createElement('div');
      el.id='v18-hud';
      el.innerHTML='<span id="v18-hud-mode">🎮 Solo</span><span id="v18-hud-zone">🗺️ Valedouro</span><span id="v18-hud-time">☀️ Dia 1</span>';
      document.body.appendChild(el);
    }
    let state=null;
    try{state=typeof s!=='undefined'?s:null}catch(e){state=null}
    let players=[];
    try{players=typeof coopPlayers!=='undefined'&&Array.isArray(coopPlayers)?coopPlayers.filter(p=>p&&p.id):[]}catch(e){}
    let room=false,shared=false;
    try{room=typeof coopRoom!=='undefined'&&!!coopRoom}catch(e){}
    try{shared=typeof coopCfg!=='undefined'&&!!(coopRoom&&coopCfg&&coopCfg.shared)}catch(e){}
    const mode=room?`🤝 Coop${shared?' • Partilhado':''} · ${Math.max(1,players.length)} jogador${players.length===1?'':'es'}`:'🎮 Solo';
    const zone=state&&state.zone||'Valedouro';
    const day=Number(state&&state.day)||1;
    const time=state&&state.time||'Dia';
    const m=document.getElementById('v18-hud-mode'),z=document.getElementById('v18-hud-zone'),t=document.getElementById('v18-hud-time');
    if(m)m.textContent=mode;
    if(z)z.textContent='🗺️ '+zone;
    if(t)t.textContent=(time==='Noite'?'🌙':'☀️')+' Dia '+day;
  }

  function installStyle(){
    if(document.getElementById('v18-style'))return;
    const style=document.createElement('style');
    style.id='v18-style';
    style.textContent='.v18-gift-hidden{display:none!important}#v18-hud{position:fixed;right:12px;bottom:12px;z-index:35;display:flex;gap:6px;align-items:center;max-width:min(92vw,620px);padding:7px 9px;border:1px solid #303c4d;border-radius:999px;background:rgba(15,21,29,.92);backdrop-filter:blur(12px);box-shadow:0 8px 28px #0006;color:#cbd5e1;font-size:10px;line-height:1;pointer-events:none;white-space:nowrap;overflow:hidden}#v18-hud span{overflow:hidden;text-overflow:ellipsis}#v18-hud span+span{border-left:1px solid #303c4d;padding-left:6px}@media(max-width:520px){#v18-hud{right:8px;bottom:8px;max-width:calc(100vw - 16px);font-size:9px;padding:6px 8px}}';
    document.head.appendChild(style);
  }

  async function check(manual){
    showChecking(!!manual);
    try{
      const data=await fetchVersion();
      if(isNewer(data.version,CURRENT_VERSION))setAvailable(data);
      else setLatest();
    }catch(e){
      showRetry('V'+CURRENT_VERSION+' — não foi possível verificar agora. O jogo continua a funcionar.');
    }
  }

  async function getRegistration(){
    try{
      if(typeof appRegistration!=='undefined'&&appRegistration)return appRegistration;
    }catch(e){}
    if(navigator.serviceWorker&&navigator.serviceWorker.getRegistration){
      return navigator.serviceWorker.getRegistration('./');
    }
    return null;
  }

  function waitForActivation(reg,knownWorker,timeout){
    return new Promise(resolve=>{
      const started=knownWorker||reg.installing||reg.waiting;
      if(!started){resolve(!!reg.active);return}
      let done=false;
      const finish=ok=>{if(done)return;done=true;clearTimeout(timer);try{started.removeEventListener('statechange',onState)}catch(e){};resolve(ok)};
      const onState=()=>{
        if(started.state==='activated')finish(true);
        else if(started.state==='redundant')finish(false);
      };
      const timer=setTimeout(()=>finish(false),timeout);
      started.addEventListener('statechange',onState);
      onState();
    });
  }

  async function apply(){
    const text=getText(),btn=getButton();
    if(btn){btn.disabled=true;btn.textContent='⏳ A atualizar…'}
    if(text)text.textContent='A guardar e a preparar a atualização…';
    try{
      try{
        if(typeof saveGame==='function'&&typeof s!=='undefined'&&document.getElementById('game')&&!document.getElementById('game').classList.contains('hidden'))saveGame();
      }catch(e){}

      const reg=await withTimeout(getRegistration(),3000);
      if(!reg)throw new Error('no-registration');
      if(text)text.textContent='A instalar a nova versão…';

      const before=reg.active||null;
      let nativeResult;
      try{nativeResult=nativeUpdate(reg)}catch(e){nativeResult=null}
      try{await withTimeout(nativeResult,UPDATE_TIMEOUT)}catch(e){}

      if(reg.waiting){try{reg.waiting.postMessage({type:'SKIP_WAITING'})}catch(e){}}
      let worker=reg.installing||reg.waiting||null;
      if(worker){
        try{worker.postMessage({type:'SKIP_WAITING'})}catch(e){}
      }

      const activated=await waitForActivation(reg,worker,WORKER_TIMEOUT);
      const activeChanged=!!(reg.active&&reg.active!==before);
      const controller=navigator.serviceWorker&&navigator.serviceWorker.controller;
      if(!activated&&!activeChanged&&!controller)throw new Error('worker-timeout');

      if(text)text.textContent='Atualização concluída. A reabrir Valedouro…';
      window.__valedouroReloaded=true;
      setTimeout(()=>location.reload(),300);
    }catch(e){
      if(text)text.textContent='A atualização não conseguiu concluir agora. O jogo continua aberto e o teu save está seguro.';
      if(btn){btn.disabled=false;btn.style.display='block';btn.textContent='🔄 Tentar atualização';btn.onclick=()=>window.__valedouroV183.apply();}
    }
  }

  function init(){
    try{installStyle();hud();refreshGiftButtons();}catch(e){}

    /* At DOM ready, replace the old public updater before/while the page may use it. */
    window.__valedouroV183={version:CURRENT_VERSION,check,apply};
    window.checkForUpdates=check;
    window.applyUpdate=apply;

    try{
      const oldRender=window.render;
      if(typeof oldRender==='function'&&!oldRender.__v183Wrapped){
        const wrapped=function(){
          const r=oldRender.apply(this,arguments);
          requestAnimationFrame(()=>{refreshGiftButtons();hud()});
          return r;
        };
        wrapped.__v183Wrapped=true;
        window.render=wrapped;
      }
    }catch(e){}

    try{new MutationObserver(()=>{refreshGiftButtons();hud()}).observe(document.body,{childList:true,subtree:true});}catch(e){}
    setInterval(()=>{refreshGiftButtons();hud()},1000);

    /* Give the updater its own first check. The old call, if already running,
       is protected by the early prototype guard and cannot hang the UI. */
    check(false);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
