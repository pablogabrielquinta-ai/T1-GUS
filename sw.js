/* Service worker: cachea la app para que abra offline
   y sirva desde caché cuando no hay conexión.
   El caché de la app (CACHE_NAME) se borra en cada actualización.
   El caché de recursos externos (mapa de calles, Leaflet) es
   independiente y NO se borra, así lo que ya se vio del mapa
   queda guardado aunque actualicemos la app. */
var CACHE_NAME = 'gu-t1-cache-v40';
var EXTERNAL_CACHE = 'gu-t1-external-v1';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(key){
        if (key !== CACHE_NAME && key !== EXTERNAL_CACHE) return caches.delete(key);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  var isExterno = event.request.url.indexOf(self.location.origin) !== 0;
  var cacheName = isExterno ? EXTERNAL_CACHE : CACHE_NAME;

  event.respondWith(
    caches.match(event.request).then(function(cached){
      var fetchPromise = fetch(event.request).then(function(networkResp){
        if (networkResp && (networkResp.status === 200 || networkResp.type === 'opaque')){
          var respClone = networkResp.clone();
          caches.open(cacheName).then(function(cache){ cache.put(event.request, respClone); });
        }
        return networkResp;
      }).catch(function(){ return cached; });
      return cached || fetchPromise;
    })
  );
});
