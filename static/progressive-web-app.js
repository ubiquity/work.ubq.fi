const cacheName = "pwacache-v3"; // Increment this when files change
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
  event.waitUntil(
    caches
      .open(cacheName)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => console.error("[Service Worker] Cache failed:", error))
  );
});

// Activate event (deletes old caches when updated)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== cacheName) {
              return caches.delete(name);
            }
          })
        );
      })
      .catch((error) => console.error("[Service Worker] Error during activation:", error))
  );
  self.clients.claim(); // Take control of all pages immediately
});

// Fetch event (try network first, if offline return from cache)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          } else {
            return null;
          }
        });
      })
  );
});