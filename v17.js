/* =========================================================
   V17 — expanded class system + meaningful class utilities
   ========================================================= */
(function(){
  const V17_CLASSES={
    paladin:{
      name:'Paladino',icon:'🛡️✨',
      desc:'Guardião sagrado. Resiste a dano e transforma defesa em sobrevivência.',
      mods:{def:20,hp:10,en:10,heal:15},weapons:'Espadas, maças e escudos.',
      passive:'Égide: Defender reduz mais dano e recupera 6 HP + 3 Energia.'
    },
    monk:{
      name:'Monge',icon:'🥋',
      desc:'Lutador ágil que cresce em força à medida que mantém o ritmo do combate.',
      mods:{agi:25,en:15,def:-10},weapons:'Adagas, bastões e armas leves.',
      passive:'Combo: ataques consecutivos no mesmo combate acumulam até +30% de dano.'
    },
    bard:{
      name:'Bardo',icon:'🎵',
      desc:'Apoia a aventura com sorte, energia e pequenos momentos de inspiração.',
      mods:{luck:20,en:10},skillBonus:{fortune:2},weapons:'Instrumentos, adagas e cajados.',
      passive:'Inspiração: ações de exploração têm 12% de chance de recuperar 5 Energia.'
    },
    engineer:{
      name:'Engenheiro',icon:'🔧',
      desc:'Especialista em mineração, ferramentas e produção eficiente.',
      mods:{gather:20,craft:15,en:-5},skillBonus:{gather:1,craft:1},weapons:'Ferramentas e armas técnicas.',
      passive:'Salvamento: mineração tem menos desabamentos e 20% de chance de extrair +1 minério.'
    },
    merchant:{
      name:'Mercador',icon:'💰',
      desc:'Transforma conhecimento do mercado em mais ouro e melhores compras.',
      mods:{luck:10,str:-10},skillBonus:{fortune:1,economy:2},weapons:'Adagas e armas leves.',
      passive:'Pechincha: compra por -10% e vende por +8% antes dos bónus de Economia.'
    },
    assassin:{
      name:'Assassino',icon:'🗡️',
      desc:'Especialista em golpes iniciais e fugas limpas.',
      mods:{agi:30,luck:15,hp:-10},weapons:'Adagas.',
      passive:'Emboscada: o primeiro ataque de cada combate causa dano crítico.'
    },
    elementalist:{
      name:'Elementalista',icon:'🌌',
      desc:'Canaliza energia arcana para tornar o Especial mais barato e perigoso.',
      mods:{en:35,hp:-10,luck:5},weapons:'Cajados e orbes.',
      passive:'Sobrecarga: o Especial custa 10 Energia e deixa o inimigo vulnerável ao próximo golpe.'
    },
    explorer:{
      name:'Explorador',icon:'🧭',
      desc:'Vive para descobrir caminhos, tesouros e recursos escondidos.',
      mods:{agi:20,gather:15,luck:10,en:10},skillBonus:{gather:1},weapons:'Arcos, facas e armas leves.',
      passive:'Cartografia: viajar custa 25% menos Energia e explorar tem 15% de chance de dar +1 recurso.'
    }
  };
  Object.assign(CLASS_INFO,V17_CLASSES);

  function classSkillBonus(classId,key){
    const b=CLASS_INFO[classId]?.skillBonus;
    return Math.max(0,Number(b?.[key]||0));
  }
  const oldSkillLevelV17=skillLevel;
  skillLevel=function(k){
    const base=oldSkillLevelV17(k);
    return base+classSkillBonus(s.classId||'neutral',k);
  };
  window.classSkillBonusV17=classSkillBonus;

  function classPassiveText(id){
    return CLASS_INFO[id]?.passive||'Sem talento especial.';
  }
  window.classPassiveTextV17=classPassiveText;

  /* Class chooser now shows the actual talent, not just raw stats. */
  const oldChooseClassV17=chooseClass;
  chooseClass=function(key){
    if(!CLASS_INFO[key])return;
    selectedClass=key;
    document.querySelectorAll('.class-card').forEach(b=>b.classList.toggle('selected',b.dataset.cls===key));
    const c=CLASS_INFO[key],d=document.getElementById('classDesc');
    if(d)d.innerHTML=`<b>${c.icon} ${c.name}</b><br>${c.desc}<br><small>Armas: ${c.weapons}</small><br><span class="class-passive">✨ ${c.passive||'Sem talento especial.'}</span>`;
  };

  const oldShowClassChooserV17=showClassChooser;
  showClassChooser=function(){
    const cards=Object.entries(CLASS_INFO).map(([k,c])=>
      `<button type="button" class="card class-card ${k===selectedClass?'selected':''}" data-cls="${k}" onclick="chooseClass('${k}')">
        <h3>${c.icon} ${c.name}</h3>
        <p>${c.desc}</p>
        <small class="class-passive-mini">✨ ${c.passive||'Sem talento especial.'}</small>
      </button>`).join('');
    openModal(`<h2>🧙 Escolhe a tua classe</h2>
      <p class="muted">Agora cada classe tem identidade própria: atributos + uma utilidade exclusiva.</p>
      <div class="class-grid">${cards}</div>
      <div id="classDesc" class="tip" style="margin-top:10px"></div>
      <div class="actions" style="margin-top:10px"><button onclick="closeModal()">Voltar</button><button class="primary" onclick="confirmClassAndStart()">Começar aventura</button></div>`);
    chooseClass(selectedClass);
  };

  /* Character sheet: explain why the class matters. */
  const oldClassAttributeHTMLV17=classAttributeHTML;
  classAttributeHTML=function(){
    const base=oldClassAttributeHTMLV17();
    return base+`<div class="attr"><b>Talento</b><span>✨ ${classPassiveText(s.classId||'neutral')}</span></div>`;
  };

  /* Paladino: stronger Guard + recovery. */
  const oldGuardV17=guard;
  guard=function(){
    const before=s.hp, beforeEnergy=s.energy;
    oldGuardV17();
    if((s.classId||'neutral')==='paladin' && combatState){
      const hp=Math.min(s.maxHp,s.hp+6);
      const en=Math.min(s.maxEnergy,s.energy+3);
      s.hp=hp;s.energy=en;
      setEvent(`🛡️ Égide: +${s.hp-before>0?s.hp-before:6} HP e +${s.energy-beforeEnergy>0?s.energy-beforeEnergy:3} Energia.`,'good','Paladino');
      renderCombat();
    }
  };

  /* Paladino also improves the damage mitigation during enemy turn. */
  const oldEnemyTurnV17=enemyTurn;
  enemyTurn=function(){
    const c=combatState;
    if(c && (s.classId||'neutral')==='paladin' && c.guard){
      const had=c.guard;
      oldEnemyTurnV17();
      /* The original V15 mitigation is 35%; the Paladino receives an additional reduction. */
      if(had && combatState && s.hp>0){
        /* Keep the extra benefit deterministic and small: restore 2 HP after surviving the hit. */
        s.hp=Math.min(s.maxHp,s.hp+2);
      }
    }else oldEnemyTurnV17();
  };

  /* Berserker: danger becomes damage. */
  /* Combat passives: Berserker, Monge and Assassino. */
  const baseAttackEnemyV17=attackEnemy;
  const basePowerStrikeV17=powerStrike;
  const baseGuardV17=guard;
  const baseCombatPotionV17=combatPotion;
  const baseFleeV17=flee;
  const baseCombatV17=combat;

  combat=function(){
    const r=baseCombatV17();
    if(combatState){
      combatState.monkCombo=0;
      combatState.v17AssassinFirst=true;
      combatState.v17Vulnerable=0;
    }
    return r;
  };

  guard=function(){
    const r=baseGuardV17();
    if((s.classId||'neutral')==='monk' && combatState)combatState.monkCombo=0;
    return r;
  };

  combatPotion=function(){
    const r=baseCombatPotionV17();
    if((s.classId||'neutral')==='monk' && combatState)combatState.monkCombo=0;
    return r;
  };

  flee=function(){
    const r=baseFleeV17();
    if((s.classId||'neutral')==='monk' && combatState)combatState.monkCombo=0;
    return r;
  };

  attackEnemy=function(){
    const c=combatState;
    if(!c)return baseAttackEnemyV17();

    const cls=s.classId||'neutral';
    let mult=1;

    if(cls==='monk'){
      c.monkCombo=Math.min(3,Number(c.monkCombo||0)+1);
      mult*=1+Math.max(0,(c.monkCombo-1)*0.15);
    }
    if(cls==='berserker' && s.hp<=s.maxHp*.40){
      mult*=1.25;
    }
    if(cls==='assassin' && c.v17AssassinFirst!==false && c.ehp===c.maxEhp){
      mult*=1.50;
      c.v17AssassinFirst=false;
    }

    if(mult!==1){
      const mods=CLASS_INFO[cls]?.mods||{};
      const originalStr=Number(mods.str||0);
      mods.str=originalStr+(mult-1)*100;
      try{return baseAttackEnemyV17()}
      finally{mods.str=originalStr}
    }

    return baseAttackEnemyV17();
  };

  /* Elementalist gets a cheaper, stronger Special and marks the enemy vulnerable. */
  powerStrike=function(){
    const isElem=(s.classId||'neutral')==='elementalist';
    if(isElem && combatState){
      if(s.energy<10||combatState.cooldown>0)return;
      s.energy-=10;
      combatState.cooldown=2;
      const dmg=Math.floor((24+skillLevel('combat')*3+s.equip.enchant*3)*(hasEffect('fury')?1.3:1));
      combatState.ehp-=dmg;
      combatState.v17Vulnerable=1;
      if(combatState.ehp<=0){endCombatWin(combatState,(combatState.boss?105:18)+rand(0,20));return}
      enemyTurn();
      if(combatState)renderCombat();
      return;
    }
    return basePowerStrikeV17();
  };

  /* A vulnerable target deals 2 less damage for the next enemy turn. */
  const baseEnemyTurnV17=enemyTurn;
  enemyTurn=function(){
    const c=combatState;
    if(c && c.v17Vulnerable>0){
      c.v17Vulnerable=0;
      const oldBase=c.enemyDmgBase;
      c.enemyDmgBase=Math.max(1,oldBase-2);
      try{return baseEnemyTurnV17()}
      finally{if(combatState)combatState.enemyDmgBase=oldBase}
    }
    return baseEnemyTurnV17();
  };

  /* Bardo: exploration can restore energy without adding another button. */
  const oldExploreV17=eventExplore;
  eventExplore=function(){
    const before=s.energy;
    const r=oldExploreV17();
    if((s.classId||'neutral')==='bard' && Math.random()<0.12){
      const gain=Math.min(5,s.maxEnergy-s.energy);
      if(gain>0){s.energy+=gain;setEvent(`🎵 Inspiração: +${gain} Energia.`,'good','Bardo');render();}
    }
    return r;
  };

  /* Engineer: better mining utility and cheaper crafting time. */
  const oldMineV17=mine;
  mine=function(){
    const isEng=(s.classId||'neutral')==='engineer';
    const hpBefore=s.hp, oreBefore=s.inv.ore||0;
    const r=oldMineV17();
    if(isEng && (s.inv.ore||0)>oreBefore){
      let extra=0;
      if(Math.random()<0.20){s.inv.ore++;extra=1}
      if(extra)setEvent('🔧 Salvamento: +1 minério extra.','good','Engenheiro');
      if(s.hp<hpBefore && Math.random()<0.65){
        const heal=Math.min(hpBefore-s.hp,3);
        s.hp+=heal;
      }
    }
    return r;
  };
  const oldCraftV17=craft;
  craft=function(k){
    if((s.classId||'neutral')==='engineer' && recipes[k]){
      const r=recipes[k], oldTime=r.time;
      try{r.time=Math.max(10,Math.floor(oldTime*.90));return oldCraftV17(k)}
      finally{r.time=oldTime}
    }
    return oldCraftV17(k);
  };

  /* Merchant: prices matter for every sale/purchase, on top of Economy. */
  const oldBuyV17=buy;
  buy=function(k,p){
    if((s.classId||'neutral')==='merchant')p=Math.max(1,Math.floor(p*.90));
    return oldBuyV17(k,p);
  };
  const oldBulkSellV17=bulkSell;
  bulkSell=function(k,q,p){
    if((s.classId||'neutral')==='merchant')p=Math.max(1,Math.floor(p*1.08));
    return oldBulkSellV17(k,q,p);
  };

  /* Assassin: much better escape chance; first strike is handled above. */
  const oldFleeV17=flee;
  flee=function(){
    if((s.classId||'neutral')==='assassin' && combatState && !hasEffect('smokeEscape')){
      if(Math.random()<0.90){
        setEvent('🗡️ Escapaste com precisão de assassino.','good','Assassino');
        closeModal();render();return;
      }
    }
    return oldFleeV17();
  };

  /* Explorer: cheaper travel + occasional bonus resource on exploration. */
  const oldTravelV17=travel;
  travel=function(i){
    if((s.classId||'neutral')==='explorer' && zones[i] && zones[i].name!==s.zone){
      const oldSpendEnergy=spendEnergy;
      let used=false;
      spendEnergy=function(n){used=true;return oldSpendEnergy(Math.max(1,Math.floor(n*.75)))};
      try{return oldTravelV17(i)}finally{spendEnergy=oldSpendEnergy}
    }
    return oldTravelV17(i);
  };
  const oldExploreV17B=eventExplore;
  eventExplore=function(){
    const isExp=(s.classId||'neutral')==='explorer';
    const before={wood:s.inv.wood||0,stone:s.inv.stone||0,herb:s.inv.herb||0,leather:s.inv.leather||0,mushroom:s.inv.mushroom||0};
    const r=oldExploreV17B();
    if(isExp && Math.random()<0.15){
      const keys=Object.keys(before).filter(k=>ITEM[k]);
      const k=keys[rand(0,keys.length-1)];s.inv[k]=(s.inv[k]||0)+1;
      setEvent(`🧭 Cartografia: +1 ${ITEM[k].n}.`,'good','Explorador');render();
    }
    return r;
  };

  /* Existing classes gain small identity passives too. */
  const oldCombatPotionV17= combatPotion;
  combatPotion=function(){
    const healClass=(s.classId||'neutral')==='cleric';
    const before=s.hp;
    const r=oldCombatPotionV17();
    if(healClass && s.hp>before && !combatState){
      /* no-op after combat ended */
    }
    return r;
  };
  const oldUseItemV17=useItem;
  useItem=function(k){
    const before=s.hp, beforeEn=s.energy;
    const r=oldUseItemV17(k);
    if((s.classId||'neutral')==='cleric' && before!==s.hp){
      const extra=Math.min(10,s.maxHp-s.hp);
      if(extra>0){s.hp+=extra;setEvent(`✨ Bênção: +${extra} HP adicional.`,'good','Clérigo');render('inventory');}
    }
    return r;
  };

  /* Alchemist: consumable crafting can finish with +1 extra output. */
  const oldFinishCraftV17=finishCraft;
  finishCraft=function(){
    const k=s.activeCraft?.key, before={};
    if(k&&recipes[k]?.out)for(const a of Object.keys(recipes[k].out))before[a]=s.inv[a]||0;
    const r=oldFinishCraftV17();
    if((s.classId||'neutral')==='alchemist' && k && recipes[k]?.out){
      const consumable=Object.keys(recipes[k].out).some(a=>ITEM[a]?.cat==='consumable'||ITEM[a]?.cat==='food');
      if(consumable && Math.random()<0.35){
        const a=Object.keys(recipes[k].out)[0];
        s.inv[a]=(s.inv[a]||0)+1;
        setEvent(`⚗️ Reagente extra: +1 ${ITEM[a]?.n||a}.`,'good','Alquimista');
      }
    }
    return r;
  };

  /* Berserker visual cue in combat HUD. */
  const oldRenderCombatV17=renderCombat;
  renderCombat=function(){
    if(combatState){
      combatState.v17ClassNote = classPassiveText(s.classId||'neutral');
    }
    return oldRenderCombatV17();
  };

  /* Make class passives visible in the inventory sheet. */
  const previousRenderV17=render;
  render=function(tab=currentTab){
    previousRenderV17(tab);
    if(tab==='inventory'){
      const content=document.getElementById('content'); if(!content)return;
      const marker='v17-class-passive';
      if(content.querySelector('.'+marker))return;
      const panel=document.createElement('section');
      panel.className='panel '+marker;
      panel.innerHTML=`<h2>✨ Talento de classe</h2><div class="tip"><b>${CLASS_INFO[s.classId||'neutral'].icon} ${CLASS_INFO[s.classId||'neutral'].name}</b><br>${classPassiveText(s.classId||'neutral')}</div>`;
      content.appendChild(panel);
    }
  };

  /* Save-friendly normalization for old/new files. */
  const oldSanitizeV17=sanitize;
  sanitize=function(x){
    const z=oldSanitizeV17(x);
    z.classId=CLASS_INFO[z.classId]?z.classId:'neutral';
    return z;
  };

  window.v17Classes=V17_CLASSES;
})();


/* V17 PWA version display/update bridge. */
(function(){
  const V17='17.0.0';
  function refreshVersionLabel(){
    const t=document.getElementById('updateText');
    if(t && !t.dataset.v17Label){
      t.dataset.v17Label='1';
      t.textContent='V'+V17+' — estás na versão mais recente. Os teus saves ficam neste dispositivo.';
    }
  }
  window.checkForUpdates=async function(manual=false){
    const text=document.getElementById('updateText'),btn=document.getElementById('updateBtn');
    if(!text)return;
    text.textContent=manual?'A procurar a versão mais recente…':'V'+V17+' — a verificar…';
    try{
      const res=await fetch('./version.json?t='+Date.now(),{cache:'no-store'});
      const data=await res.json();
      const latest=String(data.version||V17);
      if(latest!==V17){
        text.innerHTML='<b>Nova versão disponível: V'+latest+'</b><br>'+((data.changelog||[]).slice(0,4).map(x=>'• '+x).join('<br>')||'Atualização disponível.');
        if(btn){btn.style.display='block';btn.textContent='⬆️ Atualizar agora';btn.onclick=()=>location.reload();}
      }else{
        refreshVersionLabel();
        if(btn){btn.style.display='block';btn.textContent='🔄 Procurar atualização';btn.onclick=()=>checkForUpdates(true);}
      }
    }catch(e){
      text.textContent='V'+V17+' — não foi possível verificar agora. O jogo continua a funcionar.';
      if(btn){btn.style.display='block';btn.textContent='🔄 Tentar novamente';btn.onclick=()=>checkForUpdates(true);}
    }
  };
  refreshVersionLabel();
})();
