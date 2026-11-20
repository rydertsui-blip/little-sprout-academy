const CACHE_NAME = "little-sprout-family-v2";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/images/seedling.png",
  "./assets/images/star.png",
  "./assets/images/moon.png",
  "./assets/images/flower.png",
  "./assets/images/books.png",
  "./assets/images/compass.png",
  "./assets/images/bird.png",
  "./assets/images/abc.png",
  "./assets/images/sparkles.png",
  "./assets/images/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.all(CORE.map((path) => cache.add(path).catch(() => null)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
      return response;
    }).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok && new URL(event.request.url).origin === location.origin) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
