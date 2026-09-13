/* V17 — button cooldown 1s + Elementalist Special cooldown restored to 2s. */
(function(){
  const BUTTON_COOLDOWN=1000;

  function install(){
    document.addEventListener('click',function(e){
      const b=e.target.closest('.combat-actions button');
      if(!b || b.disabled || b.dataset.cooldownLock==='1') return;
      b.dataset.cooldownLock='1';
      b.disabled=true;
      setTimeout(function(){
        b.disabled=false;
        delete b.dataset.cooldownLock;
      },BUTTON_COOLDOWN);
    },true);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();

  /* Elementalist keeps the class-specific 2-second Special cooldown. */
  const original=window.powerStrike;
  if(typeof original==='function'){
    window.powerStrike=function(){
      if(typeof combatState!=='undefined' && combatState && typeof s!=='undefined' && s.classId==='elementalist' && combatState.cooldown>0) return;
      const result=original.apply(this,arguments);
      if(typeof combatState!=='undefined' && combatState && typeof s!=='undefined' && s.classId==='elementalist'){
        combatState.cooldown=2;
      }
      return result;
    };
  }
})();
