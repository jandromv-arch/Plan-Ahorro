// MiAhorro - Service Worker v4
// Cachea la app para que funcione sin conexión.
// IMPORTANTE: no intercepta imágenes ni el manifest, para que el móvil pueda
// leer siempre el icono de la app directamente de la red.
const CACHE = 'miahorro-v4';
const CORE = ['./', './index.html'];

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

  var url = req.url;
  // Dejar pasar SIN tocar: iconos, imágenes y manifest.
  if (req.destination === 'image' || /\.(png|jpg|jpeg|svg|ico|webp)$/i.test(url) || /manifest\.json/i.test(url)) return;

  // Página principal: red primero (siempre la última versión), caché si no hay conexión.
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

  // Librerías y demás: caché primero, guardando solo respuestas válidas.
  e.respondWith(
    caches.match(req).then(function(cached){
      if (cached) return cached;
      return fetch(req).then(function(resp){
        if (resp && resp.ok && resp.status === 200) {
          try { var copy = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, copy); }).catch(function(){}); } catch(err){}
        }
        return resp;
      }).catch(function(){ return cached; });
    })
  );
});
