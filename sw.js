// Service worker — cache the app shell so it works fully offline once installed.
var CACHE = "masarif-v1";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).catch(function(){})
  );
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(resp){
        // Cache same-origin successful responses for next time.
        try{
          var copy = resp.clone();
          if(resp.ok && new URL(e.request.url).origin === self.location.origin){
            caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
          }
        }catch(err){}
        return resp;
      }).catch(function(){
        // Offline fallback: serve the app shell for navigations.
        if(e.request.mode === "navigate") return caches.match("./index.html");
      });
    })
  );
});
