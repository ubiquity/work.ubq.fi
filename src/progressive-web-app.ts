const cacheName = "pwacache-v1"; // when we update we increment the version number
const urlsToCache = ["/", "/dist/src/home/home.js", "/style/style.css", "/style/inverted-style.css", "/favicon.svg"];

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.addEventListener("install", (event: InstallEvent) => {
  console.log("[Service Worker] Install");
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      console.log("[Service Worker] Caching all: app shell and content");
      await cache.addAll(urlsToCache);
    })()
  );
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(
    (async () => {
      const r = await caches.match(event.request);
      console.log(`[Service Worker] Fetching resource: ${event.request.url}`);
      if (r) {
        return r;
      }
      const response = await fetch(event.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${event.request.url}`);
      await cache.put(event.request, response.clone());
      return response;
    })()
  );
});

// Garbage collector, deletes old cache when app is updated (cache name changes)

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.addEventListener("activate", (event: ActivateEvent) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key === cacheName) {
            return;
          }
          return caches.delete(key);
        })
      );
    })
  );
});
