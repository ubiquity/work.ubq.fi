const cacheName = "pwacache-v4"; // Increment this when files change
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
self.addEventListener("install", async (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(cacheName);
        await cache.addAll(urlsToCache);
        console.log("[Service Worker] Files cached successfully");
      } catch (error) {
        console.error("[Service Worker] Cache failed:", error);
      }
      self.skipWaiting(); // Activate the new worker immediately
    })()
  );
});

// Activate event (deletes old caches when updated)
self.addEventListener("activate", async (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map((name) => {
            if (name !== cacheName) {
              return caches.delete(name);
            }
          })
        );
        console.log("[Service Worker] Old caches removed");
      } catch (error) {
        console.error("[Service Worker] Error during activation:", error);
      }
      self.clients.claim(); // Take control of all pages immediately
    })()
  );
});

// Fetch event: Cache first approach but update cache anyway
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ignore non-HTTP(S) requests (like 'chrome-extension://')
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // If the request has query parameters, bypass the cache
  if (url.search) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);

      if (cachedResponse) {
        // Start a network fetch in the background to update the cache, this will return early from cache
        // but the fetch will still happen in the background
        event.waitUntil(
          (async () => {
            try {
              const networkResponse = await fetch(event.request);
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                const cache = await caches.open(cacheName);
                await cache.put(event.request, responseClone);
              }
            } catch (error) {
              console.error("[Service Worker] Background cache update failed:", error);
            }
          })()
        );
        return cachedResponse;
      } else {
        // Attempt to fetch from the network if no cache is available
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            try {
              const responseClone = networkResponse.clone();
              const cache = await caches.open(cacheName);
              await cache.put(event.request, responseClone);
            } catch (error) {
              console.error(`[Service Worker] Failed to cache resource: ${event.request.url}`);
            }
          }
          return networkResponse;
        } catch (error) {
          console.error("[Service Worker] Fetch failed, and no cache is available:", error);
          return new Response("An error occurred", {
            status: 500,
            statusText: "Internal Server Error",
          });
        }
      }
    })()
  );
});