export function registerServiceWorker() {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/dist/src/progressive-web-app.js").then(
      (registration) => {
        console.log("ServiceWorker registration successful with scope: ", registration.scope);
      },
      (err) => {
        console.log("ServiceWorker registration failed: ", err);
      }
    );
  });
}
