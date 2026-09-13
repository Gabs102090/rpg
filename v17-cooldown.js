/* V17 cooldown adjustment: Special cooldown is 1 second. */
(function(){
  const originalPowerStrike=window.powerStrike;
  if(typeof originalPowerStrike!=='function') return;
  window.powerStrike=function(){
    const before=window.combatState;
    const result=originalPowerStrike.apply(this,arguments);
    if(before && window.combatState && window.combatState!==false){
      if(window.s && window.s.classId==='elementalist' && window.combatState.cooldown>1){
        window.combatState.cooldown=1;
      }
    }
    return result;
  };
})();
