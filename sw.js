const CACHE = 'valedouro-v18.1.0';
const CORE = ['./', './index.html', './index-1.html', './v17.js', './v18.js', './manifest.webmanifest', './version.json', './icon-192.svg', './icon-512.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/index-1.html') || url.pathname.endsWith('/version.json')) {
    e.respondWith(
      fetch(req, {cache:'no-store'}).then(async r => {
        if (!r.ok) return r;
        const type = r.headers.get('content-type') || '';
        if (type.includes('text/html')) {
          let text = await r.text();
          if (!text.includes('src="./v17.js"')) text = text.replace(/<\/body>/i, '<script src="./v17.js"></script></body>');
          if (!text.includes('src="./v18.js"')) text = text.replace(/<\/body>/i, '<script src="./v18.js"></script></body>');
          const headers = new Headers(r.headers);
          headers.delete('content-length');
          const out = new Response(text, {status:r.status, statusText:r.statusText, headers});
          caches.open(CACHE).then(c => c.put(req, out.clone()));
          return out;
        }
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  e.respondWith(caches.match(req).then(r => r || fetch(req).then(net => {
    const copy = net.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
    return net;
  })));
});
