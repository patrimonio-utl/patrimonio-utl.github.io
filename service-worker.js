const CACHE_NAME = 'patrimonio-cultural-v7';
const APP_SHELL = [
  "./", "./index.html", "./legislacao.html", "./documentos-tecnicos.html",
  "./cartas-patrimoniais.html", "./bibliografia.html", "./multimedia.html", "./ligacoes.html",
  "./manifest.webmanifest", "./offline.html", "./assets/icon-192.png",
  "./assets/icon-512.png", "./assets/apple-touch-icon.png", "./assets/site.css",
  "./assets/site.js", "./assets/catalog-data.js", "./assets/catalog.js"
];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => { const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)); return response; }).catch(async () => { const cached = await caches.match(event.request); if (cached) return cached; if (event.request.mode === "navigate") return caches.match("./offline.html"); return Response.error(); }));
});
