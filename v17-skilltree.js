/* V17 — Gigantic Skill Tree: 9 branches × 12 tiers = 108 nodes. */
(function(){
  'use strict';
  const STYLE=`<style id="v17-skilltree-style">
  .v17-tree-wrap{max-height:76vh;overflow:auto;padding:4px 2px 12px}
  .v17-tree-head{position:sticky;top:0;z-index:3;background:var(--panel);padding-bottom:10px}
  .v17-tree-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:8px 0}
  .v17-tree-stat{background:#11161f;border:1px solid var(--line);border-radius:12px;padding:8px;text-align:center;font-size:11px}
  .v17-tree-stat b{display:block;font-size:16px}
  .v17-tree-scroll{overflow-x:auto;overflow-y:visible;padding-bottom:8px}
  .v17-tree-grid{display:grid;grid-template-columns:repeat(9,190px);gap:10px;min-width:1790px;align-items:start}
  .v17-branch{background:#10161f;border:1px solid var(--line);border-radius:16px;padding:8px}
  .v17-branch-title{font-weight:900;text-align:center;margin:2px 0 8px;font-size:13px}
  .v17-node{position:relative;width:100%;min-height:105px;padding:9px!important;text-align:left!important;background:#18212d!important;border:1px solid #344457!important;border-radius:13px!important;margin:0 0 8px;white-space:normal!important}
  .v17-node::after{content:'↓';position:absolute;left:50%;bottom:-13px;transform:translateX(-50%);color:#63758a;font-size:12px}
  .v17-node:last-child::after{display:none}
  .v17-node.unlocked{border-color:#57718e!important}
  .v17-node.available{border-color:var(--gold)!important;box-shadow:0 0 0 1px #f5c85b33 inset}
  .v17-node.bought{border-color:#4d9b72!important;background:#14231d!important}
  .v17-node.locked{opacity:.45}
  .v17-node b{display:block;font-size:12px;line-height:1.15;margin-bottom:4px}
  .v17-node small{display:block;color:var(--muted);font-size:10px;line-height:1.28}
  .v17-node .v17-cost{display:inline-block;margin-top:6px;font-size:10px;color:#dfe8f1;border:1px solid var(--line);border-radius:99px;padding:2px 6px}
  .v17-tree-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
  @media(max-width:720px){.v17-tree-grid{grid-template-columns:repeat(9,175px);min-width:1655px}.v17-node{min-height:110px}}
  </style>`;

  const BRANCHES=[
    {id:'combat',icon:'⚔️',name:'Combate',desc:'Aperfeiçoa dano, ritmo de ataque e domínio marcial.',skill:'combat',items:[
      ['Fundamentos de Aço','Treino básico que fortalece o combate.'],['Golpe Preciso','Mais domínio sobre ataques normais.'],['Ritmo de Guerra','A experiência de combate rende mais poder.'],['Quebra-Guarda','Aprende a explorar aberturas defensivas.'],['Mão Pesada','Impactos mais consistentes.'],['Duelista','Perfecciona o combate individual.'],['Contra-Ataque','Transforma técnica em pressão ofensiva.'],['Mestre das Lâminas','Domínio avançado de armas.'],['Instinto de Batalha','Mantém eficácia em lutas longas.'],['Carnificina Controlada','Veterania converte-se em força.'],['Campeão de Valedouro','Técnica de elite.'],['Avatar Marcial','O auge do caminho guerreiro.']]},
    {id:'defense',icon:'🛡️',name:'Defesa',desc:'Vida, resistência e capacidade de sobreviver.',stat:'hp',items:[
      ['Pele de Carvalho','Resistência física básica.'],['Fôlego','Aprende a suportar jornadas duras.'],['Postura Firme','Menos vulnerabilidade a erros.'],['Armadura Natural','O corpo aguenta mais.'],['Escudo Interior','Resiliência acumulada.'],['Fortaleza','Grande salto de sobrevivência.'],['Muralha','Defesa digna de um guardião.'],['Titã','Resistência extraordinária.'],['Bastião','Sobrevive onde outros cairiam.'],['Último Reduto','Uma reserva profunda de vigor.'],['Guardião Eterno','Resistência de lenda.'],['Colosso','O máximo de vitalidade defensiva.']]},
    {id:'arcane',icon:'🌌',name:'Arcano',desc:'Energia, conhecimento e poder místico.',stat:'en',items:[
      ['Faísca Arcana','Abre o primeiro canal de energia.'],['Pulso Etéreo','Aumenta a reserva de energia.'],['Concentração','Canalização mais eficiente.'],['Núcleo Mágico','Expande o potencial arcano.'],['Fluxo Astral','Energia corre sem desperdício.'],['Runa Viva','Conhecimento transforma-se em poder.'],['Mente Prismática','Domínio superior da energia.'],['Constelação','Reserva arcana de elite.'],['Céu Interior','O praticante toca forças profundas.'],['Singularidade','Concentração quase absoluta.'],['Arquimago','Perícia arcana lendária.'],['Coroa Celeste','O ápice do caminho místico.']]},
    {id:'explore',icon:'🧭',name:'Exploração',desc:'Recursos, descoberta e eficiência fora de combate.',skill:'gather',items:[
      ['Olho de Explorador','Repara em recursos escondidos.'],['Passo Leve','Explora com maior eficiência.'],['Rastreador','Lê sinais do ambiente.'],['Catador Experiente','Extrai mais valor das zonas.'],['Mapa Mental','Conhece os caminhos de Valedouro.'],['Sobrevivente','Adapta-se a ambientes hostis.'],['Prospector','Procura veios e materiais raros.'],['Batedor','Descobre oportunidades antes dos outros.'],['Cartógrafo','Transforma experiência em conhecimento.'],['Mestre da Expedição','Viagens longas tornam-se rotina.'],['Lenda das Fronteiras','Poucos segredos ficam por encontrar.'],['Coração do Explorador','Domínio absoluto da exploração.']]},
    {id:'economy',icon:'💰',name:'Economia',desc:'Comércio, sorte e crescimento financeiro.',skill:'economy',items:[
      ['Troco Certeiro','Aprende os fundamentos do negócio.'],['Preço Justo','Negocia com mais segurança.'],['Olho para Ouro','Reconhece boas oportunidades.'],['Pequeno Investidor','Faz cada transação render.'],['Negociador','Puxa o mercado a seu favor.'],['Mercador Nato','Experiência comercial acumulada.'],['Mestre da Feira','Transforma oportunidades em lucro.'],['Magnata Local','A economia de Valedouro responde melhor.'],['Barão do Mercado','Conhecimento financeiro avançado.'],['Rei das Barganhas','Negociações excepcionais.'],['Fortuna de Família','Riqueza torna-se uma ferramenta.'],['Lenda Mercantil','O auge do domínio económico.']]},
    {id:'craft',icon:'🔧',name:'Ofício',desc:'Crafting, ferramentas e produção.',skill:'craft',items:[
      ['Aprendiz de Oficina','Primeiros passos na produção.'],['Mão Segura','Trabalho mais consistente.'],['Ferramenta Certa','Escolhe melhor os instrumentos.'],['Forja Rápida','Produção mais fluida.'],['Artesão','Materiais são usados com precisão.'],['Engenho','Resolve receitas complicadas.'],['Mestre Artesão','Qualidade de produção elevada.'],['Oficina Perfeita','Trabalha com eficiência.'],['Arquiteto de Itens','Planeia produção em escala.'],['Inventor','Transforma técnica em inovação.'],['Grande Artífice','Produção de nível lendário.'],['Mestre de Valedouro','O ápice da arte de criar.']]},
    {id:'survival',icon:'🌿',name:'Sobrevivência',desc:'Agricultura, adaptação e gestão de recursos.',skill:'agri',items:[
      ['Sementeira','Compreende o ciclo da natureza.'],['Mão Verde','Cuida melhor das culturas.'],['Solo Vivo','Aproveita melhor a terra.'],['Colheita Farta','Experiência agrícola acumulada.'],['Guarda de Provisões','Aprende a durar mais tempo.'],['Caçador de Estações','Adapta-se ao clima.'],['Agricultor Experiente','Produção agrícola avançada.'],['Jardim Perene','Domínio das culturas.'],['Sobrevivente Nato','Recursos duram mais.'],['Celeiro Cheio','Converte trabalho em estabilidade.'],['Guardião da Terra','Conhecimento agrícola raro.'],['Coração Verde','O auge do caminho natural.']]},
    {id:'fortune',icon:'🍀',name:'Destino',desc:'Fortuna, oportunidades e pequenas vantagens.',skill:'fortune',items:[
      ['Pressentimento','Sente quando algo pode correr bem.'],['Boa Estrela','A sorte começa a sorrir.'],['Timing','Escolhe melhores momentos.'],['Mão da Fortuna','O acaso tende a favorecer-te.'],['Oportunista','Aproveita pequenas brechas.'],['Estrela Ascendente','Sequências positivas aparecem mais.'],['Sortudo','A sorte já é uma característica.'],['Favor do Destino','Eventos benéficos têm mais impacto.'],['Aposta Segura','Arrisca com confiança.'],['Roda da Fortuna','Grandes oportunidades tornam-se possíveis.'],['Filho das Estrelas','A sorte parece impossível de ignorar.'],['Destino Soberano','O auge da afinidade com o acaso.']]},
    {id:'mastery',icon:'✨',name:'Maestria',desc:'Bónus gerais e evolução de longo prazo.',special:true,items:[
      ['Disciplina','Cria uma base sólida para todas as áreas.'],['Aprendiz Eterno','Aprender nunca deixa de compensar.'],['Versatilidade','Transita entre estilos com facilidade.'],['Foco','Mantém eficiência sob pressão.'],['Adaptação','Converte experiência em consistência.'],['Especialização','Faz cada ponto investido valer mais.'],['Perfeccionismo','Procura sempre a próxima melhoria.'],['Mentor','O conhecimento acumulado torna-se força.'],['Mestre Multiclasse','Todas as disciplinas beneficiam.'],['Lenda Viva','Experiência extraordinária.'],['Ascensão','O aventureiro ultrapassa limites comuns.'],['Transcendência','A grande culminação da árvore.']]}
  ];

  function init(){
    if(!window.s)return;
    if(!s.v17Tree)s.v17Tree={nodes:{}};
    if(!s.v17Tree.nodes||typeof s.v17Tree.nodes!=='object')s.v17Tree.nodes={};
    if(!document.getElementById('v17-skilltree-style'))document.head.insertAdjacentHTML('beforeend',STYLE);
    addLauncher();
  }

  function totalSpent(){return BRANCHES.reduce((n,b)=>n+b.items.reduce((m,_,i)=>m+(s.v17Tree.nodes[b.id+'_'+i]?.cost||0),0),0)}
  function pointsTotal(){return Math.max(5,((Number(s.level)||1)-1)*2+5)}
  function freePoints(){return Math.max(0,pointsTotal()-totalSpent())}
  function reqLevel(tier){return 1+(tier-1)*2}
  function nodeCost(tier){return tier<=4?1:tier<=8?2:3}
  function nodeId(b,i){return b.id+'_'+i}
  function isBought(b,i){return !!s.v17Tree.nodes[nodeId(b,i)]}
  function prerequisiteOK(b,i){return i===0||isBought(b,i-1)}

  function effectFor(branch,tier){
    if(branch.stat==='hp')return {type:'hp',value:tier<=8?8:12};
    if(branch.stat==='en')return {type:'en',value:tier<=8?6:9};
    if(branch.skill)return {type:'skill',value:tier%4===0?2:1,skill:branch.skill};
    if(branch.id==='mastery'){
      const pool=[
        {type:'hp',value:5},{type:'en',value:4},{type:'skill',skill:'combat',value:1},{type:'skill',skill:'fortune',value:1},
        {type:'skill',skill:'gather',value:1},{type:'skill',skill:'craft',value:1},{type:'skill',skill:'economy',value:1},{type:'skill',skill:'agri',value:1}
      ];return pool[(tier-1)%pool.length];
    }
    return {type:'hp',value:4};
  }

  function effectText(e){
    if(e.type==='hp')return `+${e.value} Vida máxima`;
    if(e.type==='en')return `+${e.value} Energia máxima`;
    return `+${e.value} nível de ${e.skill}`;
  }

  function applyEffect(e,dir){
    const v=Number(e.value||0)*dir;
    if(e.type==='hp'){s.maxHp=Math.max(1,Number(s.maxHp||1)+v);s.hp=Math.min(s.maxHp,Number(s.hp||s.maxHp)+Math.max(0,v));}
    else if(e.type==='en'){s.maxEnergy=Math.max(1,Number(s.maxEnergy||1)+v);s.energy=Math.min(s.maxEnergy,Number(s.energy||s.maxEnergy)+Math.max(0,v));}
    else if(e.type==='skill'){s.skills=s.skills||{};s.skills[e.skill]=Math.max(0,Number(s.skills[e.skill]||0)+v);}
  }

  function levelUpPassive(){
    // Points are derived from level, so no separate currency has to be persisted.
  }

  function buy(b,i){
    if(!s.v17Tree)return;
    if(isBought(b,i))return;
    const tier=i+1, cost=nodeCost(tier);
    if(Number(s.level||1)<reqLevel(tier))return setEvent(`🔒 Requer Nível ${reqLevel(tier)}.`,'bad','Árvore de Skills');
    if(!prerequisiteOK(b,i))return setEvent('🔗 Primeiro desbloqueia o nó anterior desta linha.','bad','Árvore de Skills');
    if(freePoints()<cost)return setEvent(`✨ Faltam pontos de skill. Tens ${freePoints()} livres.`,'bad','Árvore de Skills');
    const effect=effectFor(b,tier);s.v17Tree.nodes[nodeId(b,i)]={cost,effect};applyEffect(effect,1);
    setEvent(`✨ ${b.name}: ${b.items[i][0]} desbloqueada. ${effectText(effect)}.`,'good','Árvore de Skills');
    render();
    try{saveGame()}catch(_){ }
  }

  function respec(){
    const n=s.v17Tree?.nodes||{};const keys=Object.keys(n);if(!keys.length)return setEvent('🌳 Não tens pontos investidos para redefinir.','bad','Árvore de Skills');
    if(Number(s.gold||0)<50)return setEvent('💰 A redefinição custa 50 ouro.','bad','Árvore de Skills');
    if(!confirm('Redefinir toda a Árvore de Skills por 50 ouro? Os pontos voltam a ficar livres.'))return;
    Object.values(n).forEach(x=>x?.effect&&applyEffect(x.effect,-1));
    s.gold-=50;s.v17Tree.nodes={};setEvent('🌳 Árvore redefinida. Os pontos foram devolvidos.','good','Árvore de Skills');render();try{saveGame()}catch(_){ }
  }

  function nodeHTML(b,i){
    const tier=i+1,bought=isBought(b,i),req=reqLevel(tier),cost=nodeCost(tier),prev=prerequisiteOK(b,i),eligible=!bought&&prev&&Number(s.level||1)>=req&&freePoints()>=cost;
    const e=bought?s.v17Tree.nodes[nodeId(b,i)].effect:effectFor(b,tier);
    const cls=bought?'bought':eligible?'available':(prev?'unlocked':'locked');
    const label=bought?'✅ Comprada':freePoints()<cost?'✨ Sem pontos':Number(s.level||1)<req?`🔒 Nível ${req}`:!prev?'🔗 Anterior primeiro':`✨ ${cost} ponto${cost>1?'s':''}`;
    return `<button class="v17-node ${cls}" onclick="window.v17BuySkill('${b.id}',${i})" ${bought?'disabled':''}><b>${tier}. ${b.items[i][0]}</b><small>${b.items[i][1]}</small><small style="margin-top:5px"><strong>${effectText(e)}</strong></small><span class="v17-cost">${label}</span></button>`;
  }

  function render(){
    if(!window.s)return;
    const branches=BRANCHES.map(b=>`<div class="v17-branch"><div class="v17-branch-title">${b.icon} ${b.name}</div>${b.items.map((_,i)=>nodeHTML(b,i)).join('')}</div>`).join('');
    const bought=Object.keys(s.v17Tree?.nodes||{}).length;
    const html=`<div class="v17-tree-head"><h2 style="margin:0">🌳 Árvore de Skills</h2><p class="muted" style="margin:4px 0">9 ramos · 108 nós · progressão até ao fim do jogo.</p><div class="v17-tree-stats"><div class="v17-tree-stat"><b>${freePoints()}</b>Pontos livres</div><div class="v17-tree-stat"><b>${bought}</b>Nós comprados</div><div class="v17-tree-stat"><b>${s.level||1}</b>Nível</div></div><div class="tip">Cada nível dá <b>2 pontos</b> de skill (mais 5 iniciais). Os nós exigem nível e pré-requisito. Não precisas de escolher uma única árvore: podes construir a tua personagem como quiseres.</div></div><div class="v17-tree-scroll"><div class="v17-tree-grid">${branches}</div></div><div class="v17-tree-actions"><button onclick="v17SkillTreeRender()">🔄 Actualizar</button><button onclick="v17RespecSkills()">♻️ Redefinir · 50 ouro</button></div>`;
    const wrap=document.createElement('div');wrap.className='v17-tree-wrap';wrap.innerHTML=html;
    openModal(wrap.innerHTML);
  }

  function addLauncher(){
    if(document.getElementById('v17-tree-launcher'))return;
    const top=document.querySelector('.toprow');
    if(top){const b=document.createElement('button');b.id='v17-tree-launcher';b.className='iconbtn';b.title='Árvore de Skills';b.textContent='🌳';b.onclick=render;top.appendChild(b);}
  }

  window.v17BuySkill=(branchId,index)=>{const b=BRANCHES.find(x=>x.id===branchId);if(b)buy(b,index)};
  window.v17RespecSkills=respec;
  window.v17SkillTreeRender=render;

  function ensureLoaded(){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
    const oldStart=window.startGame;
    if(typeof oldStart==='function'&&!window.__v17TreeStartWrapped){window.__v17TreeStartWrapped=true;window.startGame=function(){const r=oldStart.apply(this,arguments);init();return r};}
  }

  window.openV17SkillTree=render;
  ensureLoaded();
})();
