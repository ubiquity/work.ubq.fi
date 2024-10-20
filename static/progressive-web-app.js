const cacheName = "pwacache-v2"; // Increment this when files change
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/dist/src/home/home.js",
  "/style/style.css",
  "/style/inverted-style.css",
  "/style/fonts/ubiquity-nova-standard.woff",
  "/style/special.css",
  "/favicon.svg",
];

// Install event (caches all necessary files)
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install event");
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => {
        console.log("[Service Worker] Caching resources");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => console.error("[Service Worker] Cache failed:", error))
  );
  self.skipWaiting(); // activate the new worker immediately
});

// Activate event (deletes old caches when updated)
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate event");
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== cacheName) {
              console.log(`[Service Worker] Deleting old cache: ${name}`);
              return caches.delete(name);
            }
          })
        );
      })
      .catch((error) => console.error("[Service Worker] Error during activation:", error))
  );
  self.clients.claim(); // Take control of all pages immediately
});

// Fetch event: Respond from cache or network
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // If the request has query parameters, bypass the cache
  if (url.search) { 
    console.log('[Service Worker] Bypassing cache for:', event.request.url);
    event.respondWith(fetch(event.request));
    return;
  }

  console.log("[Service Worker] Fetch intercepted for:", event.request.url);
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
        return cachedResponse;
      }
      console.log(`[Service Worker] Fetching from network: ${event.request.url}`);
      return fetch(event.request)
        .then((networkResponse) => {
          return networkResponse;
        })
        .catch((error) => {
          console.error("[Service Worker] Network request failed:", error);
          // Fallback to cached home
          return caches.match("/");
        });
    })
  );
});
