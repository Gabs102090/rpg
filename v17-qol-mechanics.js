/* V17.2 — 10 QoL improvements + 5 lightweight gameplay mechanics. */
(function(){
  'use strict';
  const COOLDOWN_MS=500;
  const lastClick=new WeakMap();
  const SYSTEM_KEY='v17Extra';
  const $=s=>document.querySelector(s);
  const state=()=>{try{return s}catch(_){return window.s;}};
  const sys=()=>{
    const p=state(); if(!p)return null;
    p[SYSTEM_KEY]=p[SYSTEM_KEY]||{};
    const x=p[SYSTEM_KEY];
    x.streaks=x.streaks||{explore:0,fish:0};
    x.daily=x.daily||{day:p.day||1,counts:{explore:0,mine:0,fish:0,craft:0},claimed:false};
    if(x.daily.day!==(p.day||1))x.daily={day:p.day||1,counts:{explore:0,mine:0,fish:0,craft:0},claimed:false};
    return x;
  };
  function event(msg,kind='good',meta='V17.2'){
    if(typeof window.setEvent==='function')window.setEvent(msg,kind,meta);
  }
  function safeRender(tab){
    if(typeof window.render==='function')window.render(tab||(typeof currentTab!=='undefined'?currentTab:undefined));
  }

  /* QoL 1: 500ms duplicate-click guard without disabling buttons or breaking menus. */
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');
    if(!b)return;
    const now=Date.now(),last=lastClick.get(b)||0;
    if(now-last<COOLDOWN_MS){e.preventDefault();e.stopImmediatePropagation();return;}
    lastClick.set(b,now);
  },true);

  /* QoL 2: silent autosave every 60 seconds. */
  setInterval(()=>{
    const p=state();
    if(!p||!$('#game')||$('#game').classList.contains('hidden'))return;
    try{
      const key='valedouro_save_v10';
      if(typeof window.sanitize==='function')window.sanitize(p);
      localStorage.setItem(key,JSON.stringify(p));
      const badge=$('#v172-save-status');
      if(badge)badge.textContent='💾 Auto-save: '+new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'});
    }catch(err){console.warn('[V17.2] Autosave falhou',err);}
  },60000);

  /* QoL 3: Ctrl/Cmd+S quick-save. */
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){
      e.preventDefault();if(typeof window.saveGame==='function')window.saveGame();
    }
  });

  /* QoL 4: number keys 1–5 switch the visible navigation tabs. */
  document.addEventListener('keydown',e=>{
    if(e.ctrlKey||e.metaKey||e.altKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
    if(!/^[1-5]$/.test(e.key))return;
    const nav=$$('.nav button');
    if(nav[Number(e.key)-1])nav[Number(e.key)-1].click();
  });
  function $$(s){return [...document.querySelectorAll(s)];}

  /* QoL 5: searchable inventory list. */
  function addInventorySearch(){
    if((typeof currentTab!=='undefined'?currentTab:'')!=='inventory')return;
    const content=$('#content');if(!content||$('#v172-inv-search'))return;
    const panel=document.createElement('section');panel.className='panel';panel.id='v172-inv-tools';
    panel.innerHTML='<h2>🔎 Pesquisa rápida</h2><input id="v172-inv-search" placeholder="Procurar item no inventário…" aria-label="Pesquisar inventário"><div class="muted" style="font-size:11px;margin-top:5px">Filtra os itens visíveis por nome.</div>';
    content.prepend(panel);
    $('#v172-inv-search').addEventListener('input',e=>{
      const q=e.target.value.trim().toLocaleLowerCase('pt-PT');
      $$('#content .item').forEach(row=>row.style.display=row.textContent.toLocaleLowerCase('pt-PT').includes(q)?'':'none');
    });
  }

  /* QoL 6: compact layout toggle, persisted locally. */
  function compactToggle(){
    const on=localStorage.getItem('v172-compact')==='1';
    document.body.classList.toggle('v172-compact',on);
  }
  const css=document.createElement('style');
  css.textContent='.v172-compact .panel{padding:9px;margin-bottom:7px}.v172-compact .item{padding:5px 0}.v172-compact button{min-height:40px;padding:8px 10px}#v172-tools{display:flex;gap:6px;flex-wrap:wrap;margin:6px 10px}#v172-tools button{min-height:38px;padding:6px 9px;font-size:11px}#v172-save-status{font-size:10px;color:var(--muted);align-self:center}.v172-fab{position:fixed;right:12px;bottom:14px;z-index:35;border-radius:999px;min-height:44px;box-shadow:0 5px 20px #0008}';
  document.head.appendChild(css);compactToggle();

  /* QoL 7: a compact-mode control. */
  function makeTools(){
    if(!$('.toprow')||$('#v172-tools'))return;
    const row=document.createElement('div');row.id='v172-tools';
    row.innerHTML='<button type="button" id="v172-compact-btn">↕️ Compacto</button><button type="button" id="v172-bounty-btn">🎯 Bónus diário</button><button type="button" id="v172-backup-btn">📋 Copiar save</button><span id="v172-save-status">💾 Auto-save ativo</span><span id="v172-session" class="muted" style="font-size:10px"></span>';
    const top=$('.top');if(top)top.appendChild(row);
    $('#v172-compact-btn').addEventListener('click',()=>{
      const on=!document.body.classList.contains('v172-compact');
      document.body.classList.toggle('v172-compact',on);localStorage.setItem('v172-compact',on?'1':'0');
      $('#v172-compact-btn').textContent=on?'↕️ Compacto: ON':'↕️ Compacto: OFF';
    });
    $('#v172-compact-btn').textContent=document.body.classList.contains('v172-compact')?'↕️ Compacto: ON':'↕️ Compacto: OFF';
    $('#v172-bounty-btn').addEventListener('click',showBounty);
    $('#v172-backup-btn').addEventListener('click',async()=>{
      try{
        const p=state();if(!p)throw Error('Sem save ativo');
        const text=JSON.stringify(p,null,2);
        await navigator.clipboard.writeText(text);
        event('📋 Backup do save copiado. Guarda-o num ficheiro de texto.','good','Backup');
      }catch(err){event('⚠️ Não foi possível copiar automaticamente. Usa Ctrl+S para guardar no jogo.','bad','Backup');}
    });
  }

  /* QoL 8: reduced-motion toggle via the device preference, plus no forced animations. */
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const st=document.createElement('style');st.textContent='*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}';document.head.appendChild(st);
  }

  /* QoL 9: floating scroll-to-top button. */
  function makeTopButton(){
    if($('#v172-top'))return;
    const b=document.createElement('button');b.id='v172-top';b.className='v172-fab';b.type='button';b.textContent='⬆️ Topo';b.title='Voltar ao topo';
    b.addEventListener('click',()=>window.scrollTo({top:0,behavior:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));
    document.body.appendChild(b);
  }

  /* QoL 10: show play session duration. */
  const sessionStart=Date.now();
  function sessionLabel(){
    const m=Math.floor((Date.now()-sessionStart)/60000);
    const el=$('#v172-session');if(el)el.textContent='⏱️ Sessão: '+(m<60?m+' min':Math.floor(m/60)+' h '+(m%60)+' min');
  }

  /* Gameplay mechanic 1: daily bounty, based on successful actions, one reward/day. */
  const bountyKinds=[['explore','🧭 Explorações',3],['mine','⛏️ Minerações',3],['fish','🎣 Pescarias',3],['craft','🔧 Fabricações',2]];
  function showBounty(){
    const x=sys();if(!x)return;
    const options=bountyKinds.map(a=>({key:a[0],label:a[1],goal:a[2]}));
    const chosen=options[(Number(x.daily.day)||1)%options.length];
    const count=x.daily.counts[chosen.key]||0;
    const done=count>=chosen.goal,claimed=!!x.daily.claimed;
    const html='<h2>🎯 Bónus diário</h2><p class="muted">Dia '+x.daily.day+' · Faz atividades para completar o desafio.</p><div class="tip"><b>'+chosen.label+': '+Math.min(count,chosen.goal)+'/'+chosen.goal+'</b><div class="bar"><div class="fill xp" style="width:'+Math.min(100,count/chosen.goal*100)+'%"></div></div><p>Recompensa: 35 ouro + 25 XP.</p></div><div class="actions" style="margin-top:10px"><button onclick="closeModal()">Fechar</button><button class="primary" id="v172-claim" '+(!done||claimed?'disabled':'')+'>'+(claimed?'✅ Reclamado':done?'🎁 Reclamar':'🔒 Continua a jogar')+'</button></div>';
    if(typeof window.openModal==='function')window.openModal(html);
    const btn=$('#v172-claim');if(btn)btn.addEventListener('click',()=>{
      const y=sys();if(!y||y.daily.claimed||(y.daily.counts[chosen.key]||0)<chosen.goal)return;
      y.daily.claimed=true;state().gold+=35;if(typeof window.gainXP==='function')window.gainXP(25);
      event('🎯 Bónus diário concluído: +35 ouro e +25 XP!','good','Recompensa');if(typeof window.closeModal==='function')window.closeModal();safeRender();
    });
  }

  function trackAction(key,success){
    if(!success)return;
    const x=sys();if(!x)return;
    x.daily.counts[key]=(x.daily.counts[key]||0)+1;
  }

  /* Gameplay mechanic 2: exploration streak gives a bonus resource every third success. */
  const oldExplore=window.eventExplore;
  if(typeof oldExplore==='function')window.eventExplore=function(){
    const p=state(),before=p?Number(p.stats.explore||0):0;
    const r=oldExplore.apply(this,arguments);
    if(p&&Number(p.stats.explore||0)>before){
      const x=sys();x.streaks.explore++;trackAction('explore',true);
      if(x.streaks.explore%3===0){const k=['wood','stone','herb','leather','mushroom'][Math.floor(Math.random()*5)];p.inv[k]=(p.inv[k]||0)+1;event('🧭 Série de exploração: encontraste +1 '+((typeof ITEM!=='undefined'?ITEM[k]?.n:undefined)||k)+'.','good','Descoberta');}
    }
    return r;
  };

  /* Gameplay mechanic 3: mining can uncover a rare extra gem. */
  const oldMine=window.mine;
  if(typeof oldMine==='function')window.mine=function(){
    const p=state(),before=p?Number(p.stats.mine||0):0;
    const r=oldMine.apply(this,arguments);
    if(p&&Number(p.stats.mine||0)>before){
      trackAction('mine',true);
      if(Math.random()<.12){p.inv.gems=(p.inv.gems||0)+1;event('💎 Veio raro! Encontraste uma gema extra.','good','Mineração');}
    }
    return r;
  };

  /* Gameplay mechanic 4: fishing streak gives one bonus fish every third catch. */
  const oldFish=window.fish;
  if(typeof oldFish==='function')window.fish=function(){
    const p=state(),before=p?Number(p.stats.fish||0):0;
    const r=oldFish.apply(this,arguments);
    if(p&&Number(p.stats.fish||0)>before){
      const x=sys();x.streaks.fish++;trackAction('fish',true);
      if(x.streaks.fish%3===0){p.inv.fish=(p.inv.fish||0)+1;event('🎣 Boa sequência! Apanhaste +1 peixe extra.','good','Pesca');}
    }
    return r;
  };

  /* Gameplay mechanic 5: crafting mastery grants a small material bonus every fifth craft. */
  const oldFinish=window.finishCraft;
  if(typeof oldFinish==='function')window.finishCraft=function(){
    const p=state(),before=p?Number(p.stats.crafted||0):0;
    const r=oldFinish.apply(this,arguments);
    if(p&&Number(p.stats.crafted||0)>before){
      const x=sys();trackAction('craft',true);
      if(Number(p.stats.crafted||0)%5===0){
        const k=['wood','stone','iron','herb'][Math.floor(Math.random()*4)];p.inv[k]=(p.inv[k]||0)+1;
        event('🔧 Maestria de ofício: +1 '+((typeof ITEM!=='undefined'?ITEM[k]?.n:undefined)||k)+'.','good','Crafting');
      }
    }
    return r;
  };

  /* Render enhancements without replacing core rendering. */
  const oldRender=window.render;
  if(typeof oldRender==='function')window.render=function(tab){
    const r=oldRender.apply(this,arguments);
    try{makeTools();makeTopButton();addInventorySearch();sessionLabel();}catch(err){console.warn('[V17.2] UI enhancement:',err);}
    return r;
  };
  function boot(){makeTools();makeTopButton();sessionLabel();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  setInterval(sessionLabel,30000);
  window.v172={showBounty};
})();