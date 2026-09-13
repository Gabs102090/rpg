const CACHE = 'valedouro-v18.3.0';
const CORE = ['./', './index.html', './index-1.html', './v17.js', './v18.3.js', './manifest.webmanifest', './version.json', './icon-192.svg', './icon-512.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // HTML and version metadata are network-first so installed PWAs can receive
  // a new bootstrap even when an older Service Worker is still controlling the app.
  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/index-1.html') || url.pathname.endsWith('/version.json')) {
    e.respondWith(
      fetch(req, {cache:'no-store'}).then(async r => {
        if (!r.ok) return r;
        const type = r.headers.get('content-type') || '';
        if (type.includes('text/html')) {
          let text = await r.text();

          // v17 must run after the game's original globals are defined.
          if (!text.includes('src="./v17.js"')) {
            text = text.replace(/<\/body>/i, '<script src="./v17.js"></script></body>');
          }

          // v18.3 is deliberately inserted in <head>. It installs the early
          // ServiceWorkerRegistration.update guard before the legacy auto-check
          // in index-1.html can start.
          if (!text.includes('src="./v18.3.js"')) {
            const tag = '<script src="./v18.3.js"></script>';
            if (/<\/head>/i.test(text)) text = text.replace(/<\/head>/i, tag + '</head>');
            else text = text.replace(/<\/body>/i, tag + '</body>');
          }

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

  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(net => {
      const copy = net.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return net;
    }))
  );
});
