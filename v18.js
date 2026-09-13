/* =========================================================
   V18.1 — QOL + robust PWA updater
   ========================================================= */
(function(){
  'use strict';

  const CURRENT_VERSION='18.1.0';

  function inCoop(){
    return !!(typeof coopRoom!=='undefined' && coopRoom && Array.isArray(coopPlayers) && coopPlayers.some(p=>p && p.id && p.id!==coopPlayerId));
  }

  function refreshGiftButtons(root=document){
    const enabled=inCoop();
    root.querySelectorAll('button').forEach(btn=>{
      const text=(btn.textContent||'').trim().toLowerCase();
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
      el.innerHTML='<span id="v18-hud-mode">🎮 Solo</span><span id="v18-hud-zone">🗺️ Vale de Arven</span><span id="v18-hud-time">☀️ Dia 1</span>';
      document.body.appendChild(el);
    }
    const state=typeof s!=='undefined'?s:null;
    const players=typeof coopPlayers!=='undefined' && Array.isArray(coopPlayers)?coopPlayers.filter(p=>p&&p.id):[];
    const shared=typeof coopCfg!=='undefined' && !!(coopRoom && coopCfg && coopCfg.shared);
    const mode=coopRoom ? `🤝 Coop${shared?' • Partilhado':''} · ${Math.max(1,players.length)} jogador${players.length===1?'':'es'}` : '🎮 Solo';
    const zone=state?.zone||'Valedouro';
    const day=Number(state?.day)||1;
    const time=state?.time||'Dia';
    const m=document.getElementById('v18-hud-mode'),z=document.getElementById('v18-hud-zone'),t=document.getElementById('v18-hud-time');
    if(m)m.textContent=mode;
    if(z)z.textContent=`🗺️ ${zone}`;
    if(t)t.textContent=`${time==='Noite'?'🌙':'☀️'} Dia ${day}`;
    el.classList.toggle('v18-hud-coop',!!coopRoom);
  }

  function installStyle(){
    if(document.getElementById('v18-style'))return;
    const style=document.createElement('style');style.id='v18-style';
    style.textContent=`
      .v18-gift-hidden{display:none!important}
      #v18-hud{position:fixed;right:12px;bottom:12px;z-index:35;display:flex;gap:6px;align-items:center;max-width:min(92vw,620px);padding:7px 9px;border:1px solid #303c4d;border-radius:999px;background:rgba(15,21,29,.92);backdrop-filter:blur(12px);box-shadow:0 8px 28px #0006;color:#cbd5e1;font-size:10px;line-height:1;pointer-events:none;white-space:nowrap;overflow:hidden}
      #v18-hud span{overflow:hidden;text-overflow:ellipsis}
      #v18-hud span+span{border-left:1px solid #303c4d;padding-left:6px}
      @media(max-width:520px){#v18-hud{right:8px;bottom:8px;max-width:calc(100vw - 16px);font-size:9px;padding:6px 8px}.v18-hud-coop{border-color:#44556c}}
    `;
    document.head.appendChild(style);
  }

  function versionParts(v){return String(v||'0').replace(/^v/i,'').split('.').map(n=>parseInt(n,10)||0)}
  function isNewer(latest,current){
    const a=versionParts(latest),b=versionParts(current);
    for(let i=0;i<3;i++)if((a[i]||0)!==(b[i]||0))return (a[i]||0)>(b[i]||0);
    return false;
  }

  async function checkForUpdatesSafe(manual=false){
    const text=document.getElementById('updateText'),btn=document.getElementById('updateBtn');
    if(!text)return;
    if(btn)btn.disabled=true;
    text.textContent=manual?'A procurar a versão mais recente…':'A verificar versão…';
    try{
      const reg=typeof appRegistration!=='undefined'?appRegistration:null;
      if(reg)await reg.update();
      const res=await fetch('./version.json?t='+Date.now(),{cache:'no-store'});
      if(!res.ok)throw new Error('version');
      const data=await res.json();
      if(isNewer(data.version,CURRENT_VERSION)){
        text.innerHTML='<b>Nova versão disponível: V'+data.version+'</b><br>'+((data.changelog||[]).slice(0,4).map(x=>'• '+x).join('<br>')||'Atualização disponível.');
        if(btn){btn.style.display='block';btn.disabled=false;btn.textContent='⬆️ Atualizar agora';btn.onclick=applyUpdateSafe;}
      }else{
        text.textContent='V'+CURRENT_VERSION+' — estás na versão mais recente. Os teus saves ficam neste dispositivo.';
        if(btn){btn.style.display='block';btn.disabled=false;btn.textContent='🔄 Procurar atualização';btn.onclick=()=>checkForUpdatesSafe(true);}
      }
    }catch(e){
      text.textContent='V'+CURRENT_VERSION+' — não foi possível verificar agora. O jogo continua a funcionar.';
      if(btn){btn.style.display='block';btn.disabled=false;btn.textContent='🔄 Tentar novamente';btn.onclick=()=>checkForUpdatesSafe(true);}
    }
  }

  function waitForWorkerReady(reg,timeout=12000){
    return new Promise(resolve=>{
      if(!reg){resolve(false);return}
      const worker=reg.installing||reg.waiting;
      if(!worker){resolve(!!reg.active);return}
      let done=false;
      const finish=ok=>{if(done)return;done=true;clearTimeout(timer);worker.removeEventListener('statechange',onState);resolve(ok)};
      const onState=()=>{if(worker.state==='activated'||worker.state==='redundant')finish(worker.state==='activated')};
      const timer=setTimeout(()=>finish(false),timeout);
      worker.addEventListener('statechange',onState);
      onState();
    });
  }

  async function applyUpdateSafe(){
    const text=document.getElementById('updateText'),btn=document.getElementById('updateBtn');
    if(btn){btn.disabled=true;btn.textContent='⏳ A atualizar…';}
    if(text)text.textContent='A preparar a atualização…';
    try{
      if(typeof saveGame==='function' && typeof s!=='undefined' && document.getElementById('game') && !document.getElementById('game').classList.contains('hidden')){
        try{saveGame()}catch(e){}
      }
      try{updateFound=false}catch(e){}
      const reg=typeof appRegistration!=='undefined'?appRegistration:(navigator.serviceWorker&&await navigator.serviceWorker.getRegistration('./'));
      if(!reg)throw new Error('sw');
      if(text)text.textContent='A instalar a nova versão…';
      await reg.update();
      if(reg.waiting){
        try{reg.waiting.postMessage({type:'SKIP_WAITING'})}catch(e){}
      }
      const ready=await waitForWorkerReady(reg,12000);
      if(!ready && !reg.waiting)throw new Error('worker-timeout');
      if(text)text.textContent='Atualização concluída. A reabrir Valedouro…';
      setTimeout(()=>{
        try{window.__valedouroReloaded=true;location.reload()}catch(e){location.href=location.href}
      },350);
    }catch(e){
      if(text)text.textContent='A atualização não conseguiu concluir. O jogo continua aberto e o teu save está seguro.';
      if(btn){btn.disabled=false;btn.textContent='🔄 Tentar atualização';btn.onclick=applyUpdateSafe;}
    }
  }

  installStyle();
  hud();

  const oldRenderV18=window.render;
  if(typeof oldRenderV18==='function'){
    window.render=function(tab){
      const r=oldRenderV18.apply(this,arguments);
      requestAnimationFrame(()=>{refreshGiftButtons();hud()});
      return r;
    };
  }

  // Replace the older updater: it compared against V17 and reloaded after
  // a fixed 700 ms, which could race the Service Worker activation.
  window.checkForUpdates=checkForUpdatesSafe;
  window.applyUpdate=applyUpdateSafe;

  const observer=new MutationObserver(()=>{refreshGiftButtons();hud()});
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{refreshGiftButtons();hud()},1000);

  window.v18Qol={version:CURRENT_VERSION,inCoop,checkForUpdates:checkForUpdatesSafe,applyUpdate:applyUpdateSafe};
})();
