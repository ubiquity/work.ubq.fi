// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

self.addEventListener("install", (event: InstallEvent) => {
  event.waitUntil(
    caches.open("v1").then((cache) => {
      return cache.addAll(["/", "/dist/src/home/home.js", "/style/style.css", "/style/inverted-style.css", "/favicon.svg"]);
    })
  );
});
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
self.addEventListener("fetch", (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
