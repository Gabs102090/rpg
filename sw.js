const CACHE = 'valedouro-v18.4.0';
const CORE = ['./', './index.html', './index-1.html', './v17.js', './v18.4.js', './manifest.webmanifest', './version.json', './icon-192.svg', './icon-512.svg'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Do not let one transient network failure abort the entire SW install.
    await Promise.all(CORE.map(async url => {
      try { await cache.add(url); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function inject(html){
  // v17 needs the game's original globals, so keep it at the end of body.
  if(!html.includes('src="./v17.js"')){
    html = html.replace(/<\/body>/i, '<script src="./v17.js"></script></body>');
  }

  // v18.4 must run before the legacy updater in index-1.html.
  if(!html.includes('src="./v18.4.js"')){
    const tag = '<script src="./v18.4.js"></script>';
    if(/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, tag + '</head>');
    else html = html.replace(/<\/body>/i, tag + '</body>');
  }
  return html;
}

async function networkFirst(req){
  try{
    const r = await fetch(req, {cache:'no-store'});
    if(!r.ok) return r;
    const type = r.headers.get('content-type') || '';
    if(type.includes('text/html')){
      const text = inject(await r.text());
      const headers = new Headers(r.headers);
      headers.delete('content-length');
      const out = new Response(text, {status:r.status, statusText:r.statusText, headers});
      const cache = await caches.open(CACHE);
      await cache.put(req, out.clone());
      return out;
    }
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
    return r;
  }catch(_){
    const cached = await caches.match(req);
    if(cached) return cached;
    const fallback = await caches.match('./index-1.html');
    return fallback || new Response('Valedouro indisponível neste momento.', {status:503, headers:{'Content-Type':'text/plain;charset=utf-8'}});
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  if(url.origin !== location.origin) return;

  // Always prefer fresh HTML. This prevents an old bootstrap from randomly
  // winning after a new deployment or an interrupted SW update.
  if(req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/index-1.html') || url.pathname.endsWith('/version.json')){
    e.respondWith(networkFirst(req));
    return;
  }

  // Static assets: cache first for speed, network fallback for missing assets.
  e.respondWith(
    caches.match(req).then(cached => {
      if(cached) return cached;
      return fetch(req).then(net => {
        if(net.ok){
          const copy = net.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
        }
        return net;
      });
    }).catch(() => new Response('', {status:504}))
  );
});
