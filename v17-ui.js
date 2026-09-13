/* V17 UI cleanup — no update/search controls. */
(function(){
  const HIDE_TEXT=[
    'atualizar aplicação',
    'atualizar aplicacao',
    'procurar atualização',
    'procurar atualizacao',
    'tentar novamente'
  ];

  function clean(){
    const panel=document.getElementById('updatePanel');
    if(panel) panel.remove();

    document.querySelectorAll('button,[role="button"]').forEach(el=>{
      const text=(el.textContent||'').trim().toLowerCase();
      if(HIDE_TEXT.some(t=>text.includes(t))) el.remove();
    });

    const text=document.getElementById('updateText');
    if(text) text.textContent='';
  }

  function boot(){
    clean();
    const observer=new MutationObserver(clean);
    if(document.body) observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();

  /* Prevent the old V16 updater bridge from doing visible work. */
  window.checkForUpdates=function(){ return Promise.resolve(false); };
})();
