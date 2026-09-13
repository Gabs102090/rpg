const CACHE = 'valedouro-v17.0.0';
const CORE = ['./', './index.html', './index-1.html', './v17.js', './manifest.webmanifest', './version.json', './icon-192.svg', './icon-512.svg'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
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

// Kept for compatibility with older installed workers/pages.
self.addEventListener('message', e => {
  if(e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function inject(html){
  // V17 is the only patch/version layer. It runs after the game's original
  // globals are defined, exactly as intended by the V17 implementation.
  if(!html.includes('src="./v17.js"')){
    html = html.replace(/<\/body>/i, '<script src="./v17.js"></script></body>');
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

  // Always prefer fresh HTML so the V17 bootstrap is picked up reliably.
  if(req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/index-1.html') || url.pathname.endsWith('/version.json')){
    e.respondWith(networkFirst(req));
    return;
  }

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
