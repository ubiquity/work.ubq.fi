import { CACHE_NAME } from "./home/github-types";

const URLS_TO_CACHE = ["/", "/dist/src/home/home.js", "/style/style.css", "/style/inverted-style.css", "/favicon.svg", "/api/issues"];

self.addEventListener("install", (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(URLS_TO_CACHE);
      } catch (error) {
        console.error("Error during cache opening:", error);
      }
    })()
  );
});

self.addEventListener("fetch", async (event: FetchEvent) => {
  try {
    const cacheMatch = await caches.match(event.request);
    if (cacheMatch) return cacheMatch;

    const fetchResponse = await fetch(event.request);
    if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== "basic") {
      return fetchResponse;
    }

    const cache = await caches.open(CACHE_NAME);
    await cache.put(event.request, fetchResponse.clone());
    return fetchResponse;
  } catch (error) {
    console.error("Error during fetch event:", error);
    return new Response("Error fetching resource.");
  }
});

self.addEventListener("sync", (event: SyncEvent) => {
  if (event.tag === "sync-issues") {
    event.waitUntil(
      syncIssues().catch((error) => {
        console.error("Error during sync issues:", error);
      })
    );
  }
});

async function syncIssues() {
  try {
    const response = await fetch("/api/issues");
    const issues = await response.json();
    const cache = await caches.open(CACHE_NAME);
    await cache.put("/api/issues", new Response(JSON.stringify(issues)));
  } catch (error) {
    console.error("Failed to sync issues:", error);
  }
}
