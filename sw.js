// MiAhorro - Service Worker
// Cachea la app para que funcione sin conexión una vez abierta.
const CACHE = 'miahorro-v1';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).catch(function(){}));
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  // Solo GET
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(function(cached){
      if (cached) return cached;
      return fetch(req).then(function(resp){
        // Cachear también lo que se vaya pidiendo (p.ej. CDNs) para offline
        try {
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        } catch(err){}
        return resp;
      }).catch(function(){
        // si falla la red y no hay caché, intentar servir el index
        return caches.match('./index.html');
      });
    })
  );
});
