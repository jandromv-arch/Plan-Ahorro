// MiAhorro - Service Worker
// Cachea la app para que funcione sin conexión. v2: solo guarda respuestas correctas.
const CACHE = 'miahorro-v3';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png?v=3',
  './icon-512.png?v=3'
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
  if (req.method !== 'GET') return;

  // La página principal: red primero (así siempre tienes la última versión),
  // y si no hay conexión, tiramos de caché.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function(resp){
        if (resp && resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
        }
        return resp;
      }).catch(function(){
        return caches.match('./index.html').then(function(r){ return r || caches.match('./'); });
      })
    );
    return;
  }

  // Resto de recursos: caché primero, y solo guardamos respuestas VÁLIDAS.
  e.respondWith(
    caches.match(req).then(function(cached){
      if (cached) return cached;
      return fetch(req).then(function(resp){
        if (resp && resp.ok && resp.status === 200) {
          try {
            var copy = resp.clone();
            caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){});
          } catch(err){}
        }
        return resp;
      }).catch(function(){ return cached; });
    })
  );
});
