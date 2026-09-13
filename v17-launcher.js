/* V17 — robust Skill Tree launcher. Ensures the tree is reachable after the base UI finishes booting. */
(function(){
  'use strict';
  const ID='v17-tree-launcher';

  function openTree(){
    if(typeof window.openV17SkillTree==='function'){
      window.openV17SkillTree();
      return;
    }
    if(typeof window.v17SkillTreeRender==='function'){
      window.v17SkillTreeRender();
      return;
    }
    console.warn('[V17] Skill Tree ainda não carregada.');
  }

  function add(){
    const top=document.querySelector('.toprow');
    if(!top || top.querySelector('#'+ID))return;
    const b=document.createElement('button');
    b.id=ID;
    b.type='button';
    b.className='iconbtn';
    b.title='Árvore de Skills';
    b.setAttribute('aria-label','Abrir Árvore de Skills');
    b.textContent='🌳';
    b.addEventListener('click',openTree);
    top.appendChild(b);
  }

  function boot(){
    add();
    if(document.body){
      const obs=new MutationObserver(add);
      obs.observe(document.body,{childList:true,subtree:true});
      setTimeout(add,250);
      setTimeout(add,1000);
      setTimeout(add,2500);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
