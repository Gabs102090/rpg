/* =========================================================
   V18 — QOL: contextual gifting + compact HUD
   ========================================================= */
(function(){
  'use strict';

  function inCoop(){
    return !!(window.coopRoom && Array.isArray(window.coopPlayers) && window.coopPlayers.some(p=>p && p.id && p.id!==window.coopPlayerId));
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
    const state=window.s;
    const players=Array.isArray(window.coopPlayers)?window.coopPlayers.filter(p=>p&&p.id):[];
    const shared=!!(window.coopRoom && window.coopCfg && window.coopCfg.shared);
    const mode=window.coopRoom ? `🤝 Coop${shared?' • Partilhado':''} · ${Math.max(1,players.length)} jogador${players.length===1?'':'es'}` : '🎮 Solo';
    const zone=state?.zone||'Valedouro';
    const day=Number(state?.day)||1;
    const time=state?.time||'Dia';
    const m=document.getElementById('v18-hud-mode'),z=document.getElementById('v18-hud-zone'),t=document.getElementById('v18-hud-time');
    if(m)m.textContent=mode;
    if(z)z.textContent=`🗺️ ${zone}`;
    if(t)t.textContent=`${time==='Noite'?'🌙':'☀️'} Dia ${day}`;
    el.classList.toggle('v18-hud-coop',!!window.coopRoom);
  }

  function installStyle(){
    if(document.getElementById('v18-style'))return;
    const s=document.createElement('style');s.id='v18-style';
    s.textContent=`
      .v18-gift-hidden{display:none!important}
      #v18-hud{position:fixed;right:12px;bottom:12px;z-index:35;display:flex;gap:6px;align-items:center;max-width:min(92vw,620px);padding:7px 9px;border:1px solid #303c4d;border-radius:999px;background:rgba(15,21,29,.92);backdrop-filter:blur(12px);box-shadow:0 8px 28px #0006;color:#cbd5e1;font-size:10px;line-height:1;pointer-events:none;white-space:nowrap;overflow:hidden}
      #v18-hud span{overflow:hidden;text-overflow:ellipsis}
      #v18-hud span+span{border-left:1px solid #303c4d;padding-left:6px}
      @media(max-width:520px){#v18-hud{right:8px;bottom:8px;max-width:calc(100vw - 16px);font-size:9px;padding:6px 8px}.v18-hud-coop{border-color:#44556c}}
    `;
    document.head.appendChild(s);
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

  const observer=new MutationObserver(()=>{refreshGiftButtons();hud()});
  observer.observe(document.body,{childList:true,subtree:true});
  setInterval(()=>{refreshGiftButtons();hud()},1000);

  window.v18Qol={version:'18.0.0',inCoop};
})();
