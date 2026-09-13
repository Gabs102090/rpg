/* V18.4 — silent automatic updater + QOL */
(function(){
  'use strict';
  const FLAG='__valedouro_v184';
  if(window[FLAG]) return;
  window[FLAG]=true;
  const WAIT=12000;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));

  function saveSafely(){
    try{
      if(typeof saveGame==='function'&&typeof s!=='undefined'&&document.getElementById('game')&&!document.getElementById('game').classList.contains('hidden')) saveGame();
    }catch(e){}
  }

  function hideUpdater(){
    try{
      const p=document.getElementById('updatePanel');
      if(p) p.remove();
      const b=document.getElementById('updateBtn');
      if(b) b.remove();
    }catch(e){}
  }

  function refreshGiftButtons(){
    let enabled=false;
    try{enabled=!!(typeof coopRoom!=='undefined'&&coopRoom&&Array.isArray(coopPlayers)&&coopPlayers.some(p=>p&&p.id&&p.id!==coopPlayerId));}catch(e){}
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
      el=document.createElement('div'); el.id='v18-hud';
      el.innerHTML='<span id="v18-hud-mode">🎮 Solo</span><span id="v18-hud-zone">🗺️ Valedouro</span><span id="v18-hud-time">☀️ Dia 1</span>';
      document.body.appendChild(el);
    }
    let state=null,room=false,shared=false,players=[];
    try{state=typeof s!=='undefined'?s:null}catch(e){}
    try{room=typeof coopRoom!=='undefined'&&!!coopRoom}catch(e){}
    try{shared=typeof coopCfg!=='undefined'&&!!(coopRoom&&coopCfg&&coopCfg.shared)}catch(e){}
    try{players=Array.isArray(coopPlayers)?coopPlayers.filter(p=>p&&p.id):[]}catch(e){}
    const mode=room?'🤝 Coop'+(shared?' • Partilhado':'')+' · '+Math.max(1,players.length)+' jogador'+(players.length===1?'':'es'):'🎮 Solo';
    const zone=state&&state.zone||'Valedouro', day=Number(state&&state.day)||1, time=state&&state.time||'Dia';
    const m=document.getElementById('v18-hud-mode'),z=document.getElementById('v18-hud-zone'),t=document.getElementById('v18-hud-time');
    if(m)m.textContent=mode; if(z)z.textContent='🗺️ '+zone; if(t)t.textContent=(time==='Noite'?'🌙':'☀️')+' Dia '+day;
  }

  function style(){
    if(document.getElementById('v184-style'))return;
    const s=document.createElement('style'); s.id='v184-style';
    s.textContent='#updatePanel,#updateBtn{display:none!important}.v18-gift-hidden{display:none!important}#v18-hud{position:fixed;right:12px;bottom:12px;z-index:35;display:flex;gap:6px;align-items:center;max-width:min(92vw,620px);padding:7px 9px;border:1px solid #303c4d;border-radius:999px;background:rgba(15,21,29,.92);backdrop-filter:blur(12px);box-shadow:0 8px 28px #0006;color:#cbd5e1;font-size:10px;line-height:1;pointer-events:none;white-space:nowrap;overflow:hidden}#v18-hud span{overflow:hidden;text-overflow:ellipsis}#v18-hud span+span{border-left:1px solid #303c4d;padding-left:6px}@media(max-width:520px){#v18-hud{right:8px;bottom:8px;max-width:calc(100vw - 16px);font-size:9px;padding:6px 8px}}';
    document.head.appendChild(s);
  }

  async function autoUpdate(){
    if(!navigator.serviceWorker||!navigator.serviceWorker.getRegistration)return;
    try{
      const reg=await navigator.serviceWorker.getRegistration('./');
      if(!reg)return;
      let found=false;
      const mark=()=>{found=true};
      try{reg.addEventListener('updatefound',mark)}catch(e){}
      const before=reg.active;
      await Promise.race([Promise.resolve(reg.update()),sleep(5000)]);
      let worker=reg.installing||reg.waiting;
      for(let i=0;i<20&&!worker;i++){await sleep(250);worker=reg.installing||reg.waiting}
      if(worker||found){
        saveSafely();
        try{if(reg.waiting)reg.waiting.postMessage({type:'SKIP_WAITING'})}catch(e){}
        if(worker){try{worker.postMessage({type:'SKIP_WAITING'})}catch(e){}}
        const controllerChanged=new Promise(resolve=>{
          let done=false; const finish=()=>{if(!done){done=true;resolve(true)}};
          const timer=setTimeout(()=>finish(),WAIT);
          navigator.serviceWorker.addEventListener('controllerchange',()=>{clearTimeout(timer);finish()},{once:true});
        });
        await Promise.race([controllerChanged,sleep(WAIT)]);
        if(navigator.serviceWorker.controller&&navigator.serviceWorker.controller!==before){
          try{sessionStorage.setItem('valedouro_auto_updated','1')}catch(e){}
          location.reload();
        }else if(worker&&worker.state==='activated'){
          location.reload();
        }
      }
    }catch(e){}
  }

  function init(){
    style(); hideUpdater(); refreshGiftButtons(); hud();
    try{
      const oldRender=window.render;
      if(typeof oldRender==='function'&&!oldRender.__v184Wrapped){
        const wrapped=function(){const r=oldRender.apply(this,arguments);requestAnimationFrame(()=>{hideUpdater();refreshGiftButtons();hud()});return r};
        wrapped.__v184Wrapped=true; window.render=wrapped;
      }
    }catch(e){}
    try{new MutationObserver(()=>{hideUpdater();refreshGiftButtons();hud()}).observe(document.body,{childList:true,subtree:true})}catch(e){}
    setInterval(()=>{hideUpdater();refreshGiftButtons();hud()},1000);
    setTimeout(autoUpdate,700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
