const CACHE_NAME = "little-sprout-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./vendor/lucide.min.js",
  "./vendor/hanzi-writer.min.js",
  "./fonts/andika-regular.woff2",
  "./fonts/andika-bold.woff2",
  "./assets/images/apple-touch-icon.png",
  "./assets/images/favicon-64.png",
  "./assets/images/app-icon-192.png",
  "./assets/images/app-icon-512.png",
  "./assets/images/abc.png",
  "./assets/images/apple.png",
  "./assets/images/bear.png",
  "./assets/images/bird.png",
  "./assets/images/books.png",
  "./assets/images/cat.png",
  "./assets/images/compass.png",
  "./assets/images/dog.png",
  "./assets/images/fish.png",
  "./assets/images/flower.png",
  "./assets/images/house.png",
  "./assets/images/moon.png",
  "./assets/images/mountain.png",
  "./assets/images/music.png",
  "./assets/images/pencil.png",
  "./assets/images/rabbit.png",
  "./assets/images/rain.png",
  "./assets/images/seedling.png",
  "./assets/images/sparkles.png",
  "./assets/images/star.png",
  "./assets/images/sun.png",
  "./assets/images/tree.png",
  "./assets/images/trophy.png",
  "./assets/images/water.png",
  "./assets/audio/en-apple.m4a",
  "./assets/audio/en-bear.m4a",
  "./assets/audio/en-cat.m4a",
  "./assets/audio/en-dog.m4a",
  "./assets/audio/en-fish.m4a",
  "./assets/audio/en-flower.m4a",
  "./assets/audio/en-moon.m4a",
  "./assets/audio/en-star.m4a",
  "./assets/audio/en-sun.m4a",
  "./assets/audio/en-tree.m4a",
  "./assets/audio/zh-gou.m4a",
  "./assets/audio/zh-hua.m4a",
  "./assets/audio/zh-huo.m4a",
  "./assets/audio/zh-kou.m4a",
  "./assets/audio/zh-mao.m4a",
  "./assets/audio/zh-mu.m4a",
  "./assets/audio/zh-niao.m4a",
  "./assets/audio/zh-ren.m4a",
  "./assets/audio/zh-ri.m4a",
  "./assets/audio/zh-shan.m4a",
  "./assets/audio/zh-shou.m4a",
  "./assets/audio/zh-shui.m4a",
  "./assets/audio/zh-tian.m4a",
  "./assets/audio/zh-tu.m4a",
  "./assets/audio/zh-yu.m4a",
  "./assets/audio/zh-yue.m4a",
  "./assets/audio/zh-zu.m4a",
  "./assets/hanzi/人.json",
  "./assets/hanzi/口.json",
  "./assets/hanzi/山.json",
  "./assets/hanzi/手.json",
  "./assets/hanzi/日.json",
  "./assets/hanzi/月.json",
  "./assets/hanzi/木.json",
  "./assets/hanzi/水.json",
  "./assets/hanzi/火.json",
  "./assets/hanzi/田.json",
  "./assets/hanzi/目.json",
  "./assets/hanzi/足.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all(
      APP_SHELL.map((path) => cache.add(path).catch(() => null))
    )).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok && new URL(event.request.url).origin === location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      });
    })
  );
});
