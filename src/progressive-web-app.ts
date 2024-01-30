export function pwa() {
  self.addEventListener("install", (event: InstallEvent) => {
    event.waitUntil(
      caches.open("v1").then((cache) => {
        return cache.addAll(["/", "/dist/src/home/home.js", "/style/style.css", "/style/inverted-style.css", "/favicon.svg"]);
      })
    );
  });

  self.addEventListener("fetch", (event: FetchEvent) => {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then(
        (registration) => {
          console.log("ServiceWorker registration successful with scope: ", registration.scope);
        },
        (err) => {
          console.log("ServiceWorker registration failed: ", err);
        }
      );
    });
  }
}
