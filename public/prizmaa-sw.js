const CACHE = "prizmaa-shell-v1";
const PUBLIC_PATHS = ["/prizmaa", "/prizmaa/app", "/prizmaa.webmanifest", "/prizmaa-icon-192.png", "/prizmaa-icon-512.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => Promise.allSettled(PUBLIC_PATHS.map(url=>cache.add(url)))));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("prizmaa-shell-")&&k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if(event.request.method!=="GET" || new URL(event.request.url).origin!==self.location.origin) return;
  if(!new URL(event.request.url).pathname.startsWith("/prizmaa")) return;
  event.respondWith(fetch(event.request).then(response=>{
    if(response.ok && response.type==="basic"){
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    }
    return response;
  }).catch(()=>caches.match(event.request)));
});
