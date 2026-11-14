// Vetro: оболонка додатка зберігається на телефоні — відкривається миттєво і без зв'язку. Дані з таблиці сюди не потрапляють (їх зберігає сама сторінка).
const V = 'vetro-shell-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(SHELL))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('vetro-shell') && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET' || /(^|\.)google(usercontent)?\.com$/.test(u.hostname)) return;     // запити до таблиці — завжди напряму
  if (req.mode === 'navigate') {                                                                // сторінка: спершу мережа (оновлення коду), без мережі — збережена
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(V).then(x => x.put('./index.html', c)); return r; })
      .catch(() => caches.match('./index.html', {ignoreSearch: true})));
    return;
  }
  if (u.origin === location.origin || /cdnjs\.cloudflare\.com|fonts\.(googleapis|gstatic)\.com/.test(u.hostname)) {   // решта: з телефону + тихо оновити
    e.respondWith(caches.open(V).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
