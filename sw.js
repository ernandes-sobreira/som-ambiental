const CACHE = 'som-ambiental-v1';
const ASSETS = ['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  // Firebase e APIs externas: sempre rede
  if (e.request.url.includes('firebaseio.com') || e.request.url.includes('gstatic.com/firebasejs')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        fetch(e.request).then(r => { if(r&&r.status===200) caches.open(CACHE).then(c=>c.put(e.request,r)); }).catch(()=>{});
        return cached;
      }
      return fetch(e.request).then(r => {
        if(r&&r.status===200&&r.type==='basic') caches.open(CACHE).then(c=>c.put(e.request,r.clone()));
        return r;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
