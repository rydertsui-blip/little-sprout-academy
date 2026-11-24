const CACHE_NAME = "little-sprout-family-v6";
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
  "./assets/images/apple.png",
  "./assets/images/bear.png",
  "./assets/images/cat.png",
  "./assets/images/dog.png",
  "./assets/images/fish.png",
  "./assets/images/water.png",
  "./assets/images/rain.png",
  "./assets/images/mountain.png",
  "./assets/images/house.png",
  "./assets/images/pencil.png",
  "./assets/images/rabbit.png",
  "./assets/images/sun.png",
  "./assets/images/tree.png",
  "./assets/images/trophy.png",
  "./assets/images/music.png",
  "./assets/images/speech.png",
  "./assets/images/favicon-64.png",
  "./assets/images/app-icon-192.png",
  "./assets/images/app-icon-512.png",
  "./assets/images/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(CORE.map((path) => cache.add(path)));
    const indexResponse = await fetch("./index.html", { cache: "reload" });
    const indexCopy = indexResponse.clone();
    const indexHtml = await indexResponse.text();
    await cache.put("./index.html", indexCopy);
    const linkedAssets = Array.from(indexHtml.matchAll(/(?:src|href)="([^"]+)"/g))
      .map((match) => match[1])
      .filter((path) => path.includes("assets/"));
    await Promise.all(linkedAssets.map((path) => cache.add(path)));
    try {
      const manifestResponse = await fetch("./precache-manifest.json", { cache: "reload" });
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        const audioPaths = Array.isArray(manifest.audio) ? manifest.audio : [];
        await Promise.allSettled(audioPaths.map((path) => cache.add(path)));
      }
    } catch {
      // Audio precache is best-effort; the app can still work online.
    }
    const cssAssets = linkedAssets.filter((path) => path.endsWith(".css"));
    for (const cssPath of cssAssets) {
      const response = await fetch(cssPath, { cache: "reload" });
      const cssText = await response.text();
      const fontUrls = Array.from(cssText.matchAll(/url\(([^)]+)\)/g))
        .map((match) => match[1].replace(/^['\"]|['\"]$/g, ""))
        .filter((path) => !path.startsWith("data:"))
        .map((path) => new URL(path, new URL(cssPath, self.location.href)).href);
      await Promise.all(fontUrls.map((path) => cache.add(path)));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const copy = response.clone();
          const cache = await caches.open(CACHE_NAME);
          await cache.put("./index.html", copy);
        }
        return response;
      } catch {
        return (await caches.match("./index.html")) ?? Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok && new URL(event.request.url).origin === location.origin) {
      const copy = response.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(event.request, copy);
    }
    return response;
  })());
});
